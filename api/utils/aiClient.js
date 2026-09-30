import { GoogleGenAI } from '@google/genai';

// Single point of contact with LLM providers (D1). generate() round-robins across
// GEN_PROVIDERS and falls back through the rest on a 429 (D28), so no single provider's
// free-tier cap is the ceiling. Embeddings stay on Gemini alone — mixing embedding models
// would put incompatible vectors in the same Atlas Vector Search index.

const GEMINI_GEN_MODEL = process.env.GEMINI_GEN_MODEL || 'gemini-3.6-flash';
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const GROQ_GEN_MODEL = process.env.GROQ_GEN_MODEL || 'openai/gpt-oss-20b';
export const EMBEDDING_DIMENSIONS = 768;

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

let geminiClient = null;
const getGeminiClient = () => {
    if (!geminiClient) {
        if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
        geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return geminiClient;
};

const logUsage = (provider, model, promptTokens, outputTokens) => {
    if (promptTokens == null && outputTokens == null) return;
    console.log(JSON.stringify({ event: 'ai_usage', provider, model, promptTokens, outputTokens }));
};

export const isRateLimited = (err) => (err?.status ?? err?.code) === 429;

// A 429 is never retried in place — round-robin to the next provider is strictly faster
// than backing off, and doesn't waste calls against a quota that won't recover in seconds.
const isRetryable = (err) => {
    const status = err?.status ?? err?.code;
    return typeof status === 'number' && status >= 500;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (label, fn) => {
    let lastErr;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const start = Date.now();
            const result = await fn(controller.signal);
            console.log(JSON.stringify({ event: 'ai_call', label, ms: Date.now() - start, attempt }));
            return result;
        } catch (err) {
            lastErr = err;
            if (attempt === MAX_RETRIES || !isRetryable(err)) throw err;
            await sleep(RETRY_BASE_MS * 2 ** attempt);
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastErr;
};

// Each provider takes ({ prompt, system }, signal) and returns plain text.
const GEN_PROVIDERS = [
    {
        name: 'gemini',
        generate: async ({ prompt, system }) => {
            const response = await getGeminiClient().models.generateContent({
                model: GEMINI_GEN_MODEL,
                contents: prompt,
                config: system ? { systemInstruction: system } : undefined,
            });
            const usage = response.usageMetadata;
            logUsage('gemini', GEMINI_GEN_MODEL, usage?.promptTokenCount, usage?.candidatesTokenCount);
            return (response.text || '').trim();
        },
    },
    {
        name: 'groq',
        generate: async ({ prompt, system }, signal) => {
            if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                signal,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: GROQ_GEN_MODEL,
                    messages: [
                        ...(system ? [{ role: 'system', content: system }] : []),
                        { role: 'user', content: prompt },
                    ],
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                const err = new Error(body?.error?.message || `Groq request failed (${res.status})`);
                err.status = res.status;
                throw err;
            }
            const data = await res.json();
            logUsage('groq', GROQ_GEN_MODEL, data.usage?.prompt_tokens, data.usage?.completion_tokens);
            return (data.choices?.[0]?.message?.content || '').trim();
        },
    },
];

let ringCursor = 0;

const generateWithRing = async ({ prompt, system }) => {
    const order = GEN_PROVIDERS.map((_, i) => GEN_PROVIDERS[(ringCursor + i) % GEN_PROVIDERS.length]);
    ringCursor = (ringCursor + 1) % GEN_PROVIDERS.length;

    let lastErr;
    for (const provider of order) {
        try {
            return await withRetry(`generate:${provider.name}`, (signal) => provider.generate({ prompt, system }, signal));
        } catch (err) {
            lastErr = err;
            if (!isRateLimited(err)) throw err; // a real error — don't mask it by trying another provider
        }
    }
    throw lastErr; // every provider is rate-limited
};

// A plain (mutable) object, not named exports, so tests can `mock.method(aiClient, 'generate', ...)`.
export const aiClient = {
    generate: generateWithRing,

    // embedBatch(texts) -> array of number[] (one embedding per input text, same order).
    embedBatch: async (texts) => {
        if (texts.length === 0) return [];
        const response = await withRetry('embed', async () =>
            getGeminiClient().models.embedContent({
                model: EMBED_MODEL,
                contents: texts,
                config: { outputDimensionality: EMBEDDING_DIMENSIONS },
            })
        );
        return response.embeddings.map((e) => e.values);
    },

    embed: async (text) => (await aiClient.embedBatch([text]))[0],
};

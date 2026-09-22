import { GoogleGenAI } from '@google/genai';

// Single point of contact with the LLM provider (D1). Swapping providers means
// changing this file only. All calls are retried with backoff on transient
// errors (429/5xx) and logged with token usage for basic cost visibility.

const GEN_MODEL = process.env.GEMINI_GEN_MODEL || 'gemini-3.6-flash';
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 768;

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

let client = null;
const getClient = () => {
    if (!client) {
        if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
        client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return client;
};

// ApiError.message is JSON.stringify(errorBody) (@google/genai's throwErrorIfNotOK).
const parseApiErrorBody = (err) => {
    try {
        return JSON.parse(err?.message);
    } catch {
        return null;
    }
};

// A per-day quota won't recover within our backoff window, so retrying just wastes the cap.
export const isDailyQuotaExhausted = (err) => {
    const body = parseApiErrorBody(err);
    if (body?.error?.status !== 'RESOURCE_EXHAUSTED') return false;
    const violations = body.error.details?.flatMap((d) => d.violations || []) || [];
    return violations.some((v) => /PerDay/i.test(v.quotaId || ''));
};

const isRetryable = (err) => {
    if (isDailyQuotaExhausted(err)) return false;
    const status = err?.status ?? err?.code;
    return status === 429 || (typeof status === 'number' && status >= 500);
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

// A plain (mutable) object, not named exports, so tests can `mock.method(aiClient, 'generate', ...)`.
export const aiClient = {
    // generate({ prompt, system }) -> plain text response.
    generate: async ({ prompt, system }) => {
        const response = await withRetry('generate', async () =>
            getClient().models.generateContent({
                model: GEN_MODEL,
                contents: prompt,
                config: system ? { systemInstruction: system } : undefined,
            })
        );
        const usage = response.usageMetadata;
        if (usage) {
            console.log(JSON.stringify({
                event: 'ai_usage', model: GEN_MODEL,
                promptTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount,
            }));
        }
        return (response.text || '').trim();
    },

    // embedBatch(texts) -> array of number[] (one embedding per input text, same order).
    embedBatch: async (texts) => {
        if (texts.length === 0) return [];
        const response = await withRetry('embed', async () =>
            getClient().models.embedContent({
                model: EMBED_MODEL,
                contents: texts,
                config: { outputDimensionality: EMBEDDING_DIMENSIONS },
            })
        );
        return response.embeddings.map((e) => e.values);
    },

    embed: async (text) => (await aiClient.embedBatch([text]))[0],
};

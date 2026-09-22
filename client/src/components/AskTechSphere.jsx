import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiSparkles, HiX } from 'react-icons/hi';
import { apiFetch } from '../utils/format';

const QUICK_ACTIONS = [
  { mode: 'explain', label: 'Explain this' },
  { mode: 'eli5', label: 'ELI5' },
  { mode: 'example', label: 'Give an example' },
  { mode: 'explain_code', label: 'Explain this code' },
];

const GAP = 16; // px between the widget and the viewport edge / footer

// Keeps the widget pinned to the bottom-right of the viewport while scrolling the
// article, but stops it from overlapping the footer once that scrolls into view.
const useFooterClearance = () => {
  const [bottom, setBottom] = useState(GAP);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return undefined;

    let raf = null;
    const measure = () => {
      raf = null;
      const overlap = window.innerHeight - footer.getBoundingClientRect().top;
      setBottom(overlap > 0 ? overlap + GAP : GAP);
    };
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return bottom;
};

function Sources({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className='mt-2 flex flex-wrap gap-2'>
      {sources.map((s, i) => (
        <Link
          key={`${s.postId}-${i}`}
          to={`/post/${s.slug}`}
          className='rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent'
        >
          {s.title}{s.headingPath ? ` · ${s.headingPath}` : ''}
        </Link>
      ))}
    </div>
  );
}

export default function AskTechSphere({ postId }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [entries, setEntries] = useState([]); // { question, answer, sources, error }
  const [pending, setPending] = useState(false);
  const bottom = useFooterClearance();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries]);

  const run = async (label, request) => {
    setPending(true);
    const id = Date.now() + Math.random();
    setEntries((prev) => [...prev, { id, question: label, answer: null, sources: [], error: null }]);
    const patch = (fields) => setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...fields } : e)));
    try {
      const data = await request();
      patch({ answer: data.answer, sources: data.sources || [] });
    } catch (err) {
      patch({ error: err.message });
    } finally {
      setPending(false);
    }
  };

  const askQuestion = (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || pending) return;
    setQuestion('');
    run(q, () =>
      apiFetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, postId }),
      })
    );
  };

  const runQuickAction = (mode, label) => {
    if (pending) return;
    const selection = window.getSelection()?.toString().trim() || undefined;
    run(label, () =>
      apiFetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, mode, selection }),
      })
    );
  };

  return (
    <div className='fixed right-4 z-40 sm:right-6' style={{ bottom }}>
      {open && (
        <div className='absolute bottom-[4.25rem] right-0 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl'>
          <div className='flex items-center justify-between border-b border-line px-4 py-3'>
            <span className='font-medium'><HiSparkles className='inline h-4 w-4 text-accent' /> Ask TechSphere</span>
            <button type='button' onClick={() => setOpen(false)} aria-label='Close' className='text-muted hover:text-ink'>
              <HiX className='h-5 w-5' />
            </button>
          </div>

          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4'>
            <p className='mb-3 text-xs text-muted'>
              Select some text in the article first if you want these to apply to a specific passage.
            </p>
            <div className='mb-4 flex flex-wrap gap-2'>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.mode}
                  type='button'
                  disabled={pending}
                  onClick={() => runQuickAction(a.mode, a.label)}
                  className='rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-50'
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className='flex flex-col gap-4'>
              {entries.length === 0 && (
                <p className='text-sm text-muted'>Ask anything about this article, or use a quick action above.</p>
              )}
              {entries.map((entry) => (
                <div key={entry.id} className='text-sm'>
                  <p className='font-medium text-accent'>{entry.question}</p>
                  {entry.error && <p className='mt-1 text-red-300'>{entry.error}</p>}
                  {!entry.error && entry.answer === null && <p className='mt-1 text-muted'>Thinking…</p>}
                  {entry.answer !== null && <p className='mt-1 whitespace-pre-wrap text-ink'>{entry.answer}</p>}
                  <Sources sources={entry.sources} />
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={askQuestion} className='flex gap-2 border-t border-line p-3'>
            <input
              type='text'
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder='Ask a question…'
              className='flex-1 rounded-md border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent'
            />
            <button type='submit' disabled={pending || question.trim().length < 3} className='btn-primary px-4 py-2 text-sm'>
              Ask
            </button>
          </form>
        </div>
      )}

      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close Ask TechSphere' : 'Open Ask TechSphere'}
        className='flex h-14 w-14 items-center justify-center rounded-full bg-accent text-canvas shadow-lg transition hover:opacity-90'
      >
        {open ? <HiX className='h-6 w-6' /> : <HiSparkles className='h-6 w-6' />}
      </button>
    </div>
  );
}

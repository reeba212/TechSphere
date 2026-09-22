import { useEffect, useRef } from 'react';
import { apiFetch } from '../utils/format';

const THROTTLE_MS = 4000;

// Tracks scroll depth through the page and periodically saves it as reading progress
// for `postId`. Only ever moves forward (scrolling back up doesn't lower progress) and
// is throttled so it isn't one request per scroll event. Disabled once the reader has
// already marked the article complete.
export function useReadingProgress(postId, { enabled, alreadyCompleted }) {
  const lastSentAt = useRef(0);
  const bestPercentage = useRef(0);

  useEffect(() => {
    if (!enabled || alreadyCompleted) return;

    const send = (percentage, position) => {
      apiFetch(`/api/progress/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercentage: percentage, lastReadPosition: position }),
      }).catch(() => {});
    };

    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const percentage = scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 100;
      if (percentage <= bestPercentage.current) return;
      bestPercentage.current = percentage;

      const now = Date.now();
      if (now - lastSentAt.current < THROTTLE_MS) return;
      lastSentAt.current = now;
      send(percentage, window.scrollY);
    };

    const flush = () => {
      if (bestPercentage.current > 0) send(bestPercentage.current, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', flush);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [postId, enabled, alreadyCompleted]);
}

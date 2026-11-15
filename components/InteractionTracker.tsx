'use client';

import { useEffect } from 'react';

const FLUSH_INTERVAL_MS = 10_000;
const MAX_BUFFER = 400;

type Ev = {
  t: number;
  type: 'key' | 'click' | 'move' | 'scroll' | 'visibility' | 'focus' | 'blur';
  trusted?: boolean;
  keyGap?: number;
};

function getSessionId(): string {
  try {
    const key = 'tm_session_id';
    let v = sessionStorage.getItem(key);
    if (!v) {
      v = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now().toString(36);
      sessionStorage.setItem(key, v);
    }
    return v;
  } catch {
    return 'anon-' + Date.now().toString(36);
  }
}

export function InteractionTracker() {
  useEffect(() => {
    const buffer: Ev[] = [];
    let lastKeyTs = 0;
    let moveCount = 0;
    const sessionId = getSessionId();

    const push = (ev: Ev) => {
      if (buffer.length >= MAX_BUFFER) buffer.shift();
      buffer.push(ev);
    };

    const onKey = (e: KeyboardEvent) => {
      const now = Date.now();
      const gap = lastKeyTs ? now - lastKeyTs : 0;
      lastKeyTs = now;
      push({ t: now, type: 'key', trusted: e.isTrusted, keyGap: gap });
    };

    const onClick = (e: MouseEvent) => {
      push({ t: Date.now(), type: 'click', trusted: e.isTrusted });
    };

    let moveThrottle = 0;
    const onMouseMove = () => {
      const now = Date.now();
      if (now - moveThrottle < 250) return;
      moveThrottle = now;
      moveCount++;
      push({ t: now, type: 'move', trusted: true });
    };

    const onScroll = () => {
      push({ t: Date.now(), type: 'scroll', trusted: true });
    };

    const onVisibility = () => {
      push({ t: Date.now(), type: 'visibility', trusted: true });
    };

    const onFocus = () => push({ t: Date.now(), type: 'focus', trusted: true });
    const onBlur = () => push({ t: Date.now(), type: 'blur', trusted: true });

    document.addEventListener('keydown', onKey, { passive: true });
    document.addEventListener('click', onClick, { passive: true });
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
    window.addEventListener('focus', onFocus, { passive: true });
    window.addEventListener('blur', onBlur, { passive: true });

    const flush = () => {
      if (buffer.length === 0) return;
      const payload = { sessionId, events: buffer.splice(0, buffer.length) };
      const body = JSON.stringify(payload);
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon('/api/telemetry', blob);
        } else {
          fetch('/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // never throw from telemetry
      }
    };

    const interval = window.setInterval(flush, FLUSH_INTERVAL_MS);
    const onPageHide = () => flush();
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      flush();
    };
  }, []);

  return null;
}
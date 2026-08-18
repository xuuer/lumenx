'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { X, Copy, BookmarkPlus, Search, History } from 'lucide-react';
import { usePlaygroundStore } from './usePlaygroundStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<string, string> = {
  t2i: 'T2I',
  i2i: 'I2I',
  t2v: 'T2V',
  i2v: 'I2V',
  r2v: 'R2V',
  v2v: 'V2V',
};

type RelTime =
  | { key: 'history.justNow' }
  | {
      key: 'history.minutesAgo' | 'history.hoursAgo' | 'history.daysAgo' | 'history.monthsAgo';
      count: number;
    };

function relativeTime(dateStr: string): RelTime {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return { key: 'history.justNow' };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { key: 'history.minutesAgo', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: 'history.hoursAgo', count: hours };
  const days = Math.floor(hours / 24);
  if (days < 30) return { key: 'history.daysAgo', count: days };
  const months = Math.floor(days / 30);
  return { key: 'history.monthsAgo', count: months };
}

// ---------------------------------------------------------------------------
// Deduplicated history entry
// ---------------------------------------------------------------------------

interface HistoryEntry {
  prompt: string;
  mode: string;
  model_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PromptHistoryDrawer() {
  const t = useTranslations('playground');
  const showHistoryDrawer = usePlaygroundStore((s) => s.showHistoryDrawer);
  const setShowHistoryDrawer = usePlaygroundStore((s) => s.setShowHistoryDrawer);
  const history = usePlaygroundStore((s) => s.history);
  const setPrompt = usePlaygroundStore((s) => s.setPrompt);
  const setShowTemplateModal = usePlaygroundStore((s) => s.setShowTemplateModal);

  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Animate in after mount
  useEffect(() => {
    if (showHistoryDrawer) {
      // Allow a frame for the DOM to render before sliding in
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
  }, [showHistoryDrawer]);

  // Close with animation
  const handleClose = useCallback(() => {
    setVisible(false);
    // Wait for transition to finish before unmounting
    setTimeout(() => setShowHistoryDrawer(false), 250);
  }, [setShowHistoryDrawer]);

  // Deduplicate by prompt text, keep the most recent occurrence (history is newest-first)
  const deduplicated = useMemo<HistoryEntry[]>(() => {
    const seen = new Set<string>();
    const results: HistoryEntry[] = [];
    for (const gen of history) {
      const key = gen.prompt.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push({
        prompt: gen.prompt,
        mode: gen.mode,
        model_id: gen.model_id,
        created_at: gen.created_at,
      });
    }
    return results;
  }, [history]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return deduplicated;
    const q = search.trim().toLowerCase();
    return deduplicated.filter((e) => e.prompt.toLowerCase().includes(q));
  }, [deduplicated, search]);

  const handleCopy = useCallback(
    (prompt: string) => {
      setPrompt(prompt);
      handleClose();
    },
    [setPrompt, handleClose],
  );

  const handleSaveAsTemplate = useCallback(
    (prompt: string) => {
      setPrompt(prompt);
      setShowTemplateModal(true);
      handleClose();
    },
    [setPrompt, setShowTemplateModal, handleClose],
  );

  if (!showHistoryDrawer || typeof window === 'undefined') return null;

  return createPortal(
    // Transparent click-catcher — closes on outside click WITHOUT a dark scrim,
    // so the workspace behind stays fully visible (history is a side panel, not
    // a takeover modal).
    <div
      className="fixed inset-0 z-50"
      onClick={handleClose}
    >
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-[420px] bg-elevated border-l border-glass-border shadow-2xl flex flex-col transition-transform duration-250 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between shrink-0">
          <h2 className="font-display atelier-display text-[1.375rem] font-semibold tracking-tight text-foreground">{t('history.title')}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-hover-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Search ─────────────────────────────────────────────────── */}
        <div className="px-6 py-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('history.searchPlaceholder')}
              className="w-full bg-surface-inset border border-glass-border rounded-[14px] pl-9 pr-3 py-2.5 text-xs text-foreground/80 placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* ── List ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <History className="w-7 h-7 text-text-muted/50 mb-3" />
              <p className="font-display italic text-[0.9375rem] text-text-secondary leading-relaxed">
                {search.trim() ? t('history.noMatch') : t('history.empty')}
              </p>
            </div>
          ) : (
            filtered.map((entry, idx) => (
              <div
                key={`${entry.created_at}-${idx}`}
                className={[
                  'py-4',
                  idx < filtered.length - 1
                    ? 'border-b border-border-subtle'
                    : '',
                ].join(' ')}
              >
                {/* Prompt text — Fraunces italic, the author's voice */}
                <p className="font-display italic text-[0.9375rem] text-text-secondary leading-relaxed line-clamp-3 mb-2.5">
                  {entry.prompt}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="font-mono text-[0.5625rem] bg-primary/15 text-primary rounded px-[6px] py-[2px] uppercase">
                    {MODE_LABELS[entry.mode] || entry.mode}
                  </span>
                  {entry.model_id && (
                    <span className="font-mono text-[0.5625rem] bg-glass text-text-muted rounded px-[6px] py-[2px]">
                      {entry.model_id}
                    </span>
                  )}
                  <span className="font-mono text-[0.5625rem] text-text-muted ml-auto">
                    {(() => {
                      const rt = relativeTime(entry.created_at);
                      return 'count' in rt ? t(rt.key, { count: rt.count }) : t(rt.key);
                    })()}
                  </span>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(entry.prompt)}
                    className="flex items-center gap-1 text-[0.6875rem] text-text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {t('history.copy')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAsTemplate(entry.prompt)}
                    className="flex items-center gap-1 text-[0.6875rem] text-text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    {t('history.saveAsTemplate')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  , document.body);
}

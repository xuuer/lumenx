"use client";
/**
 * CompareModal — side-by-side video comparison for 2-4 candidates.
 * Per grill Q9:
 *   - Portal to document.body (escape transformed ancestors)
 *   - Up to 4 videos (1×2 / 1×3 / 2×2 grid auto)
 *   - Default sync playback: one master timeline drives all videos
 *   - Default muted; "Solo (S)" cycles which video is unmuted
 *   - "Independent" toggle: each video plays on its own timeline
 *   - ESC closes
 *
 * The point of compare is精筛: spot the difference between two takes
 * the user can't quite distinguish at thumbnail size. Sync playback
 * is the core value-add — letting them see "action vs camera vs
 * lighting" at identical frame numbers.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, X, Volume2, VolumeX, Lock, Unlock } from "lucide-react";
import type { VideoTask } from "@/lib/api";

interface CompareModalProps {
    tasks: VideoTask[];
    onClose: () => void;
    resolveUrl?: (url: string) => string;
}

export default function CompareModal({ tasks, onClose, resolveUrl }: CompareModalProps) {
    const display = (u?: string | null) => (u && resolveUrl ? resolveUrl(u) : u ?? undefined);
    const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sync, setSync] = useState(true);
    const [soloIndex, setSoloIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState(0); // 0-1, master clock

    // Cap at 4. Anything more got truncated before opening.
    const slots = tasks.slice(0, 4);
    const gridClass =
        slots.length === 1
            ? "grid-cols-1"
            : slots.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 grid-rows-2";

    // Master clock — gated on isPlaying (P1-5). Previously this rAF
    // loop ran continuously while the modal was open, burning a frame
    // every 16ms even when nothing was animating. Now it only runs
    // while playback is active.
    useEffect(() => {
        if (!sync || !isPlaying) return;
        let raf = 0;
        const tick = () => {
            const master = videoRefs.current[0];
            if (master && master.duration) {
                setProgress(master.currentTime / master.duration);
                // Push to followers within 50ms tolerance to avoid micro-stutter.
                for (let i = 1; i < videoRefs.current.length; i++) {
                    const v = videoRefs.current[i];
                    if (!v) continue;
                    if (Math.abs(v.currentTime - master.currentTime) > 0.05) {
                        try { v.currentTime = master.currentTime; } catch { /* seek may fail until metadata loads */ }
                    }
                }
            }
            raf = window.requestAnimationFrame(tick);
        };
        raf = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(raf);
    }, [sync, isPlaying]);

    // Focus trap: on mount move focus to the close button + restore on
    // unmount. Keyboard users can't escape into the document beneath
    // the portal (P1-7).
    useEffect(() => {
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        // Defer to next tick so the portal has rendered.
        const focusTimer = window.setTimeout(() => {
            closeBtnRef.current?.focus();
        }, 0);
        return () => {
            window.clearTimeout(focusTimer);
            previouslyFocused.current?.focus?.();
        };
    }, []);

    const handleTrapTab = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== "Tab") return;
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    // Esc to close, Space to play/pause, S to cycle solo.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === " ") {
                e.preventDefault();
                togglePlay();
            } else if (e.key.toLowerCase() === "s") {
                e.preventDefault();
                cycleSolo();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slots.length, soloIndex]);

    const togglePlay = () => {
        const next = !isPlaying;
        setIsPlaying(next);
        for (const v of videoRefs.current) {
            if (!v) continue;
            if (next) {
                v.play().catch(() => { /* autoplay may be blocked */ });
            } else {
                v.pause();
            }
        }
    };

    const cycleSolo = () => {
        if (slots.length === 0) return;
        setSoloIndex((cur) => {
            if (cur === null) return 0;
            if (cur + 1 >= slots.length) return null;
            return cur + 1;
        });
    };

    const seekTo = (frac: number) => {
        for (const v of videoRefs.current) {
            if (!v?.duration) continue;
            try { v.currentTime = frac * v.duration; } catch { /* ignore */ }
        }
        setProgress(frac);
    };

    if (typeof window === "undefined") return null;

    const modal = (
        <>
            <div
                aria-hidden="true"
                className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Compare candidates"
                onKeyDown={handleTrapTab}
                className="fixed left-1/2 top-1/2 z-[61] flex h-[88vh] w-[min(1200px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[12px] border border-glass-border bg-surface shadow-[0_24px_60px_-22px_rgba(0,0,0,0.9)] motion-safe:animate-[compareModalIn_240ms_cubic-bezier(0.22,1,0.36,1)_both]"
            >
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-glass-border px-4 py-3">
                    <div className="flex items-center gap-2">
                        {/* Display tier — primary modal title (P0-2). */}
                        <div className="font-display text-display font-semibold tracking-tight text-foreground">
                            Compare {slots.length} candidates
                        </div>
                        <div className="font-mono text-chrome-sm font-medium uppercase text-text-muted">
                            {sync ? "synced" : "independent"} · {soloIndex === null ? "all muted" : `solo #${soloIndex + 1}`}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setSync(!sync)}
                            title={sync ? "Switch to independent timelines" : "Sync timelines"}
                            className="btn-tip inline-flex h-8 min-w-[68px] items-center justify-center gap-1 rounded px-2 font-mono text-chrome-sm font-medium uppercase text-text-secondary transition-colors duration-fast ease-out-quart hover:bg-hover-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                        >
                            {sync ? <Lock size={11} aria-hidden="true" /> : <Unlock size={11} aria-hidden="true" />}
                            {sync ? "Synced" : "Indep."}
                        </button>
                        <button
                            type="button"
                            onClick={cycleSolo}
                            title="Cycle solo audio (S)"
                            className="btn-tip inline-flex h-8 min-w-[78px] items-center justify-center gap-1 rounded px-2 font-mono text-chrome-sm font-medium uppercase text-text-secondary transition-colors duration-fast ease-out-quart hover:bg-hover-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                        >
                            {soloIndex === null ? (
                                <VolumeX size={11} aria-hidden="true" />
                            ) : (
                                <Volume2 size={11} aria-hidden="true" />
                            )}
                            {soloIndex === null ? "Mute" : `Solo ${soloIndex + 1}`}
                        </button>
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="-m-1 grid h-9 w-9 place-items-center rounded text-text-muted transition-colors duration-fast ease-out-quart hover:bg-hover-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                {/* Grid */}
                <div className={`grid flex-1 gap-2 overflow-hidden p-3 ${gridClass}`}>
                    {slots.map((task, i) => {
                        const url = display(task.video_url);
                        return (
                            <div
                                key={task.id}
                                className="relative overflow-hidden rounded-md border border-glass-border bg-black"
                            >
                                {url ? (
                                    <video
                                        ref={(el) => { videoRefs.current[i] = el; }}
                                        src={url}
                                        muted={soloIndex !== i}
                                        loop
                                        playsInline
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <div className="grid h-full w-full place-items-center font-mono text-chrome-sm font-medium uppercase text-text-muted">
                                        no video url
                                    </div>
                                )}
                                <div className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded bg-black/65 px-1.5 py-[3px] font-mono text-chrome-sm font-medium uppercase text-foreground">
                                    #{i + 1}
                                    <span className="text-text-secondary">·</span>
                                    <span className="text-foreground">{task.model || "?"}</span>
                                    {task.is_starred ? (
                                        <span className="text-status-starred-fg" aria-label="Starred">★</span>
                                    ) : null}
                                </div>
                                {task.label ? (
                                    <div className="absolute bottom-2 left-2 rounded bg-black/65 px-1.5 py-[3px] font-mono text-chrome text-foreground">
                                        {task.label}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                {/* Footer controls */}
                <footer className="flex shrink-0 items-center gap-3 border-t border-glass-border px-4 py-3">
                    <button
                        type="button"
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        className="grid h-10 w-10 place-items-center rounded-full bg-elevated text-foreground transition-colors duration-fast ease-out-quart hover:bg-hover-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                    >
                        {isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                    </button>
                    {sync ? (
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            value={Math.round(progress * 1000)}
                            onChange={(e) => seekTo(parseInt(e.target.value, 10) / 1000)}
                            aria-label="Playback position"
                            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-elevated accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                        />
                    ) : (
                        <div className="flex-1 text-center font-mono text-chrome-sm font-medium uppercase text-text-muted">
                            Independent timelines · each video controls itself
                        </div>
                    )}
                    <div className="font-mono text-chrome-sm tracking-tight text-text-muted">
                        Space play/pause · S solo · Esc close
                    </div>
                </footer>
            </div>
        </>
    );

    return createPortal(modal, document.body);
}

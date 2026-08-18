"use client";
/**
 * PreviousEpisodeFramesRail — R2V v2 P2-a cross-step extension.
 *
 * Shows the last 3-4 frames of the previous episode at the top of the
 * Storyboard step, so authors composing this episode's opening shots
 * can see what came before. Reuses /projects/{id}/previous_episode
 * endpoint (extended in P2-a to include last_frames metadata).
 *
 * UX:
 *   · Collapsible band at the top of the shot list (default collapsed
 *     to avoid stealing space; user toggles via header chevron).
 *   · Renders only when project is in a series with a previous episode.
 *   · Each thumb is clickable to lightbox via PreviewVideo/Image.
 */
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Film, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import PreviewImage from "@/components/shared/preview/PreviewImage";
import PreviewVideo from "@/components/shared/preview/PreviewVideo";

interface PreviousEpisodeFramesRailProps {
    scriptId: string | null;
    seriesId: string | null;
}

interface FrameLite {
    id: string;
    action_description: string;
    thumbnail_url: string | null;
    video_url: string | null;
}

export default function PreviousEpisodeFramesRail({ scriptId, seriesId }: PreviousEpisodeFramesRailProps) {
    const t = useTranslations("previousFramesRail");
    const [frames, setFrames] = useState<FrameLite[]>([]);
    const [prevTitle, setPrevTitle] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!scriptId || !seriesId) return;
        let cancelled = false;
        setLoading(true);
        api.getPreviousEpisodeSummary(scriptId)
            .then(d => {
                if (cancelled) return;
                if (d.has_previous && d.last_frames && d.last_frames.length > 0) {
                    setFrames(d.last_frames);
                    setPrevTitle(d.previous_episode_title);
                }
            })
            .catch(() => { /* silently ignore — non-critical */ })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [scriptId, seriesId]);

    // Don't render anything when there's no previous episode or no frames
    if (!seriesId || (!loading && frames.length === 0)) return null;

    return (
        <div className="border-b border-glass-border bg-surface/60 backdrop-blur-sm">
            {/* Collapsible header */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                className="w-full flex items-center gap-2 px-4 sm:px-6 py-2.5 hover:bg-hover-bg transition-colors"
            >
                <span className="grid h-5 w-5 place-items-center text-text-muted">
                    {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <Film size={12} className="text-text-muted" />
                <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.18em] text-text-secondary">
                    {t("title")}
                </span>
                {prevTitle && (
                    <span className="font-mono text-[0.625rem] tracking-tight text-text-muted truncate max-w-[200px]">
                        · {prevTitle}
                    </span>
                )}
                {!open && frames.length > 0 && (
                    <span className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.14em] text-text-muted">
                        {t("framesCount", { count: frames.length })}
                    </span>
                )}
            </button>

            {/* Collapsible body */}
            {open && (
                <div className="px-4 sm:px-6 pb-3 pt-1">
                    <div className="flex items-stretch gap-2 overflow-x-auto custom-scrollbar pb-1">
                        {frames.map((f, idx) => (
                            <FrameThumb key={f.id} frame={f} indexFromEnd={frames.length - idx} />
                        ))}
                    </div>
                    <p className="mt-2 text-[0.6875rem] text-text-muted italic px-1">
                        {t("hint")}
                    </p>
                </div>
            )}
        </div>
    );
}

function FrameThumb({ frame, indexFromEnd }: { frame: FrameLite; indexFromEnd: number }) {
    const t = useTranslations("previousFramesRail");
    return (
        <div className="shrink-0 w-[140px]">
            <div className="aspect-video rounded-md border border-glass-border bg-black/40 overflow-hidden">
                {frame.video_url ? (
                    <PreviewVideo src={frame.video_url} className="h-full w-full" hoverPlay clickToLightbox />
                ) : frame.thumbnail_url ? (
                    <PreviewImage src={frame.thumbnail_url} className="h-full w-full" clickToLightbox />
                ) : (
                    <div className="grid h-full w-full place-items-center text-text-muted">
                        <ImageIcon size={16} aria-hidden="true" />
                    </div>
                )}
            </div>
            <p className="mt-1 font-mono text-[0.59375rem] uppercase tracking-[0.14em] text-text-muted">
                {t("frameLabel", { offset: indexFromEnd })}
            </p>
            {frame.action_description && (
                <p className="mt-0.5 text-[0.6875rem] text-text-secondary line-clamp-2 leading-snug">
                    {frame.action_description}
                </p>
            )}
        </div>
    );
}

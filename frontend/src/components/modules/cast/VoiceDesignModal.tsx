"use client";
/**
 * VoiceDesignModal — PR-3i #4 (revised)
 *
 * Sub-modal for designing a new voice from a text prompt.
 * Iterative flow: write/translate voice_prompt → preview → tweak → accept.
 *
 * Improvements over v1:
 *   - Character description shown as read-only context panel at top
 *   - Allow closing (X) during generation with confirmation dialog
 *   - Wider modal to better utilize space
 */
import { useEffect, useRef, useState } from "react";
import { X, Loader2, Check, Play, Pause, Sparkles, RefreshCw, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { api, type CustomVoice } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";

interface VoiceDesignModalProps {
    isOpen: boolean;
    onClose: () => void;
    seriesId: string;
    characterName?: string;
    characterDescription?: string;
    onCreated: (voice: CustomVoice) => void;
}

type Phase = "draft" | "translating" | "previewing" | "preview_ready" | "saving" | "done" | "error";

export default function VoiceDesignModal({
    isOpen,
    onClose,
    seriesId,
    characterName,
    characterDescription,
    onCreated,
}: VoiceDesignModalProps) {
    const t = useTranslations("voiceDesign");
    const defaultPreviewText = t("previewTextDefault");
    const [voicePrompt, setVoicePrompt] = useState("");
    const [previewText, setPreviewText] = useState(defaultPreviewText);
    const [label, setLabel] = useState("");
    const [phase, setPhase] = useState<Phase>("draft");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [playing, setPlaying] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const reset = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setVoicePrompt("");
        setPreviewText(defaultPreviewText);
        setLabel("");
        setPhase("draft");
        setErrorMsg(null);
        setPreviewVoiceId(null);
        setPreviewUrl(null);
        setPlaying(false);
        setConfirmClose(false);
    };

    useEffect(() => {
        if (!isOpen && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlaying(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const inFlight = phase === "translating" || phase === "previewing" || phase === "saving";

    const handleClose = () => {
        if (inFlight) {
            setConfirmClose(true);
            return;
        }
        reset();
        onClose();
    };

    const handleForceClose = () => {
        reset();
        onClose();
    };

    const handleTranslate = async () => {
        if (!characterDescription?.trim()) return;
        setErrorMsg(null);
        setPhase("translating");
        try {
            const { voice_prompt } = await api.translateVoicePrompt(characterDescription);
            setVoicePrompt(voice_prompt);
            setPhase("draft");
        } catch (e: any) {
            setErrorMsg(e?.message || "Translate failed");
            setPhase("error");
        }
    };

    const handlePreview = async () => {
        if (!voicePrompt.trim()) return;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlaying(false);
        }
        setErrorMsg(null);
        setPhase("previewing");
        try {
            const { voice_id, preview_url } = await api.designVoicePreview({
                voice_prompt: voicePrompt.trim(),
                preview_text: previewText.trim() || defaultPreviewText,
            });
            setPreviewVoiceId(voice_id);
            setPreviewUrl(preview_url);
            setPhase("preview_ready");
            const audio = new Audio(getAssetUrl(preview_url));
            audio.onended = () => {
                setPlaying(false);
                if (audioRef.current === audio) audioRef.current = null;
            };
            audio.onerror = () => {
                setPlaying(false);
                setErrorMsg(t("playFailed"));
            };
            audioRef.current = audio;
            setPlaying(true);
            await audio.play();
        } catch (e: any) {
            setErrorMsg(e?.message || "Preview failed");
            setPhase("error");
        }
    };

    const handleReplay = async () => {
        if (!previewUrl) return;
        if (audioRef.current && playing) {
            audioRef.current.pause();
            setPlaying(false);
            return;
        }
        const audio = new Audio(getAssetUrl(previewUrl));
        audio.onended = () => {
            setPlaying(false);
            if (audioRef.current === audio) audioRef.current = null;
        };
        audioRef.current = audio;
        setPlaying(true);
        await audio.play();
    };

    const handleAccept = async () => {
        if (!previewVoiceId || !label.trim()) return;
        setErrorMsg(null);
        setPhase("saving");
        try {
            const voice = await api.designVoiceAccept({
                series_id: seriesId,
                voice_id: previewVoiceId,
                voice_prompt: voicePrompt.trim(),
                label: label.trim(),
            });
            setPhase("done");
            setTimeout(() => {
                onCreated(voice);
                reset();
                onClose();
            }, 600);
        } catch (e: any) {
            setErrorMsg(e?.message || "Save failed");
            setPhase("error");
        }
    };

    return (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-overlay backdrop-blur-sm" onClick={handleClose}>
            <div
                className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-glass-border bg-elevated shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-glass-border">
                    <h2 className="text-display font-medium text-foreground">{t("title")}</h2>
                    <button
                        onClick={handleClose}
                        aria-label={t("close")}
                        className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-foreground transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
                    {/* Character context panel */}
                    {(characterName || characterDescription) && (
                        <div className="rounded-lg border border-glass-border bg-black/20 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Users size={12} className="text-text-muted" />
                                <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-text-muted">
                                    {t("characterContext")}
                                </span>
                            </div>
                            {characterName && (
                                <p className="text-[0.8125rem] font-medium text-foreground">{characterName}</p>
                            )}
                            {characterDescription && (
                                <p className="mt-1 text-[0.75rem] text-text-secondary leading-relaxed line-clamp-3">
                                    {characterDescription}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Voice prompt */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block font-mono text-[0.625rem] uppercase tracking-[0.18em] text-text-muted">
                                {t("voicePromptLabel")}
                            </label>
                            {characterDescription?.trim() && (
                                <button
                                    onClick={handleTranslate}
                                    disabled={inFlight}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 transition-colors text-[0.6875rem] disabled:opacity-40"
                                >
                                    {phase === "translating" ? (
                                        <Loader2 size={11} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={11} />
                                    )}
                                    {t("translateBtn")}
                                </button>
                            )}
                        </div>
                        <textarea
                            value={voicePrompt}
                            onChange={(e) => setVoicePrompt(e.target.value.slice(0, 500))}
                            placeholder={t("voicePromptPlaceholder")}
                            disabled={inFlight}
                            rows={5}
                            maxLength={500}
                            className="w-full rounded-md border border-glass-border bg-black/30 px-3 py-2.5 text-[0.8125rem] text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/40 disabled:opacity-60 resize-none"
                        />
                        <p className="mt-1 text-right font-mono text-[0.625rem] text-text-muted">
                            {voicePrompt.length}/500
                        </p>
                    </div>

                    {/* Preview text */}
                    <div>
                        <label className="block font-mono text-[0.625rem] uppercase tracking-[0.18em] text-text-muted mb-1.5">
                            {t("previewTextLabel")}
                        </label>
                        <input
                            type="text"
                            value={previewText}
                            onChange={(e) => setPreviewText(e.target.value)}
                            disabled={inFlight}
                            className="w-full rounded-md border border-glass-border bg-black/30 px-3 py-2.5 text-[0.8125rem] text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/40 disabled:opacity-60"
                        />
                    </div>

                    {/* Preview action */}
                    <button
                        onClick={handlePreview}
                        disabled={!voicePrompt.trim() || inFlight}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-glass border border-primary/40 text-primary hover:bg-primary/10 transition-colors text-[0.8125rem] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {phase === "previewing" ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : phase === "preview_ready" ? (
                            <RefreshCw size={13} />
                        ) : (
                            <Sparkles size={13} />
                        )}
                        {phase === "preview_ready" ? t("regenerateBtn") : t("generateBtn")}
                    </button>

                    {/* Preview audio bar */}
                    {previewUrl && phase !== "previewing" && (
                        <div className="flex items-center gap-2 rounded-md border border-glass-border bg-black/30 px-3 py-2.5">
                            <button
                                onClick={handleReplay}
                                aria-label={playing ? "Pause" : "Play"}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary"
                            >
                                {playing ? <Pause size={13} /> : <Play size={13} />}
                            </button>
                            <span className="font-mono text-[0.6875rem] text-text-muted truncate">
                                voice_id: {previewVoiceId}
                            </span>
                        </div>
                    )}

                    {/* Label input (only after first preview) */}
                    {(phase === "preview_ready" || phase === "saving" || phase === "done") && (
                        <div>
                            <label className="block font-mono text-[0.625rem] uppercase tracking-[0.18em] text-text-muted mb-1.5">
                                {t("labelLabel")}
                            </label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value.slice(0, 30))}
                                placeholder={t("labelPlaceholder")}
                                disabled={inFlight || phase === "done"}
                                maxLength={30}
                                className="w-full rounded-md border border-glass-border bg-black/30 px-3 py-2.5 text-[0.8125rem] text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/40 disabled:opacity-60"
                            />
                        </div>
                    )}

                    {/* Error */}
                    {errorMsg && (
                        <div className="rounded-md border border-status-failed-border bg-status-failed-bg px-3 py-2 text-body-sm text-status-failed-fg" role="alert">
                            {errorMsg}
                        </div>
                    )}

                    {/* Done */}
                    {phase === "done" && (
                        <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-body-sm text-primary">
                            <Check size={13} />
                            <span>{t("doneSaved")}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-glass-border">
                    <button
                        onClick={handleClose}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-glass border border-glass-border text-text-secondary hover:text-foreground hover:bg-hover-bg transition-colors text-[0.75rem]"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={!previewVoiceId || !label.trim() || inFlight || phase === "done"}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary text-white border border-[rgba(100,108,255,0.65)] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.14)] hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[0.75rem] font-semibold"
                    >
                        {phase === "saving" ? <Loader2 size={12} className="animate-spin" /> : null}
                        {phase === "done" ? <Check size={12} /> : null}
                        {phase === "done" ? t("done") : t("acceptBtn")}
                    </button>
                </div>
            </div>

            {/* Confirm close dialog during generation */}
            {confirmClose && (
                <div
                    className="fixed inset-0 z-[120] grid place-items-center bg-overlay/60"
                    onClick={(e) => { e.stopPropagation(); setConfirmClose(false); }}
                >
                    <div
                        className="w-full max-w-xs rounded-xl border border-glass-border bg-elevated p-5 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-[0.8125rem] text-foreground font-medium mb-1">{t("confirmCloseTitle")}</p>
                        <p className="text-[0.75rem] text-text-secondary mb-4">{t("confirmCloseBody")}</p>
                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={() => setConfirmClose(false)}
                                className="px-3 py-1.5 rounded-md bg-glass border border-glass-border text-text-secondary hover:text-foreground text-[0.75rem] transition-colors"
                            >
                                {t("confirmCloseStay")}
                            </button>
                            <button
                                onClick={handleForceClose}
                                className="px-3 py-1.5 rounded-md bg-status-failed-bg border border-status-failed-border text-status-failed-fg hover:bg-status-failed-bg/80 text-[0.75rem] font-medium transition-colors"
                            >
                                {t("confirmCloseLeave")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

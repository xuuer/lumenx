"use client";
/**
 * StoryboardGenerateDialog — wraps the LLM-driven '从剧本生成分镜' flow.
 *
 * Per Q grill outcomes:
 *   · Pre-flight runs in the dialog itself (no silent disabled button —
 *     user can always open the dialog and see WHY it's blocked + quick
 *     jump back to the Script step).
 *   · Confirm path replaces existing shots wholesale (clear-and-regenerate
 *     semantics, mirrors how a fresh 提取实体 → 生成分镜 onboarding feels).
 *   · Long-running call surfaces as a project-aware toast (not blocking
 *     overlay) so users can switch projects and learn when the other one
 *     finishes via the global ToastContainer.
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, X, AlertTriangle, ArrowRight, Film, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import WorkflowActionButton from "@/components/shared/WorkflowActionButton";

interface StoryboardGenerateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** Currently-loaded project — all gating reads from here. */
    project: {
        id: string;
        title?: string;
        originalText?: string;
        original_text?: string;
        characters?: any[];
        frames?: any[];
    } | null;
    existingShotCount: number;
    /** Called when the user confirms. Dialog closes immediately; parent
     *  runs the API call in the background with toast feedback. */
    onConfirm: () => void;
    /** Jump to the Script step (used by the empty-text quick fix link). */
    onJumpToScript?: () => void;
}

export default function StoryboardGenerateDialog({
    isOpen,
    onClose,
    project,
    existingShotCount,
    onConfirm,
    onJumpToScript,
}: StoryboardGenerateDialogProps) {
    const t = useTranslations("storyboardGen");

    const text = (project as any)?.original_text ?? project?.originalText ?? "";
    const charsCount = project?.characters?.length ?? 0;
    const checks = useMemo(() => {
        return [
            {
                key: "text" as const,
                pass: text.trim().length >= 40,
                label: t("checkText"),
                hint: t("checkTextHint"),
            },
            {
                key: "chars" as const,
                pass: charsCount > 0,
                label: t("checkChars"),
                hint: t("checkCharsHint"),
            },
        ];
    }, [text, charsCount, t]);

    const allPass = checks.every((c) => c.pass);

    const handleConfirm = () => {
        if (!allPass) return;
        onClose();
        onConfirm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] bg-overlay backdrop-blur-sm grid place-items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="w-full max-w-md rounded-2xl border border-glass-border bg-elevated shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-glass-border">
                            <div className="flex items-center gap-2">
                                <Sparkles size={15} className="text-primary" />
                                <h2 className="text-display font-medium text-foreground">{t("title")}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label={t("close")}
                                className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-foreground transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </header>

                        {/* Body */}
                        <div className="px-5 py-4 space-y-4">
                            {/* Project context line */}
                            <p className="text-body-sm text-text-secondary">
                                <span className="text-text-muted">{t("forProject")}</span>{" "}
                                <span className="text-foreground font-medium">{project?.title || "—"}</span>
                            </p>

                            {/* Pre-flight checks */}
                            <section>
                                <h3 className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-text-muted">
                                    {t("preflightTitle")}
                                </h3>
                                <ul className="space-y-2">
                                    {checks.map((c) => (
                                        <li
                                            key={c.key}
                                            className={`flex items-start gap-2 rounded-md border px-3 py-2 ${
                                                c.pass
                                                    ? "border-status-completed-border bg-status-completed-bg/5"
                                                    : "border-accent/40 bg-accent/10"
                                            }`}
                                        >
                                            <span
                                                className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[0.625rem] font-bold ${
                                                    c.pass ? "bg-status-completed-bg/20 text-status-completed-fg" : "bg-accent/20 text-accent"
                                                }`}
                                            >
                                                {c.pass ? "✓" : "!"}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[0.78125rem] text-foreground">{c.label}</p>
                                                {!c.pass && (
                                                    <p className="text-[0.6875rem] text-text-muted mt-0.5">{c.hint}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                {!allPass && onJumpToScript && (
                                    <button
                                        onClick={onJumpToScript}
                                        className="mt-2 inline-flex items-center gap-1 text-[0.6875rem] text-primary hover:text-primary-hover transition-colors"
                                    >
                                        {t("goFixInScript")}
                                        <ArrowRight size={11} />
                                    </button>
                                )}
                            </section>

                            {/* Destructive warning when shots already exist */}
                            {allPass && existingShotCount > 0 && (
                                <div className="flex items-start gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2">
                                    <AlertTriangle size={13} className="text-accent mt-0.5 shrink-0" />
                                    <p className="text-[0.75rem] text-accent">
                                        {t("willReplaceWarning", { count: existingShotCount })}
                                    </p>
                                </div>
                            )}

                            {/* Healthy CTA hint */}
                            {allPass && existingShotCount === 0 && (
                                <p className="text-[0.75rem] text-text-muted flex items-center gap-1.5">
                                    <Film size={12} />
                                    {t("freshHint")}
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-glass-border">
                            <WorkflowActionButton
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                            >
                                {t("cancel")}
                            </WorkflowActionButton>
                            <WorkflowActionButton
                                variant="primary"
                                size="sm"
                                disabled={!allPass}
                                leftIcon={<Wand2 />}
                                onClick={handleConfirm}
                            >
                                {existingShotCount > 0
                                    ? t("replaceAndGenerate")
                                    : t("generate")}
                            </WorkflowActionButton>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

"use client";
/**
 * SidePanelHeader — 4 个 R2V step 右栏统一头部组件。
 *
 * 与 <StepHeader> 同字体语言（中文 Inter Medium / 英文 mono chrome），
 * 但更紧凑（高度 56px vs StepHeader 112px），不带 ghost number、不带
 * progress rail。专为右栏 chrome 设计。
 *
 * 适用场景：
 *   · ArtDirection 风格编辑器 ("风格编辑器")
 *   · ScriptProcessor entities panel ("实体识别面板")
 *   · StoryboardR2V TaskQueuePanel ("任务队列")
 *   · VideoAssembly variants panel ("候选变体")
 *
 * 视觉一致点：
 *   · 56px 高 · border-b border-glass-border · bg-surface
 *   · 左 icon chip 28×28 紫 6% bg + 紫 32% border（StepHeader icon 缩小版）
 *   · title Inter Medium 14px / subtitle Inter 11.5px text-text-muted
 *   · 右 trailing slot（actions / counts / close button）
 */
import type { ReactNode } from "react";
import clsx from "clsx";

export interface SidePanelHeaderProps {
    /** 左侧 icon chip 里的 lucide icon。 */
    icon?: ReactNode;
    /** 中文 / 内容 title (Inter Medium 14px)。 */
    title: string;
    /** 一行 subtitle（可选）。 */
    subtitle?: string;
    /** 右侧 trailing slot —— close 按钮 / counts / 操作按钮等。 */
    trailing?: ReactNode;
    className?: string;
}

export default function SidePanelHeader({
    icon,
    title,
    subtitle,
    trailing,
    className,
}: SidePanelHeaderProps) {
    return (
        <div
            className={clsx(
                "flex h-14 w-full shrink-0 items-center gap-3 border-b border-glass-border bg-surface px-4",
                className,
            )}
        >
            {icon ? (
                <div
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-primary"
                    style={{
                        background: "rgba(100, 108, 255, 0.06)",
                        border: "1px solid rgba(100, 108, 255, 0.32)",
                        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                >
                    <span className="grid h-3 w-3 place-items-center [&>svg]:h-3 [&>svg]:w-3 [&>svg]:stroke-[1.6]">
                        {icon}
                    </span>
                </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-0">
                <span
                    className="truncate font-sans text-[0.875rem] font-medium leading-tight text-foreground"
                    style={{ letterSpacing: 0 }}
                >
                    {title}
                </span>
                {subtitle ? (
                    <span
                        className="truncate font-sans text-[0.71875rem] font-normal leading-tight text-text-muted"
                        style={{ letterSpacing: 0 }}
                    >
                        {subtitle}
                    </span>
                ) : null}
            </div>
            {trailing ? <div className="flex shrink-0 items-center gap-1">{trailing}</div> : null}
        </div>
    );
}

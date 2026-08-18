"use client";
/**
 * SectionShell — collapsible container used by every subsection
 * inside the attached ShotPanel (Params / Candidates / Advanced).
 * Standardizes the header ▼/▶ toggle, title typography, optional
 * trailing slot (filter chips, summary count), and collapsed-state
 * spacing so the whole panel reads as a coherent unit instead of
 * a pile of bespoke headers.
 */
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface SectionShellProps {
    title: ReactNode;
    open: boolean;
    onToggle: () => void;
    /** Right side of the header — chips, counts, action buttons.
     *  Clicks bubble independently of the toggle. */
    trailing?: ReactNode;
    /** Body is rendered only when open; allows expensive children to
     *  skip mounting until needed. */
    children: ReactNode;
    /** Optional muted one-liner under the title (e.g. metadata). */
    subtitle?: ReactNode;
    /** Override the chevron-only header with a custom layout when
     *  needed (e.g. for the Active-T2I row which has a thumb strip
     *  always visible alongside the toggle). */
    headerOverride?: ReactNode;
}

export default function SectionShell({
    title,
    open,
    onToggle,
    trailing,
    children,
    subtitle,
    headerOverride,
}: SectionShellProps) {
    return (
        <div className="border-b border-glass-border last:border-b-0 py-4">
            {headerOverride ?? (
                <div className="flex items-center gap-2 px-3 mb-3">
                    {/* 28x28 visual chevron + 40x40 hit area via -m-1
                        p-2 expansion (WCAG 2.5.5 AA). Visual outline
                        unchanged. */}
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={open}
                        aria-label={open ? "Collapse section" : "Expand section"}
                        className="-m-1 grid h-7 w-7 place-items-center rounded text-text-muted transition-colors duration-fast ease-out-quart hover:bg-hover-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                    >
                        {open ? (
                            <ChevronDown size={13} aria-hidden="true" />
                        ) : (
                            <ChevronRight size={13} aria-hidden="true" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onToggle}
                        className="flex min-w-0 flex-1 items-baseline gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                    >
                        {/* Section title — chrome tier (per type scale),
                            uppercase tracking is RESERVED for section
                            titles (not metadata) per Sweep E (P2-1). */}
                        <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                            {title}
                        </span>
                        {subtitle ? (
                            <span className="truncate font-mono text-[0.625rem] tracking-tight text-text-muted">
                                {subtitle}
                            </span>
                        ) : null}
                    </button>
                    {trailing ? (
                        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
                    ) : null}
                </div>
            )}
            {open ? <div className="px-3">{children}</div> : null}
        </div>
    );
}

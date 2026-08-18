"use client";
/**
 * ShotPanel — the attached "workbench" that hangs under each shot in
 * the storyboard. Visual treatment (per design grill Q11):
 *   - Indented ~20px from the shot card's left edge (suggests "child of")
 *   - Dashed line connecting the panel's top to the shot card's bottom
 *   - Slightly darker background than the shot card
 *
 * The panel itself is a thin chrome; ParamsSection / T2ISubsection /
 * CandidatesSection compose inside as children. ShotPanel is also
 * the boundary where per-shot collapse state lives — but we
 * intentionally do NOT make the WHOLE panel collapsible; each
 * subsection has its own toggle so users can keep params open while
 * collapsing candidates and vice versa (per grill Q11 X).
 *
 * Why no outer toggle: with attached panels under every shot in a
 * long storyboard, having "params + candidates" share one toggle
 * would force users to expand/collapse a chunky bundle every time
 * they wanted to peek at just one half. Independent toggles per
 * subsection keep the affordance precise.
 */
import type { ReactNode } from "react";

interface ShotPanelProps {
    children: ReactNode;
}

export default function ShotPanel({ children }: ShotPanelProps) {
    // P2-4 revision: the previous "dashed" connector was too subtle
    // to register. Promoted to a 1px solid primary-tinted L-shape that
    // commits to "this belongs to that shot." Panel itself gains a
    // subtle inset highlight + soft outer shadow for depth without
    // boxiness (anti-pattern: nested cards).
    //
    // Responsive: at ≥md (768) keep the deep ml-5 indent that visually
    // marks "child of shot." Below md the candidate grid + params
    // sections need every horizontal pixel, so the indent shrinks to
    // ml-2 and the connector L-shape repositions to match.
    return (
        <div className="relative ml-2 mr-1 mt-1.5 md:ml-5">
            <span
                aria-hidden="true"
                className="absolute -top-2.5 left-1.5 h-3 border-l border-primary/35 md:left-3"
            />
            <span
                aria-hidden="true"
                className="absolute top-[2px] left-1.5 h-px w-2 border-t border-primary/35 md:left-3 md:w-2.5"
            />
            <div className="rounded-lg border border-glass-border bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_12px_-6px_rgba(0,0,0,0.5)] backdrop-blur-[2px] motion-safe:animate-[shotPanelIn_220ms_cubic-bezier(0.22,1,0.36,1)_both]">
                {children}
            </div>
        </div>
    );
}

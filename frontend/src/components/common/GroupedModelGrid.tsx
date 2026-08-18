import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import rawCatalog from '@/generated/modelCatalog.json';
import type { I2VModelConfig, SelectableModelOption } from '@/lib/modelCatalog';

// ---------------------------------------------------------------------------
// Family display names — fall back to the raw key when the catalog entry
// does not carry an explicit display_name.
// ---------------------------------------------------------------------------

const FAMILY_DISPLAY_NAMES: Record<string, string> = {};
for (const [key, fam] of Object.entries(
    ((rawCatalog as Record<string, unknown>).families as Record<string, Record<string, unknown>>) ||
        {},
)) {
    FAMILY_DISPLAY_NAMES[key] = (fam.display_name as string) || key;
}

// Quick lookup: model-id -> catalog ui.order (used for group sorting).
const MODEL_ORDER: Record<string, number> = {};
for (const [id, model] of Object.entries(
    ((rawCatalog as Record<string, unknown>).models as Record<
        string,
        { ui?: { order?: number } }
    >) || {},
)) {
    MODEL_ORDER[id] = model.ui?.order ?? 0;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The component accepts any model shape that satisfies this base contract. */
export type GroupableModel = (I2VModelConfig | SelectableModelOption) & {
    id: string;
    name: string;
    description: string;
    family?: string;
    badges?: string[];
    recommended?: boolean;
    status?: string;
};

type AccentColor = 'green' | 'blue' | 'purple';

// Line B「Luminous Atelier」: the `accent` prop is retained for API
// compatibility, but its green/blue/purple variants are collapsed to a single
// atelier teal (primary) treatment. Selected cards get a teal border + soft
// teal glow; the check icon renders in primary.
const ATELIER_SELECTED = {
    selected: 'border-primary/50 bg-primary/10 shadow-[var(--glow-primary)]',
    check: 'text-primary',
};

const ACCENT_CLASSES: Record<AccentColor, { selected: string; check: string }> = {
    green: ATELIER_SELECTED,
    blue: ATELIER_SELECTED,
    purple: ATELIER_SELECTED,
};

interface GroupedModelGridProps {
    models: GroupableModel[];
    selectedId: string;
    onSelect: (id: string) => void;
    /** Accent color for the selected card. Defaults to "green". */
    accent?: AccentColor;
    /** Number of grid columns. Defaults to 2. */
    columns?: 2 | 3;
    /** Optional className applied to the root wrapper. */
    className?: string;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

interface FamilyGroup {
    family: string;
    displayName: string;
    maxOrder: number;
    models: GroupableModel[];
}

function buildGroups(models: GroupableModel[]): FamilyGroup[] {
    const map = new Map<string, GroupableModel[]>();

    for (const model of models) {
        const family = model.family || '_ungrouped';
        let bucket = map.get(family);
        if (!bucket) {
            bucket = [];
            map.set(family, bucket);
        }
        bucket.push(model);
    }

    const groups: FamilyGroup[] = [];
    for (const [family, familyModels] of Array.from(map.entries())) {
        const maxOrder = familyModels.reduce(
            (max: number, m: GroupableModel) => Math.max(max, MODEL_ORDER[m.id] ?? 0),
            0,
        );
        groups.push({
            family,
            displayName: FAMILY_DISPLAY_NAMES[family] || family,
            maxOrder,
            models: familyModels,
        });
    }

    // Sort groups: highest maxOrder first.
    groups.sort((a, b) => b.maxOrder - a.maxOrder);
    return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GroupedModelGrid({
    models,
    selectedId,
    onSelect,
    accent = 'green',
    columns = 2,
    className,
}: GroupedModelGridProps) {
    const groups = useMemo(() => buildGroups(models), [models]);
    const accentClasses = ACCENT_CLASSES[accent];

    const gridCols = columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

    return (
        <div className={`space-y-4${className ? ` ${className}` : ''}`}>
            {groups.map((group) => (
                <div key={group.family}>
                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-text-muted">
                            {group.displayName}
                        </span>
                        <div className="flex-1 h-px bg-glass-border" />
                    </div>

                    {/* Model cards */}
                    <div className={`grid ${gridCols} gap-2`}>
                        {group.models.map((model) => {
                            const isSelected = model.id === selectedId;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => onSelect(model.id)}
                                    className={`relative flex flex-col items-start p-3.5 rounded-lg border transition-all text-left ${
                                        isSelected
                                            ? accentClasses.selected
                                            : 'border-glass-border bg-glass hover:-translate-y-0.5 hover:border-primary/40'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <Check size={14} className={accentClasses.check} />
                                        </div>
                                    )}
                                    <span className="text-[0.9375rem] font-semibold text-foreground leading-snug">
                                        {model.name}
                                    </span>
                                    <span className="text-[0.8125rem] text-text-secondary mt-0.5 leading-relaxed">
                                        {model.description}
                                    </span>
                                    {model.badges && model.badges.length > 0 && (
                                        <div className="flex gap-1 mt-1.5">
                                            {model.badges.map((badge) => (
                                                <span
                                                    key={badge}
                                                    className="text-[0.625rem] px-1.5 py-0.5 rounded bg-elevated text-text-secondary"
                                                >
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

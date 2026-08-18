/**
 * Tests for interactive multi-round polish logic:
 * - Draft selection (first polish vs re-polish with feedback)
 * - API payload construction (feedback parameter)
 *
 * Since vitest environment is 'node' (no jsdom/RTL),
 * we extract and test pure business logic.
 */
import { describe, it, expect } from 'vitest';

// ── Draft selection logic (mirrors VideoCreator.handlePolish) ──────────

/**
 * When feedback is provided, use the current polished EN result as draft.
 * When no feedback, use the original prompt.
 * This is the core logic from both VideoCreator and PropertiesPanel.
 */
function selectDraftForVideoPolish(
    feedback: string,
    originalPrompt: string,
    polishedEn: string | undefined,
): string | null {
    const draftPrompt = feedback ? (polishedEn || originalPrompt) : originalPrompt;
    return draftPrompt || null;
}

/**
 * PropertiesPanel variant: uses image_prompt or action_description as fallback.
 */
function selectDraftForStoryboardPolish(
    feedback: string,
    polishedEn: string | undefined,
    imagePrompt: string | undefined,
    actionDescription: string | undefined,
): string {
    if (feedback) {
        return polishedEn || imagePrompt || actionDescription || "";
    }
    return imagePrompt || actionDescription || "";
}

describe('selectDraftForVideoPolish', () => {
    it('should use original prompt when no feedback', () => {
        const result = selectDraftForVideoPolish("", "original prompt", "polished EN");
        expect(result).toBe("original prompt");
    });

    it('should use polished EN when feedback is provided and polished exists', () => {
        const result = selectDraftForVideoPolish("make it shorter", "original prompt", "polished EN");
        expect(result).toBe("polished EN");
    });

    it('should fall back to original prompt when feedback provided but no polished result', () => {
        const result = selectDraftForVideoPolish("make it shorter", "original prompt", undefined);
        expect(result).toBe("original prompt");
    });

    it('should return null when no feedback and no original prompt', () => {
        const result = selectDraftForVideoPolish("", "", undefined);
        expect(result).toBeNull();
    });

    it('should return polished EN even when original prompt is empty (feedback mode)', () => {
        const result = selectDraftForVideoPolish("fix this", "", "polished EN");
        expect(result).toBe("polished EN");
    });
});

describe('selectDraftForStoryboardPolish', () => {
    it('should use image_prompt when no feedback', () => {
        const result = selectDraftForStoryboardPolish("", "polished EN", "image prompt", "action desc");
        expect(result).toBe("image prompt");
    });

    it('should fall back to action_description when no feedback and no image_prompt', () => {
        const result = selectDraftForStoryboardPolish("", undefined, undefined, "action desc");
        expect(result).toBe("action desc");
    });

    it('should use polished EN when feedback provided', () => {
        const result = selectDraftForStoryboardPolish("more detail", "polished EN", "image prompt", "action desc");
        expect(result).toBe("polished EN");
    });

    it('should fall back to image_prompt when feedback provided but no polished EN', () => {
        const result = selectDraftForStoryboardPolish("more detail", undefined, "image prompt", "action desc");
        expect(result).toBe("image prompt");
    });

    it('should fall back to action_description when feedback but no polished EN or image_prompt', () => {
        const result = selectDraftForStoryboardPolish("more detail", undefined, undefined, "action desc");
        expect(result).toBe("action desc");
    });

    it('should return empty string when all sources are undefined', () => {
        const result = selectDraftForStoryboardPolish("feedback", undefined, undefined, undefined);
        expect(result).toBe("");
    });
});

// ── API payload construction ──────────────────────────────────────────

/** Mirrors api.polishVideoPrompt payload */
function buildVideoPolishPayload(draftPrompt: string, feedback: string = "") {
    return {
        draft_prompt: draftPrompt,
        feedback: feedback,
    };
}

/** Mirrors api.polishR2VPrompt payload */
function buildR2VPolishPayload(
    draftPrompt: string,
    slots: { description: string }[],
    feedback: string = "",
) {
    return {
        draft_prompt: draftPrompt,
        slots: slots,
        feedback: feedback,
    };
}

/** Mirrors api.refineFramePrompt payload */
function buildRefineFramePayload(
    frameId: string,
    rawPrompt: string,
    assets: any[] = [],
    feedback: string = "",
) {
    return {
        frame_id: frameId,
        raw_prompt: rawPrompt,
        assets: assets,
        feedback: feedback,
    };
}

describe('buildVideoPolishPayload', () => {
    it('should include empty feedback by default', () => {
        const payload = buildVideoPolishPayload("a nice prompt");
        expect(payload).toEqual({
            draft_prompt: "a nice prompt",
            feedback: "",
        });
    });

    it('should include feedback when provided', () => {
        const payload = buildVideoPolishPayload("a nice prompt", "make it more cinematic");
        expect(payload).toEqual({
            draft_prompt: "a nice prompt",
            feedback: "make it more cinematic",
        });
    });
});

describe('buildR2VPolishPayload', () => {
    it('should include slots and empty feedback by default', () => {
        const slots = [{ description: "warrior" }];
        const payload = buildR2VPolishPayload("prompt", slots);
        expect(payload).toEqual({
            draft_prompt: "prompt",
            slots: [{ description: "warrior" }],
            feedback: "",
        });
    });

    it('should include feedback when provided', () => {
        const slots = [{ description: "warrior" }, { description: "mage" }];
        const payload = buildR2VPolishPayload("prompt", slots, "add more action");
        expect(payload.feedback).toBe("add more action");
        expect(payload.slots).toHaveLength(2);
    });

    it('should work with empty slots array', () => {
        const payload = buildR2VPolishPayload("prompt", [], "feedback");
        expect(payload.slots).toEqual([]);
        expect(payload.feedback).toBe("feedback");
    });
});

describe('buildRefineFramePayload', () => {
    it('should include frame_id, raw_prompt and empty defaults', () => {
        const payload = buildRefineFramePayload("frame-1", "raw prompt");
        expect(payload).toEqual({
            frame_id: "frame-1",
            raw_prompt: "raw prompt",
            assets: [],
            feedback: "",
        });
    });

    it('should include assets and feedback when provided', () => {
        const assets = [{ type: "Character", name: "Hero", description: "brave warrior" }];
        const payload = buildRefineFramePayload("frame-1", "raw prompt", assets, "more detail on hero");
        expect(payload.assets).toHaveLength(1);
        expect(payload.feedback).toBe("more detail on hero");
    });
});

// ── Feedback input validation logic ──────────────────────────────────

/** Mirrors the disabled condition for "再润色" button */
function canSubmitFeedback(isPolishing: boolean, feedbackText: string): boolean {
    return !isPolishing && !!feedbackText.trim();
}

/** Mirrors the Enter key handler condition (after fix) */
function shouldHandleEnterKey(key: string, feedbackText: string, isPolishing: boolean): boolean {
    return key === "Enter" && !!feedbackText.trim() && !isPolishing;
}

describe('canSubmitFeedback', () => {
    it('should return false when polishing is in progress', () => {
        expect(canSubmitFeedback(true, "some feedback")).toBe(false);
    });

    it('should return false when feedback is empty', () => {
        expect(canSubmitFeedback(false, "")).toBe(false);
    });

    it('should return false when feedback is whitespace only', () => {
        expect(canSubmitFeedback(false, "   ")).toBe(false);
    });

    it('should return true when not polishing and feedback has content', () => {
        expect(canSubmitFeedback(false, "make it better")).toBe(true);
    });
});

describe('shouldHandleEnterKey', () => {
    it('should return true for Enter key with feedback and not polishing', () => {
        expect(shouldHandleEnterKey("Enter", "feedback", false)).toBe(true);
    });

    it('should return false for non-Enter key', () => {
        expect(shouldHandleEnterKey("Escape", "feedback", false)).toBe(false);
    });

    it('should return false when polishing (prevents double-submit)', () => {
        expect(shouldHandleEnterKey("Enter", "feedback", true)).toBe(false);
    });

    it('should return false when feedback is empty', () => {
        expect(shouldHandleEnterKey("Enter", "", false)).toBe(false);
    });

    it('should return false when feedback is whitespace', () => {
        expect(shouldHandleEnterKey("Enter", "  ", false)).toBe(false);
    });
});

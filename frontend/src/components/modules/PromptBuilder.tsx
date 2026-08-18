"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useLayoutEffect } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronDown, Video, User } from "lucide-react";

export type PromptSegment =
    | { type: "text"; value: string; id: string }
    | { type: "camera"; value: string; label: string; id: string }
    | { type: "character"; value: string; label: string; thumbnail?: string; id: string };  // value is "character1"/"character2"/"character3", label is display name

interface PromptBuilderProps {
    segments: PromptSegment[];
    onChange: (segments: PromptSegment[]) => void;
    onSubmit?: () => void;
    placeholder?: string;
}

export interface PromptBuilderRef {
    insertCamera: () => void;
    insertText: (text: string) => void;
    insertCharacter: (characterIndex: number, name: string, thumbnail?: string) => void;
}

const CAMERA_GROUPS = [
    {
        label: "Basic Movement (基础运镜)",
        options: [
            { label: "⬅️ 水平左移 (Pan Left)", value: "camera pans left" },
            { label: "➡️ 水平右移 (Pan Right)", value: "camera pans right" },
            { label: "⬆️ 向上推移 (Tilt Up)", value: "camera pans up" },
            { label: "⬇️ 向下推移 (Tilt Down)", value: "camera pans down" },
            { label: "🔍+ 镜头推进 (Zoom In)", value: "zoom in, close up" },
            { label: "🔍- 镜头拉远 (Zoom Out)", value: "zoom out, wide angle" },
        ]
    },
    {
        label: "Cinematic (高级/电影感运镜)",
        options: [
            { label: "🔄 环绕拍摄 (Orbit)", value: "camera orbits around, 360 degree view" },
            { label: "👀 第一人称 (FPV)", value: "FPV view, first person perspective" },
            { label: "✈️ 无人机航拍 (Drone)", value: "drone shot, aerial view, fly over" },
            { label: "🎦 手持晃动 (Handheld)", value: "handheld camera, shaky cam, realistic" },
            { label: "🏃 跟随运镜 (Tracking)", value: "tracking shot, following the subject" },
            { label: "📍 固定机位 (Static)", value: "static camera, no movement, tripod shot" },
        ]
    }
];

// Helper to find option across groups
const findCameraOption = (value: string) => {
    for (const group of CAMERA_GROUPS) {
        const found = group.options.find(opt => opt.value === value);
        if (found) return found;
    }
    return null;
};

const PromptBuilder = forwardRef<PromptBuilderRef, PromptBuilderProps>(({ segments, onChange, onSubmit, placeholder }, ref) => {
    const ts = useTranslations("storyboard");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // Local state to manage the textarea value directly, avoiding cursor jumps from prop sync
    const [value, setValue] = useState("");
    const isComposing = useRef(false);

    // Convert segments to Text format
    // Text: value
    // Camera: (camera: value)
    // Character: [value: label]  (e.g. [character1:雷震])
    const segmentsToText = (segs: PromptSegment[]) => {
        return segs.map(seg => {
            if (seg.type === "text") {
                return seg.value;
            } else if (seg.type === "camera") {
                return `(camera: ${seg.value})`;
            } else if (seg.type === "character") {
                return `[${seg.value}:${seg.label}]`;
            }
            return "";
        }).join("");
    };

    // Parse Text back to segments
    const parseTextToSegments = (text: string): PromptSegment[] => {
        const newSegments: PromptSegment[] = [];
        // Regex to match [characterN:Label] or (camera: Value)
        // Group 1: character value (character\d+)
        // Group 2: character label
        // Group 3: camera value
        const regex = /\[(character\d+):([^\]]+)\]|\(camera:\s*([^)]+)\)/g;

        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Add preceding text
            if (match.index > lastIndex) {
                newSegments.push({
                    type: "text",
                    value: text.slice(lastIndex, match.index),
                    id: Math.random().toString(36).substr(2, 9)
                });
            }

            if (match[1]) {
                // Character match
                newSegments.push({
                    type: "character",
                    value: match[1],
                    label: match[2],
                    id: Math.random().toString(36).substr(2, 9)
                });
            } else if (match[3]) {
                // Camera match
                newSegments.push({
                    type: "camera",
                    value: match[3].trim(),
                    label: match[3].trim(), // Use value as label for simplicity in text mode
                    id: Math.random().toString(36).substr(2, 9)
                });
            }

            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            newSegments.push({
                type: "text",
                value: text.slice(lastIndex),
                id: Math.random().toString(36).substr(2, 9)
            });
        }

        return newSegments.length > 0 ? newSegments : [{ type: "text", value: "", id: "init" }];
    };

    // Sync props to local state
    // Only sync if the semantic content has changed externally
    useEffect(() => {
        const textFromProps = segmentsToText(segments);
        // We compare the parsed version of current local value with props to see if they are semantically different
        // This prevents overwriting local state (and moving cursor) when the round-trip conversion is stable
        const currentParsed = parseTextToSegments(value);
        const currentReconstructed = segmentsToText(currentParsed);

        if (textFromProps !== currentReconstructed && !isComposing.current) {
            setValue(textFromProps);
        }
        // If value is empty and props are not, sync (initial load)
        if (!value && textFromProps) {
            setValue(textFromProps);
        }
    }, [segments]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (!isComposing.current) {
            const newSegments = parseTextToSegments(newValue);
            onChange(newSegments);
        }
    };

    const handleCompositionStart = () => {
        isComposing.current = true;
    };

    const handleCompositionEnd = () => {
        isComposing.current = false;
        // Trigger update after composition
        const newSegments = parseTextToSegments(value);
        onChange(newSegments);
    };

    const insertTextAtCursor = (textToInsert: string) => {
        if (!textareaRef.current) return;

        const input = textareaRef.current;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;

        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        const newValue = before + textToInsert + after;

        setValue(newValue);

        // Update parent
        const newSegments = parseTextToSegments(newValue);
        onChange(newSegments);

        // Restore cursor position
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = start + textToInsert.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    useImperativeHandle(ref, () => ({
        insertCamera: () => {
            // Default camera
            insertTextAtCursor("(camera: camera pans left)");
        },
        insertText: (text: string) => {
            insertTextAtCursor(text);
        },
        insertCharacter: (characterIndex: number, name: string, thumbnail?: string) => {
            const id = `character${characterIndex + 1}`;
            insertTextAtCursor(`[${id}:${name}]`);
        }
    }));

    return (
        <div className="relative group w-full h-full">
            <textarea
                ref={textareaRef}
                className="glass-input w-full min-h-[8rem] h-full p-4 text-base leading-relaxed outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none bg-transparent text-foreground placeholder-text-muted font-mono"
                value={value}
                onChange={handleChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        onSubmit?.();
                    }
                }}
                placeholder={placeholder || ts("promptBuilderPlaceholder")}
            />
        </div>
    );
});

PromptBuilder.displayName = "PromptBuilder";

export default PromptBuilder;

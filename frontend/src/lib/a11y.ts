import type { KeyboardEvent } from "react";

/**
 * Roving arrow-key navigation for a tablist / radiogroup container.
 *
 * Attach to the container's `onKeyDown`; its children must carry
 * role="tab" or role="radio". ArrowLeft/Up and ArrowRight/Down move focus to
 * the prev/next item (wrapping) and activate it (automatic activation, matching
 * the existing onClick); Home/End jump to the ends. Disabled items are skipped.
 *
 * Pair with roving tabindex on the items: the active item gets tabIndex={0},
 * the rest tabIndex={-1}, so Tab enters the group once and arrows move within.
 */
export function rovingKeyDown(e: KeyboardEvent<HTMLElement>) {
  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"],[role="radio"]')
  ).filter((el) => el.getAttribute("aria-disabled") !== "true" && !(el as HTMLButtonElement).disabled);
  if (items.length === 0) return;
  const cur = items.indexOf(document.activeElement as HTMLElement);
  if (cur < 0) return;
  e.preventDefault();
  let next = cur;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (cur + 1) % items.length;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (cur - 1 + items.length) % items.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = items.length - 1;
  items[next].focus();
  items[next].click();
}

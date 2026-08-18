/**
 * Dev-only logger. Replaces direct `console.warn` / `console.error`
 * scattered across feature code so production bundles don't leak
 * internal failure detail to the browser console.
 *
 * Use case: networkblips, optimistic-UI race losses, debounced-writer
 * retry failures — things the user doesn't need to see but a dev
 * wants visible when iterating locally.
 *
 * In production (`NODE_ENV === 'production'`) the calls are no-ops.
 * In development the messages route to console.* with a tag so
 * filtering in DevTools stays trivial.
 *
 * For user-facing failures (e.g. "Failed to save your work") use a
 * toast component instead; this is strictly diagnostic chatter.
 */

const isDev = process.env.NODE_ENV !== "production";

function tag(scope: string): string {
    return `[${scope}]`;
}

export const debugLog = {
    warn: (scope: string, ...args: unknown[]): void => {
        if (!isDev) return;
        // eslint-disable-next-line no-console
        console.warn(tag(scope), ...args);
    },
    error: (scope: string, ...args: unknown[]): void => {
        if (!isDev) return;
        // eslint-disable-next-line no-console
        console.error(tag(scope), ...args);
    },
    info: (scope: string, ...args: unknown[]): void => {
        if (!isDev) return;
        // eslint-disable-next-line no-console
        console.info(tag(scope), ...args);
    },
};

"use client";

/**
 * OfflineBanner — global network-connectivity indicator (MVP).
 *
 * Renders a thin top banner only while the browser reports offline, so the
 * user knows queued actions won't reach the backend until reconnection.
 * Disabling action buttons app-wide is intentionally deferred (out of MVP).
 */
import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOnline } from "@/lib/useOnline";

export default function OfflineBanner() {
  const online = useOnline();
  const t = useTranslations("common");

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-none items-center justify-center gap-2 border-b border-status-failed-border bg-status-failed-bg px-4 py-1.5 text-status-failed-fg"
    >
      <WifiOff size={14} aria-hidden="true" className="flex-shrink-0" />
      <span className="text-body-sm font-medium">
        {t("offlineBannerText")}
      </span>
    </div>
  );
}

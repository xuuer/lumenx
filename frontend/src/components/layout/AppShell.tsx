"use client";

import GlobalSidebar, { type GlobalTab } from "./GlobalSidebar";
import OfflineBanner from "./OfflineBanner";
import BottomTabBar from "./BottomTabBar";

interface AppShellProps {
  activeTab: GlobalTab;
  onTabChange: (tab: GlobalTab) => void;
  children: React.ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <OfflineBanner />
      <div className="flex min-h-0 flex-1">
        <GlobalSidebar activeTab={activeTab} onTabChange={onTabChange} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}

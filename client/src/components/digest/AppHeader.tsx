import { ReactNode } from "react";

export function AppHeader({ children }: { children?: ReactNode }) {
  if (!children) return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-opacity-80">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-end">
        {children}
      </div>
    </header>
  );
}

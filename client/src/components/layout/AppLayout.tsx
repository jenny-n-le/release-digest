import { ReactNode, createContext, useContext, useState } from "react";
import { Sidebar } from "./Sidebar";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-muted/20">
        <Sidebar />
        <div
          className="transition-all duration-200"
          style={{ marginLeft: collapsed ? 60 : 200 }}
        >
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

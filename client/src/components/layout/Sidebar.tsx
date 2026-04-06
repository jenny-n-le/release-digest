import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Newspaper,
  Layers,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "./AppLayout";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  children?: { label: string; path: string; icon: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Digest", path: "/", icon: Newspaper },
  {
    label: "EPD",
    path: "/epd",
    icon: Layers,
    children: [
      { label: "Tier Calculator", path: "/epd/tier-calculator", icon: Calculator },
    ],
  },
  { label: "GTM", path: "/gtm", icon: Megaphone },
];

export function Sidebar() {
  const [location] = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [expandedSections, setExpandedSections] = useState<string[]>(["/epd"]);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location === path;
  };

  const isSectionActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((c) => location === c.path);
    }
    return isActive(item.path);
  };

  const toggleSection = (path: string) => {
    setExpandedSections((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isSectionActive(item);
    const hasChildren = !!item.children;
    const isExpanded = expandedSections.includes(item.path);

    if (collapsed) {
      if (hasChildren) {
        return (
          <TooltipProvider key={item.path} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={item.children![0].path}>
                  <button
                    className={`w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all px-2 py-2.5 ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <div className="space-y-1">
                  <div className="font-medium">{item.label}</div>
                  {item.children!.map((child) => (
                    <Link key={child.path} href={child.path}>
                      <div className="text-muted-foreground hover:text-foreground cursor-pointer py-0.5">
                        {child.label}
                      </div>
                    </Link>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <TooltipProvider key={item.path} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={item.path}>
                <button
                  className={`w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all px-2 py-2.5 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                </button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (hasChildren) {
      return (
        <div key={item.path}>
          <button
            onClick={() => toggleSection(item.path)}
            className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all px-3 py-2.5 ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                isExpanded ? "" : "-rotate-90"
              }`}
            />
          </button>
          {isExpanded && (
            <div className="ml-4 pl-3 border-l space-y-0.5 mt-0.5">
              {item.children!.map((child) => {
                const ChildIcon = child.icon;
                const childActive = isActive(child.path);
                return (
                  <Link key={child.path} href={child.path}>
                    <button
                      className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all px-2.5 py-2 ${
                        childActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <ChildIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{child.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.path}>
        <Link href={item.path}>
          <button
            className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all px-3 py-2.5 ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        </Link>
      </div>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r flex flex-col transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-[200px]"
      }`}
      data-testid="sidebar"
    >
      <div
        className={`h-14 flex items-center border-b px-3 ${
          collapsed ? "justify-center" : "gap-3"
        }`}
      >
        <div className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-primary-foreground font-bold font-display text-lg shadow-lg shadow-primary/20 bg-[#1B66FF]">
          WS
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold font-display tracking-tight truncate">
            Workstream
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1" data-testid="nav-main">
        {NAV_ITEMS.map(renderNavItem)}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full ${collapsed ? "justify-center px-0" : ""}`}
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

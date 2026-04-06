import { Release } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
  releases: Release[];
  onReleaseClick?: (release: Release) => void;
}

const COLUMN_ORDER = [
  "In Development",
  "Coming Soon",
  "Beta",
  "Partially Released",
  "Fully Released",
] as const;

export function KanbanBoard({ releases, onReleaseClick }: KanbanBoardProps) {
  // Group releases by status
  const releasesByStatus = releases.reduce((acc, release) => {
    if (!acc[release.status]) {
      acc[release.status] = [];
    }
    acc[release.status].push(release);
    return acc;
  }, {} as Record<string, Release[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Development": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Coming Soon": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Beta": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Partially Released": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Fully Released": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {COLUMN_ORDER.map((status) => (
        <div key={status} className="flex-none w-80 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {status}
            </h3>
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {releasesByStatus[status]?.length || 0}
            </span>
          </div>

          <ScrollArea className="flex-1 bg-muted/30 rounded-xl p-2 h-full border border-dashed border-muted-foreground/20">
            <div className="flex flex-col gap-3">
              {releasesByStatus[status]?.map((release) => (
                <div key={release.id} onClick={onReleaseClick ? () => onReleaseClick(release) : undefined} className={onReleaseClick ? "cursor-pointer" : ""}>
                  <Card className="bg-white dark:bg-slate-900 border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                          {release.product}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {release.releaseDate || (release.status === "Coming Soon" ? "TBD" : "")}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-medium leading-tight pt-1">
                        <div className="hover:underline decoration-primary underline-offset-2">
                          {release.releaseName}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                      <p className="line-clamp-3 mb-2">{release.what}</p>
                      {release.owner && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                            {release.owner.charAt(0)}
                          </div>
                          <span className="text-[10px]">{release.owner}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
              {(!releasesByStatus[status] || releasesByStatus[status].length === 0) && (
                <div className="h-24 flex items-center justify-center text-xs text-muted-foreground italic">
                  No items
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}

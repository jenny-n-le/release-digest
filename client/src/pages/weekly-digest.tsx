import { useState, useMemo } from "react";
import { subDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { fetchAllReleases, groupReleasesByProduct, generateEmailHtml, filterRecentlyReleased, filterComingSoon, sortComingSoon } from "@/lib/mock-notion";
import { DateRangePicker } from "@/components/digest/DateRangePicker";
import { ProductFilter } from "@/components/digest/ProductFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductGroup } from "@/components/digest/ProductGroup";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, LayoutGrid, List, Download, Clock, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { KanbanBoard } from "@/components/digest/KanbanBoard";
import { ReleaseDetailPanel } from "@/components/digest/ReleaseDetailPanel";
import { ExportDrawer } from "@/components/digest/ExportDrawer";
import { AppHeader } from "@/components/digest/AppHeader";
import { Release } from "@/lib/types";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function WeeklyDigest() {
  const [startDate, setStartDate] = useState(() => subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(() => new Date());
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilters, setTierFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { toast } = useToast();

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  const { data: allReleases, isLoading, isFetching } = useQuery({
    queryKey: ['all-releases-digest'],
    queryFn: fetchAllReleases,
    staleTime: 2 * 60 * 1000,
  });

  const toggleTierFilter = (tier: string) => {
    setTierFilters(prev => {
      if (prev.includes(tier)) {
        return prev.filter(t => t !== tier);
      }
      return [...prev, tier];
    });
  };

  const applyCommonFilters = (releases: Release[]) => {
    return releases.filter(release => {
      const releaseProducts = release.product.split(", ").filter(Boolean);
      const productMatch = selectedProducts.length === 0 || releaseProducts.some(p => selectedProducts.includes(p));
      const tierMatch = tierFilters.length === 0 || (release.tier && tierFilters.includes(release.tier));
      return productMatch && tierMatch;
    });
  };

  const { recentlyReleased, comingSoon, allFiltered } = useMemo(() => {
    if (!allReleases) return { recentlyReleased: [], comingSoon: [], allFiltered: [] };

    let baseReleases = allReleases;
    if (statusFilter !== "all" && statusFilter !== "Coming Soon") {
      baseReleases = allReleases.filter(r => r.status === statusFilter);
    }

    const recent = applyCommonFilters(filterRecentlyReleased(
      statusFilter === "Coming Soon" ? [] : baseReleases,
      startDate,
      endDate
    ));

    const coming = statusFilter !== "all" && statusFilter !== "Coming Soon"
      ? []
      : sortComingSoon(applyCommonFilters(filterComingSoon(allReleases)));

    return {
      recentlyReleased: recent,
      comingSoon: coming,
      allFiltered: [...recent, ...coming],
    };
  }, [allReleases, startDate, endDate, selectedProducts, statusFilter, tierFilters]);

  const groupedRecent = useMemo(() => groupReleasesByProduct(recentlyReleased), [recentlyReleased]);
  const groupedComingSoon = useMemo(() => groupReleasesByProduct(comingSoon), [comingSoon]);

  const hasReleases = allFiltered.length > 0;

  const TIERS = ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3', 'Untiered'];
  const tierColors: Record<string, string> = {
    'Tier 0': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 data-[state=on]:bg-red-200 data-[state=on]:border-red-300',
    'Tier 1': 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 data-[state=on]:bg-orange-200 data-[state=on]:border-orange-300',
    'Tier 2': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 data-[state=on]:bg-blue-200 data-[state=on]:border-blue-300',
    'Tier 3': 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 data-[state=on]:bg-slate-200 data-[state=on]:border-slate-300',
    'Untiered': 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 data-[state=on]:bg-gray-200 data-[state=on]:border-gray-300',
  };

  const tierDescriptions: Record<string, string> = {
    'Tier 0': 'New Product (GTM managed by Jenny)',
    'Tier 1': 'Large Release (GTM managed by Jonathan)',
    'Tier 2': 'Medium Release (GTM managed by Jenny)',
    'Tier 3': 'Small Release (GTM managed by RJ & CS Team)',
    'Untiered': 'X-small Release (No GTM support required)',
  };

  return (
    <div className="pb-20">
      <AppHeader>
        <div className="flex items-center gap-3">
          <div className="bg-muted p-1 rounded-lg flex items-center gap-1">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setViewMode('list')}
              title="List View"
              data-testid="view-list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setViewMode('board')}
              title="Board View"
              data-testid="view-board"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <ProductFilter
            selectedProducts={selectedProducts}
            onSelectionChange={setSelectedProducts}
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="In Development">In Development</SelectItem>
              <SelectItem value="Coming Soon">Coming Soon</SelectItem>
              <SelectItem value="Partially Released">Partially Released</SelectItem>
              <SelectItem value="Fully Released">Fully Released</SelectItem>
              <SelectItem value="Beta">Beta</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
          />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExportOpen(true)}
            data-testid="button-export"
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Export
          </Button>
        </div>
      </AppHeader>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-foreground">
                Releases 
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
                </span>
              </h2>
              {isFetching && !isLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filter by Tier:</span>
              <button
                onClick={() => setTierFilters([])}
                data-testid="tier-filter-all"
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  tierFilters.length === 0 
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All
              </button>
              {TIERS.map(tier => (
                <TooltipProvider key={tier}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleTierFilter(tier)}
                        data-state={tierFilters.includes(tier) ? "on" : "off"}
                        data-testid={`tier-filter-${tier.toLowerCase().replace(' ', '-')}`}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${tierColors[tier]} ${
                          !tierFilters.includes(tier) && tierFilters.length > 0 ? "opacity-50 hover:opacity-100" : "opacity-100"
                        }`}
                      >
                        {tier}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-slate-800">
                      <p>{tierDescriptions[tier]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading releases...</p>
              </div>
            ) : !hasReleases ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed p-12 text-center">
                <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground" data-testid="text-no-releases">No releases found</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  No releases found for this selection. Try expanding the date range or adjusting filters.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                <AnimatePresence mode="wait">
                  {viewMode === 'list' ? (
                    <motion.div
                      key="list-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-10"
                    >
                      {recentlyReleased.length > 0 && (
                        <div className="space-y-6" data-testid="section-recently-released">
                          <div className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-foreground">
                              Recently Released
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              ({recentlyReleased.length})
                            </span>
                          </div>
                          {Object.entries(groupedRecent).map(([product, productReleases]) => (
                            <motion.div
                              key={product}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ProductGroup 
                                productName={product} 
                                releases={productReleases} 
                                onReleaseClick={setSelectedRelease}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {comingSoon.length > 0 && (
                        <div className="space-y-6" data-testid="section-coming-soon">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-600" />
                            <h3 className="text-lg font-semibold text-foreground">
                              Coming Soon
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              ({comingSoon.length})
                            </span>
                          </div>
                          {Object.entries(groupedComingSoon).map(([product, productReleases]) => (
                            <motion.div
                              key={`coming-${product}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ProductGroup 
                                productName={product} 
                                releases={productReleases} 
                                onReleaseClick={setSelectedRelease}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="board-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <KanbanBoard 
                        releases={allFiltered} 
                        onReleaseClick={setSelectedRelease}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
      <ReleaseDetailPanel 
        release={selectedRelease} 
        isOpen={!!selectedRelease} 
        onClose={() => setSelectedRelease(null)} 
      />
      <ExportDrawer
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        releases={allFiltered}
        groupedReleases={groupReleasesByProduct(allFiltered)}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}

import { Release, PageContent, OverviewBlock, MediaItem, SectionContent } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User, 
  Users,
  FileText, 
  ExternalLink, 
  ArrowLeft, 
  Presentation,
  FileCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link as LinkIcon,
  Target,
  Play,
  Video,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface ReleaseDetailPanelProps {
  release: Release | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  'Released': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'Fully Released': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'In Development': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'Coming Soon': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'Partially Released': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'Beta': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  'Released': <CheckCircle2 className="w-4 h-4" />,
  'Fully Released': <CheckCircle2 className="w-4 h-4" />,
  'In Development': <FileCode className="w-4 h-4" />,
  'Coming Soon': <Clock className="w-4 h-4" />,
  'Partially Released': <AlertCircle className="w-4 h-4" />,
  'Beta': <AlertCircle className="w-4 h-4" />,
};

function BlocksRenderer({ blocks }: { blocks: OverviewBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => {
        if (block.type === "divider") {
          return <Separator key={idx} className="my-4" />;
        }
        if (block.type === "heading") {
          const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
          const sizes = { 1: "text-lg font-bold", 2: "text-base font-semibold", 3: "text-sm font-semibold" };
          return (
            <Tag key={idx} className={`${sizes[block.level as 1 | 2 | 3] || sizes[3]} mt-4 mb-1`}>
              {block.text}
            </Tag>
          );
        }
        if (block.type === "list_item") {
          return (
            <div key={idx} className="flex gap-2 text-sm text-muted-foreground pl-4">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
              <span>{block.text}</span>
            </div>
          );
        }
        if (block.type === "callout" || block.type === "quote") {
          return (
            <div key={idx} className="border-l-4 border-primary/30 bg-muted/30 px-4 py-2 rounded-r text-sm text-muted-foreground italic">
              {block.text}
            </div>
          );
        }
        return (
          <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function MediaRenderer({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null;

  const videos = items.filter(i => i.kind === "video");
  const images = items.filter(i => i.kind === "image");

  return (
    <div className="space-y-4">
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((item, idx) => (
            <div
              key={`video-${idx}`}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
              data-testid={`media-video-${idx}`}
            >
              <div className="h-12 w-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                <Video className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.host || "Video"}
                </div>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
                data-testid={`media-watch-${idx}`}
              >
                <Play className="h-3 w-3" />
                Watch
              </a>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((item, idx) => (
            <a
              key={`img-${idx}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg overflow-hidden border bg-muted relative group cursor-zoom-in aspect-[4/3]"
              data-testid={`media-image-${idx}`}
            >
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs truncate block">{item.title}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionPanel({ title, section, testId }: { title: string; section: SectionContent; testId: string }) {
  const hasBlocks = section.blocks.length > 0;
  const hasMedia = section.media.length > 0;
  if (!hasBlocks && !hasMedia) return null;

  return (
    <section className="space-y-4" data-testid={testId}>
      <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
      {hasBlocks && <BlocksRenderer blocks={section.blocks} />}
      {hasMedia && (
        <div className="mt-4">
          <MediaRenderer items={section.media} />
        </div>
      )}
    </section>
  );
}

export function ReleaseDetailPanel({ release, isOpen, onClose }: ReleaseDetailPanelProps) {
  const pageId = release && typeof release.id === "string" ? release.id : null;

  const { data: pageContent, isLoading: isLoadingContent } = useQuery<PageContent>({
    queryKey: ["page-content", pageId],
    queryFn: async () => {
      const res = await fetch(`/api/notion/pages/${pageId}/content`);
      if (!res.ok) throw new Error("Failed to fetch page content");
      return res.json();
    },
    enabled: isOpen && !!pageId,
    staleTime: 5 * 60 * 1000,
  });

  if (!release) return null;

  const sections = pageContent?.sections;
  const hasAnySectionContent = sections && (
    sections.detailedOverview.blocks.length > 0 || sections.detailedOverview.media.length > 0 ||
    sections.videosAndScreenshots.blocks.length > 0 || sections.videosAndScreenshots.media.length > 0 ||
    sections.enablementDeckOrLinks.blocks.length > 0 || sections.enablementDeckOrLinks.media.length > 0
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col" side="right">
        <div className="p-6 border-b bg-muted/10 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2 -ml-2 text-muted-foreground hover:text-foreground" 
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Weekly Digest
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <Badge variant="outline" className="mb-2">
                {release.product}
              </Badge>
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1.5 font-medium px-2.5 py-0.5 ${statusColors[release.status] || 'bg-gray-100 text-gray-700'}`}
              >
                {statusIcons[release.status]}
                {release.status}
              </Badge>
            </div>
            
            <SheetTitle className="text-2xl font-display font-bold leading-tight">
              {release.releaseName}
            </SheetTitle>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {(release.releaseDate || release.status === "Coming Soon") && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Release Date: {release.releaseDate || "TBD"}</span>
                </div>
              )}
              {release.owner && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Owner: {release.owner}</span>
                </div>
              )}
              {release.tier && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>{release.tier}</span>
                </div>
              )}
            </div>
            {release.who && release.who.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{release.who.join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">

            {release.what && (
              <section className="space-y-4" data-testid="section-brief-description">
                <h3 className="text-lg font-semibold border-b pb-2">Brief Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{release.what}</p>
              </section>
            )}

            {release.why && (
              <section className="space-y-4" data-testid="section-why-it-matters">
                <h3 className="text-lg font-semibold border-b pb-2">Why It Matters</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{release.why}</p>
              </section>
            )}

            {isLoadingContent && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading page content...
              </div>
            )}

            {sections && (
              <>
                <SectionPanel
                  title="Detailed Overview"
                  section={sections.detailedOverview}
                  testId="section-detailed-overview"
                />
                <SectionPanel
                  title="Videos & Screenshots"
                  section={sections.videosAndScreenshots}
                  testId="section-videos-screenshots"
                />
                <SectionPanel
                  title="Enablement Deck or Links"
                  section={sections.enablementDeckOrLinks}
                  testId="section-enablement-deck"
                />
              </>
            )}

            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Documentation & Resources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {release.prdUrl && (
                  <a 
                    href={release.prdUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">PRD / Spec</div>
                      <div className="text-xs text-muted-foreground">Product Requirements</div>
                    </div>
                    <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {release.enablementDeckUrl && (
                  <a 
                    href={release.enablementDeckUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">
                      <Presentation className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">Enablement Deck</div>
                      <div className="text-xs text-muted-foreground">Slides & Training</div>
                    </div>
                    <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {release.knowledgeArticleUrl && (
                  <a 
                    href={release.knowledgeArticleUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">Knowledge Article</div>
                      <div className="text-xs text-muted-foreground">User Guide</div>
                    </div>
                    <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                <a 
                  href={release.notionUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                >
                  <div className="h-10 w-10 rounded bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:scale-105 transition-transform">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">Notion Ticket</div>
                    <div className="text-xs text-muted-foreground">Original Source</div>
                  </div>
                  <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {release.resources && release.resources.map((resource, idx) => (
                  <a 
                    key={`resource-${idx}`}
                    href={resource.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <LinkIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">{resource.title || resource.type}</div>
                      <div className="text-xs text-muted-foreground">{resource.type}</div>
                    </div>
                    <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}

              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

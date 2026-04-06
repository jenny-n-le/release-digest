import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Copy, Slack, Mail, ExternalLink } from "lucide-react";
import { Release, DigestGroup } from "@/lib/types";
import { generateSlackPreview, generateSlackHtml, generateEmailHtml } from "@/lib/mock-notion";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  releases: Release[] | undefined;
  groupedReleases: Record<string, Release[]>;
  startDate: Date;
  endDate: Date;
}

export function ExportDrawer({
  isOpen,
  onClose,
  releases,
  groupedReleases,
  startDate,
  endDate,
}: ExportDrawerProps) {
  const { toast } = useToast();
  const hasReleases = releases && releases.length > 0;

  const copyRichText = (html: string, plainText: string, label: string) => {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plainText], { type: "text/plain" }),
    });
    navigator.clipboard.write([item]).catch(() => {
      navigator.clipboard.writeText(plainText);
    });
    toast({
      title: "Copied!",
      description: `${label} format copied to clipboard.`,
    });
  };

  const copySlack = () => {
    if (!releases) return;
    const s = format(startDate, 'MMM d');
    const e = format(endDate, 'MMM d');
    const html = generateSlackHtml(groupedReleases, s, e);
    const plain = generateSlackPreview(groupedReleases, s, e);
    copyRichText(html, plain, 'Slack');
  };

  const copyEmailHtml = () => {
    if (!releases) return;
    const html = generateEmailHtml(groupedReleases, format(startDate, 'MMM d'), format(endDate, 'MMM d'));
    copyRichText(html, html, 'Email HTML');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full" side="right">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>Export Digest</SheetTitle>
          <SheetDescription>
            {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Format</h3>
            
            <Tabs defaultValue="slack" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="slack">
                  <Slack className="h-4 w-4 mr-2" /> Slack
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" /> Email
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="slack" className="space-y-4">
                <div className="bg-slate-950 text-slate-50 p-3 rounded-md text-xs font-mono h-[300px] overflow-y-auto whitespace-pre-wrap border border-slate-800">
                  {hasReleases ? generateSlackPreview(groupedReleases, format(startDate, 'MMM d'), format(endDate, 'MMM d')) : 'No releases to export for this selection.'}
                </div>
                <Button 
                  className="w-full" 
                  onClick={copySlack}
                  disabled={!hasReleases}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy for Slack
                </Button>
              </TabsContent>
              
              <TabsContent value="email" className="space-y-4">
                <div className="bg-white border text-slate-900 p-3 rounded-md text-xs font-sans h-[300px] overflow-y-auto">
                   {hasReleases ? (
                     <div dangerouslySetInnerHTML={{ __html: generateEmailHtml(groupedReleases, format(startDate, 'MMM d'), format(endDate, 'MMM d')) }} />
                   ) : (
                     <div className="h-full flex items-center justify-center text-muted-foreground italic">No releases to export for this selection.</div>
                   )}
                </div>
                <Button 
                  className="w-full" 
                  onClick={copyEmailHtml}
                  disabled={!hasReleases}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy HTML for Email
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-5">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2 text-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Pro Tip
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Make sure to verify the "Knowledge Article" links in Notion before generating the digest to avoid broken links in the final output.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

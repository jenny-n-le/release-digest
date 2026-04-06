import { Release } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, User, FileText, Calendar, Info, Users, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReleaseCardProps {
  release: Release;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  'In Development': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800',
  'Coming Soon': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
  'Partially Released': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800',
  'Beta': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-800',
  'Fully Released': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800',
};

const tierStyles: Record<string, string> = {
  'Tier 0': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 font-bold',
  'Tier 1': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800 font-semibold',
  'Tier 2': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Tier 3': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  'Untiered': 'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-800',
};

const tierDescriptions: Record<string, string> = {
  'Tier 0': 'New Product (GTM managed by Jenny)',
  'Tier 1': 'Large Release (GTM managed by Jonathan)',
  'Tier 2': 'Medium Release (GTM managed by Jenny)',
  'Tier 3': 'Small Release (GTM managed by RJ & CS Team)',
  'Untiered': 'X-small Release (No GTM support required)',
};

export function ReleaseCard({ release, onClick }: ReleaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
    >
      <Card className="mb-4 hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg font-display tracking-tight leading-none">
                      {release.notionUrl ? (
                        <a
                          href={release.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`link-card-name-${release.id}`}
                        >
                          {release.releaseName}
                        </a>
                      ) : (
                        release.releaseName
                      )}
                  </CardTitle>
                  <Badge variant="outline" className={`font-normal ${statusColors[release.status] || 'bg-gray-100 text-gray-700'}`}>
                    {release.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                {(release.releaseDate || release.status === "Coming Soon") && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {release.releaseDate || "TBD"}
                  </span>
                )}
                {release.owner && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {release.owner}
                  </span>
                )}
                {release.knowledgeArticleUrl && (
                  <a href={release.knowledgeArticleUrl} className="flex items-center gap-1 hover:text-primary hover:underline">
                    <FileText className="h-3 w-3" />
                    Knowledge Article
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm pb-2">
          {release.what && (
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider pt-1">Brief Description</span>
              <p className="text-foreground/90 leading-relaxed">{release.what}</p>
            </div>
          )}
          {release.why && (
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider pt-1">Why It Matters</span>
              <p className="text-muted-foreground leading-relaxed">{release.why}</p>
            </div>
          )}
        </CardContent>
        {release.who && release.who.length > 0 && (
          <div className="px-6 pb-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{release.who.join(", ")}</span>
            </div>
          </div>
        )}
        {release.resources && release.resources.length > 0 && (
          <div className="px-6 pb-2">
            <div className="flex flex-wrap gap-2">
              {release.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  data-testid={`link-resource-${release.id}-${idx}`}
                >
                  <LinkIcon className="h-3 w-3" />
                  {resource.title || resource.type}
                </a>
              ))}
            </div>
          </div>
        )}
        <CardFooter className="pt-0 pb-3 flex justify-end">
          {release.tier && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-2 py-0.5 h-5 rounded-full border cursor-help ${tierStyles[release.tier] || tierStyles['Untiered']}`}
                  >
                    {release.tier}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs bg-slate-900 text-white border-slate-800">
                  <p>{tierDescriptions[release.tier] || tierDescriptions['Untiered']}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

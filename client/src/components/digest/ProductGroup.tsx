import { Release } from "@/lib/types";
import { ReleaseCard } from "./ReleaseCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Folder } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductGroupProps {
  productName: string;
  releases: Release[];
  onReleaseClick?: (release: Release) => void;
}

export function ProductGroup({ productName, releases, onReleaseClick }: ProductGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8 border rounded-xl overflow-hidden bg-card/50">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full flex justify-between items-center p-4 h-auto hover:bg-muted/50 rounded-none group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg group-hover:bg-primary/20 transition-colors text-[#ffffff] bg-[#1B66FF]">
              <Folder className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">{productName}</h2>
            <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">{releases.length}</Badge>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 bg-muted/30">
        <div className="space-y-4">
          {releases.map((release) => (
            <ReleaseCard 
              key={release.id} 
              release={release} 
              onClick={onReleaseClick ? () => onReleaseClick(release) : undefined} 
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

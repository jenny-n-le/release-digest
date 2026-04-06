import type { Release as DbRelease } from "@shared/schema";

export interface Release {
  id: number | string;
  product: string;
  releaseName: string;
  notionUrl: string;
  status: string;
  releaseDate: string;
  what: string;
  why: string;
  detailedOverview: string | null;
  knowledgeArticleUrl: string | null;
  owner: string | null;
  description: string | null;
  context: string | null;
  scope: string | null;
  rolloutNotes: string | null;
  prdUrl: string | null;
  enablementDeckUrl: string | null;
  videoUrl: string | null;
  imageUrls: string[] | null;
  tier: string | null;
  who: string[] | null;
  resources: Array<{ title: string; url: string; type: string }> | null;
  attachments: Array<{ id: string; name: string; url: string; type: string; size: number }> | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastEditedTime: string | null;
}

export interface NotionReleaseResponse {
  id: string;
  name: string;
  category: string;
  categories: string[];
  status: string;
  tier: string;
  date: string;
  owner: string;
  notionUrl: string;
  knowledgeArticleUrl: string;
  briefDescription: string;
  whyItMatters: string;
  detailedOverview: string;
  lastEditedTime: string;
}

export function mapNotionToRelease(nr: NotionReleaseResponse): Release {
  return {
    id: nr.id,
    product: nr.categories?.length > 0 ? nr.categories.join(", ") : (nr.category || "Uncategorized"),
    releaseName: nr.name,
    notionUrl: nr.notionUrl || "",
    status: nr.status || "",
    releaseDate: nr.date || "",
    what: nr.briefDescription || "",
    why: nr.whyItMatters || "",
    detailedOverview: nr.detailedOverview || null,
    knowledgeArticleUrl: nr.knowledgeArticleUrl || null,
    owner: nr.owner || null,
    description: null,
    context: null,
    scope: null,
    rolloutNotes: null,
    prdUrl: null,
    enablementDeckUrl: null,
    videoUrl: null,
    imageUrls: null,
    tier: nr.tier || null,
    who: null,
    resources: null,
    attachments: null,
    createdAt: null,
    updatedAt: null,
    lastEditedTime: nr.lastEditedTime || null,
  };
}

export interface OverviewBlock {
  type: "heading" | "paragraph" | "list_item" | "callout" | "quote" | "divider";
  level?: number;
  text: string;
}

export interface MediaItem {
  kind: "image" | "video";
  url: string;
  title: string;
  blockId: string;
  host?: string;
}

export interface SectionContent {
  blocks: OverviewBlock[];
  media: MediaItem[];
}

export interface PageSections {
  detailedOverview: SectionContent;
  videosAndScreenshots: SectionContent;
  enablementDeckOrLinks: SectionContent;
}

export interface PageContent {
  pageId: string;
  lastEditedTime: string;
  overview: OverviewBlock[];
  media: MediaItem[];
  sections: PageSections;
}

export interface DigestGroup {
  product: string;
  releases: Release[];
}

export interface DigestData {
  start: string;
  end: string;
  grouped: Record<string, Release[]>;
}

export function mapDbRelease(db: DbRelease): Release {
  return {
    id: db.id,
    product: db.product,
    releaseName: db.releaseName,
    notionUrl: db.notionUrl,
    status: db.status as Release["status"],
    releaseDate: db.releaseDate,
    what: db.what,
    why: db.why,
    detailedOverview: null,
    knowledgeArticleUrl: db.knowledgeArticleUrl,
    owner: db.owner,
    description: db.description,
    context: db.context,
    scope: db.scope,
    rolloutNotes: db.rolloutNotes,
    prdUrl: db.prdUrl,
    enablementDeckUrl: db.enablementDeckUrl,
    videoUrl: db.videoUrl,
    imageUrls: db.imageUrls,
    tier: db.tier,
    who: db.who,
    resources: db.resources,
    attachments: db.attachments,
    createdAt: db.createdAt?.toISOString() ?? null,
    updatedAt: db.updatedAt?.toISOString() ?? null,
    lastEditedTime: null,
  };
}

export interface NotionRelease {
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
  warnings?: string[];
}

function normalizeTier(raw: string | null): string {
  if (!raw) return "Untiered";
  const lower = raw.toLowerCase();
  if (lower.includes("tier 0")) return "Tier 0";
  if (lower.includes("tier 1")) return "Tier 1";
  if (lower.includes("tier 2")) return "Tier 2";
  if (lower.includes("tier 3")) return "Tier 3";
  return "Untiered";
}

function extractPlainText(richText: any[]): string {
  if (!richText || richText.length === 0) return "";
  return richText.map((t: any) => t.plain_text || "").join("");
}

function extractDate(dateProp: any): string {
  if (!dateProp || !dateProp.start) return "";
  return dateProp.start;
}

function extractSelectValue(selectProp: any): string {
  if (!selectProp || !selectProp.name) return "";
  return selectProp.name;
}

function extractMultiSelectValues(multiSelectProp: any[]): string[] {
  if (!multiSelectProp || multiSelectProp.length === 0) return [];
  return multiSelectProp.map((item: any) => item.name || "");
}

function extractStatusValue(statusProp: any): string {
  if (!statusProp || !statusProp.name) return "";
  return statusProp.name;
}

function extractPeopleNames(peopleProp: any[]): string {
  if (!peopleProp || peopleProp.length === 0) return "";
  const first = peopleProp[0];
  return first.name || first.person?.email || "";
}

function extractUrl(urlProp: any): string {
  return urlProp || "";
}

function mapNotionPage(page: any): NotionRelease | null {
  const props = page.properties;

  const name = extractPlainText(props["Release Name"]?.title || []);
  const dateRaw = extractDate(props["Release Date"]?.date);

  if (!name) return null;

  const categories = extractMultiSelectValues(props["Product"]?.multi_select || []);
  const category = categories.length > 0 ? categories[0] : "";

  const statusRaw = extractSelectValue(props["Release Status"]?.select) ||
                    extractStatusValue(props["Release Status"]?.status);

  const tierRaw = extractSelectValue(props["Release Tier"]?.select);

  const owner = extractSelectValue(props["Owner of Feature"]?.select) ||
                extractPeopleNames(props["Owner of Feature"]?.people || []);

  const knowledgeArticleUrl = extractPlainText(props["Knowledge Article Link"]?.rich_text || []) ||
                              extractUrl(props["Knowledge Article Link"]?.url);

  const briefDescription = extractPlainText(props["Brief Description"]?.rich_text || []);

  const whyItMatters = extractPlainText(props["Why It Matters"]?.rich_text || []);

  const detailedOverview = "";

  const notionUrl = page.url || "";
  const lastEditedTime = page.last_edited_time || "";

  return {
    id: page.id,
    name,
    category,
    categories,
    status: statusRaw,
    tier: normalizeTier(tierRaw),
    date: dateRaw,
    owner,
    notionUrl,
    knowledgeArticleUrl,
    briefDescription,
    whyItMatters,
    detailedOverview,
    lastEditedTime,
  };
}

function cleanDatabaseId(raw: string): string {
  const hex = raw.replace(/-/g, "").replace(/[^a-f0-9]/gi, "").trim();
  const id = hex.substring(0, 32);
  if (id.length !== 32) {
    throw new Error("NOTION_DATABASE_ID does not contain a valid 32-character hex ID");
  }
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

async function queryNotionDatabase(databaseId: string, startCursor?: string): Promise<any> {
  const notionToken = process.env.NOTION_TOKEN;
  const cleanId = cleanDatabaseId(databaseId);
  const url = `https://api.notion.com/v1/databases/${cleanId}/query`;

  const body: any = { page_size: 100 };
  if (startCursor) body.start_cursor = startCursor;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export interface CreateNotionReleaseInput {
  name: string;
  date: string;
  status?: string;
  categories?: string[];
  tier?: string;
  briefDescription?: string;
  whyItMatters?: string;
  owner?: string;
  who?: string;
  knowledgeArticleUrl?: string;
}

export async function createNotionRelease(input: CreateNotionReleaseInput): Promise<NotionRelease> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken || !databaseId) {
    throw new Error("NOTION_TOKEN and NOTION_DATABASE_ID must be set");
  }

  if (!input.name) {
    throw new Error("name is required");
  }

  const properties: any = {
    "Release Name": {
      title: [{ text: { content: input.name } }],
    },
    ...(input.date ? { "Release Date": { date: { start: input.date } } } : {}),
  };

  if (input.categories && input.categories.length > 0) {
    properties["Product"] = {
      multi_select: input.categories.map((c) => ({ name: c })),
    };
  }

  if (input.tier) {
    properties["Release Tier"] = {
      select: { name: input.tier },
    };
  }

  if (input.briefDescription) {
    properties["Brief Description"] = {
      rich_text: [{ text: { content: input.briefDescription } }],
    };
  }

  if (input.whyItMatters) {
    properties["Why It Matters"] = {
      rich_text: [{ text: { content: input.whyItMatters } }],
    };
  }

  if (input.knowledgeArticleUrl) {
    properties["Knowledge Article Link"] = {
      rich_text: [{ text: { content: input.knowledgeArticleUrl } }],
    };
  }

  if (input.status) {
    properties["Release Status"] = {
      select: { name: input.status },
    };
  }

  if (input.owner) {
    properties["Owner of Feature"] = {
      select: { name: input.owner },
    };
  }

  const warnings: string[] = [];

  const cleanId = cleanDatabaseId(databaseId);
  let currentProperties = { ...properties };

  const makeRequest = async (props: any) => {
    return fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: cleanId },
        properties: props,
      }),
    });
  };

  let response = await makeRequest(currentProperties);

  if (!response.ok) {
    const errorBody = await response.text();
    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson.code === "validation_error" && errorJson.message?.includes("is not a property that exists")) {
        const match = errorJson.message.match(/^(.+?) is not a property that exists/);
        if (match) {
          const missingProp = match[1];
          warnings.push(`"${missingProp}" property does not exist in your Notion database and was skipped.`);
          delete currentProperties[missingProp];
          response = await makeRequest(currentProperties);
          if (!response.ok) {
            const retryError = await response.text();
            console.error("[notion] Create page retry error:", retryError);
            throw new Error(`Notion API error (${response.status})`);
          }
        } else {
          console.error("[notion] Create page error:", errorBody);
          throw new Error(`Notion API error (${response.status})`);
        }
      } else {
        console.error("[notion] Create page error:", errorBody);
        throw new Error(`Notion API error (${response.status})`);
      }
    } catch (e: any) {
      if (e.message?.startsWith("Notion API error")) throw e;
      console.error("[notion] Create page error:", errorBody);
      throw new Error(`Notion API error (${response.status})`);
    }
  }

  const page = await response.json();
  const mapped = mapNotionPage(page);

  const result = mapped || {
    id: page.id,
    name: input.name,
    category: input.categories?.[0] || "",
    categories: input.categories || [],
    status: input.status || "",
    tier: input.tier || "Untiered",
    date: input.date,
    owner: input.owner || "",
    notionUrl: page.url || "",
    knowledgeArticleUrl: input.knowledgeArticleUrl || "",
    briefDescription: input.briefDescription || "",
    whyItMatters: input.whyItMatters || "",
    detailedOverview: "",
    lastEditedTime: page.last_edited_time || "",
  };

  return { ...result, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function updateNotionRelease(pageId: string, input: Partial<CreateNotionReleaseInput>): Promise<NotionRelease> {
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    throw new Error("NOTION_TOKEN must be set");
  }

  const properties: any = {};

  if (input.name !== undefined) {
    properties["Release Name"] = {
      title: [{ text: { content: input.name } }],
    };
  }

  if (input.date !== undefined) {
    if (input.date) {
      properties["Release Date"] = { date: { start: input.date } };
    } else {
      properties["Release Date"] = { date: null };
    }
  }

  if (input.categories !== undefined) {
    properties["Product"] = {
      multi_select: (input.categories || []).map((c) => ({ name: c })),
    };
  }

  if (input.tier !== undefined) {
    properties["Release Tier"] = input.tier
      ? { select: { name: input.tier } }
      : { select: null };
  }

  if (input.briefDescription !== undefined) {
    properties["Brief Description"] = {
      rich_text: input.briefDescription
        ? [{ text: { content: input.briefDescription } }]
        : [],
    };
  }

  if (input.whyItMatters !== undefined) {
    properties["Why It Matters"] = {
      rich_text: input.whyItMatters
        ? [{ text: { content: input.whyItMatters } }]
        : [],
    };
  }

  if (input.knowledgeArticleUrl !== undefined) {
    properties["Knowledge Article Link"] = {
      rich_text: input.knowledgeArticleUrl
        ? [{ text: { content: input.knowledgeArticleUrl } }]
        : [],
    };
  }

  if (input.status) {
    properties["Release Status"] = {
      select: { name: input.status },
    };
  }

  if (input.owner) {
    properties["Owner of Feature"] = {
      select: { name: input.owner },
    };
  }

  const warnings: string[] = [];

  let currentProperties = { ...properties };

  const makeRequest = async (props: any) => {
    return fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: props }),
    });
  };

  let response = await makeRequest(currentProperties);

  if (!response.ok) {
    const errorBody = await response.text();
    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson.code === "validation_error" && errorJson.message?.includes("is not a property that exists")) {
        const match = errorJson.message.match(/^(.+?) is not a property that exists/);
        if (match) {
          const missingProp = match[1];
          warnings.push(`"${missingProp}" property does not exist in your Notion database and was skipped.`);
          delete currentProperties[missingProp];
          response = await makeRequest(currentProperties);
          if (!response.ok) {
            const retryError = await response.text();
            console.error("[notion] Update page retry error:", retryError);
            throw new Error(`Notion API error (${response.status})`);
          }
        } else {
          console.error("[notion] Update page error:", errorBody);
          throw new Error(`Notion API error (${response.status})`);
        }
      } else {
        console.error("[notion] Update page error:", errorBody);
        throw new Error(`Notion API error (${response.status})`);
      }
    } catch (e: any) {
      if (e.message?.startsWith("Notion API error")) throw e;
      console.error("[notion] Update page error:", errorBody);
      throw new Error(`Notion API error (${response.status})`);
    }
  }

  const page = await response.json();
  const mapped = mapNotionPage(page);

  const result = mapped || {
    id: page.id,
    name: input.name || "",
    category: input.categories?.[0] || "",
    categories: input.categories || [],
    status: "",
    tier: input.tier || "Untiered",
    date: input.date || "",
    owner: input.owner || "",
    notionUrl: page.url || "",
    knowledgeArticleUrl: input.knowledgeArticleUrl || "",
    briefDescription: input.briefDescription || "",
    whyItMatters: input.whyItMatters || "",
    detailedOverview: "",
    lastEditedTime: page.last_edited_time || "",
  };

  return { ...result, warnings: warnings.length > 0 ? warnings : undefined };
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

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".m4v", ".avi"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"];
const VIDEO_HOSTS = ["youtube.com", "youtu.be", "loom.com", "vimeo.com", "drive.google.com"];

function isVideoUrl(url: string): boolean {
  try {
    const lower = url.toLowerCase();
    if (VIDEO_EXTENSIONS.some(ext => lower.includes(ext))) return true;
    const hostname = new URL(url).hostname.replace("www.", "");
    return VIDEO_HOSTS.some(h => hostname.includes(h));
  } catch {
    return false;
  }
}

function isImageUrl(url: string): boolean {
  try {
    const lower = url.toLowerCase();
    return IMAGE_EXTENSIONS.some(ext => lower.includes(ext));
  } catch {
    return false;
  }
}

function isLoomUrl(url: string): boolean {
  try {
    return new URL(url).hostname.replace("www.", "").includes("loom.com");
  } catch {
    return false;
  }
}

function getVideoHost(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("loom")) return "Loom";
    if (hostname.includes("vimeo")) return "Vimeo";
    if (hostname.includes("drive.google")) return "Google Drive";
    return "Video";
  } catch {
    return "Video";
  }
}

function extractBlockText(block: any): string {
  const content = block[block.type];
  if (!content?.rich_text) return "";
  return content.rich_text.map((t: any) => t.plain_text || "").join("");
}

function getFileOrExternalUrl(content: any): string {
  if (content?.type === "file" && content.file?.url) return content.file.url;
  if (content?.type === "external" && content.external?.url) return content.external.url;
  return "";
}

function getCaption(content: any): string {
  if (!content?.caption) return "";
  return content.caption.map((t: any) => t.plain_text || "").join("");
}

const SECTION_HEADINGS = ["Detailed Overview", "Videos & Screenshots", "Enablement Deck or Links"] as const;
const TEMPLATE_GUIDE_TEXT = "(Include PRD, write-up, customer segments impacted, roll out plan if relevant)";

function findHeadingIndex(blocks: any[], exactTitle: string): number {
  return blocks.findIndex(b => {
    const type = b.type;
    if (type !== "heading_1" && type !== "heading_2" && type !== "heading_3") return false;
    const text = extractBlockText(b).trim();
    return text === exactTitle;
  });
}

function getHeadingLevel(block: any): number {
  if (block.type === "heading_1") return 1;
  if (block.type === "heading_2") return 2;
  if (block.type === "heading_3") return 3;
  return 0;
}

function getSectionRange(blocks: any[], headingIndex: number): [number, number] {
  const headingLevel = getHeadingLevel(blocks[headingIndex]);
  const start = headingIndex + 1;
  let end = blocks.length;
  for (let i = start; i < blocks.length; i++) {
    const level = getHeadingLevel(blocks[i]);
    if (level > 0 && level <= headingLevel) {
      end = i;
      break;
    }
  }
  return [start, end];
}

function extractSectionBlocks(allBlocks: any[], sectionTitle: string, pageId: string): { blocks: any[], range: [number, number] | null } {
  const headingIdx = findHeadingIndex(allBlocks, sectionTitle);
  if (headingIdx === -1) {
    console.log(`[sections] pageId=${pageId.substring(0,8)} heading="${sectionTitle}" NOT FOUND`);
    return { blocks: [], range: null };
  }
  const [start, end] = getSectionRange(allBlocks, headingIdx);
  const sectionBlocks = allBlocks.slice(start, end);
  console.log(`[sections] pageId=${pageId.substring(0,8)} heading="${sectionTitle}" found at ${headingIdx}, blocks=${sectionBlocks.length} (${start}-${end})`);
  return { blocks: sectionBlocks, range: [start, end] };
}

function isTemplateGuideText(text: string): boolean {
  return text.trim() === TEMPLATE_GUIDE_TEXT;
}

function parseSectionContent(rawBlocks: any[], pageId: string, filterTemplate: boolean = false): SectionContent {
  const overview: OverviewBlock[] = [];
  const media: MediaItem[] = [];

  for (const block of rawBlocks) {
    const type = block.type;
    const blockId = block.id || "";

    if (type === "heading_1" || type === "heading_2" || type === "heading_3") {
      const text = extractBlockText(block);
      if (text) {
        const level = type === "heading_1" ? 1 : type === "heading_2" ? 2 : 3;
        overview.push({ type: "heading", level, text });
      }
    } else if (type === "paragraph") {
      const text = extractBlockText(block);
      if (text.trim()) {
        if (filterTemplate && isTemplateGuideText(text)) continue;
        overview.push({ type: "paragraph", text });
      }
    } else if (type === "bulleted_list_item" || type === "numbered_list_item") {
      const text = extractBlockText(block);
      if (text.trim()) overview.push({ type: "list_item", text });
    } else if (type === "callout") {
      const text = extractBlockText(block);
      if (text.trim()) overview.push({ type: "callout", text });
    } else if (type === "quote") {
      const text = extractBlockText(block);
      if (text.trim()) overview.push({ type: "quote", text });
    } else if (type === "divider") {
      overview.push({ type: "divider", text: "" });
    } else if (type === "video") {
      const url = getFileOrExternalUrl(block.video);
      if (url) media.push({ kind: "video", url, title: getCaption(block.video) || "Demo Video", blockId, host: getVideoHost(url) });
    } else if (type === "image") {
      const url = getFileOrExternalUrl(block.image);
      if (url) media.push({ kind: "image", url, title: getCaption(block.image) || "Screenshot", blockId });
    } else if (type === "file") {
      const url = getFileOrExternalUrl(block.file);
      if (url) {
        if (isVideoUrl(url)) media.push({ kind: "video", url, title: getCaption(block.file) || "Video File", blockId, host: getVideoHost(url) });
        else if (isImageUrl(url)) media.push({ kind: "image", url, title: getCaption(block.file) || "Image", blockId });
      }
    } else if (type === "embed") {
      const url = block.embed?.url || "";
      if (url && (isVideoUrl(url) || isLoomUrl(url))) media.push({ kind: "video", url, title: getCaption(block.embed) || "Embedded Video", blockId, host: getVideoHost(url) });
    } else if (type === "bookmark") {
      const url = block.bookmark?.url || "";
      if (url && (isVideoUrl(url) || isLoomUrl(url))) media.push({ kind: "video", url, title: getCaption(block.bookmark) || "Bookmarked Video", blockId, host: getVideoHost(url) });
    } else if (type === "link_preview") {
      const url = block.link_preview?.url || "";
      if (url && (isVideoUrl(url) || isLoomUrl(url))) media.push({ kind: "video", url, title: "Video Link", blockId, host: getVideoHost(url) });
    }
  }

  return { blocks: overview, media };
}

function parseSections(allBlocks: any[], pageId: string): PageSections {
  const detailedOverviewRaw = extractSectionBlocks(allBlocks, "Detailed Overview", pageId);
  const videosRaw = extractSectionBlocks(allBlocks, "Videos & Screenshots", pageId);
  const enablementRaw = extractSectionBlocks(allBlocks, "Enablement Deck or Links", pageId);

  const hasSections = detailedOverviewRaw.range !== null || videosRaw.range !== null || enablementRaw.range !== null;

  if (!hasSections && allBlocks.length > 0) {
    console.log(`[sections] pageId=${pageId.substring(0,8)} no section headings found — falling back to full page content as Detailed Overview`);
    return {
      detailedOverview: parseSectionContent(allBlocks, pageId, true),
      videosAndScreenshots: { blocks: [], media: [] },
      enablementDeckOrLinks: { blocks: [], media: [] },
    };
  }

  let detailedOverview = parseSectionContent(detailedOverviewRaw.blocks, pageId, true);
  const videosAndScreenshots = parseSectionContent(videosRaw.blocks, pageId);
  const enablementDeckOrLinks = parseSectionContent(enablementRaw.blocks, pageId);

  const allSectionsEmpty = detailedOverview.blocks.length === 0 && detailedOverview.media.length === 0 &&
    videosAndScreenshots.blocks.length === 0 && videosAndScreenshots.media.length === 0 &&
    enablementDeckOrLinks.blocks.length === 0 && enablementDeckOrLinks.media.length === 0;

  if (allSectionsEmpty && hasSections) {
    const headingIndices = [
      findHeadingIndex(allBlocks, "Detailed Overview"),
      findHeadingIndex(allBlocks, "Videos & Screenshots"),
      findHeadingIndex(allBlocks, "Enablement Deck or Links"),
    ].filter(i => i >= 0);

    if (headingIndices.length > 0) {
      const firstHeadingIdx = Math.min(...headingIndices);
      if (firstHeadingIdx > 0) {
        const preSectionBlocks = allBlocks.slice(0, firstHeadingIdx);
        console.log(`[sections] pageId=${pageId.substring(0,8)} all sections empty — using ${preSectionBlocks.length} pre-section blocks as Detailed Overview`);
        detailedOverview = parseSectionContent(preSectionBlocks, pageId, true);
      }
    }
  }

  return { detailedOverview, videosAndScreenshots, enablementDeckOrLinks };
}

const DEBUG_PAGE_IDS = new Set([
  "304a1747-bfd1-80ed-b19d-d4e32c886d47",
  "303a1747-bfd1-8003-9813-eaa47e164902",
]);

function parseBlocks(blocks: any[], pageId: string): { overview: OverviewBlock[]; media: MediaItem[] } {
  const overview: OverviewBlock[] = [];
  const media: MediaItem[] = [];
  const debug = DEBUG_PAGE_IDS.has(pageId);

  for (const block of blocks) {
    const type = block.type;
    const blockId = block.id || "";

    if (debug) {
      const c = block[type];
      const urlInfo = c?.url || c?.file?.url?.substring(0, 80) || c?.external?.url?.substring(0, 80) || "";
      console.log(`[notion-blocks] pageId=${pageId.substring(0,8)} type=${type} id=${blockId.substring(0,8)} has_children=${block.has_children} url=${urlInfo}`);
    }

    if (type === "heading_1" || type === "heading_2" || type === "heading_3") {
      const text = extractBlockText(block);
      if (text) {
        const level = type === "heading_1" ? 1 : type === "heading_2" ? 2 : 3;
        overview.push({ type: "heading", level, text });
      }
    } else if (type === "paragraph") {
      const text = extractBlockText(block);
      if (text.trim()) {
        overview.push({ type: "paragraph", text });
      }
    } else if (type === "bulleted_list_item" || type === "numbered_list_item") {
      const text = extractBlockText(block);
      if (text.trim()) {
        overview.push({ type: "list_item", text });
      }
    } else if (type === "callout") {
      const text = extractBlockText(block);
      if (text.trim()) {
        overview.push({ type: "callout", text });
      }
    } else if (type === "quote") {
      const text = extractBlockText(block);
      if (text.trim()) {
        overview.push({ type: "quote", text });
      }
    } else if (type === "divider") {
      overview.push({ type: "divider", text: "" });
    } else if (type === "video") {
      const url = getFileOrExternalUrl(block.video);
      if (url) {
        media.push({
          kind: "video",
          url,
          title: getCaption(block.video) || "Demo Video",
          blockId,
          host: getVideoHost(url),
        });
      }
    } else if (type === "image") {
      const url = getFileOrExternalUrl(block.image);
      if (url) {
        media.push({
          kind: "image",
          url,
          title: getCaption(block.image) || "Screenshot",
          blockId,
        });
      }
    } else if (type === "file") {
      const url = getFileOrExternalUrl(block.file);
      if (url) {
        if (isVideoUrl(url)) {
          media.push({
            kind: "video",
            url,
            title: getCaption(block.file) || "Video File",
            blockId,
            host: getVideoHost(url),
          });
        } else if (isImageUrl(url)) {
          media.push({
            kind: "image",
            url,
            title: getCaption(block.file) || "Image",
            blockId,
          });
        }
      }
    } else if (type === "embed") {
      const url = block.embed?.url || "";
      if (url) {
        if (isVideoUrl(url) || isLoomUrl(url)) {
          media.push({
            kind: "video",
            url,
            title: getCaption(block.embed) || "Embedded Video",
            blockId,
            host: getVideoHost(url),
          });
        }
      }
    } else if (type === "bookmark") {
      const url = block.bookmark?.url || "";
      if (url && (isVideoUrl(url) || isLoomUrl(url))) {
        media.push({
          kind: "video",
          url,
          title: getCaption(block.bookmark) || "Bookmarked Video",
          blockId,
          host: getVideoHost(url),
        });
      }
    } else if (type === "link_preview") {
      const url = block.link_preview?.url || "";
      if (url && (isVideoUrl(url) || isLoomUrl(url))) {
        media.push({
          kind: "video",
          url,
          title: "Video Link",
          blockId,
          host: getVideoHost(url),
        });
      }
    }
  }

  if (debug) {
    console.log(`[notion-blocks] pageId=${pageId.substring(0,8)} TOTAL overview=${overview.length} media=${media.length} (images=${media.filter(m=>m.kind==="image").length} videos=${media.filter(m=>m.kind==="video").length})`);
  }

  return { overview, media };
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const pageContentCache = new Map<string, { lastEditedTime: string; fetchedAt: number; content: PageContent }>();

async function fetchNotionPageMeta(pageId: string): Promise<{ lastEditedTime: string }> {
  const notionToken = process.env.NOTION_TOKEN;
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      "Authorization": `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
    },
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Notion API error (${res.status}): ${errorBody}`);
  }
  const data = await res.json();
  return { lastEditedTime: data.last_edited_time };
}

async function fetchBlockChildren(blockId: string): Promise<any[]> {
  const notionToken = process.env.NOTION_TOKEN;
  const allBlocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) url.searchParams.set("start_cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
      },
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Notion API error (${res.status}): ${errorBody}`);
    }
    const data = await res.json();
    allBlocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return allBlocks;
}

async function fetchAllBlocksRecursive(pageId: string, maxDepth: number = 3): Promise<any[]> {
  const topBlocks = await fetchBlockChildren(pageId);
  const result: any[] = [];

  async function recurse(blocks: any[], depth: number) {
    for (const block of blocks) {
      result.push(block);
      if (block.has_children && depth < maxDepth) {
        const children = await fetchBlockChildren(block.id);
        await recurse(children, depth + 1);
      }
    }
  }

  await recurse(topBlocks, 0);
  return result;
}

export async function fetchPageContent(pageId: string): Promise<PageContent> {
  if (!process.env.NOTION_TOKEN) {
    throw new Error("NOTION_TOKEN must be set");
  }

  const meta = await fetchNotionPageMeta(pageId);
  const cached = pageContentCache.get(pageId);
  const now = Date.now();
  if (cached && cached.lastEditedTime === meta.lastEditedTime && (now - cached.fetchedAt) < CACHE_TTL_MS) {
    return cached.content;
  }

  const topBlocks = await fetchBlockChildren(pageId);

  const allBlocks: any[] = [];
  async function recurse(blocks: any[], depth: number) {
    for (const block of blocks) {
      allBlocks.push(block);
      if (block.has_children && depth < 3) {
        const children = await fetchBlockChildren(block.id);
        await recurse(children, depth + 1);
      }
    }
  }
  await recurse(topBlocks, 0);

  const { overview, media } = parseBlocks(allBlocks, pageId);

  const sections = parseSections(topBlocks, pageId);

  const content: PageContent = {
    pageId,
    lastEditedTime: meta.lastEditedTime,
    overview,
    media,
    sections,
  };

  pageContentCache.set(pageId, { lastEditedTime: meta.lastEditedTime, fetchedAt: Date.now(), content });
  return content;
}

function contentToNotionBlocks(content: string): any[] {
  if (!content || !content.trim()) return [];

  const lines = content.split("\n");
  const blocks: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: trimmed.substring(2) } }],
        },
      });
    } else {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: trimmed } }],
        },
      });
    }
  }

  return blocks;
}

export async function replaceSectionBlocks(
  pageId: string,
  sectionTitle: string,
  newContent: string
): Promise<{ blocksDeleted: number; blocksInserted: number; headingCreated: boolean }> {
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) throw new Error("NOTION_TOKEN must be set");

  const topBlocks = await fetchBlockChildren(pageId);

  let headingIdx = findHeadingIndex(topBlocks, sectionTitle);
  let headingCreated = false;
  let headingBlockId: string;
  let blocksDeleted = 0;

  if (headingIdx === -1) {
    console.log(`[sections] pageId=${pageId.substring(0,8)} creating missing heading "${sectionTitle}"`);
    let headingType = "heading_2";
    for (const h of SECTION_HEADINGS) {
      const idx = findHeadingIndex(topBlocks, h);
      if (idx !== -1) {
        headingType = topBlocks[idx].type;
        break;
      }
    }

    const appendRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        children: [{
          object: "block",
          type: headingType,
          [headingType]: {
            rich_text: [{ type: "text", text: { content: sectionTitle } }],
          },
        }],
      }),
    });

    if (!appendRes.ok) {
      const err = await appendRes.text();
      throw new Error(`Failed to create heading: ${err}`);
    }

    const appendData = await appendRes.json();
    headingBlockId = appendData.results[0].id;
    headingCreated = true;
  } else {
    headingBlockId = topBlocks[headingIdx].id;
    const [start, end] = getSectionRange(topBlocks, headingIdx);
    const blocksToDelete = topBlocks.slice(start, end);
    blocksDeleted = blocksToDelete.length;

    for (const block of blocksToDelete) {
      await fetch(`https://api.notion.com/v1/blocks/${block.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      });
    }
    console.log(`[sections] pageId=${pageId.substring(0,8)} deleted ${blocksDeleted} blocks from "${sectionTitle}"`);
  }

  const newBlocks = contentToNotionBlocks(newContent);
  let blocksInserted = 0;

  if (newBlocks.length > 0) {
    const insertRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        children: newBlocks,
        after: headingBlockId,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error(`[sections] Failed to insert blocks:`, err);
      throw new Error(`Failed to insert section blocks: ${err}`);
    }

    blocksInserted = newBlocks.length;
    console.log(`[sections] pageId=${pageId.substring(0,8)} inserted ${blocksInserted} blocks after "${sectionTitle}"`);
  }

  pageContentCache.delete(pageId);

  return { blocksDeleted, blocksInserted, headingCreated };
}

export async function fetchNotionReleases(): Promise<NotionRelease[]> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId) {
    throw new Error("NOTION_TOKEN and NOTION_DATABASE_ID must be set");
  }

  const results: NotionRelease[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await queryNotionDatabase(databaseId, cursor);

    for (const page of response.results) {
      const mapped = mapNotionPage(page);
      if (mapped) {
        results.push(mapped);
      }
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  results.sort((a, b) => b.date.localeCompare(a.date));

  return results;
}

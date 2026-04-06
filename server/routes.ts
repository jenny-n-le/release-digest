import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { createHmac } from "crypto";
import { storage } from "./storage";
import { insertReleaseSchema, insertGtmResourceSchema } from "@shared/schema";
import { fetchNotionReleases, createNotionRelease, updateNotionRelease, fetchPageContent, replaceSectionBlocks } from "./notion";

const AUTH_COOKIE = "ws_auth";
const AUTH_VALUE = "authenticated";

function signedToken(): string {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  const sig = createHmac("sha256", secret).update(AUTH_VALUE).digest("base64url");
  return `${AUTH_VALUE}.${sig}`;
}

function isAuthenticated(req: Request): boolean {
  const header = req.headers.cookie ?? "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === AUTH_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1).trim()) === signedToken();
    }
  }
  return false;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ authenticated: isAuthenticated(req) });
  });

  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    if (password === process.env.APP_PASSWORD) {
      res.cookie(AUTH_COOKIE, signedToken(), {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.json({ ok: true });
    } else {
      res.status(401).json({ ok: false });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(AUTH_COOKIE);
    res.json({ ok: true });
  });

  app.get("/api/notion/releases", async (_req, res) => {
    try {
      const releases = await fetchNotionReleases();
      return res.json({ releases });
    } catch (error: any) {
      console.error("Error fetching Notion releases:", error.message);
      return res.status(500).json({
        message: "Failed to fetch releases from Notion. Check that NOTION_TOKEN and NOTION_DATABASE_ID are configured.",
      });
    }
  });

  app.post("/api/notion/releases", async (req, res) => {
    try {
      const { name, date, status, categories, tier, briefDescription, whyItMatters, owner, who, knowledgeArticleUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }
      const release = await createNotionRelease({
        name,
        date,
        status,
        categories,
        tier,
        briefDescription,
        whyItMatters,
        owner,
        who,
        knowledgeArticleUrl,
      });
      return res.status(201).json(release);
    } catch (error: any) {
      console.error("Error creating Notion release:", error.message);
      return res.status(500).json({
        message: "Failed to create release in Notion.",
      });
    }
  });

  app.patch("/api/notion/releases/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      const { name, date, status, categories, tier, briefDescription, whyItMatters, owner, who, knowledgeArticleUrl } = req.body;
      const release = await updateNotionRelease(pageId, {
        name,
        date,
        status,
        categories,
        tier,
        briefDescription,
        whyItMatters,
        owner,
        who,
        knowledgeArticleUrl,
      });
      return res.json(release);
    } catch (error: any) {
      console.error("Error updating Notion release:", error.message);
      return res.status(500).json({
        message: "Failed to update release in Notion.",
      });
    }
  });

  app.get("/api/notion/pages/:pageId/content", async (req, res) => {
    try {
      const { pageId } = req.params;
      const content = await fetchPageContent(pageId);
      return res.json(content);
    } catch (error: any) {
      console.error("Error fetching page content:", error.message);
      return res.status(500).json({
        message: "Failed to fetch page content from Notion.",
      });
    }
  });

  app.patch("/api/notion/pages/:pageId/sections", async (req, res) => {
    try {
      const { pageId } = req.params;
      const { sections } = req.body;
      if (!sections || typeof sections !== "object") {
        return res.status(400).json({ message: "sections object is required" });
      }

      const SECTION_MAP: Record<string, string> = {
        detailedOverview: "Detailed Overview",
        videosAndScreenshots: "Videos & Screenshots",
        enablementDeckOrLinks: "Enablement Deck or Links",
      };

      const results: Record<string, any> = {};
      const warnings: string[] = [];

      for (const [key, content] of Object.entries(sections)) {
        const sectionTitle = SECTION_MAP[key];
        if (!sectionTitle) {
          warnings.push(`Unknown section key: ${key}`);
          continue;
        }
        if (typeof content !== "string") {
          warnings.push(`Section "${key}" must be a string`);
          continue;
        }
        try {
          results[key] = await replaceSectionBlocks(pageId, sectionTitle, content as string);
        } catch (err: any) {
          warnings.push(`Failed to update "${sectionTitle}": ${err.message}`);
        }
      }

      return res.json({ success: true, results, warnings });
    } catch (error: any) {
      console.error("Error updating page sections:", error.message);
      return res.status(500).json({
        message: "Failed to update page sections in Notion.",
      });
    }
  });

  app.get("/api/releases", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (startDate && endDate) {
        const releases = await storage.getReleasesByDateRange(
          startDate as string,
          endDate as string
        );
        return res.json(releases);
      }
      const releases = await storage.getReleases();
      return res.json(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      return res.status(500).json({ message: "Failed to fetch releases" });
    }
  });

  app.get("/api/releases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const release = await storage.getRelease(id);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      return res.json(release);
    } catch (error) {
      console.error("Error fetching release:", error);
      return res.status(500).json({ message: "Failed to fetch release" });
    }
  });

  app.post("/api/releases", async (req, res) => {
    try {
      const parsed = insertReleaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid release data", errors: parsed.error.errors });
      }
      const release = await storage.createRelease(parsed.data);
      return res.status(201).json(release);
    } catch (error) {
      console.error("Error creating release:", error);
      return res.status(500).json({ message: "Failed to create release" });
    }
  });

  app.patch("/api/releases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertReleaseSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid release data", errors: parsed.error.errors });
      }
      const release = await storage.updateRelease(id, parsed.data);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      return res.json(release);
    } catch (error) {
      console.error("Error updating release:", error);
      return res.status(500).json({ message: "Failed to update release" });
    }
  });

  app.delete("/api/releases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRelease(id);
      if (!deleted) {
        return res.status(404).json({ message: "Release not found" });
      }
      return res.json({ message: "Release deleted" });
    } catch (error) {
      console.error("Error deleting release:", error);
      return res.status(500).json({ message: "Failed to delete release" });
    }
  });

  app.get("/api/gtm/resources", async (_req, res) => {
    try {
      const resources = await storage.getGtmResources();
      return res.json(resources);
    } catch (error) {
      console.error("Error fetching GTM resources:", error);
      return res.status(500).json({ message: "Failed to fetch GTM resources" });
    }
  });

  app.post("/api/gtm/resources", async (req, res) => {
    try {
      const parsed = insertGtmResourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid resource data", errors: parsed.error.errors });
      }
      const resource = await storage.createGtmResource(parsed.data);
      return res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating GTM resource:", error);
      return res.status(500).json({ message: "Failed to create GTM resource" });
    }
  });

  app.patch("/api/gtm/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertGtmResourceSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid resource data", errors: parsed.error.errors });
      }
      const resource = await storage.updateGtmResource(id, parsed.data);
      if (!resource) return res.status(404).json({ message: "Resource not found" });
      return res.json(resource);
    } catch (error) {
      console.error("Error updating GTM resource:", error);
      return res.status(500).json({ message: "Failed to update GTM resource" });
    }
  });

  app.delete("/api/gtm/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGtmResource(id);
      if (!deleted) return res.status(404).json({ message: "Resource not found" });
      return res.json({ message: "Resource deleted" });
    } catch (error) {
      console.error("Error deleting GTM resource:", error);
      return res.status(500).json({ message: "Failed to delete GTM resource" });
    }
  });

  return httpServer;
}

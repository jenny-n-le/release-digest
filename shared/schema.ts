import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  product: text("product").notNull(),
  releaseName: text("release_name").notNull(),
  notionUrl: text("notion_url").notNull().default("#"),
  status: text("status").notNull(),
  releaseDate: text("release_date").notNull(),
  what: text("what").notNull(),
  why: text("why").notNull(),
  knowledgeArticleUrl: text("knowledge_article_url"),
  owner: text("owner"),
  description: text("description"),
  context: text("context"),
  scope: text("scope"),
  rolloutNotes: text("rollout_notes"),
  prdUrl: text("prd_url"),
  enablementDeckUrl: text("enablement_deck_url"),
  videoUrl: text("video_url"),
  imageUrls: text("image_urls").array(),
  tier: text("tier"),
  who: text("who").array(),
  resources: jsonb("resources").$type<Array<{ title: string; url: string; type: string }>>(),
  attachments: jsonb("attachments").$type<Array<{ id: string; name: string; url: string; type: string; size: number }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;

export const gtmResources = pgTable("gtm_resources", {
  id: serial("id").primaryKey(),
  emoji: text("emoji").notNull().default("🔗"),
  title: text("title").notNull(),
  url: text("url").notNull(),
  sortOrder: serial("sort_order"),
});

export const insertGtmResourceSchema = createInsertSchema(gtmResources).omit({
  id: true,
  sortOrder: true,
});

export type InsertGtmResource = z.infer<typeof insertGtmResourceSchema>;
export type GtmResource = typeof gtmResources.$inferSelect;

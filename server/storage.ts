import { type Release, type InsertRelease, releases, type GtmResource, type InsertGtmResource, gtmResources } from "@shared/schema";
import { db as _db } from "./db";
import { eq, and, gte, lte, asc } from "drizzle-orm";

function getDb() {
  if (!_db) throw new Error("DATABASE_URL is not configured.");
  return _db;
}

export interface IStorage {
  getReleases(): Promise<Release[]>;
  getReleasesByDateRange(startDate: string, endDate: string): Promise<Release[]>;
  getRelease(id: number): Promise<Release | undefined>;
  createRelease(release: InsertRelease): Promise<Release>;
  updateRelease(id: number, release: Partial<InsertRelease>): Promise<Release | undefined>;
  deleteRelease(id: number): Promise<boolean>;
  getGtmResources(): Promise<GtmResource[]>;
  createGtmResource(resource: InsertGtmResource): Promise<GtmResource>;
  updateGtmResource(id: number, resource: Partial<InsertGtmResource>): Promise<GtmResource | undefined>;
  deleteGtmResource(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getReleases(): Promise<Release[]> {
    return getDb().select().from(releases);
  }

  async getReleasesByDateRange(startDate: string, endDate: string): Promise<Release[]> {
    return getDb()
      .select()
      .from(releases)
      .where(and(gte(releases.releaseDate, startDate), lte(releases.releaseDate, endDate)));
  }

  async getRelease(id: number): Promise<Release | undefined> {
    const [release] = await getDb().select().from(releases).where(eq(releases.id, id));
    return release;
  }

  async createRelease(release: InsertRelease): Promise<Release> {
    const [created] = await getDb().insert(releases).values(release).returning();
    return created;
  }

  async updateRelease(id: number, data: Partial<InsertRelease>): Promise<Release | undefined> {
    const [updated] = await getDb()
      .update(releases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(releases.id, id))
      .returning();
    return updated;
  }

  async deleteRelease(id: number): Promise<boolean> {
    const [deleted] = await getDb()
      .delete(releases)
      .where(eq(releases.id, id))
      .returning();
    return !!deleted;
  }

  async getGtmResources(): Promise<GtmResource[]> {
    return getDb().select().from(gtmResources).orderBy(asc(gtmResources.sortOrder));
  }

  async createGtmResource(resource: InsertGtmResource): Promise<GtmResource> {
    const [created] = await getDb().insert(gtmResources).values(resource).returning();
    return created;
  }

  async updateGtmResource(id: number, data: Partial<InsertGtmResource>): Promise<GtmResource | undefined> {
    const [updated] = await getDb()
      .update(gtmResources)
      .set(data)
      .where(eq(gtmResources.id, id))
      .returning();
    return updated;
  }

  async deleteGtmResource(id: number): Promise<boolean> {
    const [deleted] = await getDb()
      .delete(gtmResources)
      .where(eq(gtmResources.id, id))
      .returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();

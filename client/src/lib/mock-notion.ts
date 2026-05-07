import { Release, NotionReleaseResponse, mapNotionToRelease } from './types';
import { format, parseISO, isWithinInterval, isFuture, subDays, isAfter } from 'date-fns';

export const fetchAllReleases = async (): Promise<Release[]> => {
  const res = await fetch('/api/notion/releases');
  if (!res.ok) throw new Error('Failed to fetch releases');
  const data: { releases: NotionReleaseResponse[] } = await res.json();
  return data.releases.map(mapNotionToRelease);
};

export const fetchReleases = async (start: Date, end: Date): Promise<Release[]> => {
  const allReleases = await fetchAllReleases();
  return allReleases.filter(r => {
    if (!r.releaseDate) return false;
    try {
      const d = parseISO(r.releaseDate);
      return isWithinInterval(d, { start, end });
    } catch {
      return false;
    }
  });
};

const RELEASED_STATUSES = ["Fully Released", "Partially Released", "Beta"];
const FRESHNESS_DAYS = 30;

export function filterRecentlyReleased(releases: Release[], start: Date, end: Date): Release[] {
  return releases.filter(r => {
    if (!RELEASED_STATUSES.includes(r.status)) return false;
    if (!r.releaseDate) return false;
    try {
      const d = parseISO(r.releaseDate);
      return isWithinInterval(d, { start, end });
    } catch {
      return false;
    }
  });
}

export function filterComingSoon(releases: Release[]): Release[] {
  const freshnessCutoff = subDays(new Date(), FRESHNESS_DAYS);

  return releases.filter(r => {
    if (r.status !== "Coming Soon") return false;

    const hasDate = !!r.releaseDate;
    let releaseDate: Date | null = null;
    if (hasDate) {
      try { releaseDate = parseISO(r.releaseDate); } catch { releaseDate = null; }
    }

    if (releaseDate && isFuture(releaseDate)) return true;

    if (releaseDate && isAfter(releaseDate, freshnessCutoff)) return true;

    const lastEdited = r.lastEditedTime ? new Date(r.lastEditedTime) : null;

    if (!releaseDate && lastEdited && isAfter(lastEdited, freshnessCutoff)) return true;

    return false;
  });
}

export function sortComingSoon(releases: Release[]): Release[] {
  return [...releases].sort((a, b) => {
    const aDate = a.releaseDate ? parseISO(a.releaseDate) : null;
    const bDate = b.releaseDate ? parseISO(b.releaseDate) : null;

    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (aDate && bDate) return aDate.getTime() - bDate.getTime();

    const aEdited = a.lastEditedTime ? new Date(a.lastEditedTime).getTime() : 0;
    const bEdited = b.lastEditedTime ? new Date(b.lastEditedTime).getTime() : 0;
    return bEdited - aEdited;
  });
}

const PRODUCT_ORDER = [
  "Hiring",
  "HRIS",
  "Time & Scheduling",
  "Payroll",
  "Benefits",
  "Mobile Worker App",
  "Platform",
  "Tip Management (Beta)",
  "Compliance Shield (Beta)",
  "Manager Logbook (Beta)",
];

const TIER_PRIORITY: Record<string, number> = {
  'Tier 0': 0,
  'Tier 1': 1,
  'Tier 2': 2,
  'Tier 3': 3,
  'Untiered': 4,
};

export function sortByTierThenDate(releases: Release[]): Release[] {
  return [...releases].sort((a, b) => {
    const aPri = a.tier ? (TIER_PRIORITY[a.tier] ?? 5) : 5;
    const bPri = b.tier ? (TIER_PRIORITY[b.tier] ?? 5) : 5;
    if (aPri !== bPri) return aPri - bPri;
    const aDate = a.releaseDate || "";
    const bDate = b.releaseDate || "";
    return bDate.localeCompare(aDate);
  });
}

export const groupReleasesByProduct = (releases: Release[]): Record<string, Release[]> => {
  const sorted = sortByTierThenDate(releases);

  const grouped = sorted.reduce((acc, release) => {
    if (!acc[release.product]) {
      acc[release.product] = [];
    }
    acc[release.product].push(release);
    return acc;
  }, {} as Record<string, Release[]>);

  const bestTierForGroup = (productReleases: Release[]): number => {
    let best = 99;
    for (const r of productReleases) {
      const pri = r.tier ? (TIER_PRIORITY[r.tier] ?? 5) : 5;
      if (pri < best) best = pri;
    }
    return best;
  };

  const entries = Object.entries(grouped);
  entries.sort((a, b) => {
    const aTier = bestTierForGroup(a[1]);
    const bTier = bestTierForGroup(b[1]);
    if (aTier !== bTier) return aTier - bTier;
    const aIdx = PRODUCT_ORDER.indexOf(a[0]);
    const bIdx = PRODUCT_ORDER.indexOf(b[0]);
    const aOrder = aIdx === -1 ? PRODUCT_ORDER.length : aIdx;
    const bOrder = bIdx === -1 ? PRODUCT_ORDER.length : bIdx;
    return aOrder - bOrder;
  });

  const ordered: Record<string, Release[]> = {};
  for (const [product, productReleases] of entries) {
    ordered[product] = productReleases;
  }
  return ordered;
};

const RELEASED_STATUS_SET = new Set(["Fully Released", "Partially Released", "Beta"]);
const COMING_SOON_STATUS_SET = new Set(["Coming Soon"]);

function groupByStatusCategory(releases: Release[]): { released: Release[]; comingSoon: Release[]; inDevelopment: Release[] } {
  const released: Release[] = [];
  const comingSoon: Release[] = [];
  const inDevelopment: Release[] = [];
  for (const r of releases) {
    if (RELEASED_STATUS_SET.has(r.status)) released.push(r);
    else if (COMING_SOON_STATUS_SET.has(r.status)) comingSoon.push(r);
    else inDevelopment.push(r);
  }
  return { released, comingSoon, inDevelopment };
}

function groupByProductOrdered(releases: Release[]): Record<string, Release[]> {
  return groupReleasesByProduct(releases);
}

function formatSlackSection(releases: Release[]): string {
  let text = '';
  const byProduct = groupByProductOrdered(releases);
  Object.entries(byProduct).forEach(([product, productReleases]) => {
    text += `*_${product.toUpperCase()}_*\n`;
    productReleases.forEach(release => {
      const datePart = release.releaseDate ? `  (${release.releaseDate})` : '';
      text += `    • _${release.releaseName}_ // ${release.status}${datePart}\n`;
      if (release.what) text += `        ◦ *What:* ${release.what}\n`;
      if (release.why) text += `        ◦ *Why It Matters:* ${release.why}\n`;
      if (release.owner) text += `        ◦ *Owner of Feature:* ${release.owner}\n`;
    });
  });
  return text;
}

function formatSlackSectionHtml(releases: Release[]): string {
  let html = '';
  const indent = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
  const byProduct = groupByProductOrdered(releases);
  const productEntries = Object.entries(byProduct);
  productEntries.forEach(([product, productReleases], idx) => {
    html += `<p><b><u>${product.toUpperCase()}</u></b></p>`;
    html += `<ul>`;
    productReleases.forEach(release => {
      const datePart = release.releaseDate ? `  (${release.releaseDate})` : '';
      const nameHtml = release.notionUrl
        ? `<a href="${release.notionUrl}">${release.releaseName}</a>`
        : release.releaseName;
      html += `<li>${nameHtml} // ${release.status}${datePart}<br>`;
      const subItems: string[] = [];
      if (release.what) subItems.push(`${indent}○ <b>What:</b> ${release.what}`);
      if (release.why) subItems.push(`${indent}○ <b>Why It Matters:</b> ${release.why}`);
      if (release.owner) subItems.push(`${indent}○ <b>Owner of Feature:</b> ${release.owner}`);
      html += subItems.join(`<br>`);
      html += `</li>`;
    });
    html += `</ul>`;
    if (idx < productEntries.length - 1) html += `<br>`;
  });
  return html;
}

export const generateSlackPreview = (grouped: Record<string, Release[]>, startStr: string, endStr: string): string => {
  const allReleases = Object.values(grouped).flat();
  const { released, comingSoon, inDevelopment } = groupByStatusCategory(allReleases);

  let text = `---------\n`;
  text += `*Bi-Weekly Release Digest (Last 30 Days)*\n\n`;

  if (released.length > 0) {
    text += `🟢 *RELEASED & LIVE:*\n`;
    text += formatSlackSection(released);
    text += `\n`;
  }
  if (comingSoon.length > 0) {
    text += `🔵 *COMING SOON:*\n`;
    text += formatSlackSection(comingSoon);
    text += `\n`;
  }
  if (inDevelopment.length > 0) {
    text += `🟡 *IN DEVELOPMENT:*\n`;
    text += formatSlackSection(inDevelopment);
    text += `\n`;
  }

  return text;
};

export const generateSlackHtml = (grouped: Record<string, Release[]>, startStr: string, endStr: string): string => {
  const allReleases = Object.values(grouped).flat();
  const { released, comingSoon, inDevelopment } = groupByStatusCategory(allReleases);

  let html = `<div>`;
  html += `<p>---------</p>`;
  html += `<p><b>Bi-Weekly Release Digest (Last 30 Days)</b></p>`;

  if (released.length > 0) {
    html += `<p>🟢 <b>RELEASED &amp; LIVE:</b></p>`;
    html += formatSlackSectionHtml(released);
  }
  if (comingSoon.length > 0) {
    html += `<p>🔵 <b>COMING SOON:</b></p>`;
    html += formatSlackSectionHtml(comingSoon);
  }
  if (inDevelopment.length > 0) {
    html += `<p>🟡 <b>IN DEVELOPMENT:</b></p>`;
    html += formatSlackSectionHtml(inDevelopment);
  }

  html += `</div>`;
  return html;
};

export const generateEmailHtml = (grouped: Record<string, Release[]>, startStr: string, endStr: string): string => {
  const brandBlue = '#1B66FF';
  const navy = '#091C5D';

  let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; max-width: 720px; margin: 0 auto;">`;
  html += `<h1 style="font-size: 24px; font-weight: 700; margin-bottom: 32px; color: #111;">Bi-Weekly Release Digest (Last 30 Days)</h1>`;

  const STATUS_ORDER: Record<string, number> = {
    'Fully Released': 0, 'Partially Released': 1, 'Beta': 2,
    'Coming Soon': 3, 'In Development': 4,
  };

  Object.entries(grouped).forEach(([product, releases]) => {
    const sorted = [...releases].sort((a, b) => {
      const aStatus = STATUS_ORDER[a.status] ?? 5;
      const bStatus = STATUS_ORDER[b.status] ?? 5;
      if (aStatus !== bStatus) return aStatus - bStatus;
      const aTier = a.tier ? (TIER_PRIORITY[a.tier] ?? 5) : 5;
      const bTier = b.tier ? (TIER_PRIORITY[b.tier] ?? 5) : 5;
      return aTier - bTier;
    });

    html += `<div style="margin-top: 32px;">`;
    html += `<h2 style="color: ${brandBlue}; font-size: 16px; font-weight: 700; margin: 0 0 4px 0;">${product}</h2>`;
    html += `<div style="border-bottom: 2px solid #e5e7eb; margin-bottom: 16px;"></div>`;

    sorted.forEach(release => {
      const datePart = release.releaseDate ? `<span style="color: #6b7280; font-size: 14px; font-weight: 400; margin-left: 4px;">(${release.releaseDate})</span>` : '';
      const statusBadge = `<span style="background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-left: 12px; white-space: nowrap;">${release.status}</span>`;
      const tierBadge = release.tier ? `<span style="background: #eef2ff; color: ${navy}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-left: 6px; white-space: nowrap;">${release.tier}</span>` : '';

      const bulletColor = '#6b7280';
      html += `<div style="margin-bottom: 24px; padding-left: 4px;">`;
      const nameHtml = release.notionUrl ? `<a href="${release.notionUrl}" style="color: #111; text-decoration: underline;">${release.releaseName}</a>` : release.releaseName;
      html += `<div style="font-size: 16px; font-weight: 700; color: #111; line-height: 1.5;">${nameHtml}${statusBadge}${tierBadge} ${datePart}</div>`;
      html += `<ul style="margin: 4px 0 0 0; padding-left: 20px; list-style-type: disc;">`;
      if (release.what) html += `<li style="font-size: 14px; color: ${bulletColor}; line-height: 1.6;"><strong>What:</strong> ${release.what}</li>`;
      if (release.why) html += `<li style="font-size: 14px; color: ${bulletColor}; line-height: 1.6;"><strong>Why:</strong> ${release.why}</li>`;
      if (release.knowledgeArticleUrl) html += `<li style="font-size: 14px; color: ${bulletColor}; line-height: 1.6;"><strong>Knowledge Article:</strong> <a href="${release.knowledgeArticleUrl}" style="color: ${brandBlue};">Link</a></li>`;
      if (release.owner) html += `<li style="font-size: 14px; color: ${bulletColor}; line-height: 1.6;"><strong>Owner of Feature:</strong> ${release.owner}</li>`;
      html += `</ul>`;
      html += `</div>`;
    });

    html += `</div>`;
  });

  html += `</div>`;
  return html;
};

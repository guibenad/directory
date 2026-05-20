import { JWT } from "google-auth-library";

export type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscSummary = {
  clicks: number;
  impressions: number;
  avgCtr: number;
  avgPosition: number;
  topPages: { url: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topQueries: { query: string; clicks: number; impressions: number; position: number }[];
};

type Config = {
  siteUrl: string;
  clientEmail: string;
  privateKey: string;
};

function getConfig(): Config | null {
  const siteUrl = process.env.GOOGLE_SC_SITE_URL;
  const clientEmail = process.env.GOOGLE_SC_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!siteUrl || !clientEmail || !privateKey) return null;
  return { siteUrl, clientEmail, privateKey };
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function query(config: Config, dimensions: string[], rowLimit: number): Promise<GscRow[]> {
  const jwt = new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  const token = await jwt.authorize();
  if (!token.access_token) throw new Error("Impossible d'obtenir un jeton Google");

  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    config.siteUrl,
  )}/searchAnalytics/query`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: daysAgoIso(28),
      endDate: daysAgoIso(1),
      dimensions,
      rowLimit,
    }),
  });

  if (!res.ok) {
    throw new Error(`GSC ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { rows?: GscRow[] };
  return data.rows ?? [];
}

export async function getGscSummary(): Promise<GscSummary | null> {
  const config = getConfig();
  if (!config) return null;

  try {
    const [pages, queries] = await Promise.all([
      query(config, ["page"], 10),
      query(config, ["query"], 10),
    ]);

    const totals = pages.reduce(
      (acc, r) => ({
        clicks: acc.clicks + r.clicks,
        impressions: acc.impressions + r.impressions,
      }),
      { clicks: 0, impressions: 0 },
    );

    const avgCtr = totals.impressions === 0 ? 0 : totals.clicks / totals.impressions;
    const avgPosition =
      pages.length === 0 ? 0 : pages.reduce((s, r) => s + r.position, 0) / pages.length;

    return {
      clicks: totals.clicks,
      impressions: totals.impressions,
      avgCtr,
      avgPosition,
      topPages: pages.map((r) => ({
        url: r.keys[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topQueries: queries.map((r) => ({
        query: r.keys[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        position: r.position,
      })),
    };
  } catch (err) {
    console.warn("GSC indisponible:", err);
    return null;
  }
}

/**
 * Cloudflare Worker: Freeshot website page URL indexer
 *
 * Collects WEBSITE PAGE URLs only:
 *   https://freeshot.live/live-tv/channel-name/123
 *
 * Does NOT collect embed URLs, iframe URLs, .m3u8 files, or video stream URLs.
 *
 * Endpoints:
 *   /              help page
 *   /urls.txt      plain URL list
 *   /playlist.m3u  M3U playlist using page URLs as entries
 *   /json          JSON output
 */

const BASE = "https://freeshot.live";
const START_PATH = "/live-tv/";
const MAX_PAGES = 73;
const CHANNEL_PAGE_RE = /^\/live-tv\/([^/?#]+)\/(\d+)\/?$/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/" || url.pathname === "") {
        return helpResponse(url.origin);
      }

      const entries = await collectAllPageUrls();

      if (url.pathname === "/urls.txt") {
        return textResponse(entries.map((e) => e.url).join("\n") + "\n", "text/plain; charset=utf-8");
      }

      if (url.pathname === "/playlist.m3u") {
        return textResponse(toM3U(entries), "audio/x-mpegurl; charset=utf-8");
      }

      if (url.pathname === "/json") {
        return jsonResponse({
          count: entries.length,
          source: `${BASE}${START_PATH}`,
          type: "website_page_urls_only",
          urls: entries,
        });
      }

      return new Response("Not found\n", { status: 404 });
    } catch (err) {
      return jsonResponse(
        {
          error: "Failed to collect page URLs",
          message: err?.message || String(err),
        },
        500
      );
    }
  },
};

async function collectAllPageUrls() {
  const seen = new Map();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const pageUrl = page === 1 ? `${BASE}${START_PATH}` : `${BASE}${START_PATH}?page=${page}`;
    const html = await fetchText(pageUrl);
    const entries = extractChannelPageUrls(html);

    if (page > 1 && entries.length === 0) break;

    for (const entry of entries) {
      if (!seen.has(entry.url)) seen.set(entry.url, entry);
    }
  }

  return [...seen.values()];
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; page-url-indexer/1.0; Cloudflare Worker)",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${url}`);
  return await res.text();
}

function extractChannelPageUrls(html) {
  const out = [];
  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRe.exec(html)) !== null) {
    const rawHref = decodeHtmlEntities(match[1]).trim();
    if (!rawHref) continue;

    let parsed;
    try {
      parsed = new URL(rawHref, BASE);
    } catch {
      continue;
    }

    if (parsed.hostname.replace(/^www\./i, "") !== "freeshot.live") continue;

    const pathMatch = parsed.pathname.match(CHANNEL_PAGE_RE);
    if (!pathMatch) continue;

    const slug = pathMatch[1];
    const id = pathMatch[2];
    const cleanUrl = `${BASE}/live-tv/${slug}/${id}`;

    out.push({
      name: slugToName(slug),
      slug,
      id,
      url: cleanUrl,
    });
  }

  return out;
}

function slugToName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (/^(uk|usa|arg|al|ru|tv|hd|sd|espn|fox|tnt|bbc|bt)$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function toM3U(entries) {
  const lines = ["#EXTM3U"];

  for (const entry of entries) {
    const safeName = entry.name.replace(/"/g, "'");
    lines.push(`#EXTINF:-1 tvg-name="${safeName}" group-title="Freeshot Website Pages",${entry.name}`);
    lines.push(entry.url);
  }

  return lines.join("\n") + "\n";
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function helpResponse(origin) {
  return textResponse(
`Freeshot website page URL indexer

Outputs website page URLs only.
No embeds, iframes, .m3u8 files, or video streams are extracted.

Endpoints:
${origin}/urls.txt
${origin}/playlist.m3u
${origin}/json
`,
    "text/plain; charset=utf-8"
  );
}

function textResponse(body, contentType) {
  return new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=1800",
      "access-control-allow-origin": "*",
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2) + "\n", {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=1800",
      "access-control-allow-origin": "*",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ results: [] });

  try {
    // Search DuckDuckGo HTML for product specs
    const searchQuery = `${query} specifications details specs`;
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

    const res = await fetch(ddgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ProductLookup/1.0)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: "Search failed" });
    }

    const html = await res.text();

    // Parse DuckDuckGo HTML results
    const results: { title: string; snippet: string; url: string }[] = [];
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    const titles: { url: string; title: string }[] = [];
    let match;
    while ((match = resultRegex.exec(html)) !== null) {
      // DuckDuckGo uses redirect URLs, extract actual URL
      let url = match[1];
      const udParam = url.match(/uddg=([^&]*)/);
      if (udParam) url = decodeURIComponent(udParam[1]);
      const title = match[2].replace(/<[^>]*>/g, "").trim();
      if (title && url.startsWith("http")) {
        titles.push({ url, title });
      }
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1].replace(/<[^>]*>/g, "").trim());
    }

    for (let i = 0; i < Math.min(titles.length, 8); i++) {
      results.push({
        title: titles[i].title,
        url: titles[i].url,
        snippet: snippets[i] || "",
      });
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ results: [], error: e.message });
  }
}

// Fetch a page and extract product-related text
export async function POST(req: NextRequest) {
  const { url, productName } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ProductLookup/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NextResponse.json({ error: "Failed to fetch page" });

    const html = await res.text();

    // Strip HTML tags and extract text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    // Extract relevant sections (look for spec-related keywords)
    const specKeywords = [
      "material", "วัสดุ", "weight", "น้ำหนัก", "size", "ขนาด",
      "color", "สี", "specification", "spec", "รายละเอียด", "คุณสมบัติ",
      "feature", "description", "detail", "warranty", "รับประกัน",
      "origin", "made in", "ผลิต", "brand", "แบรนด์",
    ];

    // Find paragraphs containing product-relevant content
    const sentences = text.split(/[.。\n]/).filter((s) => s.trim().length > 20);
    const relevantText: string[] = [];
    const productNameLower = (productName || "").toLowerCase();

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (
        specKeywords.some((k) => lower.includes(k)) ||
        (productNameLower && lower.includes(productNameLower))
      ) {
        const trimmed = sentence.trim();
        if (trimmed.length < 500 && !relevantText.includes(trimmed)) {
          relevantText.push(trimmed);
        }
      }
      if (relevantText.length >= 15) break;
    }

    // Try to extract structured spec data
    const extracted: Record<string, string> = {};
    const specPatterns: [RegExp, string][] = [
      [/(?:material|วัสดุ)[:\s]*([^,.\n]{2,60})/i, "material"],
      [/(?:weight|น้ำหนัก)[:\s]*([^,.\n]{2,40})/i, "weight"],
      [/(?:size|ขนาด)[:\s]*([^,.\n]{2,60})/i, "size"],
      [/(?:color|สี|colours?)[:\s]*([^,.\n]{2,60})/i, "color"],
      [/(?:warranty|รับประกัน|guarantee)[:\s]*([^,.\n]{2,40})/i, "warranty"],
      [/(?:made\s*in|origin|แหล่งผลิต|ผลิตใน)[:\s]*([^,.\n]{2,40})/i, "origin"],
      [/(?:brand|แบรนด์|ยี่ห้อ)[:\s]*([^,.\n]{2,40})/i, "brand"],
    ];

    for (const [pattern, field] of specPatterns) {
      const m = text.match(pattern);
      if (m) extracted[field] = m[1].trim();
    }

    // Get a clean description from relevant text
    const description = relevantText.slice(0, 5).join(". ").slice(0, 500);

    return NextResponse.json({
      extracted,
      description,
      relevantText: relevantText.slice(0, 10),
      textLength: text.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch" });
  }
}

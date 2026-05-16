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
    const specPatterns: [RegExp, string, number][] = [
      [/(?:material|วัสดุ)\s*[:\-=]\s*([A-Za-z\u0E00-\u0E7F][^,.\n|()]{2,40})/i, "material", 40],
      [/(?:weight|น้ำหนัก)\s*[:\-=]\s*([0-9][0-9a-zA-Z\s.\/]{1,20})/i, "weight", 20],
      [/(?:size|ขนาด)\s*[:\-=]\s*([0-9A-Za-z][^,.\n|()]{1,30})/i, "size", 30],
      [/(?:color|colour|สี)\s*[:\-=]\s*([A-Za-z\u0E00-\u0E7F][A-Za-z\u0E00-\u0E7F\s\/\-]{1,25})/i, "color", 25],
      [/(?:warranty|รับประกัน|guarantee)\s*[:\-=]\s*([0-9][^,.\n|()]{1,25})/i, "warranty", 25],
      [/(?:made\s*in|origin|แหล่งผลิต|ผลิตใน|country)\s*[:\-=]\s*([A-Za-z\u0E00-\u0E7F][A-Za-z\u0E00-\u0E7F\s]{1,20})/i, "origin", 20],
      [/(?:brand|แบรนด์|ยี่ห้อ)\s*[:\-=]\s*([A-Za-z\u0E00-\u0E7F][A-Za-z\u0E00-\u0E7F0-9\s]{1,20})/i, "brand", 20],
    ];

    // Field label keywords that signal end of a value
    const fieldLabels = /\b(material|weight|size|color|colour|brand|warranty|guarantee|origin|made in|country|specification|description|product code|sku|barcode|price|quantity|available|stock|construction|circumference|type|model)\b/i;

    for (const [pattern, field, maxLen] of specPatterns) {
      const m = text.match(pattern);
      if (m) {
        let val = m[1].trim();
        // Cut at next field label (word followed by colon)
        const cutAt = val.search(fieldLabels);
        if (cutAt > 1) val = val.slice(0, cutAt).trim();
        // Cut at any word followed by colon/dash (likely next field)
        const colonCut = val.search(/\s+[A-Za-z\u0E00-\u0E7F]{3,}\s*[:\-=]/);
        if (colonCut > 1) val = val.slice(0, colonCut).trim();
        // Also cut at common separators
        const sepAt = val.search(/\s{3,}|[|•\t]/);
        if (sepAt > 1) val = val.slice(0, sepAt).trim();
        if (val.length > maxLen) val = val.slice(0, maxLen).trim();
        // Remove trailing colon/dash/space/punctuation
        val = val.replace(/[\s:\-=,;]+$/, "");
        if (val.length >= 2) extracted[field] = val;
      }
    }

    // Get a clean description from relevant text
    const description = relevantText.slice(0, 5).join(". ").slice(0, 500);

    // Sanitize all string values to remove control characters
    const sanitize = (s: string) => s.replace(/[\x00-\x1f\x7f]/g, " ").trim();
    const cleanExtracted: Record<string, string> = {};
    for (const [k, v] of Object.entries(extracted)) {
      cleanExtracted[k] = sanitize(v);
    }

    return NextResponse.json({
      extracted: cleanExtracted,
      description: sanitize(description),
      relevantText: relevantText.slice(0, 10).map(sanitize),
      textLength: text.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch" });
  }
}

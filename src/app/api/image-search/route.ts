import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ images: [] });

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!apiKey || !cx) return NextResponse.json({ error: "Google API not configured" }, { status: 500 });

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=8&imgSize=medium`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message || "Google API error" }, { status: 500 });
  }

  const data = await res.json();
  const images = (data.items || []).map((item: any) => ({
    url: item.link,
    thumbnail: item.image?.thumbnailLink || item.link,
    title: item.title,
    source: item.displayLink,
    width: item.image?.width,
    height: item.image?.height,
  }));

  return NextResponse.json({ images });
}

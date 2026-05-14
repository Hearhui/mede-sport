import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ photos: [] });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "PEXELS_API_KEY not set" }, { status: 500 });

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&size=small`,
    { headers: { Authorization: apiKey } }
  );

  if (!res.ok) return NextResponse.json({ error: "Pexels API error" }, { status: 500 });

  const data = await res.json();
  const photos = data.photos.map((p: any) => ({
    id: p.id,
    url: p.src.medium, // 350x350 ~30-50KB
    small: p.src.small,
    photographer: p.photographer,
    alt: p.alt || query,
  }));

  return NextResponse.json({ photos });
}

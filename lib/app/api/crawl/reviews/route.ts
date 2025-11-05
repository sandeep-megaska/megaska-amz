import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { d } from "@/lib/date";

// stub to get reviews (id, rating, title, body, date, verified)
async function fetchRecentReviews(asin: string, days=2) {
  // implement with your scraper/provider
  return [] as Array<{
    review_id: string; rating: number; title: string; body: string;
    review_date: string; verified_purchase?: boolean
  }>;
}

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get('days') ?? 2);
  const { data: wl, error } = await supabase.from('watchlist').select('asin');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results:any[] = [];
  for (const row of wl ?? []) {
    const reviews = await fetchRecentReviews(row.asin, days);
    for (const r of reviews) {
      await supabase.from('reviews').upsert({
        asin: row.asin,
        review_id: r.review_id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        review_date: r.review_date,
        verified_purchase: !!r.verified_purchase
      }, { onConflict: 'asin,review_id' });
    }
    results.push({ asin: row.asin, added: reviews.length });
  }
  return NextResponse.json({ days, results });
}

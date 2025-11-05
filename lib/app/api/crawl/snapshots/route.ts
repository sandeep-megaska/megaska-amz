import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { d } from "@/lib/date";

/** plug your internal scraper here */
async function fetchSnapshot(asin: string) {
  // TODO: implement with your method
  // return { price_inr, list_price_inr, in_stock, rating, rating_count, bsr_rank, coupon_flag, delivery_promise }
  return null;
}

export async function GET(req: NextRequest) {
  const label = req.nextUrl.searchParams.get('label') ?? 'default';
  const { data: wl, error } = await supabase.from('watchlist').select('asin').eq('label', label);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const snapDate = d(0);
  const results: any[] = [];
  for (const row of wl ?? []) {
    const snap = await fetchSnapshot(row.asin);
    if (!snap) continue;
    const { error: upErr } = await supabase.from('asin_snapshots').upsert({
      asin: row.asin,
      snap_date: snapDate,
      ...snap
    }, { onConflict: 'asin,snap_date' });
    if (upErr) results.push({ asin: row.asin, ok:false, err: upErr.message });
    else results.push({ asin: row.asin, ok:true });
  }
  return NextResponse.json({ snapDate, results });
}

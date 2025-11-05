import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { d } from "@/lib/date";

// You will implement: getTopNResults(term) -> [{asin, rank, page}]
async function getTopNResults(term: string, maxPages=5) {
  // scrape/search API; return at most ~100 results
  return [] as Array<{asin:string; rank:number; page:number}>;
}

export async function GET() {
  const snapDate = d(0);
  const { data: terms } = await supabase.from('keywords').select('term');
  const { data: wl }    = await supabase.from('watchlist').select('asin');

  const watchAsins = new Set((wl ?? []).map(w => w.asin));
  let wrote = 0;

  for (const t of terms ?? []) {
    const results = await getTopNResults(t.term);
    for (const r of results) {
      if (!watchAsins.has(r.asin)) continue; // only track ours + watched competitors
      await supabase.from('keyword_ranks').upsert({
        term: t.term, asin: r.asin, snap_date: snapDate,
        rank: r.rank, page: r.page
      }, { onConflict: 'term,asin,snap_date' });
      wrote++;
    }
  }
  return NextResponse.json({ snapDate, wrote });
}

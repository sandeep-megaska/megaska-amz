import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { d } from "@/lib/date";
// import your SP-API client

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get('days') ?? 1);
  const start = d(-days);
  const end   = d(0);

  // TODO: use your SP-API client to fetch per-ASIN sales between start..end
  // const rows = await fetchSalesByASIN(start, end);

  const rows: Array<{asin:string; order_date:string; units:number; revenue:number; refunds?:number; sessions?:number; cr?:number}> = [];

  for (const r of rows) {
    await supabase.from('sales_daily').upsert({
      asin: r.asin,
      order_date: r.order_date,
      units_sold: r.units,
      revenue_inr: r.revenue,
      refunds: r.refunds ?? 0,
      sessions: r.sessions ?? null,
      conversion_rate: r.cr ?? null
    }, { onConflict: 'asin,order_date' });
  }
  return NextResponse.json({ ok: true, start, end, count: rows.length });
}

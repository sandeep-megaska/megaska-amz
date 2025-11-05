import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { openai } from "@/lib/openai";
import { d } from "@/lib/date";

const PROMPT = (bundle:string) => `
You are analyzing swimwear reviews for Indian consumers. From the following reviews, extract:
- 5 short bullet positives
- 5 short bullet negatives
- Sizing notes (tight/loose, true-to-size patterns)
- Fabric and durability notes
- JSON of key themes with counts (keys: theme, count)
Reviews:
${bundle}
Return JSON with keys: positives, negatives, sizing_notes, fabric_notes, themes_json.
`;

export async function POST() {
  const snapDate = d(0);

  // pick ASINs with reviews yesterday/today that don't yet have a summary
  const { data: asins } = await supabase.rpc('get_asins_needing_summary', { p_date: snapDate })
    .catch(() => ({ data: [] as { asin:string }[] }));

  for (const { asin } of asins ?? []) {
    const { data: revs } = await supabase
      .from('reviews')
      .select('title,body,rating')
      .eq('asin', asin)
      .gte('review_date', snapDate) // or last 7 days if sparse
      .limit(80);

    const bundle = (revs ?? [])
      .map(r => `(${r.rating}★) ${r.title ?? ''} — ${r.body ?? ''}`.trim())
      .join('\n');

    if (!bundle) continue;

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: PROMPT(bundle)
    });

    const text = resp.output_text ?? "{}";
    const parsed = JSON.parse(text);

    await supabase.from('review_summaries').upsert({
      asin, snap_date: snapDate,
      positives: (parsed.positives||[]).join('\n- '),
      negatives: (parsed.negatives||[]).join('\n- '),
      sizing_notes: parsed.sizing_notes || '',
      fabric_notes: parsed.fabric_notes || '',
      themes_json: parsed.themes_json || []
    }, { onConflict: 'asin,snap_date' });
  }
  return NextResponse.json({ ok: true, snapDate });
}

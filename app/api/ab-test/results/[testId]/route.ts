import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export const dynamic = "force-dynamic";

const API_VERSION = "v25.0";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;

    // Load test
    const { data: test, error: testError } = await supabaseAdmin
      .from("ab_tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
    }

    // Load variants
    const { data: variants, error: varError } = await supabaseAdmin
      .from("ab_test_variants")
      .select("*")
      .eq("ab_test_id", testId)
      .order("variant_label");

    if (varError) throw varError;

    // Fetch insights for each variant's ad from Meta
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Meta credentials not configured" },
        { status: 500 }
      );
    }

    const variantsWithInsights = await Promise.all(
      (variants || []).map(async (v) => {
        if (!v.meta_ad_id) {
          return { ...v, insights: null };
        }

        try {
          const url = `https://graph.facebook.com/${API_VERSION}/${v.meta_ad_id}/insights?fields=impressions,reach,clicks,cpc,cpm,ctr,spend,actions,cost_per_action_type&date_preset=maximum&access_token=${accessToken}`;
          const res = await fetch(url);
          const data = await res.json();
          const insights = data.data?.[0] || null;

          let leads = 0;
          let costPerLead = 0;
          if (insights?.actions) {
            const leadAction = insights.actions.find(
              (a: { action_type: string; value: string }) =>
                a.action_type === "lead" ||
                a.action_type === "onsite_conversion.lead_grouped"
            );
            if (leadAction) leads = parseInt(leadAction.value);
          }
          if (insights?.cost_per_action_type) {
            const cplAction = insights.cost_per_action_type.find(
              (a: { action_type: string; value: string }) =>
                a.action_type === "lead" ||
                a.action_type === "onsite_conversion.lead_grouped"
            );
            if (cplAction) costPerLead = parseFloat(cplAction.value);
          }

          return {
            ...v,
            insights: insights
              ? {
                  impressions: parseInt(insights.impressions || "0"),
                  reach: parseInt(insights.reach || "0"),
                  clicks: parseInt(insights.clicks || "0"),
                  cpc: parseFloat(insights.cpc || "0"),
                  cpm: parseFloat(insights.cpm || "0"),
                  ctr: parseFloat(insights.ctr || "0"),
                  spend: parseFloat(insights.spend || "0"),
                  leads,
                  costPerLead,
                }
              : null,
          };
        } catch {
          return { ...v, insights: null };
        }
      })
    );

    // Determine winner by CTR (highest CTR with at least some impressions)
    let winnerId: string | null = null;
    let bestCtr = -1;
    for (const v of variantsWithInsights) {
      if (v.insights && v.insights.impressions > 100 && v.insights.ctr > bestCtr) {
        bestCtr = v.insights.ctr;
        winnerId = v.id;
      }
    }

    return NextResponse.json({
      test,
      variants: variantsWithInsights,
      suggestedWinnerId: winnerId,
    });
  } catch (error) {
    console.error("AB test results error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка загрузки результатов",
      },
      { status: 500 }
    );
  }
}

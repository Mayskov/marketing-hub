import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_VERSION = "v25.0";

export async function GET(request: Request) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    return NextResponse.json(
      { error: "Meta credentials not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch campaigns with insights
    const campaignsUrl = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/campaigns?fields=id,name,status,objective,created_time,daily_budget,lifetime_budget,start_time,stop_time&limit=50&access_token=${accessToken}`;
    const campaignsRes = await fetch(campaignsUrl);
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      throw new Error(
        campaignsData.error.error_user_msg ||
          campaignsData.error.message ||
          "Failed to fetch campaigns"
      );
    }

    const campaigns = campaignsData.data || [];

    // Parse optional date range
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const until = searchParams.get("until");

    let timeParam = "date_preset=last_30d";
    if (since && until) {
      timeParam = `time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`;
    }

    // Fetch insights for each campaign
    const campaignsWithInsights = await Promise.all(
      campaigns.map(async (campaign: { id: string; name: string; status: string; objective: string; created_time: string; daily_budget?: string }) => {
        try {
          const insightsUrl = `https://graph.facebook.com/${API_VERSION}/${campaign.id}/insights?fields=impressions,reach,clicks,cpc,cpm,ctr,spend,actions,cost_per_action_type&${timeParam}&access_token=${accessToken}`;
          const insightsRes = await fetch(insightsUrl);
          const insightsData = await insightsRes.json();

          const insights = insightsData.data?.[0] || null;

          // Extract lead count from actions
          let leads = 0;
          let costPerLead = 0;
          if (insights?.actions) {
            const leadAction = insights.actions.find(
              (a: { action_type: string; value: string }) =>
                a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
            );
            if (leadAction) leads = parseInt(leadAction.value);
          }
          if (insights?.cost_per_action_type) {
            const cplAction = insights.cost_per_action_type.find(
              (a: { action_type: string; value: string }) =>
                a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
            );
            if (cplAction) costPerLead = parseFloat(cplAction.value);
          }

          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            createdTime: campaign.created_time,
            dailyBudget: campaign.daily_budget
              ? (parseInt(campaign.daily_budget) / 100).toFixed(2)
              : null,
            impressions: insights ? parseInt(insights.impressions) : 0,
            reach: insights ? parseInt(insights.reach) : 0,
            clicks: insights ? parseInt(insights.clicks) : 0,
            cpc: insights ? parseFloat(insights.cpc) : 0,
            cpm: insights ? parseFloat(insights.cpm) : 0,
            ctr: insights ? parseFloat(insights.ctr) : 0,
            spend: insights ? parseFloat(insights.spend) : 0,
            leads,
            costPerLead,
          };
        } catch {
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            createdTime: campaign.created_time,
            dailyBudget: campaign.daily_budget
              ? (parseInt(campaign.daily_budget) / 100).toFixed(2)
              : null,
            impressions: 0,
            reach: 0,
            clicks: 0,
            cpc: 0,
            cpm: 0,
            ctr: 0,
            spend: 0,
            leads: 0,
            costPerLead: 0,
          };
        }
      })
    );

    // Calculate totals
    const totals = campaignsWithInsights.reduce(
      (acc, c) => ({
        impressions: acc.impressions + c.impressions,
        reach: acc.reach + c.reach,
        clicks: acc.clicks + c.clicks,
        spend: acc.spend + c.spend,
        leads: acc.leads + c.leads,
      }),
      { impressions: 0, reach: 0, clicks: 0, spend: 0, leads: 0 }
    );

    return NextResponse.json({
      campaigns: campaignsWithInsights,
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        costPerLead: totals.leads > 0 ? totals.spend / totals.leads : 0,
      },
      accountId,
    });
  } catch (error) {
    console.error("Campaigns fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch campaign data",
      },
      { status: 500 }
    );
  }
}

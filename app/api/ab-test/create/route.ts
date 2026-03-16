import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { createABTestCampaign } from "@/app/lib/meta";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      variants,
      interests,
      location,
      ageMin,
      ageMax,
      dailyBudget,
      landingPageUrl,
      sharedImageBase64,
      status = "PAUSED",
    } = body;

    if (!name || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: "Нужно минимум 2 варианта для A/B теста" },
        { status: 400 }
      );
    }

    if (!sharedImageBase64) {
      return NextResponse.json(
        { error: "Изображение обязательно" },
        { status: 400 }
      );
    }

    // 1. Create campaign in Meta
    const metaResult = await createABTestCampaign({
      campaignName: name,
      adSetName: `${name} - Ad Set`,
      variants: variants.map((v: { variantLabel: string; primaryText: string; headline: string; callToAction: string; imageBase64?: string }) => ({
        variantLabel: v.variantLabel,
        primaryText: v.primaryText,
        headline: v.headline,
        callToAction: v.callToAction,
        imageBase64: v.imageBase64,
      })),
      interests: interests || [],
      location: location || "Worldwide",
      ageMin: ageMin || 18,
      ageMax: ageMax || 65,
      dailyBudget: dailyBudget || 10,
      landingPageUrl: landingPageUrl || "",
      sharedImageBase64,
      status,
    });

    // 2. Save test to Supabase
    const { data: testData, error: testError } = await supabaseAdmin
      .from("ab_tests")
      .insert({
        name,
        description,
        campaign_id: metaResult.campaignId,
        ad_set_id: metaResult.adSetId,
        status: "active",
      })
      .select()
      .single();

    if (testError) throw testError;

    // 3. Save variants
    const variantInserts = metaResult.variantResults.map((vr, i) => ({
      ab_test_id: testData.id,
      variant_label: vr.variantLabel,
      primary_text: variants[i].primaryText,
      headline: variants[i].headline,
      call_to_action: variants[i].callToAction,
      image_base64: variants[i].imageBase64 || null,
      meta_ad_id: vr.adId,
      meta_creative_id: vr.creativeId,
    }));

    const { error: variantError } = await supabaseAdmin
      .from("ab_test_variants")
      .insert(variantInserts);

    if (variantError) throw variantError;

    return NextResponse.json({
      test: testData,
      adsManagerUrl: metaResult.adsManagerUrl,
      variantCount: metaResult.variantResults.length,
    });
  } catch (error) {
    console.error("AB test create error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Ошибка создания A/B теста",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createFullCampaign } from "@/app/lib/meta";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      imageBase64,
      campaignName,
      adSetName,
      adName,
      primaryText,
      headline,
      callToAction,
      interests,
      location,
      ageMin,
      ageMax,
      dailyBudget,
      landingPageUrl,
      publishImmediately,
    } = body;

    if (!imageBase64 || !campaignName || !primaryText || !headline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createFullCampaign({
      imageBase64,
      campaignName,
      adSetName,
      adName,
      primaryText,
      headline,
      callToAction,
      interests,
      location,
      ageMin: Number(ageMin),
      ageMax: Number(ageMax),
      dailyBudget: Number(dailyBudget),
      landingPageUrl: landingPageUrl || "",
      status: publishImmediately ? "ACTIVE" : "PAUSED",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}

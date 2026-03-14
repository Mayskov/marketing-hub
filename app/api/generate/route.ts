import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("ANTHROPIC_API_KEY present:", !!apiKey, "length:", apiKey?.length);

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const { description, location, ageMin, ageMax } = await request.json();

    if (!description || !location) {
      return NextResponse.json(
        { error: "Description and location are required" },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a Facebook ads copywriter. Generate ad content for this product/service:

Description: ${description}
Target location: ${location}
Target age range: ${ageMin}-${ageMax}

Return ONLY a JSON object (no markdown, no code blocks) with these fields:
- primaryText: punchy, benefit-led ad copy, max 3 sentences
- headline: max 8 words
- callToAction: one of LEARN_MORE, SIGN_UP, GET_QUOTE, CONTACT_US, SUBSCRIBE, APPLY_NOW, DOWNLOAD, GET_OFFER, SHOP_NOW, BOOK_TRAVEL (pick the best fit)
- interests: array of 3-5 relevant interest targeting keywords (single words or short phrases that Meta would recognize as ad interests)
- campaignName: a descriptive campaign name
- adSetName: a descriptive ad set name
- adName: a descriptive ad name`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 500 }
      );
    }

    const jsonMatch = textBlock.text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse Claude response as JSON" },
        { status: 500 }
      );
    }

    const generated = JSON.parse(jsonMatch[0]);

    const required = [
      "primaryText",
      "headline",
      "callToAction",
      "interests",
      "campaignName",
      "adSetName",
      "adName",
    ];
    for (const field of required) {
      if (!generated[field]) {
        return NextResponse.json(
          { error: `Missing field in generated content: ${field}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(generated);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate ad copy",
      },
      { status: 500 }
    );
  }
}

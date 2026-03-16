import adsSdk from "facebook-nodejs-business-sdk";

const FacebookAdsApi = adsSdk.FacebookAdsApi;
const AdAccount = adsSdk.AdAccount;
const Campaign = adsSdk.Campaign;
const AdSet = adsSdk.AdSet;

const API_VERSION = "v25.0";

export function initMeta() {
  const accessToken = process.env.META_ACCESS_TOKEN!;
  const accountId = process.env.META_AD_ACCOUNT_ID!;
  const pageId = process.env.META_PAGE_ID!;

  FacebookAdsApi.init(accessToken);
  const account = new AdAccount(`act_${accountId}`);

  return { account, accountId, pageId, accessToken };
}

export interface CreateCampaignParams {
  imageBase64: string;
  campaignName: string;
  adSetName: string;
  adName: string;
  primaryText: string;
  headline: string;
  callToAction: string;
  interests: string[];
  location: string;
  ageMin: number;
  ageMax: number;
  dailyBudget: number;
  landingPageUrl: string;
  status: "PAUSED" | "ACTIVE";
}

export async function createFullCampaign(params: CreateCampaignParams) {
  const { account, accountId, pageId, accessToken } = initMeta();

  // Step 1: Upload image
  let imageHash: string;
  try {
    const imageResult = await account.createAdImage([], {
      bytes: params.imageBase64,
    });
    const imageHashKey = Object.keys(imageResult._data.images)[0];
    imageHash = imageResult._data.images[imageHashKey].hash;
  } catch (err: unknown) {
    throw new Error(`Image upload failed: ${getMetaError(err)}`);
  }

  // Step 2: Create campaign
  let campaignId: string;
  try {
    const campaign = await account.createCampaign([], {
      [Campaign.Fields.name]: params.campaignName,
      [Campaign.Fields.objective]: "OUTCOME_LEADS",
      [Campaign.Fields.status]: params.status,
      [Campaign.Fields.special_ad_categories]: [],
      buying_type: "AUCTION",
      is_adset_budget_sharing_enabled: false,
    });
    campaignId = campaign._data.id;
  } catch (err: unknown) {
    throw new Error(`Campaign creation failed: ${getMetaError(err)}`);
  }

  // Step 3: Resolve location to Meta city key
  let geoLocations: Record<string, unknown>;
  try {
    geoLocations = await resolveLocation(params.location, accessToken);
  } catch {
    geoLocations = {
      country_groups: ["worldwide"],
      location_types: ["home", "recent"],
    };
  }

  // Step 4: Resolve interest targeting IDs
  const interestTargeting = await resolveInterests(
    params.interests,
    accessToken
  );

  // Step 5: Build targeting object
  const targeting: Record<string, unknown> = {
    age_min: params.ageMin,
    age_max: params.ageMax,
    genders: [0],
    geo_locations: geoLocations,
    targeting_automation: { advantage_audience: 0 },
  };

  if (interestTargeting.length > 0) {
    targeting.flexible_spec = [{ interests: interestTargeting }];
  }

  // Step 6: Create ad set
  let adSetId: string;
  try {
    const adSet = await account.createAdSet([], {
      [AdSet.Fields.name]: params.adSetName,
      [AdSet.Fields.campaign_id]: campaignId,
      [AdSet.Fields.daily_budget]: params.dailyBudget * 100,
      [AdSet.Fields.billing_event]: "IMPRESSIONS",
      [AdSet.Fields.optimization_goal]: "LEAD_GENERATION",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      [AdSet.Fields.status]: params.status,
      [AdSet.Fields.targeting]: targeting,
      [AdSet.Fields.promoted_object]: { page_id: pageId },
      [AdSet.Fields.start_time]: new Date().toISOString(),
    });
    adSetId = adSet._data.id;
  } catch (err: unknown) {
    throw new Error(`Ad set creation failed: ${getMetaError(err)}`);
  }

  // Step 7: Create ad creative
  let creativeId: string;
  try {
    const creative = await account.createAdCreative([], {
      name: `${params.adName} - Creative`,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          image_hash: imageHash,
          message: params.primaryText,
          name: params.headline,
          link: params.landingPageUrl || `https://www.facebook.com/${pageId}`,
          call_to_action: {
            type: params.callToAction,
          },
        },
      },
    });
    creativeId = creative._data.id;
  } catch (err: unknown) {
    throw new Error(`Ad creative creation failed: ${getMetaError(err)}`);
  }

  // Step 8: Create ad
  try {
    await account.createAd([], {
      name: params.adName,
      adset_id: adSetId,
      creative: { creative_id: creativeId },
      status: params.status,
    });
  } catch (err: unknown) {
    throw new Error(`Ad creation failed: ${getMetaError(err)}`);
  }

  const adsManagerUrl = `https://www.facebook.com/adsmanager/manage/campaigns?act=${accountId}&campaign_ids=${campaignId}`;
  return { campaignId, adsManagerUrl };
}

async function resolveLocation(
  locationStr: string,
  accessToken: string
): Promise<Record<string, unknown>> {
  const parts = locationStr.split(",").map((s) => s.trim());
  const cityName = parts[0];

  const url = `https://graph.facebook.com/${API_VERSION}/search?type=adgeolocation&q=${encodeURIComponent(
    cityName
  )}&location_types=${encodeURIComponent('["city"]')}&access_token=${accessToken}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.data || data.data.length === 0) {
    const countryUrl = `https://graph.facebook.com/${API_VERSION}/search?type=adgeolocation&q=${encodeURIComponent(
      locationStr
    )}&location_types=${encodeURIComponent(
      '["country"]'
    )}&access_token=${accessToken}`;
    const countryRes = await fetch(countryUrl);
    const countryData = await countryRes.json();

    if (countryData.data && countryData.data.length > 0) {
      return {
        countries: [countryData.data[0].country_code],
        location_types: ["home", "recent"],
      };
    }

    return {
      country_groups: ["worldwide"],
      location_types: ["home", "recent"],
    };
  }

  let bestMatch = data.data[0];
  if (parts.length >= 2) {
    const countryHint = parts[parts.length - 1].toLowerCase();
    const match = data.data.find(
      (r: { country_name?: string; country_code?: string }) =>
        r.country_name?.toLowerCase().includes(countryHint) ||
        r.country_code?.toLowerCase() === countryHint
    );
    if (match) bestMatch = match;
  }

  return {
    cities: [
      { key: bestMatch.key, radius: 25, distance_unit: "kilometer" },
    ],
    location_types: ["home", "recent"],
  };
}

async function resolveInterests(
  keywords: string[],
  accessToken: string
): Promise<Array<{ id: string; name: string }>> {
  const results: Array<{ id: string; name: string }> = [];

  for (const keyword of keywords) {
    try {
      const url = `https://graph.facebook.com/${API_VERSION}/search?type=adinterest&q=${encodeURIComponent(
        keyword
      )}&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        results.push({ id: data.data[0].id, name: data.data[0].name });
      }
    } catch {
      continue;
    }
  }

  return results;
}

export interface ABTestVariantParams {
  variantLabel: string;
  primaryText: string;
  headline: string;
  callToAction: string;
  imageBase64?: string;
}

export interface CreateABTestParams {
  campaignName: string;
  adSetName: string;
  variants: ABTestVariantParams[];
  interests: string[];
  location: string;
  ageMin: number;
  ageMax: number;
  dailyBudget: number;
  landingPageUrl: string;
  sharedImageBase64: string; // fallback image for variants without their own
  status: "PAUSED" | "ACTIVE";
}

export async function createABTestCampaign(params: CreateABTestParams) {
  const { account, accountId, pageId, accessToken } = initMeta();

  // Step 1: Upload shared image
  let sharedImageHash: string;
  try {
    const imageResult = await account.createAdImage([], {
      bytes: params.sharedImageBase64,
    });
    const imageHashKey = Object.keys(imageResult._data.images)[0];
    sharedImageHash = imageResult._data.images[imageHashKey].hash;
  } catch (err: unknown) {
    throw new Error(`Image upload failed: ${getMetaError(err)}`);
  }

  // Upload per-variant images if provided
  const variantImageHashes: (string | null)[] = [];
  for (const v of params.variants) {
    if (v.imageBase64) {
      try {
        const result = await account.createAdImage([], { bytes: v.imageBase64 });
        const key = Object.keys(result._data.images)[0];
        variantImageHashes.push(result._data.images[key].hash);
      } catch {
        variantImageHashes.push(null);
      }
    } else {
      variantImageHashes.push(null);
    }
  }

  // Step 2: Create campaign
  let campaignId: string;
  try {
    const campaign = await account.createCampaign([], {
      [Campaign.Fields.name]: params.campaignName,
      [Campaign.Fields.objective]: "OUTCOME_LEADS",
      [Campaign.Fields.status]: params.status,
      [Campaign.Fields.special_ad_categories]: [],
      buying_type: "AUCTION",
    });
    campaignId = campaign._data.id;
  } catch (err: unknown) {
    throw new Error(`Campaign creation failed: ${getMetaError(err)}`);
  }

  // Step 3: Resolve location + interests
  let geoLocations: Record<string, unknown>;
  try {
    geoLocations = await resolveLocation(params.location, accessToken);
  } catch {
    geoLocations = { country_groups: ["worldwide"], location_types: ["home", "recent"] };
  }

  const interestTargeting = await resolveInterests(params.interests, accessToken);

  const targeting: Record<string, unknown> = {
    age_min: params.ageMin,
    age_max: params.ageMax,
    genders: [0],
    geo_locations: geoLocations,
    targeting_automation: { advantage_audience: 0 },
  };
  if (interestTargeting.length > 0) {
    targeting.flexible_spec = [{ interests: interestTargeting }];
  }

  // Step 4: Create single ad set
  let adSetId: string;
  try {
    const adSet = await account.createAdSet([], {
      [AdSet.Fields.name]: params.adSetName,
      [AdSet.Fields.campaign_id]: campaignId,
      [AdSet.Fields.daily_budget]: params.dailyBudget * 100,
      [AdSet.Fields.billing_event]: "IMPRESSIONS",
      [AdSet.Fields.optimization_goal]: "LEAD_GENERATION",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      [AdSet.Fields.status]: params.status,
      [AdSet.Fields.targeting]: targeting,
      [AdSet.Fields.promoted_object]: { page_id: pageId },
      [AdSet.Fields.start_time]: new Date().toISOString(),
    });
    adSetId = adSet._data.id;
  } catch (err: unknown) {
    throw new Error(`Ad set creation failed: ${getMetaError(err)}`);
  }

  // Step 5: Create N ads (one per variant)
  const variantResults: Array<{ variantLabel: string; adId: string; creativeId: string }> = [];

  for (let i = 0; i < params.variants.length; i++) {
    const v = params.variants[i];
    const imageHash = variantImageHashes[i] || sharedImageHash;

    let creativeId: string;
    try {
      const creative = await account.createAdCreative([], {
        name: `${params.campaignName} - ${v.variantLabel} Creative`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            image_hash: imageHash,
            message: v.primaryText,
            name: v.headline,
            link: params.landingPageUrl || `https://www.facebook.com/${pageId}`,
            call_to_action: { type: v.callToAction },
          },
        },
      });
      creativeId = creative._data.id;
    } catch (err: unknown) {
      throw new Error(`Creative creation for ${v.variantLabel} failed: ${getMetaError(err)}`);
    }

    try {
      const ad = await account.createAd([], {
        name: `${params.campaignName} - ${v.variantLabel}`,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: params.status,
      });
      variantResults.push({ variantLabel: v.variantLabel, adId: ad._data.id, creativeId });
    } catch (err: unknown) {
      throw new Error(`Ad creation for ${v.variantLabel} failed: ${getMetaError(err)}`);
    }
  }

  const adsManagerUrl = `https://www.facebook.com/adsmanager/manage/campaigns?act=${accountId}&campaign_ids=${campaignId}`;
  return { campaignId, adSetId, variantResults, adsManagerUrl };
}

function getMetaError(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response: unknown }).response === "object"
  ) {
    const response = (
      err as {
        response: { error_user_msg?: string; message?: string };
      }
    ).response;
    return (
      response.error_user_msg || response.message || "Unknown Meta API error"
    );
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

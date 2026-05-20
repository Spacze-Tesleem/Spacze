import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/send-google-ads
 * Creates a Google Ads responsive search ad via the Google Ads API (REST).
 *
 * Required env vars:
 *   GOOGLE_ADS_DEVELOPER_TOKEN   — developer token from Google Ads API Center
 *   GOOGLE_ADS_CLIENT_ID         — OAuth2 client ID
 *   GOOGLE_ADS_CLIENT_SECRET     — OAuth2 client secret
 *   GOOGLE_ADS_REFRESH_TOKEN     — offline refresh token
 *   GOOGLE_ADS_CUSTOMER_ID       — 10-digit customer ID (no dashes)
 *
 * Body:
 *   headlines     — string[] (3 items, max 30 chars each)
 *   descriptions  — string[] (2 items, max 90 chars each)
 *   finalUrl      — destination URL
 *   campaignName  — human-readable name (used to find/create campaign)
 */

const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v16';

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`OAuth token error: ${data.error_description || JSON.stringify(data)}`);
  return data.access_token;
}

export async function POST(req: NextRequest) {
  const devToken  = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!devToken || !customerId || !process.env.GOOGLE_ADS_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google Ads not configured. Set GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      headlines    = [],
      descriptions = [],
      finalUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://spacze.com',
      campaignName = 'Spacze Campaign',
    } = body;

    if (headlines.length < 3)    throw new Error('Provide at least 3 headlines');
    if (descriptions.length < 2) throw new Error('Provide at least 2 descriptions');

    const accessToken = await getAccessToken();

    const headers = {
      'Content-Type':              'application/json',
      'Authorization':             `Bearer ${accessToken}`,
      'developer-token':           devToken,
      'login-customer-id':         customerId,
    };

    // 1. Create campaign (PAUSED — user activates in Google Ads UI)
    const campaignRes = await fetch(
      `${GOOGLE_ADS_API}/customers/${customerId}/campaigns:mutate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: [{
            create: {
              name:                  campaignName,
              advertisingChannelType:'SEARCH',
              status:                'PAUSED',
              manualCpc:             {},
              campaignBudget:        `customers/${customerId}/campaignBudgets/~`,
              networkSettings: {
                targetGoogleSearch:         true,
                targetSearchNetwork:        true,
                targetContentNetwork:       false,
              },
            },
          }],
        }),
      }
    );
    const campaignData = await campaignRes.json();
    if (campaignData.error) throw new Error(`Campaign: ${JSON.stringify(campaignData.error)}`);
    const campaignResourceName = campaignData.results?.[0]?.resourceName;

    // 2. Create ad group
    const adGroupRes = await fetch(
      `${GOOGLE_ADS_API}/customers/${customerId}/adGroups:mutate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: [{
            create: {
              name:     `${campaignName} — Ad Group`,
              campaign: campaignResourceName,
              status:   'ENABLED',
              type:     'SEARCH_STANDARD',
              cpcBidMicros: '1000000', // $1.00 default bid
            },
          }],
        }),
      }
    );
    const adGroupData = await adGroupRes.json();
    if (adGroupData.error) throw new Error(`Ad Group: ${JSON.stringify(adGroupData.error)}`);
    const adGroupResourceName = adGroupData.results?.[0]?.resourceName;

    // 3. Create responsive search ad
    const adRes = await fetch(
      `${GOOGLE_ADS_API}/customers/${customerId}/adGroupAds:mutate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: [{
            create: {
              adGroup: adGroupResourceName,
              status:  'PAUSED',
              ad: {
                finalUrls: [finalUrl],
                responsiveSearchAd: {
                  headlines:    headlines.slice(0, 15).map((text: string) => ({ text })),
                  descriptions: descriptions.slice(0, 4).map((text: string) => ({ text })),
                },
              },
            },
          }],
        }),
      }
    );
    const adData = await adRes.json();
    if (adData.error) throw new Error(`Ad: ${JSON.stringify(adData.error)}`);

    return NextResponse.json({
      success:              true,
      campaignResourceName,
      adGroupResourceName,
      adResourceName:       adData.results?.[0]?.resourceName,
      note:                 'Ad created in PAUSED state. Activate in Google Ads UI.',
    });
  } catch (err: any) {
    console.error('send-google-ads error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create Google Ad' }, { status: 500 });
  }
}

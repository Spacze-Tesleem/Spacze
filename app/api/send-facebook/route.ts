import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/send-facebook
 * Creates a Facebook Ads campaign + ad set + ad via the Marketing API.
 *
 * Required env vars:
 *   FB_ACCESS_TOKEN        — long-lived page/system-user access token
 *   FB_AD_ACCOUNT_ID       — ad account ID (act_XXXXXXXXXX)
 *   FB_PAGE_ID             — Facebook Page ID to run ads from
 *
 * Body:
 *   primaryText   — ad primary text
 *   headline      — ad headline
 *   description   — ad description
 *   cta           — CTA button type (e.g. LEARN_MORE, SIGN_UP)
 *   targetUrl     — destination URL for the ad
 *   campaignName  — human-readable campaign name
 *   dailyBudget   — daily budget in cents (default: 500 = $5.00)
 */

const FB_API = 'https://graph.facebook.com/v19.0';

function ctaType(label: string): string {
  const map: Record<string, string> = {
    'Learn More':   'LEARN_MORE',
    'Sign Up':      'SIGN_UP',
    'Get Quote':    'GET_QUOTE',
    'Contact Us':   'CONTACT_US',
    'Book Now':     'BOOK_TRAVEL',
  };
  return map[label] || 'LEARN_MORE';
}

export async function POST(req: NextRequest) {
  const token     = process.env.FB_ACCESS_TOKEN;
  const accountId = process.env.FB_AD_ACCOUNT_ID;
  const pageId    = process.env.FB_PAGE_ID;

  if (!token || !accountId || !pageId) {
    return NextResponse.json(
      { error: 'Facebook Ads not configured. Set FB_ACCESS_TOKEN, FB_AD_ACCOUNT_ID, FB_PAGE_ID.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      primaryText  = '',
      headline     = '',
      description  = '',
      cta          = 'Learn More',
      targetUrl    = process.env.NEXT_PUBLIC_APP_URL || 'https://spacze.com',
      campaignName = 'Spacze Campaign',
      dailyBudget  = 500,
    } = body;

    // 1. Create campaign
    const campaignRes = await fetch(`${FB_API}/${accountId}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:       campaignName,
        objective:  'OUTCOME_LEADS',
        status:     'PAUSED', // Start paused — user activates manually in Ads Manager
        access_token: token,
      }),
    });
    const campaign = await campaignRes.json();
    if (campaign.error) throw new Error(`Campaign: ${campaign.error.message}`);

    // 2. Create ad set
    const adSetRes = await fetch(`${FB_API}/${accountId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:             `${campaignName} — Ad Set`,
        campaign_id:      campaign.id,
        billing_event:    'IMPRESSIONS',
        optimization_goal:'LEAD_GENERATION',
        daily_budget:     dailyBudget,
        targeting: {
          geo_locations: { countries: ['NG', 'GB', 'US'] },
          age_min: 22,
          age_max: 55,
        },
        status:       'PAUSED',
        access_token: token,
      }),
    });
    const adSet = await adSetRes.json();
    if (adSet.error) throw new Error(`Ad Set: ${adSet.error.message}`);

    // 3. Create ad creative
    const creativeRes = await fetch(`${FB_API}/${accountId}/adcreatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${campaignName} — Creative`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            message:     primaryText,
            link:        targetUrl,
            name:        headline,
            description: description,
            call_to_action: { type: ctaType(cta), value: { link: targetUrl } },
          },
        },
        access_token: token,
      }),
    });
    const creative = await creativeRes.json();
    if (creative.error) throw new Error(`Creative: ${creative.error.message}`);

    // 4. Create ad
    const adRes = await fetch(`${FB_API}/${accountId}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        `${campaignName} — Ad`,
        adset_id:    adSet.id,
        creative:    { creative_id: creative.id },
        status:      'PAUSED',
        access_token: token,
      }),
    });
    const ad = await adRes.json();
    if (ad.error) throw new Error(`Ad: ${ad.error.message}`);

    return NextResponse.json({
      success:    true,
      campaignId: campaign.id,
      adSetId:    adSet.id,
      adId:       ad.id,
      note:       'Ad created in PAUSED state. Activate in Facebook Ads Manager.',
    });
  } catch (err: any) {
    console.error('send-facebook error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create Facebook ad' }, { status: 500 });
  }
}

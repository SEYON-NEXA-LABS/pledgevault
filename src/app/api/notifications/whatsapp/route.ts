import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cleanPhoneNumber, getWhatsAppWebUrl, getWhatsAppDesktopUrl } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    const supabase = await createClient();
    body = await req.json();
    const { firmId, phone, message, templateName, templateParams } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'Phone and message are required' }, { status: 400 });
    }

    const clean = cleanPhoneNumber(phone);

    // Fetch shop's configured WhatsApp settings
    let settings: any = null;
    if (firmId) {
      const { data } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('firm_id', firmId)
        .single();
      settings = data;
    }

    const provider = settings?.whatsapp_provider || 'manual';

    // 1. Meta WhatsApp Cloud API (1,000 Free Messages/Month)
    if (provider === 'cloud_api' && settings?.whatsapp_cloud_phone_number_id && settings?.whatsapp_cloud_access_token) {
      const url = `https://graph.facebook.com/v21.0/${settings.whatsapp_cloud_phone_number_id}/messages`;
      
      let payload: any = {
        messaging_product: 'whatsapp',
        to: clean,
        type: 'text',
        text: { body: message }
      };

      // If a pre-approved utility template is specified
      if (templateName) {
        payload = {
          messaging_product: 'whatsapp',
          to: clean,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: templateParams ? [
              {
                type: 'body',
                parameters: templateParams.map((val: string) => ({ type: 'text', text: val }))
              }
            ] : []
          }
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.whatsapp_cloud_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok && resData.messages) {
        return NextResponse.json({ success: true, provider: 'cloud_api', messageId: resData.messages[0]?.id });
      } else {
        console.warn('Meta Cloud API failed, falling back:', resData);
      }
    }

    // 2. OpenWA Self-Hosted Docker Gateway (Local Shop PC / VPS)
    if (provider === 'openwa' && settings?.whatsapp_openwa_url) {
      const openwaUrl = `${settings.whatsapp_openwa_url.replace(/\/$/, '')}/api/sessions/${settings.whatsapp_openwa_session_id || 'main'}/messages/send-text`;
      
      const response = await fetch(openwaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.whatsapp_openwa_api_key ? { 'X-API-Key': settings.whatsapp_openwa_api_key } : {})
        },
        body: JSON.stringify({
          chatId: `${clean}@c.us`,
          text: message
        })
      });

      const resData = await response.json();
      if (response.ok) {
        return NextResponse.json({ success: true, provider: 'openwa', data: resData });
      } else {
        console.warn('OpenWA Docker call failed, falling back:', resData);
      }
    }

    // 3. Fallback: Return direct Desktop & Web URLs for client-side launch
    const preferDesktop = settings?.whatsapp_prefer_desktop_app ?? true;
    return NextResponse.json({
      success: true,
      provider: 'manual',
      url: preferDesktop ? getWhatsAppDesktopUrl(phone, message) : getWhatsAppWebUrl(phone, message),
      desktopUrl: getWhatsAppDesktopUrl(phone, message),
      webUrl: getWhatsAppWebUrl(phone, message)
    });

  } catch (err: any) {
    console.error('WhatsApp API Router error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      webUrl: getWhatsAppWebUrl(body.phone || '', body.message || '') 
    }, { status: 500 });
  }
}

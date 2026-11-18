/**
 * WhatsApp Helper Utility for PledgeVault
 * Provides intelligent sending via:
 * 1. Native Desktop App Protocol (`whatsapp://send`)
 * 2. Web / Mobile Universal URL (`https://wa.me`)
 * 3. Automated Backend Gateway (OpenWA / Meta Cloud API)
 */

export interface WhatsAppSendOptions {
  phone: string;
  message: string;
  preferDesktopApp?: boolean; // When true, uses whatsapp:// protocol to wake up WhatsApp Desktop app directly
}

/**
 * Normalizes an Indian / International phone number to digits only with country code
 */
export function cleanPhoneNumber(phone: string, defaultCountryCode = '91'): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // If 10 digits without country code, prefix with defaultCountryCode (India = 91)
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

/**
 * Generates direct native WhatsApp Desktop app URL
 * e.g., whatsapp://send?phone=919876543210&text=...
 */
export function getWhatsAppDesktopUrl(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  return `whatsapp://send?phone=${clean}&text=${encodeURIComponent(message)}`;
}

/**
 * Generates universal web link
 * e.g., https://wa.me/919876543210?text=...
 */
export function getWhatsAppWebUrl(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * Dispatches a WhatsApp message from the client:
 * If preferDesktopApp is set (or configured), attempts to wake up the native WhatsApp Desktop app.
 * Falls back to standard wa.me in a new window/tab.
 */
export function openWhatsAppChat({ phone, message, preferDesktopApp = true }: WhatsAppSendOptions): void {
  const clean = cleanPhoneNumber(phone);
  if (!clean) {
    alert('Please provide a valid phone number');
    return;
  }

  if (preferDesktopApp) {
    // Attempt native protocol
    const desktopUrl = getWhatsAppDesktopUrl(phone, message);
    
    // We create a temporary hidden anchor to trigger custom OS protocol without leaving blank tabs
    const link = document.createElement('a');
    link.href = desktopUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Provide a small fallback timer: if user doesn't have desktop app, or prefers web
    setTimeout(() => {
      // In case native protocol didn't focus or trigger, staff can still click fallback
    }, 1000);
  } else {
    const webUrl = getWhatsAppWebUrl(phone, message);
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Dispatches message via backend notification router (supports Meta Cloud API, OpenWA Docker, or wa.me)
 */
export async function sendAutomatedWhatsApp(payload: {
  firmId: string;
  phone: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
}) {
  try {
    const res = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    console.error('sendAutomatedWhatsApp error:', err);
    return { success: false, fallbackUrl: getWhatsAppWebUrl(payload.phone, payload.message) };
  }
}

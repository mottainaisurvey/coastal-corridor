import { Client } from 'postmark';

const postmarkClient = process.env.POSTMARK_API_TOKEN
  ? new Client(process.env.POSTMARK_API_TOKEN)
  : null;

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
  from = 'noreply@coastalcorridor.africa',
  replyTo = 'support@coastalcorridor.africa',
}: EmailOptions) {
  try {
    if (!postmarkClient) {
      console.warn(`⚠️ Postmark not configured. Email would be sent to ${to}`);
      return { MessageID: 'mock-' + Date.now() };
    }
    const result = await postmarkClient.sendEmail({
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody || htmlBody.replace(/<[^>]*>/g, ''),
      ReplyTo: replyTo,
      MessageStream: 'outbound',
    });

    console.log(`✅ Email sent to ${to}:`, result.MessageID);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

// Email templates
export function inquiryConfirmationEmail(
  buyerName: string,
  propertyTitle: string,
  agentName: string,
  agentEmail: string
): string {
  return `
    <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f1ea;">
      <div style="background: #0a0e12; color: #f5f1ea; padding: 30px; border-radius: 8px;">
        <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 300;">Inquiry Received</h1>
        <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${buyerName},</p>
        <p style="margin: 0 0 15px 0; font-size: 16px;">
          Thank you for your interest in <strong>${propertyTitle}</strong>. Your inquiry has been received and forwarded to the listing agent.
        </p>
        <p style="margin: 0 0 15px 0; font-size: 16px;">
          <strong>Agent:</strong> ${agentName}<br/>
          <strong>Email:</strong> ${agentEmail}
        </p>
        <p style="margin: 0 0 15px 0; font-size: 16px;">
          The agent will contact you within 24 hours to schedule a viewing or provide additional information.
        </p>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #f5f1ea/75;">
          Best regards,<br/>
          Coastal Corridor Team
        </p>
      </div>
    </div>
  `;
}

export function agentInquiryNotificationEmail(
  agentName: string,
  buyerName: string,
  buyerEmail: string,
  buyerPhone: string,
  propertyTitle: string,
  message: string
): string {
  return `
    <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f1ea;">
      <div style="background: #0a0e12; color: #f5f1ea; padding: 30px; border-radius: 8px;">
        <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 300;">New Inquiry</h1>
        <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${agentName},</p>
        <p style="margin: 0 0 15px 0; font-size: 16px;">
          You have received a new inquiry for <strong>${propertyTitle}</strong>.
        </p>
        <div style="background: #11161c; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Buyer Name:</strong> ${buyerName}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Email:</strong> ${buyerEmail}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Phone:</strong> ${buyerPhone}</p>
          <p style="margin: 0 0 0 0; font-size: 14px;"><strong>Message:</strong> ${message}</p>
        </div>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #f5f1ea/75;">
          Please respond to the buyer within 24 hours.
        </p>
      </div>
    </div>
  `;
}

// ── CC-D-01-E: Experience booking confirmation emails ─────────────────────────

export interface ExperienceBookingEmailData {
  bookingId: string;
  bookingRef: string;           // CC-EXP-{first8}
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  experienceName: string;
  startDateTime: string;        // ISO string
  endDateTime: string;          // ISO string
  numberOfParticipants: number;
  totalAmount: string;          // Decimal as string
  currency: string;
  channelCommissionAmount: string;
  channelCommissionPercent: string;
  netToOperator: string;
  meetingPointDescription: string;
  meetingPointLatitude: string;
  meetingPointLongitude: string;
  specialRequirements: string | null;
  pickupRequested: boolean;
  pickupAddress: string | null;
  operatorDisplayName: string;
  operatorEmail: string;
  confirmationPageUrl: string;  // /booking-complete/[bookingId]
  operatorBookingsUrl: string;  // /operator/bookings
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function fmtCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
  const sym = symbols[currency] ?? currency + ' ';
  return `${sym}${num.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
}

function mapsLink(lat: string, lng: string, label: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`;
}

/**
 * CC-D-01-E AC-2: Guest booking confirmation email.
 * Sent to the guest after status transitions to CONFIRMED.
 */
export function guestBookingConfirmationEmail(data: ExperienceBookingEmailData): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const subject = `Your booking is confirmed — ${data.experienceName}`;
  const guestFirstName = data.guestName.split(' ')[0];
  const dateStr = fmtDate(data.startDateTime);
  const timeStr = `${fmtTime(data.startDateTime)} – ${fmtTime(data.endDateTime)}`;
  const totalStr = fmtCurrency(data.totalAmount, data.currency);
  const mapsUrl = mapsLink(data.meetingPointLatitude, data.meetingPointLongitude, data.meetingPointDescription);

  const htmlBody = `
    <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f1ea;">
      <div style="background: #0a0e12; color: #f5f1ea; padding: 30px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 300;">Booking Confirmed!</h1>
        <p style="margin: 0; font-size: 13px; color: rgba(245,241,234,0.6);">Ref: ${data.bookingRef}</p>
      </div>
      <div style="background: white; border-radius: 0 0 8px 8px; overflow: hidden;">
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0 0 4px 0; font-size: 16px; color: #0a0e12;">Hi ${guestFirstName},</p>
          <p style="margin: 0; font-size: 14px; color: #555;">Your booking for <strong>${data.experienceName}</strong> is confirmed.</p>
        </div>
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999; width: 40%;">Date</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${dateStr}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999;">Time</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${timeStr}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999;">Participants</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${data.numberOfParticipants}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999;">Total Paid</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12; font-weight: 500;">${totalStr}</td></tr>
          </table>
        </div>
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #999;">Meeting Point</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #0a0e12;">${data.meetingPointDescription}</p>
          <a href="${mapsUrl}" style="font-size: 12px; color: #2563eb;">View on Google Maps →</a>
        </div>
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #999;">Your Operator</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #0a0e12; font-weight: 500;">${data.operatorDisplayName}</p>
          <a href="mailto:${data.operatorEmail}" style="font-size: 12px; color: #2563eb;">${data.operatorEmail}</a>
        </div>
        <div style="padding: 24px; background: #f5f1ea; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #0a0e12;">What happens next</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #555;">${data.operatorDisplayName} has been notified and will contact you with final details.</p>
          <a href="${data.confirmationPageUrl}" style="display: inline-block; padding: 10px 20px; background: #0a0e12; color: #f5f1ea; text-decoration: none; border-radius: 6px; font-size: 13px;">View your booking →</a>
          <p style="margin: 16px 0 0 0; font-size: 11px; color: #999;">Coastal Corridor · support@coastalcorridor.africa · Ref: ${data.bookingRef}</p>
        </div>
      </div>
    </div>
  `;

  const textBody = [
    `Booking Confirmed! — ${data.bookingRef}`,
    '',
    `Hi ${guestFirstName},`,
    `Your booking for ${data.experienceName} is confirmed.`,
    '',
    `Date: ${dateStr}`,
    `Time: ${timeStr}`,
    `Participants: ${data.numberOfParticipants}`,
    `Total Paid: ${totalStr}`,
    '',
    `Meeting Point: ${data.meetingPointDescription}`,
    `Google Maps: ${mapsUrl}`,
    '',
    `Operator: ${data.operatorDisplayName} (${data.operatorEmail})`,
    '',
    `What happens next: ${data.operatorDisplayName} will contact you with final details.`,
    '',
    `View your booking: ${data.confirmationPageUrl}`,
    '',
    `Coastal Corridor · support@coastalcorridor.africa`,
  ].join('\n');

  return { subject, htmlBody, textBody };
}

/**
 * CC-D-01-E AC-3: Operator booking notification email.
 * Sent to the operator after a new booking is confirmed.
 */
export function operatorBookingNotificationEmail(data: ExperienceBookingEmailData): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const subject = `New booking — ${data.experienceName} on ${fmtDate(data.startDateTime)}`;
  const dateStr = fmtDate(data.startDateTime);
  const timeStr = `${fmtTime(data.startDateTime)} – ${fmtTime(data.endDateTime)}`;
  const totalStr = fmtCurrency(data.totalAmount, data.currency);
  const netStr = fmtCurrency(data.netToOperator, data.currency);
  const commStr = fmtCurrency(data.channelCommissionAmount, data.currency);
  const commPct = parseFloat(data.channelCommissionPercent).toFixed(1);

  const htmlBody = `
    <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f1ea;">
      <div style="background: #0a0e12; color: #f5f1ea; padding: 30px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 300;">New Booking</h1>
        <p style="margin: 0; font-size: 13px; color: rgba(245,241,234,0.6);">Ref: ${data.bookingRef}</p>
      </div>
      <div style="background: white; border-radius: 0 0 8px 8px; overflow: hidden;">
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0 0 4px 0; font-size: 16px; color: #0a0e12;">Hi ${data.operatorDisplayName},</p>
          <p style="margin: 0; font-size: 14px; color: #555;">You have a new confirmed booking for <strong>${data.experienceName}</strong>.</p>
        </div>
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999; width: 40%;">Date</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${dateStr}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999;">Time</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${timeStr}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999;">Participants</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${data.numberOfParticipants}</td></tr>
          </table>
        </div>
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">Guest Contact</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999; width: 40%;">Name</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${data.guestName}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999;">Email</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${data.guestEmail}</td></tr>
            ${data.guestPhone ? `<tr><td style="padding: 6px 0; font-size: 12px; color: #999;">Phone</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12;">${data.guestPhone}</td></tr>` : ''}
          </table>
        </div>
        <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">Commission Breakdown</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999; width: 60%;">Total paid by guest</td><td style="padding: 6px 0; font-size: 14px; color: #0a0e12; text-align: right;">${totalStr}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; color: #999;">CC commission (${commPct}%)</td><td style="padding: 6px 0; font-size: 14px; color: #999; text-align: right;">− ${commStr}</td></tr>
            <tr style="border-top: 1px solid #f0f0f0;"><td style="padding: 10px 0 6px 0; font-size: 13px; font-weight: 500; color: #0a0e12;">Net to you</td><td style="padding: 10px 0 6px 0; font-size: 16px; font-weight: 600; color: #0a0e12; text-align: right;">${netStr}</td></tr>
          </table>
        </div>
        <div style="padding: 24px; background: #fff8ed; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #0a0e12;">Action required</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #555;">Please contact ${data.guestName} at ${data.guestEmail} to confirm final details.</p>
          <a href="${data.operatorBookingsUrl}" style="display: inline-block; padding: 10px 20px; background: #0a0e12; color: #f5f1ea; text-decoration: none; border-radius: 6px; font-size: 13px;">View all bookings →</a>
          <p style="margin: 16px 0 0 0; font-size: 11px; color: #999;">Coastal Corridor · support@coastalcorridor.africa · Ref: ${data.bookingRef}</p>
        </div>
      </div>
    </div>
  `;

  const textBody = [
    `New Booking — ${data.bookingRef}`,
    '',
    `Hi ${data.operatorDisplayName},`,
    `New confirmed booking for ${data.experienceName}.`,
    '',
    `Date: ${dateStr}`,
    `Time: ${timeStr}`,
    `Participants: ${data.numberOfParticipants}`,
    '',
    `Guest: ${data.guestName} · ${data.guestEmail}${data.guestPhone ? ` · ${data.guestPhone}` : ''}`,
    data.specialRequirements ? `Special requirements: ${data.specialRequirements}` : '',
    '',
    `Total paid: ${totalStr}`,
    `CC commission (${commPct}%): ${commStr}`,
    `Net to you: ${netStr}`,
    '',
    `Action required: Contact ${data.guestName} to confirm final details.`,
    '',
    `View bookings: ${data.operatorBookingsUrl}`,
    '',
    `Coastal Corridor · support@coastalcorridor.africa`,
  ].filter(Boolean).join('\n');

  return { subject, htmlBody, textBody };
}

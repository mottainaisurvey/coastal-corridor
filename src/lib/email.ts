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
  from = 'noreply@coastalcorridor.ng',
  replyTo = 'support@coastalcorridor.ng',
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

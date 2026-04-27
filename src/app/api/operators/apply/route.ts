import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      path,
      fullName,
      businessName,
      email,
      phone,
      corridorLocation,
      countryOfResidence,
      // Host-specific
      propertyType,
      numberOfRooms,
      currentlyListedOn,
      // Operator-specific
      operationType,
      yearsOperating,
      annualCustomers,
      // Shared
      aboutOperation,
      whyCoastalCorridor,
      additionalInfo,
    } = body

    // Validate required fields
    if (!path || !fullName || !email || !phone || !corridorLocation || !countryOfResidence || !aboutOperation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate path
    if (!['host', 'operator', 'both'].includes(path)) {
      return NextResponse.json(
        { error: 'Invalid application path' },
        { status: 400 }
      )
    }

    // Save to database
    let application
    try {
      application = await prisma.operatorApplication.create({
        data: {
          path,
          fullName,
          businessName: businessName || null,
          email,
          phone,
          corridorLocation,
          countryOfResidence,
          propertyType: propertyType || null,
          numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : null,
          currentlyListedOn: currentlyListedOn || null,
          operationType: operationType || null,
          yearsOperating: yearsOperating ? parseInt(yearsOperating) : null,
          annualCustomers: annualCustomers || null,
          aboutOperation,
          whyCoastalCorridor: whyCoastalCorridor || null,
          additionalInfo: additionalInfo || null,
          status: 'PENDING',
        },
      })
    } catch (dbError) {
      console.error('DB error saving operator application:', dbError)
      // Continue even if DB fails — still send emails
    }

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: email,
        subject: 'Application received — Coastal Corridor Operator & Host Programme',
        from: 'hello@coastalcorridor.africa',
        replyTo: 'partnerships@coastalcorridor.africa',
        htmlBody: applicantConfirmationEmail(fullName, path),
      })
    } catch (emailError) {
      console.error('Failed to send applicant confirmation email:', emailError)
    }

    // Send internal notification to team
    try {
      await sendEmail({
        to: 'partnerships@coastalcorridor.africa',
        subject: `New ${path} application — ${fullName}${businessName ? ` (${businessName})` : ''}`,
        from: 'noreply@coastalcorridor.africa',
        replyTo: email,
        htmlBody: internalNotificationEmail({
          path,
          fullName,
          businessName,
          email,
          phone,
          corridorLocation,
          countryOfResidence,
          propertyType,
          numberOfRooms,
          currentlyListedOn,
          operationType,
          yearsOperating,
          annualCustomers,
          aboutOperation,
          whyCoastalCorridor,
          additionalInfo,
          applicationId: application?.id,
        }),
      })
    } catch (emailError) {
      console.error('Failed to send internal notification email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application?.id,
    })
  } catch (error: any) {
    console.error('Error processing operator application:', error)
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again.' },
      { status: 500 }
    )
  }
}

function applicantConfirmationEmail(name: string, path: string): string {
  const pathLabel = path === 'host' ? 'Host' : path === 'operator' ? 'Operator' : 'Operator & Host'
  return `
    <div style="font-family: 'Inter Tight', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f3;">
      <div style="background: #0a0e12; padding: 40px 40px 32px; border-top: 3px solid #c96a3f;">
        <p style="font-family: 'Georgia', serif; font-size: 22px; color: #faf8f3; margin: 0 0 4px 0; font-weight: 300;">Coastal Corridor</p>
        <p style="font-family: monospace; font-size: 10px; letter-spacing: 0.15em; color: #6b7079; text-transform: uppercase; margin: 0;">Lagos → Calabar</p>
      </div>
      <div style="padding: 40px;">
        <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; color: #d4a24c; text-transform: uppercase; margin: 0 0 24px 0;">${pathLabel} Programme · Application Received</p>
        <h1 style="font-family: 'Georgia', serif; font-size: 32px; font-weight: 300; color: #0a0e12; line-height: 1.1; margin: 0 0 24px 0;">
          We've received your application, ${name.split(' ')[0]}.
        </h1>
        <p style="font-size: 16px; line-height: 1.7; color: #3a3f46; margin: 0 0 16px 0;">
          Thank you for applying to the Coastal Corridor ${pathLabel} Programme. We review every application personally and respond within <strong>ten business days</strong>.
        </p>
        <p style="font-size: 16px; line-height: 1.7; color: #3a3f46; margin: 0 0 32px 0;">
          If your application matches our early-access criteria, we'll schedule a 30-minute call to discuss mutual fit. Either way, you'll hear from us.
        </p>
        <div style="background: #f5f1ea; border-left: 3px solid #c96a3f; padding: 20px 24px; margin: 0 0 32px 0;">
          <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.12em; color: #6b7079; text-transform: uppercase; margin: 0 0 8px 0;">What happens next</p>
          <p style="font-size: 15px; line-height: 1.6; color: #0a0e12; margin: 0;">
            1. Application review — 2 to 3 weeks<br>
            2. Introductory call (if shortlisted) — 30 minutes<br>
            3. Verification and listing creation — 4 to 6 weeks<br>
            4. Platform launch with the cohort — Q3 2026
          </p>
        </div>
        <p style="font-size: 15px; line-height: 1.6; color: #6b7079; margin: 0 0 8px 0;">
          Questions? Reply to this email or write to us at <a href="mailto:partnerships@coastalcorridor.africa" style="color: #c96a3f;">partnerships@coastalcorridor.africa</a>.
        </p>
        <p style="font-size: 15px; color: #6b7079; margin: 0;">
          — The Coastal Corridor Team
        </p>
      </div>
      <div style="background: #0a0e12; padding: 24px 40px; border-top: 1px solid #1a1f26;">
        <p style="font-family: monospace; font-size: 10px; letter-spacing: 0.1em; color: #4a4f56; text-transform: uppercase; margin: 0;">
          Coastal Corridor · Lagos–Calabar · coastalcorridor.africa
        </p>
      </div>
    </div>
  `
}

function internalNotificationEmail(data: Record<string, any>): string {
  const rows = [
    ['Application type', data.path],
    ['Full name', data.fullName],
    ['Business name', data.businessName || '—'],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Corridor location', data.corridorLocation],
    ['Country of residence', data.countryOfResidence],
    data.path !== 'operator' && ['Property type', data.propertyType || '—'],
    data.path !== 'operator' && ['Number of rooms', data.numberOfRooms || '—'],
    data.path !== 'operator' && ['Currently listed on', data.currentlyListedOn || '—'],
    data.path !== 'host' && ['Operation type', data.operationType || '—'],
    data.path !== 'host' && ['Years operating', data.yearsOperating || '—'],
    data.path !== 'host' && ['Annual customers', data.annualCustomers || '—'],
    ['About operation', data.aboutOperation],
    ['Why Coastal Corridor', data.whyCoastalCorridor || '—'],
    ['Additional info', data.additionalInfo || '—'],
    data.applicationId && ['Application ID', data.applicationId],
  ].filter(Boolean) as [string, string][]

  const tableRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding: 10px 16px; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; color: #6b7079; text-transform: uppercase; white-space: nowrap; border-bottom: 1px solid #1a1f26; vertical-align: top;">${label}</td>
      <td style="padding: 10px 16px; font-size: 14px; color: #faf8f3; border-bottom: 1px solid #1a1f26; line-height: 1.5;">${value}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: 'Inter Tight', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #0a0e12; color: #faf8f3;">
      <div style="padding: 32px 40px; border-bottom: 1px solid #1a1f26; border-top: 3px solid #c96a3f;">
        <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; color: #d4a24c; text-transform: uppercase; margin: 0 0 8px 0;">New Application · ${data.path.toUpperCase()} Programme</p>
        <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 300; margin: 0;">${data.fullName}${data.businessName ? ` — ${data.businessName}` : ''}</h1>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${tableRows}
      </table>
      <div style="padding: 24px 40px; border-top: 1px solid #1a1f26;">
        <a href="https://coastalcorridor.africa/admin/applications" style="display: inline-block; background: #c96a3f; color: #faf8f3; padding: 12px 24px; font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none;">
          Review in Admin →
        </a>
      </div>
    </div>
  `
}

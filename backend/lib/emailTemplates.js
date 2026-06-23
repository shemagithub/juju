import { parseJson } from './helpers.js'
import {
  DEFAULT_SITE_SETTINGS,
  mergeSiteSettingsDefaults,
} from './defaultSiteSettings.js'

const BRAND = {
  primary: '#1a6b6b',
  primaryDark: '#0f4f4f',
  accent: '#c9a227',
  text: '#1a202c',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f4f7f7',
  white: '#ffffff',
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function titleCaseStatus(s) {
  return String(s || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function whatsappHref(number) {
  const digits = String(number || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

function mailtoHref(email) {
  const e = String(email || '').trim()
  return e ? `mailto:${e}` : ''
}

/** Load public contact details from site_settings (falls back to defaults). */
export async function loadEmailContactInfo(pool) {
  let settings = {}
  try {
    const [rows] = await pool.query(
      'SELECT payload FROM site_settings WHERE singleton = 1 LIMIT 1',
    )
    settings = parseJson(rows[0]?.payload, {})
  } catch {
    /* use defaults */
  }

  const merged = mergeSiteSettingsDefaults(settings)
  const brandName = merged.brandName || process.env.MAIL_FROM_NAME || 'RwandaQuest Tours'
  const supportEmail =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    merged.contactEmail ||
    'support@rwandaquesttours.com'

  return {
    brandName,
    supportEmail,
    contactEmail: merged.contactEmail || supportEmail,
    contactPhone: merged.contactPhone || '',
    emergencyPhone: merged.emergencyPhone || '',
    whatsapp: merged.whatsapp || '',
    address: merged.address || '',
    workingHours: merged.workingHours || '',
    publicSiteUrl: merged.publicSiteUrl || '',
    facebook: merged.facebook || '',
    instagram: merged.instagram || '',
    twitter: merged.twitter || '',
  }
}

function contactLines(contact) {
  const lines = []
  if (contact.contactEmail) lines.push({ label: 'Email', value: contact.contactEmail, href: mailtoHref(contact.contactEmail) })
  if (contact.supportEmail && contact.supportEmail !== contact.contactEmail) {
    lines.push({ label: 'Support', value: contact.supportEmail, href: mailtoHref(contact.supportEmail) })
  }
  if (contact.contactPhone) lines.push({ label: 'Phone', value: contact.contactPhone, href: telHref(contact.contactPhone) })
  if (contact.emergencyPhone) lines.push({ label: 'Emergency', value: contact.emergencyPhone, href: telHref(contact.emergencyPhone) })
  if (contact.whatsapp) {
    lines.push({
      label: 'WhatsApp',
      value: contact.contactPhone || contact.whatsapp,
      href: whatsappHref(contact.whatsapp),
    })
  }
  if (contact.address) lines.push({ label: 'Office', value: contact.address })
  if (contact.workingHours) lines.push({ label: 'Hours', value: contact.workingHours })
  if (contact.publicSiteUrl) lines.push({ label: 'Website', value: contact.publicSiteUrl, href: contact.publicSiteUrl })
  return lines
}

function socialLinks(contact) {
  const links = []
  if (contact.facebook) links.push({ label: 'Facebook', href: contact.facebook })
  if (contact.instagram) links.push({ label: 'Instagram', href: contact.instagram })
  if (contact.twitter) links.push({ label: 'Twitter', href: contact.twitter })
  return links
}

function renderContactBlock(contact, { heading = 'Contact us' } = {}) {
  const lines = contactLines(contact)
  const social = socialLinks(contact)
  if (!lines.length && !social.length) return ''

  const rows = lines
    .map((line) => {
      const value = escapeHtml(line.value)
      const inner = line.href
        ? `<a href="${escapeHtml(line.href)}" style="color:${BRAND.primary};text-decoration:none">${value}</a>`
        : value
      return `
        <tr>
          <td style="padding:6px 12px 6px 0;color:${BRAND.muted};font-size:13px;vertical-align:top;white-space:nowrap;width:90px">${escapeHtml(line.label)}</td>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.text};vertical-align:top">${inner}</td>
        </tr>`
    })
    .join('')

  const socialHtml = social.length
    ? `<p style="margin:14px 0 0;font-size:12px;color:${BRAND.muted}">
        ${social
          .map(
            (s) =>
              `<a href="${escapeHtml(s.href)}" style="color:${BRAND.primary};text-decoration:none;margin-right:12px">${escapeHtml(s.label)}</a>`,
          )
          .join('')}
      </p>`
    : ''

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid ${BRAND.border};padding-top:20px">
      <tr>
        <td>
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${BRAND.primaryDark}">${escapeHtml(heading)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>
          ${socialHtml}
        </td>
      </tr>
    </table>`
}

function contactTextBlock(contact) {
  const lines = contactLines(contact)
  const social = socialLinks(contact)
  const parts = ['— Contact —', ...lines.map((l) => `${l.label}: ${l.value}`)]
  if (social.length) parts.push(social.map((s) => `${s.label}: ${s.href}`).join(' | '))
  return parts.join('\n')
}

/**
 * Wrap email body in a branded responsive layout (table-based for clients).
 */
export function wrapEmailLayout({
  brandName,
  title,
  subtitle,
  bodyHtml,
  contact,
  preheader = '',
  footerNote = '',
}) {
  const pre = escapeHtml(preheader)
  const contactHtml = contact ? renderContactBlock(contact) : ''
  const note = footerNote
    ? `<p style="margin:16px 0 0;font-size:12px;color:${BRAND.muted};line-height:1.5">${footerNote}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${pre}&nbsp;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primaryDark} 0%,${BRAND.primary} 100%);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center">
              <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85)">Rwanda travel experts</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25">${escapeHtml(brandName)}</h1>
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.white};padding:32px;border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border}">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.text}">${escapeHtml(title)}</h2>
              ${subtitle ? `<p style="margin:0 0 20px;font-size:15px;color:${BRAND.muted};line-height:1.55">${escapeHtml(subtitle)}</p>` : ''}
              ${bodyHtml}
              ${note}
              ${contactHtml}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.white};border:1px solid ${BRAND.border};border-top:none;border-radius:0 0 12px 12px;padding:16px 32px 24px;text-align:center">
              <p style="margin:0;font-size:12px;color:${BRAND.muted};line-height:1.5">
                &copy; ${new Date().getFullYear()} ${escapeHtml(brandName)}. All rights reserved.<br/>
                Kigali, Rwanda &mdash; Gorilla trekking, safaris &amp; custom tours.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function statusBadgeColor(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'confirmed' || s === 'approved' || s === 'paid' || s === 'active') return '#15803d'
  if (s === 'cancelled' || s === 'rejected' || s === 'declined' || s === 'suspended') return '#b91c1c'
  if (s === 'pending' || s === 'unpaid') return '#b45309'
  return BRAND.primary
}

function renderInfoRow(label, value) {
  return `
    <tr>
      <td style="padding:8px 16px 8px 0;color:${BRAND.muted};font-size:14px;vertical-align:top;width:120px">${escapeHtml(label)}</td>
      <td style="padding:8px 0;font-size:14px;color:${BRAND.text};font-weight:600;vertical-align:top">${value}</td>
    </tr>`
}

/** Customer email when an admin changes request/booking status. */
export function buildStatusNotificationEmail({
  name,
  entityLabel,
  reference,
  fromStatus,
  toStatus,
  extra = [],
  contact,
}) {
  const greeting = name ? `Hello ${name},` : 'Hello,'
  const subject = reference
    ? `${contact.brandName} — ${entityLabel} ${reference} is now ${titleCaseStatus(toStatus)}`
    : `${contact.brandName} — Your ${entityLabel} is now ${titleCaseStatus(toStatus)}`

  const statusColor = statusBadgeColor(toStatus)

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:${BRAND.text};line-height:1.6">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND.text};line-height:1.6">
      Your <strong>${escapeHtml(entityLabel)}</strong> status has been updated by our team.
    </p>
    ${reference ? `<p style="margin:0 0 16px;font-size:14px;color:${BRAND.muted}">Reference: <strong style="color:${BRAND.text}">${escapeHtml(reference)}</strong></p>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border-radius:10px;border:1px solid ${BRAND.border};margin:0 0 20px">
      <tr>
        <td style="padding:20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:12px">
                <span style="display:inline-block;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.06em">Previous</span><br/>
                <span style="font-size:16px;color:${BRAND.text}">${escapeHtml(titleCaseStatus(fromStatus))}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span style="display:inline-block;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.06em">Current status</span><br/>
                <span style="display:inline-block;margin-top:6px;padding:8px 14px;border-radius:999px;background:${statusColor};color:#fff;font-size:14px;font-weight:700">${escapeHtml(titleCaseStatus(toStatus))}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ${extra.length ? `<div style="margin:0 0 16px;font-size:14px;color:${BRAND.text};line-height:1.6">${extra.map((line) => `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`).join('')}</div>` : ''}
    <p style="margin:0;font-size:14px;color:${BRAND.muted};line-height:1.6">
      Questions? Reply to this email, call us, or message us on WhatsApp — we are happy to help plan your Rwanda adventure.
    </p>`

  const html = wrapEmailLayout({
    brandName: contact.brandName,
    title: 'Status update',
    subtitle: `Your ${entityLabel} has a new status.`,
    bodyHtml,
    contact,
    preheader: `Status changed to ${titleCaseStatus(toStatus)}`,
    footerNote: 'You received this email because you submitted a request on our website.',
  })

  const text = [
    greeting,
    `Your ${entityLabel} status changed from ${titleCaseStatus(fromStatus)} to ${titleCaseStatus(toStatus)}.`,
    reference ? `Reference: ${reference}` : '',
    ...extra,
    '',
    contactTextBlock(contact),
    '',
    `© ${contact.brandName}`,
  ]
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')

  return { subject, html, text }
}

/** Admin alert when a new website booking is submitted. */
export function buildAdminNewBookingEmail({ created, guestName, guestEmail, contact }) {
  const service = titleCaseStatus(String(created.serviceType || 'booking').replace(/-/g, ' '))
  const pkg =
    created.details?.packageName ||
    (created.packageId ? `Package ${String(created.packageId).slice(0, 8)}` : '')
  const payment =
    created.details?.paymentLabel ||
    created.details?.paymentMethod ||
    '—'

  const subject = `New booking — ${created.reference} (${guestName})`

  const guestEmailLink = guestEmail
    ? `<a href="${escapeHtml(mailtoHref(guestEmail))}" style="color:${BRAND.primary};text-decoration:none">${escapeHtml(guestEmail)}</a>`
    : '—'
  const guestPhone = created.phone
    ? `<a href="${escapeHtml(telHref(created.phone))}" style="color:${BRAND.primary};text-decoration:none">${escapeHtml(created.phone)}</a>`
    : '—'

  const detailsTable = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border-radius:10px;border:1px solid ${BRAND.border}">
      ${renderInfoRow('Reference', escapeHtml(created.reference))}
      ${renderInfoRow('Guest', escapeHtml(guestName))}
      ${renderInfoRow('Email', guestEmailLink)}
      ${renderInfoRow('Phone', guestPhone)}
      ${renderInfoRow('Service', escapeHtml(service))}
      ${pkg ? renderInfoRow('Package', escapeHtml(String(pkg))) : ''}
      ${renderInfoRow('Travel date', escapeHtml(created.travelDate || '—'))}
      ${created.returnDate ? renderInfoRow('Return date', escapeHtml(created.returnDate)) : ''}
      ${renderInfoRow('Travelers', escapeHtml(`${created.adults} adults, ${created.children} children`))}
      ${renderInfoRow('Payment', escapeHtml(String(payment)))}
      ${renderInfoRow('Status', `<span style="color:${statusBadgeColor(created.status)}">${escapeHtml(titleCaseStatus(created.status))}</span>`)}
    </table>`

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:${BRAND.text};line-height:1.6">
      A new booking was submitted on the public website. Review it in the admin panel under <strong>Bookings</strong>.
    </p>
    ${detailsTable}`

  const html = wrapEmailLayout({
    brandName: contact.brandName,
    title: 'New website booking',
    subtitle: `${guestName} submitted a ${service.toLowerCase()} request.`,
    bodyHtml,
    contact,
    preheader: `${created.reference} — ${guestName}`,
    footerNote: 'Internal notification — RwandaQuest Tours admin.',
  })

  const text = [
    `New booking ${created.reference}`,
    `Guest: ${guestName} <${guestEmail}>`,
    `Phone: ${created.phone || '—'}`,
    `Service: ${service}`,
    pkg ? `Package: ${pkg}` : '',
    `Travel: ${created.travelDate || '—'}`,
    `Travelers: ${created.adults} adults, ${created.children} children`,
    `Payment: ${payment}`,
    '',
    contactTextBlock(contact),
  ]
    .filter(Boolean)
    .join('\n')

  return { subject, html, text }
}

const CONTENT_KIND_LABELS = {
  package: 'Tour package',
  'car-rental': 'Car rental',
  blog: 'Blog article',
}

const CONTENT_KIND_CTA = {
  package: { label: 'View packages', path: '/packages' },
  'car-rental': { label: 'Browse fleet', path: '/car-rental' },
  blog: { label: 'Read on our blog', path: '/blog' },
}

export function buildUnsubscribeUrl(contact, email) {
  const enc = encodeURIComponent(String(email || '').trim().toLowerCase())
  const apiBase = String(process.env.PUBLIC_API_URL || process.env.API_PUBLIC_URL || '').replace(
    /\/$/,
    '',
  )
  if (apiBase) return `${apiBase}/api/subscribers/unsubscribe?email=${enc}`
  const site = String(contact?.publicSiteUrl || '').replace(/\/$/, '')
  if (site) return `${site}/api/subscribers/unsubscribe?email=${enc}`
  return `/api/subscribers/unsubscribe?email=${enc}`
}

function buildCtaUrl(contact, kind, _slug) {
  const site = String(contact?.publicSiteUrl || 'http://localhost:3000').replace(/\/$/, '')
  const path = CONTENT_KIND_CTA[kind]?.path || '/'
  return `${site}${path}`
}

function renderCtaButton(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
      <tr>
        <td style="border-radius:8px;background:${BRAND.primary}">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`
}

/** Newsletter: new or updated package, car rental, or blog post. */
export function buildSubscriberContentEmail({
  kind,
  title,
  summary,
  slug,
  contact,
  updateType = 'updated',
}) {
  const kindLabel = CONTENT_KIND_LABELS[kind] || 'Update'
  const cta = CONTENT_KIND_CTA[kind] || { label: 'Visit website', path: '/' }
  const ctaUrl = buildCtaUrl(contact, kind, slug)

  const subject = `${contact.brandName} — ${kindLabel} ${updateType}: ${title}`
  const verb = updateType === 'new' ? 'just added' : 'been updated'

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:${BRAND.text};line-height:1.6">
      We have ${verb} a <strong>${escapeHtml(kindLabel.toLowerCase())}</strong> you may be interested in:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border-radius:10px;border:1px solid ${BRAND.border};margin:0 0 8px">
      <tr>
        <td style="padding:20px">
          <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.06em">${escapeHtml(kindLabel)}</p>
          <h3 style="margin:0 0 10px;font-size:18px;color:${BRAND.primaryDark}">${escapeHtml(title)}</h3>
          ${summary ? `<p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.6">${escapeHtml(summary)}</p>` : ''}
        </td>
      </tr>
    </table>
    ${renderCtaButton(ctaUrl, cta.label)}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.5">
      Plan gorilla treks, safaris, and car hire with our Kigali team — we reply quickly on email and WhatsApp.
    </p>`

  const unsubTemplate = buildUnsubscribeUrl(contact, '{{EMAIL}}')

  const html = wrapEmailLayout({
    brandName: contact.brandName,
    title: `${kindLabel} ${updateType}`,
    subtitle: title,
    bodyHtml,
    contact,
    preheader: `${title} — ${kindLabel} ${updateType}`,
    footerNote: `You are receiving this because you subscribed to ${contact.brandName} updates. <a href="${escapeHtml(unsubTemplate)}" style="color:${BRAND.primary}">Unsubscribe</a>`,
  })

  const text = [
    `${kindLabel} ${updateType}: ${title}`,
    summary || '',
    `${cta.label}: ${ctaUrl}`,
    '',
    contactTextBlock(contact),
    '',
    'Unsubscribe: use the link in the HTML email.',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    subject,
    html,
    text,
    forRecipient(recipientEmail) {
      const unsub = buildUnsubscribeUrl(contact, recipientEmail)
      return {
        html: html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(recipientEmail)),
        text: `${text}\n\nUnsubscribe: ${unsub}`,
      }
    },
  }
}

/** Welcome email when someone subscribes to the newsletter. */
export function buildSubscriberWelcomeEmail({ email, contact, resubscribed = false }) {
  const subject = resubscribed
    ? `Welcome back to ${contact.brandName} updates`
    : `You're subscribed — ${contact.brandName} travel updates`

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:${BRAND.text};line-height:1.6">
      ${resubscribed ? 'Welcome back!' : 'Thank you for subscribing!'} You will receive email alerts when we:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:${BRAND.text};line-height:1.8">
      <li>Update or launch <strong>tour packages</strong></li>
      <li>Add or refresh <strong>car rental</strong> vehicles &amp; rates</li>
      <li>Publish new <strong>blog</strong> guides and travel tips</li>
    </ul>
    ${renderCtaButton(buildCtaUrl(contact, 'package', ''), 'Explore tour packages')}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.5">
      Gorilla permits, safaris, and custom Rwanda itineraries — our team is here to help.
    </p>`

  const unsub = buildUnsubscribeUrl(contact, email)

  const html = wrapEmailLayout({
    brandName: contact.brandName,
    title: resubscribed ? 'Welcome back' : 'Subscription confirmed',
    subtitle: `Updates sent to ${email}`,
    bodyHtml,
    contact,
    preheader: 'Tour packages, car rental & blog alerts',
    footerNote: `<a href="${escapeHtml(unsub)}" style="color:${BRAND.primary}">Unsubscribe</a> at any time.`,
  })

  const text = [
    resubscribed ? 'Welcome back to our newsletter.' : 'Thank you for subscribing.',
    'You will be notified about package, car rental, and blog updates.',
    '',
    contactTextBlock(contact),
    `Unsubscribe: ${unsub}`,
  ].join('\n')

  return { subject, html, text }
}

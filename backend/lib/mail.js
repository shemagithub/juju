import nodemailer from 'nodemailer'

let transporter

function getTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null

  const port = Number(process.env.SMTP_PORT) || 465
  const secure =
    String(process.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false'

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
  return transporter
}

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter()
  if (!transport) {
    console.warn('[mail] SMTP not configured — skip send to', to)
    return { skipped: true }
  }

  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || 'support@rwandaquesttours.com'
  const fromName = process.env.MAIL_FROM_NAME || 'RwandaQuest Tours'

  return transport.sendMail({
    from: `"${fromName}" <${from}>`,
    to,
    subject,
    html,
    text,
  })
}

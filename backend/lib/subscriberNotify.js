import { isMailConfigured, sendMail } from './mail.js'
import {
  buildSubscriberContentEmail,
  loadEmailContactInfo,
} from './emailTemplates.js'

export function queueSubscriberContentUpdate(pool, payload) {
  if (!payload?.kind || !payload?.title) return
  void notifySubscribersContentUpdate(pool, payload).catch((err) => {
    console.error('[subscriberNotify]', payload.kind, err?.message || err)
  })
}

async function listActiveSubscriberEmails(pool) {
  const [rows] = await pool.query(
    'SELECT email FROM newsletter_subscribers WHERE active_flag = 1 AND email LIKE ?',
    ['%@%'],
  )
  return (rows ?? []).map((r) => String(r.email).trim().toLowerCase()).filter(Boolean)
}

export async function notifySubscribersContentUpdate(pool, payload) {
  if (!isMailConfigured()) return

  const emails = await listActiveSubscriberEmails(pool)
  if (!emails.length) return

  const contact = await loadEmailContactInfo(pool)
  const emailContent = buildSubscriberContentEmail({
    ...payload,
    contact,
  })

  for (const to of emails) {
    try {
      const personalized = emailContent.forRecipient(to)
      await sendMail({
        to,
        subject: emailContent.subject,
        html: personalized.html,
        text: personalized.text,
      })
    } catch (err) {
      console.warn('[subscriberNotify] failed for', to, err?.message)
    }
  }

  console.info(
    `[subscriberNotify] Sent "${payload.kind}" update "${payload.title}" to ${emails.length} subscriber(s)`,
  )
}

export function shouldNotifyPackage(pkg) {
  return pkg && String(pkg.status ?? 'active').toLowerCase() === 'active'
}

export function shouldNotifyBlogPost(post) {
  return post && !!post.published
}

export function shouldNotifyCarVehicle(vehicle) {
  return vehicle && vehicle.active !== false
}

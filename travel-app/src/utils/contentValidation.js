/** Skip placeholder/test CMS values on the public site. */
export function isDisplayableName(value, minLength = 3) {
  const text = String(value ?? "").trim();
  if (text.length < minLength) return false;
  if (/^[^a-zA-Z0-9]*$/.test(text)) return false;
  return true;
}

export function formatCategoryLabel(value) {
  return String(value ?? "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function sanitizeCaption(value, fallback = "Rwanda moment") {
  const text = String(value ?? "").trim();
  return isDisplayableName(text, 4) ? text : fallback;
}

export function phoneHref(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits ? `tel:+${digits}` : "";
}

export function resolveWhatsAppNumber(settings = {}, defaults = {}) {
  const raw =
    settings.whatsapp ||
    defaults.whatsapp ||
    settings.contactPhone ||
    defaults.contactPhone ||
    "";
  return String(raw).replace(/\D/g, "");
}

export function whatsappHref(number, message) {
  const digits = String(number ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function companyWhatsAppHref(settings = {}, defaults = {}) {
  const digits = resolveWhatsAppNumber(settings, defaults);
  const brand = String(settings.brandName || defaults.brandName || "RwandaQuest").trim();
  return whatsappHref(
    digits,
    `Hello ${brand}, I would like to inquire about your tours.`,
  );
}

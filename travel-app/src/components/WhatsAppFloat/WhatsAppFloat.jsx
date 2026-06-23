import React from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { companyWhatsAppHref } from "../../utils/contentValidation";
import "./whatsapp-float.css";

const WhatsAppFloat = () => {
  const { settings } = useSiteSettings();
  const href = companyWhatsAppHref(settings, DEFAULT_SITE_SETTINGS);
  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="site-whatsapp-float"
      aria-label={`Chat with ${brandName} on WhatsApp`}
      title={`WhatsApp ${brandName}`}
    >
      <i className="bi bi-whatsapp" aria-hidden="true" />
      <span className="site-whatsapp-float__label">WhatsApp</span>
    </a>
  );
};

export default WhatsAppFloat;

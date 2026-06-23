import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { applyPageSeo } from "../../utils/seo";

/** Updates title, description, Open Graph, and structured data on route change. */
export default function PageSeo() {
  const { pathname } = useLocation();
  const { settings } = useSiteSettings();

  useEffect(() => {
    applyPageSeo(settings, pathname);
  }, [pathname, settings]);

  return null;
}

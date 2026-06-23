import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchJson } from "../utils/backendApi";
import { DEFAULT_SITE_SETTINGS, mergeNavLinks } from "../config/defaultSiteSettings";

const SiteSettingsContext = createContext({
  settings: DEFAULT_SITE_SETTINGS,
  loading: true,
});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    ...DEFAULT_SITE_SETTINGS,
    navLinks: mergeNavLinks(DEFAULT_SITE_SETTINGS.navLinks),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchJson("/api/site-settings");
        if (!cancelled && data && typeof data === "object") {
          const merged = {
            ...DEFAULT_SITE_SETTINGS,
            ...data,
            navLinks: mergeNavLinks(data.navLinks),
          };
          setSettings(merged);
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { openApi } from "../../services/api";
import { getApiUrl } from "../../config/backendUrl";
import { nomeEmpresa as packageName } from "../../../package.json";
import defaultLogo from "../../assets/logo.png";

function resolveStoredLogoUrl(raw) {
  const u = raw?.trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return getApiUrl(u);
  return u;
}

function defaultFaviconAbsoluteHref() {
  if (typeof window === "undefined") return "/favicon.ico";
  const base = process.env.PUBLIC_URL || "";
  return `${window.location.origin}${base}/favicon.ico`;
}

const defaultBranding = {
  systemName: packageName || "Atendechat",
  loginLogoUrl: "",
  menuLogoUrl: "",
  faviconUrl: "",
  publicWhatsAppNumber: "",
  publicWhatsAppMessage: "",
};

const BrandingContext = createContext({
  branding: defaultBranding,
  loading: true,
  error: null,
  refreshBranding: async () => {},
  resolveLoginLogo: () => defaultLogo,
  resolveMenuLogo: () => defaultLogo,
  resolveFavicon: () => defaultFaviconAbsoluteHref(),
});

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBranding = useCallback(async () => {
    try {
      const { data } = await openApi.get("/system-settings/branding");
      setBranding({
        systemName: data?.systemName || defaultBranding.systemName,
        loginLogoUrl: data?.loginLogoUrl ?? "",
        menuLogoUrl: data?.menuLogoUrl ?? "",
        faviconUrl: data?.faviconUrl ?? "",
        publicWhatsAppNumber: data?.publicWhatsAppNumber ?? "",
        publicWhatsAppMessage: data?.publicWhatsAppMessage ?? "",
      });
      setError(null);
    } catch (e) {
      setError(e);
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    const name = branding.systemName || defaultBranding.systemName;
    if (typeof document !== "undefined") {
      document.title = name;
    }
  }, [branding.systemName]);

  const resolveLoginLogo = useCallback(() => {
    return resolveStoredLogoUrl(branding.loginLogoUrl) || defaultLogo;
  }, [branding.loginLogoUrl]);

  const resolveMenuLogo = useCallback(() => {
    return resolveStoredLogoUrl(branding.menuLogoUrl) || defaultLogo;
  }, [branding.menuLogoUrl]);

  const resolveFavicon = useCallback(() => {
    return resolveStoredLogoUrl(branding.faviconUrl) || defaultFaviconAbsoluteHref();
  }, [branding.faviconUrl]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = resolveFavicon();
    ["icon", "shortcut icon"].forEach((rel) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    });
  }, [resolveFavicon]);

  const value = useMemo(
    () => ({
      branding,
      loading,
      error,
      refreshBranding: fetchBranding,
      resolveLoginLogo,
      resolveMenuLogo,
      resolveFavicon,
    }),
    [branding, loading, error, fetchBranding, resolveLoginLogo, resolveMenuLogo, resolveFavicon]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}

export default BrandingContext;

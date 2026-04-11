import React, { useEffect, useRef, useState } from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import api from "../../services/api";
import { useBranding } from "../../context/Branding/BrandingContext";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import PlatformPageHeader from "./PlatformPageHeader";

const ACCEPT_IMAGES = "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,.svg";
const ACCEPT_FAVICON =
  "image/png,image/jpeg,image/jpg,image/x-icon,image/vnd.microsoft.icon,.ico,.png,.jpg,.jpeg,.svg,image/svg+xml";

export default function PlatformBranding() {
  const { branding, refreshBranding, resolveLoginLogo, resolveMenuLogo, resolveFavicon } = useBranding();
  const [systemName, setSystemName] = useState("");
  const [publicWhatsAppNumber, setPublicWhatsAppNumber] = useState("");
  const [publicWhatsAppMessage, setPublicWhatsAppMessage] = useState("");
  const [loginFile, setLoginFile] = useState(null);
  const [menuFile, setMenuFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [loginPreviewUrl, setLoginPreviewUrl] = useState(null);
  const [menuPreviewUrl, setMenuPreviewUrl] = useState(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const loginInputRef = useRef(null);
  const menuInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    setSystemName(branding.systemName || "");
  }, [branding.systemName]);

  useEffect(() => {
    setPublicWhatsAppNumber(branding.publicWhatsAppNumber || "");
    setPublicWhatsAppMessage(branding.publicWhatsAppMessage || "");
  }, [branding.publicWhatsAppNumber, branding.publicWhatsAppMessage]);

  useEffect(() => {
    if (!loginFile) {
      setLoginPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(loginFile);
    setLoginPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [loginFile]);

  useEffect(() => {
    if (!menuFile) {
      setMenuPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(menuFile);
    setMenuPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [menuFile]);

  useEffect(() => {
    if (!faviconFile) {
      setFaviconPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(faviconFile);
    setFaviconPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [faviconFile]);

  const loginImgSrc = loginPreviewUrl || resolveLoginLogo();
  const menuImgSrc = menuPreviewUrl || resolveMenuLogo();
  const faviconImgSrc = faviconPreviewUrl || resolveFavicon();

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("systemName", systemName);
      fd.append("publicWhatsAppNumber", String(publicWhatsAppNumber).replace(/\D/g, ""));
      fd.append("publicWhatsAppMessage", String(publicWhatsAppMessage).trim());
      if (loginFile) fd.append("loginLogo", loginFile);
      if (menuFile) fd.append("menuLogo", menuFile);
      if (faviconFile) fd.append("favicon", faviconFile);
      await api.post("/system-settings/branding", fd);
      setLoginFile(null);
      setMenuFile(null);
      setFaviconFile(null);
      await refreshBranding();
      toast.success(i18n.t("platform.branding.saved"));
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
    }
  };

  const restoreLoginDefault = async () => {
    try {
      await api.post("/system-settings", { branding: { loginLogoUrl: "" } });
      setLoginFile(null);
      await refreshBranding();
      toast.success(i18n.t("platform.branding.saved"));
    } catch (e) {
      toastError(e);
    }
  };

  const restoreMenuDefault = async () => {
    try {
      await api.post("/system-settings", { branding: { menuLogoUrl: "" } });
      setMenuFile(null);
      await refreshBranding();
      toast.success(i18n.t("platform.branding.saved"));
    } catch (e) {
      toastError(e);
    }
  };

  const restoreFaviconDefault = async () => {
    try {
      await api.post("/system-settings", { branding: { faviconUrl: "" } });
      setFaviconFile(null);
      await refreshBranding();
      toast.success(i18n.t("platform.branding.saved"));
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <MainContainer>
      <PlatformPageHeader
        titleKey="platform.branding.title"
        subtitleKey="platform.branding.subtitle"
      />
      <Box maxWidth={560}>
        <TextField
          label={i18n.t("platform.branding.systemName")}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
        />

        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            {i18n.t("platform.branding.loginLogo")}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
            {i18n.t("platform.branding.uploadHint")}
          </Typography>
          <Box display="flex" alignItems="center" flexWrap="wrap" mt={1} style={{ gap: 8 }}>
            <img
              src={loginImgSrc}
              alt=""
              style={{ maxHeight: 72, maxWidth: 220, objectFit: "contain", border: "1px solid #eee", borderRadius: 4 }}
            />
            <input
              ref={loginInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                setLoginFile(f || null);
                e.target.value = "";
              }}
            />
            <Button size="small" variant="outlined" onClick={() => loginInputRef.current?.click()}>
              {i18n.t("platform.branding.chooseFile")}
            </Button>
            <Button size="small" onClick={restoreLoginDefault}>
              {i18n.t("platform.branding.restoreDefault")}
            </Button>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            component="div"
            style={{ marginTop: 12, lineHeight: 1.55, whiteSpace: "pre-line" }}
          >
            {i18n.t("platform.branding.loginLogoHint")}
          </Typography>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            {i18n.t("platform.branding.menuLogo")}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
            {i18n.t("platform.branding.uploadHint")}
          </Typography>
          <Box display="flex" alignItems="center" flexWrap="wrap" mt={1} style={{ gap: 8 }}>
            <img
              src={menuImgSrc}
              alt=""
              style={{ maxHeight: 72, maxWidth: 220, objectFit: "contain", border: "1px solid #eee", borderRadius: 4 }}
            />
            <input
              ref={menuInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                setMenuFile(f || null);
                e.target.value = "";
              }}
            />
            <Button size="small" variant="outlined" onClick={() => menuInputRef.current?.click()}>
              {i18n.t("platform.branding.chooseFile")}
            </Button>
            <Button size="small" onClick={restoreMenuDefault}>
              {i18n.t("platform.branding.restoreDefault")}
            </Button>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            component="div"
            style={{ marginTop: 12, lineHeight: 1.55, whiteSpace: "pre-line" }}
          >
            {i18n.t("platform.branding.menuLogoHint")}
          </Typography>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle1" style={{ fontWeight: 600 }} gutterBottom>
            {i18n.t("platform.branding.loginWhatsAppSection")}
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginBottom: 12 }}>
            {i18n.t("platform.branding.loginWhatsAppSectionSubtitle")}
          </Typography>
          <TextField
            label={i18n.t("platform.branding.loginWhatsAppNumber")}
            fullWidth
            margin="normal"
            variant="outlined"
            size="small"
            value={publicWhatsAppNumber}
            onChange={(e) => setPublicWhatsAppNumber(e.target.value)}
            placeholder="5527999999999"
            inputProps={{ inputMode: "numeric", autoComplete: "off" }}
          />
          <Typography variant="caption" color="textSecondary" display="block" style={{ marginTop: 4, lineHeight: 1.55 }}>
            {i18n.t("platform.branding.loginWhatsAppNumberHint")}
          </Typography>
          <TextField
            label={i18n.t("platform.branding.loginWhatsAppMessage")}
            fullWidth
            margin="normal"
            variant="outlined"
            size="small"
            value={publicWhatsAppMessage}
            onChange={(e) => setPublicWhatsAppMessage(e.target.value)}
            placeholder={i18n.t("platform.branding.loginWhatsAppMessagePlaceholder")}
            multiline
            minRows={2}
          />
          <Typography variant="caption" color="textSecondary" display="block" style={{ marginTop: 4, lineHeight: 1.55 }}>
            {i18n.t("platform.branding.loginWhatsAppMessageHint")}
          </Typography>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            {i18n.t("platform.branding.favicon")}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
            {i18n.t("platform.branding.uploadHintFavicon")}
          </Typography>
          <Box display="flex" alignItems="center" flexWrap="wrap" mt={1} style={{ gap: 8 }}>
            <img
              src={faviconImgSrc}
              alt=""
              style={{
                width: 32,
                height: 32,
                objectFit: "contain",
                border: "1px solid #eee",
                borderRadius: 4,
                flexShrink: 0,
              }}
            />
            <input
              ref={faviconInputRef}
              type="file"
              accept={ACCEPT_FAVICON}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFaviconFile(f || null);
                e.target.value = "";
              }}
            />
            <Button size="small" variant="outlined" onClick={() => faviconInputRef.current?.click()}>
              {i18n.t("platform.branding.chooseFile")}
            </Button>
            <Button size="small" onClick={restoreFaviconDefault}>
              {i18n.t("platform.branding.restoreDefault")}
            </Button>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            component="div"
            style={{ marginTop: 12, lineHeight: 1.55, whiteSpace: "pre-line" }}
          >
            {i18n.t("platform.branding.faviconHint")}
          </Typography>
        </Box>

        <Box mt={3}>
          <Button variant="contained" color="primary" disabled={saving} onClick={handleSave}>
            {i18n.t("platform.branding.save")}
          </Button>
        </Box>
      </Box>
    </MainContainer>
  );
}

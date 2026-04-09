import React, { useEffect, useState } from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import api from "../../services/api";
import { useBranding } from "../../context/Branding/BrandingContext";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import PlatformPageHeader from "./PlatformPageHeader";

export default function PlatformBranding() {
  const { branding, refreshBranding } = useBranding();
  const [form, setForm] = useState({
    systemName: "",
    loginLogoUrl: "",
    menuLogoUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      systemName: branding.systemName || "",
      loginLogoUrl: branding.loginLogoUrl || "",
      menuLogoUrl: branding.menuLogoUrl || "",
    });
  }, [branding.systemName, branding.loginLogoUrl, branding.menuLogoUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/system-settings", { branding: form });
      await refreshBranding();
      toast.success(i18n.t("platform.branding.saved"));
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
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
          value={form.systemName}
          onChange={(e) => setForm((f) => ({ ...f, systemName: e.target.value }))}
        />
        <TextField
          label={i18n.t("platform.branding.loginLogoUrl")}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
          helperText={i18n.t("platform.branding.urlHelp")}
          value={form.loginLogoUrl}
          onChange={(e) => setForm((f) => ({ ...f, loginLogoUrl: e.target.value }))}
        />
        <TextField
          label={i18n.t("platform.branding.menuLogoUrl")}
          fullWidth
          margin="normal"
          variant="outlined"
          size="small"
          helperText={i18n.t("platform.branding.urlHelp")}
          value={form.menuLogoUrl}
          onChange={(e) => setForm((f) => ({ ...f, menuLogoUrl: e.target.value }))}
        />
        <Box mt={2}>
          <Button variant="contained" color="primary" disabled={saving} onClick={handleSave}>
            {i18n.t("platform.branding.save")}
          </Button>
        </Box>
      </Box>
    </MainContainer>
  );
}

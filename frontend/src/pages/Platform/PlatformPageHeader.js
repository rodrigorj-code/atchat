import React from "react";
import Typography from "@material-ui/core/Typography";

import AppPageHeader from "../../ui/components/AppPageHeader";
import { i18n } from "../../translate/i18n";

/**
 * Cabeçalho comum às telas do módulo Plataforma (Super Admin).
 */
export default function PlatformPageHeader({ titleKey, subtitleKey }) {
  return (
    <AppPageHeader
      title={
        <>
          <Typography
            variant="overline"
            color="textSecondary"
            display="block"
            style={{ letterSpacing: "0.06em", marginBottom: 4 }}
          >
            {i18n.t("platform.shell.eyebrow")}
          </Typography>
          <Typography variant="h5" component="h1" color="primary">
            {i18n.t(titleKey)}
          </Typography>
        </>
      }
      subtitle={
        <Typography variant="body2" color="textSecondary" component="p" style={{ margin: 0 }}>
          {i18n.t(subtitleKey)}
        </Typography>
      }
    />
  );
}

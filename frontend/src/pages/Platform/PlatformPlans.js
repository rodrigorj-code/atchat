import React from "react";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import MainContainer from "../../components/MainContainer";
import PlansManager from "../../components/PlansManager";
import PlatformPageHeader from "./PlatformPageHeader";
import { AppSectionCard } from "../../ui";
import { i18n } from "../../translate/i18n";

/**
 * Catálogo global de planos (Super Admin). Reutiliza PlansManager e APIs /plans/*.
 */
export default function PlatformPlans() {
  return (
    <MainContainer>
      <PlatformPageHeader titleKey="platform.plans.title" subtitleKey="platform.plans.subtitle" />
      <Box marginBottom={2}>
        <AppSectionCard>
          <Typography variant="body2" color="textSecondary" component="p" style={{ margin: 0, lineHeight: 1.55, maxWidth: 880 }}>
            {i18n.t("platform.plans.intro")}
          </Typography>
        </AppSectionCard>
      </Box>
      <PlansManager variant="platform" />
    </MainContainer>
  );
}

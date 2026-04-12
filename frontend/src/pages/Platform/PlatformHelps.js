import React from "react";

import MainContainer from "../../components/MainContainer";
import HelpsManager from "../../components/HelpsManager";
import PlatformPageHeader from "./PlatformPageHeader";

/**
 * Gestão global dos conteúdos de ajuda (tutoriais/links) — apenas Super Admin.
 * Reutiliza HelpsManager; a API /helps/* é global (sem companyId).
 */
export default function PlatformHelps() {
  return (
    <MainContainer>
      <PlatformPageHeader titleKey="platform.helps.title" subtitleKey="platform.helps.subtitle" />
      <HelpsManager />
    </MainContainer>
  );
}

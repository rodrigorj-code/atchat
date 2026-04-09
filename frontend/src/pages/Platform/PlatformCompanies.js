import React from "react";

import MainContainer from "../../components/MainContainer";
import CompaniesManager from "../../components/CompaniesManager";
import PlatformPageHeader from "./PlatformPageHeader";

/**
 * Gestão global de empresas (Super Admin). Reutiliza o gestor já existente.
 */
export default function PlatformCompanies() {
  return (
    <MainContainer>
      <PlatformPageHeader
        titleKey="platform.companies.title"
        subtitleKey="platform.companies.subtitle"
      />
      <CompaniesManager />
    </MainContainer>
  );
}

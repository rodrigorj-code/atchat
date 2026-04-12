import React from "react";

import Announcements from "../Annoucements";

/**
 * Informativos globais (Super Admin) — mesma lógica e API que /announcements, com cabeçalho Plataforma.
 */
export default function PlatformInformativos() {
  return <Announcements variant="platform" />;
}

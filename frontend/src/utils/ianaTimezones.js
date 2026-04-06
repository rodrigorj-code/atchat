/** Lista IANA para select de fuso horário (fallback se Intl não suportar). */
const FALLBACK_ZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Fortaleza",
  "America/Belem",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Recife",
  "America/Bahia",
  "America/Noronha",
  "America/Rio_Branco",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Lisbon",
  "Europe/London",
  "UTC"
];

export function getIanaTimezones() {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch (e) {
    /* ignore */
  }
  return FALLBACK_ZONES;
}

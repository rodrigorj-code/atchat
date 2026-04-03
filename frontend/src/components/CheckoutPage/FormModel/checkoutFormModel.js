import { i18n } from "../../../translate/i18n";

/** Checkout PIX: apenas o campo `plan` (JSON do plano selecionado). */
export default {
  formId: "checkoutForm",
  formField: {
    plan: {
      name: "plan",
      label: i18n.t("checkoutPage.form.planField.label"),
    },
  },
};

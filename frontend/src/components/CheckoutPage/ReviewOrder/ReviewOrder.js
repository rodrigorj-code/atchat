import React from "react";
import { useFormikContext } from "formik";
import { Typography } from "@material-ui/core";
import ShippingDetails from "./ShippingDetails";
import { i18n } from "../../../translate/i18n";

export default function ReviewOrder({ invoice }) {
  const { values: formValues } = useFormikContext();
  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        {i18n.t("checkoutPage.review.titlePix")}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        {i18n.t("checkoutPage.review.confirmPixHint")}
      </Typography>
      <ShippingDetails formValues={formValues} invoice={invoice} />
    </React.Fragment>
  );
}

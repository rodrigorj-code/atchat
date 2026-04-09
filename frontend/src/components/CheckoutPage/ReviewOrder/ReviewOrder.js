import React from "react";
import { useFormikContext } from "formik";
import { Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import ShippingDetails from "./ShippingDetails";
import { i18n } from "../../../translate/i18n";
import useCheckoutStyles from "../styles";

export default function ReviewOrder({ invoice }) {
  const { values: formValues } = useFormikContext();
  const classes = useCheckoutStyles();
  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        {i18n.t("checkoutPage.review.titlePix")}
      </Typography>
      <Alert severity="info" variant="outlined" className={classes.contextAlert}>
        <Typography variant="body2" component="p">
          {i18n.t("checkoutPage.review.confirmPixHint")}
        </Typography>
      </Alert>
      <ShippingDetails formValues={formValues} invoice={invoice} />
    </React.Fragment>
  );
}

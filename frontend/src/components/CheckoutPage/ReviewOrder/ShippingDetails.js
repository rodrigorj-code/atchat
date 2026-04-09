import React from "react";
import { Typography, Grid, Paper } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import useStyles from "./styles";
import useCheckoutStyles from "../styles";
import { i18n } from "../../../translate/i18n";
import moment from "moment";

/**
 * Resumo do plano + destaque do valor da fatura (PIX cobrado pelo backend).
 */
export default function ShippingDetails(props) {
  const { formValues, invoice } = props;
  const classes = useStyles();
  const checkoutClasses = useCheckoutStyles();
  const { plan } = formValues;

  if (!plan) {
    return null;
  }

  const newPlan = JSON.parse(plan);
  const { users, connections } = newPlan;

  const pixAmount =
    invoice != null
      ? Number(invoice.value).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : "";

  return (
    <Grid container spacing={2}>
      {invoice && (
        <Grid item xs={12}>
          <Paper variant="outlined" style={{ padding: 16 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              className={classes.title}
            >
              {i18n.t("checkoutPage.review.pixSectionTitle")}
            </Typography>
            <Typography gutterBottom>
              {i18n.t("checkoutPage.review.invoiceId")}: #{invoice.id}
            </Typography>
            <Typography gutterBottom>{invoice.detail}</Typography>
            <Typography color="primary" style={{ fontWeight: 700 }}>
              {i18n.t("checkoutPage.review.chargesFromInvoice")} {pixAmount}
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              {i18n.t("checkoutPage.review.dueLabel")}:{" "}
              {moment(invoice.dueDate).format("DD/MM/YYYY")}
            </Typography>
          </Paper>
        </Grid>
      )}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom className={classes.title}>
          {i18n.t("checkoutPage.review.planSectionTitle")}
        </Typography>
        <Alert
          severity="info"
          variant="outlined"
          className={checkoutClasses.contextAlertTight}
        >
          <Typography variant="body2" component="p">
            {i18n.t("checkoutPage.review.planReferenceOnly")}
          </Typography>
        </Alert>
        <Typography gutterBottom>
          {i18n.t("checkoutPage.review.users")}: {users}
        </Typography>
        <Typography gutterBottom>
          {i18n.t("checkoutPage.review.whatsapp")}: {connections}
        </Typography>
      </Grid>
    </Grid>
  );
}

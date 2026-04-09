import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import * as Yup from "yup";
import { Formik, Form } from "formik";

import PaymentForm from "./Forms/PaymentForm";
import ReviewOrder from "./ReviewOrder";
import CheckoutSuccess from "./CheckoutSuccess";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

import validationSchema from "./FormModel/validationSchema";
import checkoutFormModel from "./FormModel/checkoutFormModel";
import formInitialValues from "./FormModel/formInitialValues";

import useStyles from "./styles";
import { i18n } from "../../translate/i18n";

export default function CheckoutPage(props) {
  const { Invoice } = props;

  const steps = [
    i18n.t("checkoutPage.steps.plan"),
    i18n.t("checkoutPage.steps.pixReview"),
  ];

  const { formId } = checkoutFormModel;

  const classes = useStyles();
  const [activeStep, setCheckoutStep] = useState(0);
  const [datePayment, setDatePayment] = useState(null);
  const [invoiceId] = useState(Invoice?.id);
  const currentValidationSchema =
    validationSchema[activeStep] || Yup.object();
  const isLastStep = activeStep === steps.length - 1;

  function _renderStepContent(step, setFieldValue, values) {
    switch (step) {
      case 0:
        return (
          <PaymentForm
            setFieldValue={setFieldValue}
            setActiveStep={setCheckoutStep}
            activeStep={step}
            invoiceId={invoiceId}
            values={values}
            invoice={Invoice}
          />
        );
      case 1:
        return <ReviewOrder invoice={Invoice} />;
      default:
        return null;
    }
  }

  async function _submitForm(values, actions) {
    try {
      const plan = JSON.parse(values.plan);
      const newValues = {
        plan: values.plan,
        price: plan.price,
        users: String(plan.users),
        connections: String(plan.connections),
        invoiceId,
      };

      const { data } = await api.post("/subscription", newValues);
      setDatePayment(data);
      actions.setSubmitting(false);
      setCheckoutStep(steps.length);
      toast.success(i18n.t("checkoutPage.success"));
    } catch (err) {
      toastError(err);
      actions.setSubmitting(false);
    }
  }

  function _handleSubmit(values, actions) {
    if (isLastStep) {
      _submitForm(values, actions);
    } else {
      setCheckoutStep(activeStep + 1);
      actions.setTouched({});
      actions.setSubmitting(false);
    }
  }

  function _handleBack() {
    setCheckoutStep((s) => Math.max(0, s - 1));
  }

  return (
    <React.Fragment>
      <Typography component="h2" variant="h5" align="center" gutterBottom>
        {i18n.t("checkoutPage.pixFlowTitle")}
      </Typography>
      <Box display="flex" justifyContent="center" width="100%">
        <Alert
          severity="info"
          variant="outlined"
          className={classes.contextAlert}
        >
          <Typography variant="body2" component="p" align="center">
            {i18n.t("checkoutPage.pixFlowSubtitle")}
          </Typography>
        </Alert>
      </Box>
      <Stepper activeStep={activeStep} className={classes.stepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <React.Fragment>
        {activeStep === steps.length ? (
          <CheckoutSuccess pix={datePayment} invoice={Invoice} />
        ) : (
          <Formik
            initialValues={{ ...formInitialValues }}
            validationSchema={currentValidationSchema}
            onSubmit={_handleSubmit}
          >
            {({ isSubmitting, setFieldValue, values }) => (
              <Form id={formId}>
                {_renderStepContent(activeStep, setFieldValue, values)}

                <div className={classes.buttons}>
                  {activeStep > 0 && (
                    <Button
                      type="button"
                      onClick={_handleBack}
                      className={classes.button}
                    >
                      {i18n.t("checkoutPage.BACK")}
                    </Button>
                  )}
                  <div className={classes.wrapper}>
                    {activeStep > 0 && (
                      <Button
                        disabled={isSubmitting}
                        type="submit"
                        variant="contained"
                        color="primary"
                        className={classes.button}
                      >
                        {isLastStep
                          ? i18n.t("checkoutPage.PAY_PIX")
                          : i18n.t("checkoutPage.NEXT")}
                      </Button>
                    )}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />
                    )}
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}

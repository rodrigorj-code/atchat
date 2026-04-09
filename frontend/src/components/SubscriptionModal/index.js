import React, { useEffect, useRef } from "react";


import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Typography from "@material-ui/core/Typography";
import Alert from "@material-ui/lab/Alert";
import CheckoutPage from "../CheckoutPage/";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyAlert: {
    width: "100%",
    "& .MuiAlert-message": {
      width: "100%",
    },
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));


const ContactModal = ({ open, onClose, Invoice }) => {
  const classes = useStyles();
  const isMounted = useRef(true);


  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);


  const handleClose = () => {
    onClose();
  };

  return (
    <div className={classes.root}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle id="financeiro-checkout-pix-title">
          {i18n.t("checkoutPage.modalTitle")}
        </DialogTitle>
        <DialogContent dividers>
          {Invoice && Invoice.id ? (
            <CheckoutPage Invoice={Invoice} />
          ) : (
            <Alert severity="info" variant="outlined" className={classes.emptyAlert}>
              <Typography variant="body2" component="p">
                {i18n.t("checkoutPage.noInvoice")}
              </Typography>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactModal;

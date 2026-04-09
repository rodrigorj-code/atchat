import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormHelperText,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import useCompanies from "../../hooks/useCompanies";
import { getIanaTimezones } from "../../utils/ianaTimezones";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  contextAlert: {
    marginBottom: theme.spacing(2),
    width: "100%",
    "& .MuiAlert-message": {
      width: "100%",
    },
  },
  contextAlertBody: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
  saveButton: {
    marginTop: theme.spacing(1.5),
  },
}));

const DEFAULT_TZ = "America/Sao_Paulo";

export default function CompanyTimezoneSettings({ company, onSaved }) {
  const classes = useStyles();
  const { updateTimezone } = useCompanies();
  const [tz, setTz] = useState(DEFAULT_TZ);
  const [saving, setSaving] = useState(false);
  const zones = useMemo(() => getIanaTimezones(), []);

  useEffect(() => {
    setTz(company?.timezone || DEFAULT_TZ);
  }, [company?.id, company?.timezone]);

  const handleSave = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      const updated = await updateTimezone(company.id, tz);
      if (typeof onSaved === "function") {
        onSaved(updated);
      }
      toast.success(i18n.t("settings.company.toasts.success"));
    } catch (err) {
      toastError(err);
    }
    setSaving(false);
  };

  if (!company?.id) {
    return null;
  }

  return (
    <Paper className={classes.root} variant="outlined">
      <Typography variant="subtitle1" gutterBottom>
        {i18n.t("settings.company.form.timezone")}
      </Typography>
      <Alert severity="info" variant="outlined" className={classes.contextAlert}>
        <Box className={classes.contextAlertBody}>
          <Typography variant="body2" component="p">
            {i18n.t("settings.company.form.timezoneHint")}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            {i18n.t("settings.company.form.timezoneFooter")}
          </Typography>
        </Box>
      </Alert>
      <FormControl variant="outlined" fullWidth margin="dense">
        <InputLabel id="company-timezone-label">
          {i18n.t("settings.company.form.timezone")}
        </InputLabel>
        <Select
          labelId="company-timezone-label"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          label={i18n.t("settings.company.form.timezone")}
        >
          {zones.map((z) => (
            <MenuItem key={z} value={z}>
              {z}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {i18n.t("settings.company.form.timezoneHelperField")}
        </FormHelperText>
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        disabled={saving}
        onClick={handleSave}
        className={classes.saveButton}
      >
        {i18n.t("settings.company.buttons.saveTimezone")}
      </Button>
    </Paper>
  );
}

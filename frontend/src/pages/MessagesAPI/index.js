import React, { useState, useEffect, useRef } from "react";
import { useHistory, Link as RouterLink } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Divider from "@material-ui/core/Divider";
import Box from "@material-ui/core/Box";

import { i18n } from "../../translate/i18n";
import {
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  IconButton,
  InputAdornment
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import axios from "axios";
import usePlans from "../../hooks/usePlans";
import { getBackendBaseURL } from "../../config/backendUrl";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4)
  },
  section: {
    marginBottom: theme.spacing(3)
  },
  sectionTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 600
  },
  formContainer: {
    width: "100%",
    maxWidth: "100%",
  },
  textRight: {
    textAlign: "right"
  },
  buttonProgress: {
    marginRight: theme.spacing(1)
  },
  mono: {
    fontFamily: "monospace",
    fontSize: "0.85rem",
    wordBreak: "break-all"
  },
  endpointField: {
    marginTop: theme.spacing(1)
  },
  responseList: {
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(2)
  },
  testCard: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  }
}));

const emptyTextForm = { token: "", number: "", body: "" };
const emptyMediaForm = { token: "", number: "" };

const MessagesAPI = () => {
  const classes = useStyles();
  const history = useHistory();
  const mediaInputRef = useRef(null);

  const [formMessageTextData] = useState(emptyTextForm);
  const [formMessageMediaData] = useState(emptyMediaForm);
  const [file, setFile] = useState(null);
  const [lastTextResult, setLastTextResult] = useState(null);
  const [lastMediaResult, setLastMediaResult] = useState(null);

  const { getPlanCompany } = usePlans();

  const getEndpoint = () => `${getBackendBaseURL()}/api/messages/send`;

  const copyEndpoint = () => {
    const url = getEndpoint();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success(i18n.t("messagesAPI.copySuccess"));
      });
    }
  };

  const formatApiError = (err) => {
    const data = err?.response?.data;
    const status = err?.response?.status;
    if (data && typeof data.error === "string") {
      const code = data.error;
      const detail = data.message;
      const translated = i18n.exists(`backendErrors.${code}`)
        ? i18n.t(`backendErrors.${code}`)
        : code;
      return {
        ok: false,
        status,
        code,
        summary: translated,
        detail: detail || null
      };
    }
    return {
      ok: false,
      status,
      code: null,
      summary: err?.message || i18n.t("errors.generic"),
      detail: null
    };
  };

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem("companyId");
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useExternalApi) {
        toast.error(i18n.t("messagesAPI.toasts.unauthorized"));
        setTimeout(() => {
          history.push(`/`);
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendTextMessage = async (values) => {
    setLastTextResult(null);
    const data = { number: values.number, body: values.body };
    try {
      const res = await axios.request({
        url: getEndpoint(),
        method: "POST",
        data,
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${values.token}`
        }
      });
      setLastTextResult({
        ok: true,
        status: res.status,
        body: res.data
      });
      toast.success(i18n.t("messagesAPI.toasts.success"));
      return true;
    } catch (err) {
      const parsed = formatApiError(err);
      setLastTextResult(parsed);
      toastError(err);
      return false;
    }
  };

  const handleSendMediaMessage = async (values) => {
    setLastMediaResult(null);
    const firstFile = file && file[0];
    if (!firstFile) {
      return false;
    }
    const data = new FormData();
    data.append("number", values.number);
    data.append("body", firstFile.name);
    data.append("medias", firstFile);
    try {
      const res = await axios.request({
        url: getEndpoint(),
        method: "POST",
        data,
        headers: {
          "Content-type": "multipart/form-data",
          Authorization: `Bearer ${values.token}`
        }
      });
      setLastMediaResult({
        ok: true,
        status: res.status,
        body: res.data
      });
      toast.success(i18n.t("messagesAPI.toasts.success"));
      return true;
    } catch (err) {
      const parsed = formatApiError(err);
      setLastMediaResult(parsed);
      toastError(err);
      return false;
    }
  };

  const renderResultAlert = (result) => {
    if (!result) {
      return (
        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            {i18n.t("messagesAPI.test.noResultYet")}
          </Typography>
        </Box>
      );
    }
    if (result.ok) {
      return (
        <Box mt={2}>
          <Alert severity="success">
            <Typography variant="body2">
              {i18n.t("messagesAPI.test.resultOk", {
              status: result.status
            })}
            </Typography>
            {result.body && (
              <Typography variant="caption" component="pre" className={classes.mono}>
                {typeof result.body === "object"
                  ? JSON.stringify(result.body, null, 2)
                  : String(result.body)}
              </Typography>
            )}
          </Alert>
        </Box>
      );
    }
    return (
      <Box mt={2}>
        <Alert severity="error">
          <Typography variant="body2">
            {result.status != null
              ? i18n.t("messagesAPI.test.resultErrStatus", { status: result.status })
              : i18n.t("messagesAPI.test.resultErr")}
          </Typography>
          {result.code && (
            <Typography variant="body2" className={classes.mono}>
              {result.code}
            </Typography>
          )}
          {result.summary && (
            <Typography variant="body2">{result.summary}</Typography>
          )}
          {result.detail && (
            <Typography variant="caption" color="textSecondary" display="block">
              {result.detail}
            </Typography>
          )}
        </Alert>
      </Box>
    );
  };

  const renderFormMessageText = () => (
    <Formik
      initialValues={formMessageTextData}
      enableReinitialize
      onSubmit={async (values, actions) => {
        const ok = await handleSendTextMessage(values);
        actions.setSubmitting(false);
        if (ok) {
          actions.resetForm({ values: emptyTextForm });
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className={classes.formContainer}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {i18n.t("messagesAPI.test.endpointReadonly")}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={getEndpoint()}
                InputProps={{ readOnly: true }}
                className={classes.endpointField}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.textMessage.token")}
                name="token"
                placeholder={i18n.t("messagesAPI.textMessage.tokenPlaceholder")}
                helperText={i18n.t("messagesAPI.textMessage.tokenHelper")}
                variant="outlined"
                margin="dense"
                fullWidth
                required
                type="password"
                autoComplete="off"
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.textMessage.number")}
                name="number"
                placeholder={i18n.t("messagesAPI.textMessage.numberPlaceholder")}
                helperText={i18n.t("messagesAPI.textMessage.numberHelper")}
                variant="outlined"
                margin="dense"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.textMessage.body")}
                name="body"
                variant="outlined"
                margin="dense"
                fullWidth
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} className={classes.textRight}>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={22} className={classes.buttonProgress} />
                ) : null}
                {i18n.t("messagesAPI.buttons.send")}
              </Button>
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  );

  const renderFormMessageMedia = () => (
    <Formik
      initialValues={formMessageMediaData}
      enableReinitialize
      onSubmit={async (values, actions) => {
        if (!file || !file[0]) {
          toast.error(i18n.t("messagesAPI.mediaMessage.fileRequired"));
          actions.setSubmitting(false);
          return;
        }
        const ok = await handleSendMediaMessage(values);
        actions.setSubmitting(false);
        if (ok) {
          actions.resetForm({ values: emptyMediaForm });
          setFile(null);
          if (mediaInputRef.current) {
            mediaInputRef.current.value = "";
          }
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className={classes.formContainer}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {i18n.t("messagesAPI.test.endpointReadonly")}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={getEndpoint()}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.mediaMessage.token")}
                name="token"
                placeholder={i18n.t("messagesAPI.mediaMessage.tokenPlaceholder")}
                helperText={i18n.t("messagesAPI.mediaMessage.tokenHelper")}
                variant="outlined"
                margin="dense"
                fullWidth
                required
                type="password"
                autoComplete="off"
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                label={i18n.t("messagesAPI.mediaMessage.number")}
                name="number"
                placeholder={i18n.t("messagesAPI.mediaMessage.numberPlaceholder")}
                helperText={i18n.t("messagesAPI.mediaMessage.numberHelper")}
                variant="outlined"
                margin="dense"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <input
                type="file"
                name="medias"
                id="messages-api-medias"
                ref={mediaInputRef}
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files)}
              />
              <label htmlFor="messages-api-medias">
                <Button variant="outlined" component="span" color="primary">
                  {i18n.t("messagesAPI.mediaMessage.chooseFile")}
                </Button>
              </label>
              <Typography variant="caption" display="block" color="textSecondary">
                {file && file[0] ? file[0].name : i18n.t("messagesAPI.mediaMessage.noFile")}
              </Typography>
            </Grid>
            <Grid item xs={12} className={classes.textRight}>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={22} className={classes.buttonProgress} />
                ) : null}
                {i18n.t("messagesAPI.buttons.send")}
              </Button>
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  );

  return (
    <MainContainer>
      <MainHeader>
        <Title>{i18n.t("messagesAPI.title")}</Title>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined">
        <Typography variant="body1" color="textSecondary" paragraph>
          {i18n.t("messagesAPI.subtitle")}
        </Typography>

        <Box className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {i18n.t("messagesAPI.sections.overview")}
          </Typography>
          <Typography variant="body2" paragraph>
            {i18n.t("messagesAPI.overviewP1")}
          </Typography>
          <Typography variant="body2" paragraph>
            {i18n.t("messagesAPI.overviewP2")}
          </Typography>
        </Box>

        <Divider />

        <Box className={classes.section} mt={2}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {i18n.t("messagesAPI.sections.token")}
          </Typography>
          <Typography variant="body2" paragraph>
            {i18n.t("messagesAPI.tokenSteps")}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            component={RouterLink}
            to="/connections"
          >
            {i18n.t("messagesAPI.openConnections")}
          </Button>
        </Box>

        <Divider />

        <Box className={classes.section} mt={2}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {i18n.t("messagesAPI.sections.endpoint")}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {i18n.t("messagesAPI.endpointUrlHelp")}
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            margin="dense"
            label={i18n.t("messagesAPI.endpointUrlLabel")}
            value={getEndpoint()}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={copyEndpoint}
                    aria-label="copy"
                  >
                    <FileCopyOutlinedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Typography variant="body2" component="div" style={{ marginTop: 16 }}>
            <strong>{i18n.t("messagesAPI.methodLabel")}:</strong> POST
          </Typography>
          <Typography variant="body2" component="div" style={{ marginTop: 8 }}>
            <strong>{i18n.t("messagesAPI.authTitle")}</strong>
          </Typography>
          <Typography variant="body2" className={classes.mono}>
            {i18n.t("messagesAPI.authLine")}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            {i18n.t("messagesAPI.authHelp")}
          </Typography>
        </Box>

        <Divider />

        <Box className={classes.section} mt={2}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {i18n.t("messagesAPI.sections.requestBodies")}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            {i18n.t("messagesAPI.jsonBodyTitle")}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            {i18n.t("messagesAPI.contentTypeJson")}
          </Typography>
          <Typography variant="body2" className={classes.mono} component="pre" style={{ marginTop: 8 }}>
            {i18n.t("messagesAPI.jsonBodyExample")}
          </Typography>

          <Typography variant="subtitle2" style={{ marginTop: 16 }} gutterBottom>
            {i18n.t("messagesAPI.multipartBodyTitle")}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            {i18n.t("messagesAPI.contentTypeMultipart")}
          </Typography>
          <Typography variant="body2" paragraph style={{ marginTop: 8 }}>
            {i18n.t("messagesAPI.multipartFields")}
          </Typography>

          <Typography variant="subtitle2" style={{ marginTop: 8 }} gutterBottom>
            {i18n.t("messagesAPI.numberFormatTitle")}
          </Typography>
          <Typography variant="body2">{i18n.t("messagesAPI.numberFormatText")}</Typography>
        </Box>

        <Divider />

        <Box className={classes.section} mt={2}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {i18n.t("messagesAPI.sections.responses")}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {i18n.t("messagesAPI.responsesIntro")}
          </Typography>
          <ul className={classes.responseList}>
            <li>
              <Typography variant="body2">{i18n.t("messagesAPI.responses.r200")}</Typography>
            </li>
            <li>
              <Typography variant="body2">{i18n.t("messagesAPI.responses.r401")}</Typography>
            </li>
            <li>
              <Typography variant="body2">{i18n.t("messagesAPI.responses.r403")}</Typography>
            </li>
            <li>
              <Typography variant="body2">{i18n.t("messagesAPI.responses.r429")}</Typography>
            </li>
            <li>
              <Typography variant="body2">{i18n.t("messagesAPI.responses.r400")}</Typography>
            </li>
          </ul>
        </Box>

        <Divider />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper className={classes.testCard} variant="outlined">
              <Typography variant="h6" className={classes.sectionTitle}>
                {i18n.t("messagesAPI.sections.testText")}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {i18n.t("messagesAPI.test.textIntro")}
              </Typography>
              {renderFormMessageText()}
              {renderResultAlert(lastTextResult)}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper className={classes.testCard} variant="outlined">
              <Typography variant="h6" className={classes.sectionTitle}>
                {i18n.t("messagesAPI.sections.testMedia")}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {i18n.t("messagesAPI.test.mediaIntro")}
              </Typography>
              {renderFormMessageMedia()}
              {renderResultAlert(lastMediaResult)}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </MainContainer>
  );
};

export default MessagesAPI;

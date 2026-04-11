import React, { useCallback, useEffect, useState } from "react";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import Chip from "@material-ui/core/Chip";
import { makeStyles } from "@material-ui/core/styles";
import GetAppIcon from "@material-ui/icons/GetApp";
import BackupIcon from "@material-ui/icons/Backup";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";

import MainContainer from "../../components/MainContainer";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  AppPageHeader,
  AppSectionCard,
  AppActionBar,
  AppPrimaryButton,
  AppSecondaryButton,
  AppLoadingState,
  AppEmptyState,
} from "../../ui";
import AppTableContainer from "../../ui/components/AppTableContainer";

const CONFIRM = "RESTAURAR";

const useStyles = makeStyles((theme) => ({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
    width: "100%",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: theme.palette.text.secondary,
  },
  hint: {
    marginTop: theme.spacing(1),
    fontSize: "0.8125rem",
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    maxWidth: 720,
  },
  restoreBox: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    maxWidth: 520,
  },
}));

function formatBytes(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PlatformBackup() {
  const classes = useStyles();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [restoreToken, setRestoreToken] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [restoreExecuting, setRestoreExecuting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/platform/backups");
      setBackups(Array.isArray(data?.backups) ? data.backups : []);
    } catch (e) {
      toastError(e);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/platform/backups/generate");
      toast.success(i18n.t("platform.backup.toasts.generated"));
      await load();
    } catch (e) {
      toastError(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const { data } = await api.get(`/platform/backups/download/${encodeURIComponent(fileName)}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toastError(e);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setRestoreToken(null);
    setRestorePreview(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/platform/backups/prepare-restore", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRestoreToken(data.restoreToken);
      setRestorePreview(data.preview);
      toast.success(i18n.t("platform.backup.toasts.uploadValidated"));
    } catch (err) {
      toastError(err);
    } finally {
      setUploading(false);
    }
  };

  const openRestoreConfirm = () => {
    if (!restoreToken) return;
    if (confirmPhrase.trim() !== CONFIRM) {
      toast.error(i18n.t("platform.backup.restoreConfirmError"));
      return;
    }
    setConfirmOpen(true);
  };

  const executeRestore = async () => {
    setRestoreExecuting(true);
    try {
      const { data } = await api.post("/platform/backups/execute-restore", {
        restoreToken,
        confirmPhrase: confirmPhrase.trim(),
      });
      toast.success(data?.message || i18n.t("platform.backup.toasts.restored"));
      setConfirmOpen(false);
      setRestoreToken(null);
      setRestorePreview(null);
      setConfirmPhrase("");
      await load();
    } catch (e) {
      toastError(e);
    } finally {
      setRestoreExecuting(false);
    }
  };

  const header = (
    <>
      <Typography variant="overline" color="textSecondary" display="block" style={{ letterSpacing: "0.06em", marginBottom: 4 }}>
        {i18n.t("platform.shell.eyebrow")}
      </Typography>
      <Typography variant="h5" component="h1" color="primary" style={{ fontWeight: 600 }}>
        {i18n.t("platform.backup.title")}
      </Typography>
    </>
  );

  const subtitle = (
    <Typography variant="body2" color="textSecondary" component="p" style={{ margin: 0, maxWidth: 800 }}>
      {i18n.t("platform.backup.subtitle")}
    </Typography>
  );

  return (
    <MainContainer>
      <Box className={classes.page}>
        <AppPageHeader title={header} subtitle={subtitle} />

        <Typography style={{ fontWeight: 600, fontSize: "1.0625rem" }}>
          {i18n.t("platform.backup.sectionGenerate")}
        </Typography>
        <Typography className={classes.hint} style={{ marginBottom: 12 }}>
          {i18n.t("platform.backup.sectionGenerateHint")}
        </Typography>

        <AppSectionCard>
          <AppActionBar style={{ marginBottom: 8 }}>
            <AppPrimaryButton
              startIcon={<BackupIcon />}
              onClick={handleGenerate}
              disabled={generating}
              loading={generating}
            >
              {i18n.t("platform.backup.generate")}
            </AppPrimaryButton>
          </AppActionBar>
          <Typography className={classes.hint}>{i18n.t("platform.backup.generateHint")}</Typography>
        </AppSectionCard>

        <Typography style={{ fontWeight: 600, fontSize: "1.0625rem" }}>
          {i18n.t("platform.backup.sectionList")}
        </Typography>

        {loading ? (
          <AppLoadingState message={i18n.t("platform.backup.loading")} />
        ) : backups.length === 0 ? (
          <AppEmptyState title={i18n.t("platform.backup.empty")} description={i18n.t("platform.backup.emptyHint")} />
        ) : (
          <AppTableContainer nested>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHead}>{i18n.t("platform.backup.colDate")}</TableCell>
                  <TableCell className={classes.tableHead}>{i18n.t("platform.backup.colFile")}</TableCell>
                  <TableCell className={classes.tableHead} align="right">
                    {i18n.t("platform.backup.colSize")}
                  </TableCell>
                  <TableCell className={classes.tableHead}>{i18n.t("platform.backup.colStatus")}</TableCell>
                  <TableCell className={classes.tableHead} align="right">
                    {i18n.t("platform.backup.colActions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((b) => (
                  <TableRow key={b.fileName}>
                    <TableCell>{b.createdAt ? new Date(b.createdAt).toLocaleString(i18n.language) : "—"}</TableCell>
                    <TableCell style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{b.fileName}</TableCell>
                    <TableCell align="right">{formatBytes(b.sizeBytes)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          b.status === "ok"
                            ? i18n.t("platform.backup.statusOk")
                            : i18n.t("platform.backup.statusInvalid")
                        }
                        color={b.status === "ok" ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <AppSecondaryButton
                        size="small"
                        startIcon={<GetAppIcon />}
                        onClick={() => handleDownload(b.fileName)}
                        disabled={b.status !== "ok"}
                      >
                        {i18n.t("platform.backup.download")}
                      </AppSecondaryButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AppTableContainer>
        )}

        <Typography style={{ fontWeight: 600, fontSize: "1.0625rem", marginTop: 8 }}>
          {i18n.t("platform.backup.sectionRestore")}
        </Typography>
        <Typography className={classes.hint} style={{ marginBottom: 16 }}>
          {i18n.t("platform.backup.restoreIntro")}
        </Typography>

        <AppSectionCard>
          <Box className={classes.restoreBox}>
            <input
              accept=".zip,application/zip"
              style={{ display: "none" }}
              id="backup-restore-upload"
              type="file"
              onChange={handleFile}
            />
            <label htmlFor="backup-restore-upload">
              <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} disabled={uploading}>
                {i18n.t("platform.backup.selectFile")}
              </Button>
            </label>
            {restorePreview ? (
              <Box>
                <Typography variant="subtitle2">{i18n.t("platform.backup.previewTitle")}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {i18n.t("platform.backup.previewDb", { name: restorePreview.dbName || "—" })}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {i18n.t("platform.backup.previewDialect", { d: restorePreview.dbDialect || "—" })}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {i18n.t("platform.backup.previewVersion", { v: restorePreview.appVersion || "—" })}
                </Typography>
              </Box>
            ) : null}
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label={i18n.t("platform.backup.confirmLabel")}
              placeholder={CONFIRM}
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              helperText={i18n.t("platform.backup.confirmHelper")}
            />
            <AppPrimaryButton
              onClick={openRestoreConfirm}
              disabled={!restoreToken || restoreExecuting || uploading}
              loading={restoreExecuting}
            >
              {i18n.t("platform.backup.restoreButton")}
            </AppPrimaryButton>
          </Box>
        </AppSectionCard>

        <Typography className={classes.hint}>{i18n.t("platform.backup.futureHint")}</Typography>
      </Box>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeRestore}
        title={i18n.t("platform.backup.modalTitle")}
        confirmText={i18n.t("platform.backup.modalConfirm")}
        destructive
      >
        {i18n.t("platform.backup.modalBody")}
      </ConfirmationModal>
    </MainContainer>
  );
}

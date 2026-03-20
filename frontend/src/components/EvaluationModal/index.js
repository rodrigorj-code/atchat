import React, { useState, useContext } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Typography,
  makeStyles,
} from "@material-ui/core";

import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import StarIcon from "@material-ui/icons/Star";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";

import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      minWidth: 520,
      maxWidth: 560,
      borderRadius: 12,
      overflow: "hidden",
    },
  },
  header: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: theme.spacing(2, 3),
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  tabs: {
    borderBottom: "1px solid rgba(0,0,0,0.12)",
    "& .MuiTab-root": {
      textTransform: "uppercase",
      fontWeight: 600,
      fontSize: "0.75rem",
    },
  },
  tabIndicator: {
    backgroundColor: "#e91e63",
    height: 3,
  },
  content: {
    padding: theme.spacing(3),
    minHeight: 280,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing(2),
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  optionNameInput: {
    flex: 1,
  },
  optionValueInput: {
    width: 80,
  },
  addOptionBtn: {
    width: "100%",
    border: "1px dashed rgba(0,0,0,0.23)",
    borderRadius: 8,
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    textTransform: "none",
    color: "rgba(0,0,0,0.6)",
    "&:hover": {
      borderColor: "#e91e63",
      color: "#e91e63",
      backgroundColor: "rgba(233, 30, 99, 0.04)",
    },
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1.5, 2),
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
    marginBottom: theme.spacing(2),
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  previewBox: {
    border: "2px solid #1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewWhatsAppHeader: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  previewContent: {
    backgroundColor: "#e5ddd5",
    padding: theme.spacing(2),
    minHeight: 200,
  },
  previewBubble: {
    backgroundColor: "#dcf8c6",
    borderRadius: 8,
    padding: theme.spacing(2),
    maxWidth: "85%",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  previewUserName: {
    fontWeight: 700,
    fontSize: "0.9rem",
    marginBottom: 4,
  },
  previewTime: {
    fontSize: "0.7rem",
    color: "rgba(0,0,0,0.5)",
    textAlign: "right",
    marginTop: 4,
  },
  previewOptions: {
    marginTop: theme.spacing(1.5),
  },
  previewOptionLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: 8,
  },
  previewOptionChip: {
    display: "inline-block",
    backgroundColor: "#fff",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 6,
    padding: "6px 12px",
    margin: "4px 4px 4px 0",
    fontSize: "0.85rem",
  },
  footer: {
    padding: theme.spacing(2, 3),
    borderTop: "1px solid rgba(0,0,0,0.08)",
  },
  cancelBtn: {
    borderColor: "#e91e63",
    color: "#e91e63",
    "&:hover": {
      borderColor: "#c2185b",
      color: "#c2185b",
      backgroundColor: "rgba(233, 30, 99, 0.04)",
    },
  },
  createBtn: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#333",
    },
  },
}));

const DEFAULT_OPTIONS = [
  { name: "Ruim", value: 1 },
  { name: "Regular", value: 2 },
  { name: "Bom", value: 3 },
  { name: "Muito Bom", value: 4 },
  { name: "Excelente", value: 5 },
];

const EvaluationModal = ({ open, onClose, onSave }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [tab, setTab] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState([...DEFAULT_OPTIONS]);

  const handleClose = () => {
    onClose();
    setName("");
    setMessage("");
    setOptions([...DEFAULT_OPTIONS]);
    setTab(0);
  };

  const handleAddOption = () => {
    const maxVal = options.length > 0 ? Math.max(...options.map((o) => o.value)) : 0;
    setOptions([...options, { name: "", value: maxVal + 1 }]);
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: field === "value" ? Number(value) || 0 : value };
    setOptions(newOptions);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(i18n.t("evaluationModal.errors.nameRequired", "Informe o nome da avaliação"));
      return;
    }
    const validOptions = options.filter((o) => o.name?.trim());
    if (validOptions.length === 0) {
      toast.error(i18n.t("evaluationModal.errors.optionsRequired", "Adicione pelo menos uma opção"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/rating-templates", {
        name: name.trim(),
        message: message.trim() || i18n.t("evaluationModal.defaultMessage", "Avalie nosso atendimento:"),
        options: validOptions,
      });
      toast.success(i18n.t("evaluationModal.created", "Avaliação criada com sucesso"));
      handleClose();
      onSave?.();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => user?.name || "Usuário";

  const currentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} className={classes.dialog}>
      <div className={classes.header}>
        <StarIcon style={{ fontSize: 22 }} />
        <Typography className={classes.headerTitle}>
          {i18n.t("evaluationModal.title", "Criar Nova Avaliação")}
        </Typography>
      </div>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        className={classes.tabs}
        TabIndicatorProps={{ className: classes.tabIndicator }}
      >
        <Tab label={i18n.t("evaluationModal.tabBasic", "Configuração Básica")} />
        <Tab label={i18n.t("evaluationModal.tabOptions", "Opções de Avaliação")} />
        <Tab label={i18n.t("evaluationModal.tabPreview", "Preview")} />
      </Tabs>

      <DialogContent className={classes.content}>
        {tab === 0 && (
          <>
            <div className={classes.sectionTitle}>
              <ChatBubbleOutlineIcon fontSize="small" />
              {i18n.t("evaluationModal.basicInfo", "Informações Básicas")}
            </div>
            <TextField
              fullWidth
              label={i18n.t("evaluationModal.nameLabel", "Nome da Avaliação")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="outlined"
              margin="normal"
              placeholder={i18n.t("evaluationModal.namePlaceholder", "Nome da Avaliação")}
            />
            <TextField
              fullWidth
              label={i18n.t("evaluationModal.messageLabel", "Mensagem")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="outlined"
              margin="normal"
              multiline
              rows={4}
              placeholder={i18n.t("evaluationModal.messagePlaceholder", "Mensagem que será enviada para o cliente")}
            />
          </>
        )}

        {tab === 1 && (
          <>
            <div className={classes.sectionTitle}>
              <StarIcon fontSize="small" style={{ color: "#e91e63" }} />
              {i18n.t("evaluationModal.optionsTitle", "Opções de Avaliação")}
            </div>
            {options.map((opt, index) => (
              <div key={index} className={classes.optionRow}>
                <TextField
                  className={classes.optionNameInput}
                  label={i18n.t("evaluationModal.optionName", "Nome da Opção")}
                  value={opt.name}
                  onChange={(e) => handleOptionChange(index, "name", e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  className={classes.optionValueInput}
                  label={i18n.t("evaluationModal.optionValue", "Valor")}
                  type="number"
                  value={opt.value}
                  onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveOption(index)}
                  style={{ color: "#e91e63" }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </div>
            ))}
            <Button
              fullWidth
              variant="outlined"
              className={classes.addOptionBtn}
              onClick={handleAddOption}
            >
              + {i18n.t("evaluationModal.addOption", "Adicionar Opção")}
            </Button>
          </>
        )}

        {tab === 2 && (
          <>
            <div className={classes.previewHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <VisibilityIcon fontSize="small" />
                <Typography variant="subtitle2">
                  {i18n.t("evaluationModal.previewTitle", "Preview da Avaliação")}
                </Typography>
              </div>
              <Button
                size="small"
                onClick={() => setShowPreview(!showPreview)}
                style={{ textTransform: "uppercase", fontSize: "0.7rem" }}
              >
                {showPreview
                  ? i18n.t("evaluationModal.hidePreview", "Ocultar Preview")
                  : i18n.t("evaluationModal.showPreview", "Mostrar Preview")}
              </Button>
            </div>
            {showPreview && (
              <div className={classes.previewBox}>
                <div className={classes.previewWhatsAppHeader}>
                  <ChatBubbleOutlineIcon style={{ fontSize: 18 }} />
                  {i18n.t("evaluationModal.previewWhatsApp", "Preview - Mensagem WhatsApp")}
                </div>
                <div className={classes.previewContent}>
                  <div className={classes.previewBubble}>
                    <div className={classes.previewUserName}>{getUserName()}</div>
                    <div>
                      {message.trim() || i18n.t("evaluationModal.defaultMessage", "Mensagem da avaliação")}
                    </div>
                    <div className={classes.previewTime}>{currentTime()}</div>
                    <div className={classes.previewOptions}>
                      <div className={classes.previewOptionLabel}>
                        {i18n.t("evaluationModal.previewOptionsLabel", "Opções de Avaliação:")}
                      </div>
                      {options
                        .filter((o) => o.name?.trim())
                        .sort((a, b) => a.value - b.value)
                        .map((opt, i) => (
                          <span key={i} className={classes.previewOptionChip}>
                            {opt.value} - {opt.name}
                          </span>
                        ))}
                      {options.filter((o) => o.name?.trim()).length === 0 && (
                        <span className={classes.previewOptionChip} style={{ color: "#999" }}>
                          1 - Ruim, 2 - Regular, ...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions className={classes.footer}>
        <Button onClick={handleClose} variant="outlined" className={classes.cancelBtn}>
          {i18n.t("evaluationModal.cancel", "Cancelar")}
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          className={classes.createBtn}
          disabled={loading}
        >
          {loading ? "..." : i18n.t("evaluationModal.create", "Criar Avaliação")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EvaluationModal;

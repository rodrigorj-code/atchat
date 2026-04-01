import React, { useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";

import { Stack, Typography } from "@mui/material";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { readFlowImportFromFile } from "../../flowBuilderTemplates/flowImportExport";

/**
 * Botão "Importar fluxo" + input de arquivo + confirmação do nome.
 */
const FlowBuilderImportFlowModal = () => {
  const history = useHistory();
  const fileRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [pending, setPending] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickFile = () => {
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await readFlowImportFromFile(file);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPending({
      nodes: result.nodes,
      connections: result.connections,
    });
    setFlowName(result.name);
    setConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    if (!submitting) {
      setConfirmOpen(false);
      setPending(null);
    }
  };

  const handleConfirmImport = async () => {
    const name = (flowName || "").trim();
    if (name.length < 2) {
      toast.error("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    if (!pending) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/flowbuilder", { name });
      const flowId = data?.id;
      if (!flowId) {
        toast.error("Não foi possível obter o ID do fluxo criado.");
        return;
      }
      await api.post("/flowbuilder/flow", {
        idFlow: flowId,
        nodes: pending.nodes,
        connections: pending.connections,
      });
      toast.success("Fluxo importado. Revise os nós e salve se necessário.");
      setConfirmOpen(false);
      setPending(null);
      history.push(`/flowbuilder/${flowId}`);
    } catch (err) {
      if (err.response?.status === 402) {
        toast.error("Já existe um fluxo com esse nome. Escolha outro.");
      } else {
        toastError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={onFileChange}
      />
      <Button
        variant="outlined"
        color="primary"
        onClick={handlePickFile}
        sx={{ textTransform: "none" }}
      >
        Importar fluxo
      </Button>

      <Dialog open={confirmOpen} onClose={handleCloseConfirm} fullWidth maxWidth="xs">
        <DialogTitle>Confirmar importação</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Será criado um novo fluxo com os nós e conexões do arquivo. Ajuste setores, listas e
              integrações após abrir o editor.
            </Typography>
            <TextField
              label="Nome do novo fluxo"
              fullWidth
              variant="outlined"
              size="small"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              helperText="Este nome aparece na lista de fluxos."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} color="secondary" variant="outlined" disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmImport} color="primary" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={22} color="inherit" /> : "Importar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FlowBuilderImportFlowModal;

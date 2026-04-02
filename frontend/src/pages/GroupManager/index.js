import React, { useState, useCallback, useContext, useMemo, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Tooltip from "@material-ui/core/Tooltip";
import Chip from "@material-ui/core/Chip";
import LinearProgress from "@material-ui/core/LinearProgress";

import RefreshIcon from "@material-ui/icons/Refresh";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import SearchIcon from "@material-ui/icons/Search";
import GroupIcon from "@material-ui/icons/Group";
import ForumIcon from "@material-ui/icons/Forum";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: 12,
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(2),
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
  connectionSelect: {
    minWidth: 260,
  },
  tabPanel: {
    paddingTop: theme.spacing(2),
  },
  emptyWrap: {
    textAlign: "center",
    padding: theme.spacing(5, 2),
    color: theme.palette.text.secondary,
  },
  emptyIcon: {
    fontSize: 56,
    opacity: 0.35,
    marginBottom: theme.spacing(1),
  },
  groupCard: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create(["box-shadow", "border-color"], {
      duration: theme.transitions.duration.shorter,
    }),
    "&:hover": {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[2],
    },
  },
  cardTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  cardMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  adminLine: {
    fontSize: "0.8125rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    lineHeight: 1.45,
  },
  jidHint: {
    fontSize: "0.75rem",
    color: theme.palette.text.disabled,
    marginTop: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  leaveDialogPaper: {
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
  },
  leaveDialogTitle: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },
  leaveDialogActions: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  listGrid: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
  },
}));

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <div role="tabpanel">{children}</div>;
}

const GroupManager = () => {
  const classes = useStyles();
  const history = useHistory();
  const { whatsApps, loading: loadingWhats } = useContext(WhatsAppsContext);

  const [whatsappId, setWhatsappId] = useState("");
  const [tab, setTab] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState("");

  const [createName, setCreateName] = useState("");
  const [createParticipants, setCreateParticipants] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteInput, setInviteInput] = useState("");
  const [joining, setJoining] = useState(false);

  const [leaveModal, setLeaveModal] = useState({ open: false, group: null });
  const [leaving, setLeaving] = useState(false);
  const [openingGroupId, setOpeningGroupId] = useState(null);

  const connectedList = useMemo(
    () =>
      (Array.isArray(whatsApps) ? whatsApps : []).filter((w) => w.status === "CONNECTED"),
    [whatsApps]
  );

  const fetchGroups = useCallback(async () => {
    if (!whatsappId) {
      setGroups([]);
      return;
    }
    setLoadingList(true);
    try {
      const { data } = await api.get(`/groups/${whatsappId}`);
      setGroups(Array.isArray(data.groups) ? data.groups : []);
    } catch (err) {
      toastError(err);
      setGroups([]);
    } finally {
      setLoadingList(false);
    }
  }, [whatsappId]);

  useEffect(() => {
    if (whatsappId) {
      fetchGroups();
    } else {
      setGroups([]);
    }
  }, [whatsappId, fetchGroups]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        (g.name || "").toLowerCase().includes(q) ||
        (g.id || "").toLowerCase().includes(q)
    );
  }, [groups, search]);

  const handleOpenConversation = async (g) => {
    if (!whatsappId) {
      toast.warning("Selecione uma conexão WhatsApp.");
      return;
    }
    setOpeningGroupId(g.id);
    try {
      const { data } = await api.post("/groups/open-conversation", {
        whatsappId: Number(whatsappId),
        groupId: g.id,
      });
      if (data?.uuid) {
        toast.success("Abrindo conversa do grupo…");
        history.push(`/tickets/${data.uuid}?inboxTab=groups`);
      }
    } catch (err) {
      toastError(err);
    } finally {
      setOpeningGroupId(null);
    }
  };

  const handleCreate = async () => {
    if (!whatsappId) {
      toast.warning("Selecione uma conexão WhatsApp.");
      return;
    }
    const lines = createParticipants
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!createName.trim() || lines.length < 1) {
      toast.warning("Informe o nome do grupo e pelo menos um número.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/groups/create", {
        whatsappId: Number(whatsappId),
        name: createName.trim(),
        participants: lines,
      });
      toast.success("Grupo criado com sucesso.");
      setCreateName("");
      setCreateParticipants("");
      setTab(0);
      await fetchGroups();
    } catch (err) {
      toastError(err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!whatsappId) {
      toast.warning("Selecione uma conexão WhatsApp.");
      return;
    }
    if (!inviteInput.trim()) {
      toast.warning("Cole o link ou o código do convite.");
      return;
    }
    setJoining(true);
    try {
      await api.post("/groups/join", {
        whatsappId: Number(whatsappId),
        inviteCode: inviteInput.trim(),
      });
      toast.success("Entrada no grupo processada.");
      setInviteInput("");
      setTab(0);
      await fetchGroups();
    } catch (err) {
      toastError(err);
    } finally {
      setJoining(false);
    }
  };

  const confirmLeave = async () => {
    const g = leaveModal.group;
    if (!g || !whatsappId) return;
    setLeaving(true);
    try {
      await api.post("/groups/leave", {
        whatsappId: Number(whatsappId),
        groupId: g.id,
      });
      toast.success("Você saiu do grupo.");
      setLeaveModal({ open: false, group: null });
      await fetchGroups();
    } catch (err) {
      toastError(err);
    } finally {
      setLeaving(false);
    }
  };

  const renderAdminSummary = (g) => {
    const count = g.adminCount ?? 0;
    const preview = Array.isArray(g.adminPreview) ? g.adminPreview : [];
    if (count === 0) return "Sem administradores listados.";
    if (preview.length === 0) {
      return `${count} admin(s) — nomes não disponíveis no WhatsApp.`;
    }
    const more = count > preview.length ? ` (+${count - preview.length})` : "";
    return `Admins: ${preview.join(", ")}${more}`;
  };

  return (
    <MainContainer>
      <Dialog
        open={leaveModal.open}
        onClose={() => !leaving && setLeaveModal({ open: false, group: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: classes.leaveDialogPaper }}
      >
        <DialogTitle className={classes.leaveDialogTitle} id="gm-leave-title">
          Sair do grupo
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            {leaveModal.group
              ? `Sair de "${leaveModal.group.name || "grupo"}"? Você deixará de receber mensagens deste grupo nesta conexão. Esta ação não pode ser desfeita pelo sistema.`
              : ""}
          </Typography>
        </DialogContent>
        <DialogActions className={classes.leaveDialogActions}>
          <Button
            onClick={() => !leaving && setLeaveModal({ open: false, group: null })}
            disabled={leaving}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmLeave}
            disabled={leaving}
            variant="contained"
            color="secondary"
          >
            {leaving ? <CircularProgress size={22} color="inherit" /> : "Sair do grupo"}
          </Button>
        </DialogActions>
      </Dialog>

      <MainHeader>
        <Title>Gerenciar grupos (WhatsApp)</Title>
      </MainHeader>

      <Paper className={classes.paper} elevation={0}>
        <Typography variant="body2" color="textSecondary" paragraph>
          Gerencie grupos da conexão selecionada. Não cria tickets nem dispara automações — apenas comandos
          nativos do WhatsApp. A abertura de conversa na inbox só cria/atualiza o registro operacional do grupo
          (sem chatbot).
        </Typography>
        <div className={classes.filterRow}>
          <FormControl variant="outlined" size="small" className={classes.connectionSelect}>
            <InputLabel id="gm-conn-label">Conexão WhatsApp</InputLabel>
            <Select
              labelId="gm-conn-label"
              label="Conexão WhatsApp"
              value={whatsappId}
              onChange={(e) => setWhatsappId(e.target.value)}
              disabled={loadingWhats}
            >
              <MenuItem value="">
                <em>Selecione</em>
              </MenuItem>
              {connectedList.map((w) => (
                <MenuItem key={w.id} value={String(w.id)}>
                  {w.name || `Conexão ${w.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {loadingWhats && <CircularProgress size={24} />}
        </div>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<GroupIcon />} label="Meus grupos" />
          <Tab label="Criar grupo" />
          <Tab label="Entrar no grupo" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <div className={classes.tabPanel}>
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Buscar por nome ou ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                style={{ minWidth: 240 }}
                disabled={!whatsappId}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={loadingList ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                onClick={fetchGroups}
                disabled={!whatsappId || loadingList}
              >
                Atualizar
              </Button>
            </Box>
            {whatsappId && loadingList && (
              <Box mb={2}>
                <LinearProgress />
                <Typography variant="caption" color="textSecondary" paragraph style={{ marginTop: 8 }}>
                  Carregando grupos da conexão…
                </Typography>
              </Box>
            )}
            {!whatsappId && (
              <div className={classes.emptyWrap}>
                <GroupIcon className={classes.emptyIcon} />
                <Typography variant="body1">Selecione uma conexão WhatsApp conectada</Typography>
                <Typography variant="body2" style={{ marginTop: 8 }}>
                  Depois você verá os grupos em que esta sessão participa.
                </Typography>
              </div>
            )}
            {whatsappId && !loadingList && filteredGroups.length === 0 && (
              <div className={classes.emptyWrap}>
                <ForumIcon className={classes.emptyIcon} />
                <Typography variant="body1">Nenhum grupo encontrado</Typography>
                <Typography variant="body2" style={{ marginTop: 8 }}>
                  Tente &quot;Atualizar&quot;, confira a busca ou verifique se a sessão está conectada e participa de grupos.
                </Typography>
              </div>
            )}
            {whatsappId && !loadingList && filteredGroups.length > 0 && (
              <div className={classes.listGrid}>
                {filteredGroups.map((g) => (
                  <Card key={g.id} className={classes.groupCard} elevation={0}>
                    <CardContent>
                      <Typography className={classes.cardTitle} variant="subtitle1" component="h3">
                        {g.name || "—"}
                      </Typography>
                      <div className={classes.cardMeta}>
                        <Chip size="small" label={`${g.participantCount ?? 0} participantes`} variant="outlined" />
                        <Chip size="small" label={`${g.adminCount ?? 0} admins`} variant="outlined" />
                      </div>
                      <Typography className={classes.adminLine}>{renderAdminSummary(g)}</Typography>
                      <Tooltip title={g.id || ""} placement="top">
                        <Typography className={classes.jidHint} component="div">
                          <InfoOutlinedIcon fontSize="inherit" />
                          <span>Passe o mouse para ver o ID do grupo (uso interno)</span>
                        </Typography>
                      </Tooltip>
                    </CardContent>
                    <CardActions style={{ padding: "8px 16px 16px", flexWrap: "wrap", gap: 8 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={
                          openingGroupId === g.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <ForumIcon />
                          )
                        }
                        onClick={() => handleOpenConversation(g)}
                        disabled={loadingList || openingGroupId === g.id}
                      >
                        Abrir conversa
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<ExitToAppIcon />}
                        onClick={() => setLeaveModal({ open: true, group: g })}
                        disabled={loadingList || !!openingGroupId}
                      >
                        Sair
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <div className={classes.tabPanel}>
            <TextField
              fullWidth
              margin="normal"
              label="Nome do grupo"
              variant="outlined"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              disabled={!whatsappId}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Números dos participantes"
              placeholder="Um por linha ou separados por vírgula (DDI + DDD + número)"
              variant="outlined"
              multiline
              minRows={4}
              value={createParticipants}
              onChange={(e) => setCreateParticipants(e.target.value)}
              disabled={!whatsappId}
              helperText="Inclua código do país (ex.: 5511999998888). É necessário pelo menos um contato."
            />
            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreate}
                disabled={!whatsappId || creating}
              >
                {creating ? <CircularProgress size={22} /> : "Criar grupo"}
              </Button>
            </Box>
          </div>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <div className={classes.tabPanel}>
            <TextField
              fullWidth
              margin="normal"
              label="Link ou código do convite"
              placeholder="https://chat.whatsapp.com/..."
              variant="outlined"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              disabled={!whatsappId}
              helperText="Cole o link completo ou só o código após chat.whatsapp.com/"
            />
            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleJoin}
                disabled={!whatsappId || joining}
              >
                {joining ? <CircularProgress size={22} /> : "Entrar no grupo"}
              </Button>
            </Box>
          </div>
        </TabPanel>
      </Paper>
    </MainContainer>
  );
};

export default GroupManager;

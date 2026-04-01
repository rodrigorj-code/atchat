import React, { useState, useEffect, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import PersonAddDisabledOutlinedIcon from "@material-ui/icons/PersonAddDisabledOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import DoneOutlinedIcon from "@material-ui/icons/DoneOutlined";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  iconBtn: {
    padding: 4,
    margin: -4,
    marginLeft: 4,
  },
  menuPaper: {
    minWidth: 220,
  },
}));

function buildUpdateBody(ticket, overrides) {
  return {
    status: overrides.status !== undefined ? overrides.status : ticket.status,
    userId: overrides.userId !== undefined ? overrides.userId : ticket.userId ?? null,
    queueId: overrides.queueId !== undefined ? overrides.queueId : ticket.queueId ?? null,
    whatsappId: ticket.whatsappId != null ? String(ticket.whatsappId) : undefined,
    useIntegration: ticket.useIntegration ?? false,
    promptId: ticket.promptId ?? null,
    integrationId: ticket.integrationId ?? null,
  };
}

/**
 * Menu discreto + diálogos para ações rápidas no card do Kanban.
 */
const KanbanTicketQuickMenu = ({ ticket, authUser, usersList, queuesList, onTicketUpdated }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [assignUserId, setAssignUserId] = useState("");
  const [queueId, setQueueId] = useState("");
  const [tagsSelection, setTagsSelection] = useState([]);

  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/tags/list");
        const list = Array.isArray(data) ? data : data?.tags || [];
        setTagOptions(Array.isArray(list) ? list : []);
      } catch (e) {
        toastError(e);
      }
    };
    load();
  }, []);

  const closeMenu = () => setAnchorEl(null);

  const handleOpenMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  };

  const openDialog = (type) => {
    closeMenu();
    if (type === "assign") {
      setAssignUserId(ticket.userId ? String(ticket.userId) : "");
    }
    if (type === "queue") {
      setQueueId(ticket.queueId ? String(ticket.queueId) : "");
    }
    if (type === "tags") {
      setTagsSelection(Array.isArray(ticket.tags) ? [...ticket.tags] : []);
    }
    setDialog(type);
  };

  const putTicket = async (body) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/tickets/${ticket.id}`, body);
      if (data) onTicketUpdated(data);
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
      setDialog(null);
    }
  };

  const handleAssignSave = () => {
    if (!assignUserId) return;
    putTicket(buildUpdateBody(ticket, { userId: Number(assignUserId) }));
  };

  const handleUnassign = () => {
    closeMenu();
    putTicket(buildUpdateBody(ticket, { userId: null }));
  };

  const handleQueueSave = () => {
    if (!queueId) return;
    putTicket(buildUpdateBody(ticket, { queueId: Number(queueId) }));
  };

  const handleTagsSave = async () => {
    setSaving(true);
    try {
      const tagsPayload = tagsSelection
        .map((t) => (t && typeof t === "object" && t.id ? t : null))
        .filter(Boolean);
      await api.post("/tags/sync", {
        ticketId: ticket.id,
        tags: tagsPayload,
      });
      onTicketUpdated({
        ...ticket,
        tags: tagsPayload,
      });
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
      setDialog(null);
    }
  };

  const handleCloseTicket = useCallback(() => {
    closeMenu();
    if (!window.confirm(i18n.t("kanban.quickActions.confirmClose"))) return;
    setSaving(true);
    api
      .put(`/tickets/${ticket.id}`, {
        status: "closed",
        userId: authUser?.id,
        queueId: ticket.queue?.id ?? ticket.queueId,
        useIntegration: false,
        promptId: null,
        integrationId: null,
      })
      .then(({ data }) => {
        if (data) onTicketUpdated(data);
      })
      .catch(toastError)
      .finally(() => setSaving(false));
  }, [ticket, authUser, onTicketUpdated]);

  const isClosed = ticket.status === "closed";

  return (
    <>
      <span
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      >
        <IconButton
          className={classes.iconBtn}
          size="small"
          aria-label={i18n.t("kanban.quickActions.menuAria")}
          onClick={handleOpenMenu}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </span>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        classes={{ paper: classes.menuPaper }}
      >
        {!isClosed && (
          <MenuItem
            onClick={() => {
              openDialog("assign");
            }}
          >
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={i18n.t("kanban.quickActions.assign")} />
          </MenuItem>
        )}
        {!isClosed && ticket.userId && (
          <MenuItem onClick={handleUnassign}>
            <ListItemIcon>
              <PersonAddDisabledOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={i18n.t("kanban.quickActions.unassign")} />
          </MenuItem>
        )}
        {!isClosed && (
          <MenuItem
            onClick={() => {
              openDialog("queue");
            }}
          >
            <ListItemIcon>
              <AccountTreeOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={i18n.t("kanban.quickActions.changeQueue")} />
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            openDialog("tags");
          }}
        >
          <ListItemIcon>
            <LocalOfferOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={i18n.t("kanban.quickActions.tags")} />
        </MenuItem>
        {!isClosed && (
          <MenuItem onClick={handleCloseTicket} disabled={saving}>
            <ListItemIcon>
              <DoneOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={i18n.t("kanban.quickActions.close")} />
          </MenuItem>
        )}
      </Menu>

      <Dialog open={dialog === "assign"} onClose={() => !saving && setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{i18n.t("kanban.quickActions.assign")}</DialogTitle>
        <DialogContent>
          <FormControl variant="outlined" margin="normal" fullWidth size="small">
            <InputLabel>{i18n.t("kanban.quickActions.selectUser")}</InputLabel>
            <Select
              label={i18n.t("kanban.quickActions.selectUser")}
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            >
              {(usersList || []).map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {u.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={saving}>
            {i18n.t("kanban.quickActions.cancel")}
          </Button>
          <Button color="primary" variant="contained" disabled={saving || !assignUserId} onClick={handleAssignSave}>
            {i18n.t("kanban.quickActions.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "queue"} onClose={() => !saving && setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{i18n.t("kanban.quickActions.changeQueue")}</DialogTitle>
        <DialogContent>
          <FormControl variant="outlined" margin="normal" fullWidth size="small">
            <InputLabel>{i18n.t("kanban.quickActions.selectQueue")}</InputLabel>
            <Select
              label={i18n.t("kanban.quickActions.selectQueue")}
              value={queueId}
              onChange={(e) => setQueueId(e.target.value)}
            >
              {(queuesList || []).map((q) => (
                <MenuItem key={q.id} value={String(q.id)}>
                  {q.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={saving}>
            {i18n.t("kanban.quickActions.cancel")}
          </Button>
          <Button color="primary" variant="contained" disabled={saving || !queueId} onClick={handleQueueSave}>
            {i18n.t("kanban.quickActions.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "tags"} onClose={() => !saving && setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{i18n.t("kanban.quickActions.tags")}</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={tagOptions}
            value={tagsSelection}
            onChange={(e, v) => setTagsSelection(v)}
            getOptionLabel={(o) => (typeof o === "string" ? o : o?.name || "")}
            getOptionSelected={(option, value) => Boolean(value) && option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                margin="normal"
                placeholder={i18n.t("kanban.quickActions.tagsPlaceholder")}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={saving}>
            {i18n.t("kanban.quickActions.cancel")}
          </Button>
          <Button color="primary" variant="contained" disabled={saving} onClick={handleTagsSave}>
            {i18n.t("kanban.quickActions.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default KanbanTicketQuickMenu;

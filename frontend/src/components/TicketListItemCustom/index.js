import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import clsx from "clsx";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import Box from "@material-ui/core/Box";
import Chip from "@material-ui/core/Chip";
import { Tooltip } from "@material-ui/core";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import AndroidIcon from "@material-ui/icons/Android";
import VisibilityIcon from "@material-ui/icons/Visibility";
import TicketMessagesDialog from "../TicketMessagesDialog";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import ContactTag from "../ContactTag";

/**
 * Item da lista de atendimentos.
 * Fase 3 (atalhos): setas para navegar entre linhas; Enter abre o ticket (comportamento nativo do ListItem botão).
 * Ações rápidas extras por ícone na linha não foram adicionadas para não repetir Aceitar/Finalizar já na base do card;
 * o ponto natural seria ListItemSecondaryAction com IconButton size="small" + Tooltip só no hover.
 */
const useStyles = makeStyles((theme) => ({
  listItemRoot: {
    position: "relative",
    alignItems: "flex-start",
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(1.25),
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
    transition: theme.transitions.create(["background-color"], { duration: 150 }),
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
    "&.Mui-selected": {
      backgroundColor:
        theme.palette.type === "dark"
          ? "rgba(25, 118, 210, 0.22)"
          : "rgba(25, 118, 210, 0.1)",
      boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
    },
    "&.Mui-selected:hover": {
      backgroundColor:
        theme.palette.type === "dark"
          ? "rgba(25, 118, 210, 0.28)"
          : "rgba(25, 118, 210, 0.14)",
    },
  },
  listItemCompact: {
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    paddingLeft: theme.spacing(1),
    marginLeft: theme.spacing(0.25),
    marginRight: theme.spacing(0.25),
  },
  pendingTicket: {
    cursor: "default",
  },
  queueBar: {
    flex: "none",
    width: 4,
    minHeight: 56,
    alignSelf: "stretch",
    borderRadius: 2,
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(0.25),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.shape.borderRadius,
  },
  avatarCompact: {
    width: 40,
    height: 40,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
  },
  topRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(1),
  },
  nameBlock: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    flex: 1,
    gap: theme.spacing(0.5),
  },
  contactNameCompact: {
    fontSize: "0.875rem",
  },
  contactName: {
    fontWeight: 700,
    fontSize: "0.9375rem",
    lineHeight: 1.35,
    color: theme.palette.text.primary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  topRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: theme.spacing(0.25),
    flexShrink: 0,
    maxWidth: "42%",
  },
  timeText: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: theme.palette.text.secondary,
    whiteSpace: "nowrap",
  },
  unreadChip: {
    height: 22,
    fontWeight: 700,
    "& .MuiChip-label": {
      paddingLeft: theme.spacing(0.75),
      paddingRight: theme.spacing(0.75),
    },
  },
  lastMessagePreview: {
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    color: theme.palette.text.secondary,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
    marginTop: theme.spacing(0.25),
  },
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  },
  chipQueue: {
    maxWidth: "100%",
    height: 24,
    "& .MuiChip-label": {
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
  chipUser: {
    maxWidth: "100%",
    height: 24,
    "& .MuiChip-label": {
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
  chipConnection: {
    maxWidth: "100%",
    height: 24,
    "& .MuiChip-label": {
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
  actionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.75),
    justifyContent: "flex-end",
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  actionBtn: {
    minWidth: 72,
    fontSize: "0.65rem",
    padding: "4px 8px",
  },
  actionAccept: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.success.dark,
    },
  },
  actionDanger: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.error.dark,
    },
  },
}));

const TicketListItemCustom = ({ ticket, compact = false }) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [ticketUser, setTicketUser] = useState(null);
  const [tag, setTag] = useState([]);

  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);
  const { profile } = user;

  useEffect(() => {
    if (ticket.userId && ticket.user) {
      setTicketUser(ticket.user?.name?.toUpperCase());
    }

    setTag(Array.isArray(ticket?.tags) ? ticket.tags : []);

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseTicket = async (id) => {
    setTag(Array.isArray(ticket?.tags) ? ticket.tags : []);
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        userId: user?.id,
        queueId: ticket?.queue?.id,
        useIntegration: false,
        promptId: null,
        integrationId: null,
      });
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
    if (isMounted.current) {
      setLoading(false);
    }
    history.push(`/tickets/`);
  };

  const handleReopenTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
        queueId: ticket?.queue?.id,
      });
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
    if (isMounted.current) {
      setLoading(false);
    }
    history.push(`/tickets/${ticket.uuid}`);
  };

  const handleAcepptTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
      });

      let settingIndex = [];
      try {
        const { data } = await api.get("/settings/");
        settingIndex = Array.isArray(data)
          ? data.filter((s) => s.key === "sendGreetingAccepted")
          : [];
      } catch (err) {
        toastError(err);
      }

      if (settingIndex[0]?.value === "enabled" && !ticket.isGroup) {
        handleSendMessage(ticket.id);
      }
    } catch (err) {
      setLoading(false);

      toastError(err);
    }
    if (isMounted.current) {
      setLoading(false);
    }

    history.push(`/tickets/${ticket.uuid}`);
  };

  const handleSendMessage = async (id) => {
    const msg = `{{ms}} *{{name}}*, meu nome é *${user?.name}* e agora vou prosseguir com seu atendimento!`;
    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: `*Mensagem Automática:*\n${msg.trim()}`,
    };
    try {
      await api.post(`/messages/${id}`, message);
    } catch (err) {
      toastError(err);
    }
  };

  const handleSelectTicket = (ticket) => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };

  const renderTicketInfo = () => {
    return (
      <>
        {ticket.chatbot && (
          <Tooltip title={i18n.t("ticketsListItem.tooltip.chatbot")}>
            <AndroidIcon fontSize="small" style={{ color: grey[700] }} />
          </Tooltip>
        )}
      </>
    );
  };

  const queueColor = ticket.queue?.color || theme.palette.grey[500];
  const updatedAt = ticket.updatedAt ? parseISO(ticket.updatedAt) : null;
  const timeTooltip =
    updatedAt != null
      ? format(updatedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })
      : "";

  const relativeTime =
    updatedAt != null
      ? formatDistanceToNow(updatedAt, { addSuffix: true, locale: ptBR })
      : "";

  const lastMessageText = ticket.lastMessage != null ? String(ticket.lastMessage) : "";

  return (
    <React.Fragment key={ticket.id}>
      <TicketMessagesDialog
        open={openTicketMessageDialog}
        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      />
      <ListItem
        dense
        button
        data-ticket-list-item
        tabIndex={-1}
        aria-label={ticket.contact?.name || i18n.t("ticketsListItem.ariaTicketRow")}
        onClick={(e) => {
          if (ticket.status === "pending") return;
          handleSelectTicket(ticket);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.listItemRoot, {
          [classes.pendingTicket]: ticket.status === "pending",
          [classes.listItemCompact]: compact,
        })}
      >
        <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name?.toUpperCase() || i18n.t("ticketsListItem.noQueue")}
        >
          <Box
            className={classes.queueBar}
            style={{ backgroundColor: queueColor }}
            aria-hidden
          />
        </Tooltip>

        <ListItemAvatar>
          <Avatar
            className={clsx(classes.avatar, { [classes.avatarCompact]: compact })}
            src={ticket?.contact?.profilePicUrl}
          />
        </ListItemAvatar>

        <Box className={classes.mainColumn}>
          <Box className={classes.topRow}>
            <Box className={classes.nameBlock}>
              <Typography
                className={clsx(classes.contactName, { [classes.contactNameCompact]: compact })}
                component="span"
                title={ticket.contact.name}
              >
                {ticket.contact.name}
              </Typography>
              {profile === "admin" && (
                <Tooltip title={i18n.t("ticketsListItem.tooltip.peek")}>
                  <VisibilityIcon
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTicketMessageDialog(true);
                    }}
                    fontSize="small"
                    style={{
                      color: blue[700],
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            <Box className={classes.topRight}>
              {renderTicketInfo()}
              {ticket.lastMessage && updatedAt && (
                <Tooltip title={timeTooltip || relativeTime}>
                  <Typography className={classes.timeText} component="span">
                    {relativeTime}
                  </Typography>
                </Tooltip>
              )}
              {ticket.unreadMessages > 0 ? (
                <Chip
                  size="small"
                  color="secondary"
                  label={`${ticket.unreadMessages} ${i18n.t("kanban.unread")}`}
                  className={classes.unreadChip}
                />
              ) : null}
            </Box>
          </Box>

          <Typography className={classes.lastMessagePreview} component="div">
            {lastMessageText.includes("data:image/png;base64") ? (
              <MarkdownWrapper> Localização</MarkdownWrapper>
            ) : (
              <MarkdownWrapper>{lastMessageText}</MarkdownWrapper>
            )}
          </Typography>

          <Box className={classes.chipsRow}>
            {ticket?.whatsapp?.name ? (
              <Chip
                size="small"
                variant="outlined"
                label={ticket.whatsapp.name.toUpperCase()}
                className={classes.chipConnection}
              />
            ) : null}
            {ticketUser ? (
              <Chip
                size="small"
                variant="outlined"
                color="primary"
                label={ticketUser}
                className={classes.chipUser}
              />
            ) : null}
            <Chip
              size="small"
              variant="outlined"
              label={ticket.queue?.name?.toUpperCase() || i18n.t("ticketsListItem.noQueue")}
              className={classes.chipQueue}
              style={{
                borderColor: queueColor,
                backgroundColor: `${queueColor}22`,
              }}
            />
            {(Array.isArray(tag) ? tag : []).map((tagItem) => (
              <ContactTag tag={tagItem} key={`ticket-contact-tag-${ticket.id}-${tagItem.id}`} />
            ))}
          </Box>

          {(ticket.status === "pending" ||
            ticket.status === "open" ||
            ticket.status === "closed") && (
            <Box className={classes.actionsRow}>
              {ticket.status === "pending" && (
                <ButtonWithSpinner
                  variant="contained"
                  size="small"
                  className={clsx(classes.actionBtn, classes.actionAccept)}
                  loading={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcepptTicket(ticket.id);
                  }}
                >
                  {i18n.t("ticketsList.buttons.accept")}
                </ButtonWithSpinner>
              )}
              {ticket.status !== "closed" && (
                <ButtonWithSpinner
                  variant="contained"
                  size="small"
                  className={clsx(classes.actionBtn, classes.actionDanger)}
                  loading={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTicket(ticket.id);
                  }}
                >
                  {i18n.t("ticketsList.buttons.closed")}
                </ButtonWithSpinner>
              )}
              {ticket.status === "closed" && (
                <ButtonWithSpinner
                  variant="contained"
                  size="small"
                  className={clsx(classes.actionBtn, classes.actionDanger)}
                  loading={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReopenTicket(ticket.id);
                  }}
                >
                  {i18n.t("ticketsList.buttons.reopen")}
                </ButtonWithSpinner>
              )}
            </Box>
          )}
        </Box>
      </ListItem>

      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};

export default TicketListItemCustom;

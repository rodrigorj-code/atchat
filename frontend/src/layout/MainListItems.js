import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import { Badge } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import ForumIcon from "@material-ui/icons/Forum";
import { AccountTree } from "@material-ui/icons";
import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import usePlans from "../hooks/usePlans";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";

const SIDEBAR_GREEN = "#24c776";

const useStyles = makeStyles((theme) => ({
  listItemIcon: {
    color: SIDEBAR_GREEN,
    minWidth: 40,
  },
  listItemText: {
    color: "rgba(0, 0, 0, 0.87)",
    "&.MuiListItemText-primary": {
      fontWeight: 500,
    },
  },
  listItem: {
    "&:hover": {
      backgroundColor: "rgba(36, 199, 118, 0.08)",
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(36, 199, 118, 0.12)",
      borderLeft: `3px solid ${SIDEBAR_GREEN}`,
      "& .MuiListItemIcon-root": {
        color: SIDEBAR_GREEN,
      },
    },
  },
  footerLinks: {
    padding: theme.spacing(1, 2),
    "& a": {
      color: theme.palette.text.secondary,
      fontSize: "0.75rem",
      marginRight: theme.spacing(0.5),
    },
  },
}));

function ListItemLink(props) {
  const {
    icon,
    primary,
    to,
    listItemClassName,
    listItemIconClassName,
    listItemTextClassName,
    selected,
  } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem
        button
        dense
        component={renderLink}
        className={listItemClassName}
        selected={selected}
      >
        {icon ? (
          <ListItemIcon className={listItemIconClassName}>{icon}</ListItemIcon>
        ) : null}
        <ListItemText primary={primary} className={listItemTextClassName} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];
    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }
    return [...state, ...newChats];
  }
  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);
    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    }
    return [chat, ...state];
  }
  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }
  if (action.type === "RESET") {
    return [];
  }
  if (action.type === "CHANGE_CHAT") {
    return state.map((chat) =>
      chat.id === action.payload.chat.id ? action.payload.chat : chat
    );
  }
};

function defaultAutomacaoPath(flags, isAdmin) {
  if (!isAdmin) return "/quick-messages";
  if (flags.useCampaigns) return "/flowbuilders";
  if (flags.useIntegrations) return "/queue-integration";
  if (flags.useOpenAi) return "/prompts";
  return "/quick-messages";
}

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose, collapsed } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { getPlanCompany } = usePlans();
  const location = useLocation();

  const socketManager = useContext(SocketContext);

  const isAdmin = user?.profile === "admin";
  const planFlags = {
    useCampaigns: showCampaigns,
    useKanban: showKanban,
    useOpenAi: showOpenAi,
    useIntegrations: showIntegrations,
    useSchedules: showSchedules,
    useExternalApi: showExternalApi,
  };

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      setShowCampaigns(planConfigs.plan.useCampaigns);
      setShowKanban(planConfigs.plan.useKanban);
      setShowOpenAi(planConfigs.plan.useOpenAi);
      setShowIntegrations(planConfigs.plan.useIntegrations);
      setShowSchedules(planConfigs.plan.useSchedules);
      setShowExternalApi(planConfigs.plan.useExternalApi);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);
    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message" || data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (Number(chatUser.userId) === Number(user.id)) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    setInvisible(unreadsCount === 0);
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter(
          (whats) =>
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
        );
        setConnectionWarning(offlineWhats.length > 0);
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const path = location.pathname;

  const selDashboard = path === "/" || path === "/relatorios";
  const selAtendimento =
    path.startsWith("/tickets") ||
    path === "/kanban" ||
    path === "/contacts" ||
    path === "/group-manager" ||
    path === "/todolist" ||
    path === "/schedules";
  const selAutomacao =
    path.startsWith("/flowbuilder") ||
    path === "/flowbuilders" ||
    path === "/phrase-lists" ||
    path === "/queue-integration" ||
    path === "/prompts" ||
    path === "/quick-messages";
  const selCampanhas =
    path === "/campaigns" ||
    path.startsWith("/contact-lists") ||
    path === "/campaigns-config" ||
    path.startsWith("/campaign/");
  const selEquipe =
    path === "/users" ||
    path === "/setores" ||
    path === "/queues" ||
    path.startsWith("/chats");
  const selConfig =
    path === "/connections" || path === "/messages-api" || path === "/settings";
  const selFinanceiro = path === "/financeiro";

  const toAutomacao = defaultAutomacaoPath(planFlags, isAdmin);
  const toEquipe = isAdmin ? "/users" : "/chats";

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform="dashboard:view"
        yes={() => (
          <ListItemLink
            to="/"
            primary={i18n.t("mainDrawer.sections.dashboard")}
            icon={<DashboardOutlinedIcon />}
            listItemClassName={classes.listItem}
            listItemIconClassName={classes.listItemIcon}
            listItemTextClassName={classes.listItemText}
            selected={selDashboard}
          />
        )}
      />

      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.sections.atendimento")}
        icon={<WhatsAppIcon />}
        listItemClassName={classes.listItem}
        listItemIconClassName={classes.listItemIcon}
        listItemTextClassName={classes.listItemText}
        selected={selAtendimento}
      />

      <ListItemLink
        to={toAutomacao}
        primary={i18n.t("mainDrawer.sections.automacao")}
        icon={<AccountTree />}
        listItemClassName={classes.listItem}
        listItemIconClassName={classes.listItemIcon}
        listItemTextClassName={classes.listItemText}
        selected={selAutomacao}
      />

      {isAdmin && (
        <>
          {showCampaigns && (
            <ListItemLink
              to="/campaigns"
              primary={i18n.t("mainDrawer.sections.campanhas")}
              icon={<EventAvailableIcon />}
              listItemClassName={classes.listItem}
              listItemIconClassName={classes.listItemIcon}
              listItemTextClassName={classes.listItemText}
              selected={selCampanhas}
            />
          )}

          <ListItemLink
            to={toEquipe}
            primary={i18n.t("mainDrawer.sections.equipe")}
            icon={
              <Badge color="secondary" variant="dot" invisible={invisible}>
                <PeopleAltOutlinedIcon />
              </Badge>
            }
            listItemClassName={classes.listItem}
            listItemIconClassName={classes.listItemIcon}
            listItemTextClassName={classes.listItemText}
            selected={selEquipe}
          />

          <ListItemLink
            to="/financeiro"
            primary={i18n.t("mainDrawer.sections.financeiro")}
            icon={<LocalAtmIcon />}
            listItemClassName={classes.listItem}
            listItemIconClassName={classes.listItemIcon}
            listItemTextClassName={classes.listItemText}
            selected={selFinanceiro}
          />

          <ListItemLink
            to="/connections"
            primary={i18n.t("mainDrawer.sections.configuracoes")}
            icon={
              <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                <SyncAltIcon />
              </Badge>
            }
            listItemClassName={classes.listItem}
            listItemIconClassName={classes.listItemIcon}
            listItemTextClassName={classes.listItemText}
            selected={selConfig}
          />
        </>
      )}

      {!isAdmin && (
        <ListItemLink
          to="/chats"
          primary={i18n.t("mainDrawer.sections.equipe")}
          icon={
            <Badge color="secondary" variant="dot" invisible={invisible}>
              <ForumIcon />
            </Badge>
          }
          listItemClassName={classes.listItem}
          listItemIconClassName={classes.listItemIcon}
          listItemTextClassName={classes.listItemText}
          selected={selEquipe}
        />
      )}

      {!collapsed && (
        <>
          <Divider style={{ marginTop: 8 }} />
          <div className={classes.footerLinks}>
            <Typography variant="caption" component="div">
              <Link component={RouterLink} to="/helps" underline="hover">
                {i18n.t("mainDrawer.listItems.helps")}
              </Link>
              {" · "}
              <Link component={RouterLink} to="/files" underline="hover">
                {i18n.t("mainDrawer.listItems.files")}
              </Link>
              {" · "}
              <Link component={RouterLink} to="/tags" underline="hover">
                {i18n.t("mainDrawer.listItems.tags")}
              </Link>
              {" · "}
              <Link component={RouterLink} to="/avaliacao" underline="hover">
                {i18n.t("mainDrawer.listItems.evaluation")}
              </Link>
              {user.super && (
                <>
                  {" · "}
                  <Link component={RouterLink} to="/announcements" underline="hover">
                    {i18n.t("mainDrawer.listItems.annoucements")}
                  </Link>
                </>
              )}
            </Typography>
          </div>
          <Divider />
          <Typography
            style={{
              fontSize: "12px",
              padding: "10px",
              textAlign: "right",
              fontWeight: "bold",
            }}
          >
            8.0.1
          </Typography>
        </>
      )}
    </div>
  );
};

export default MainListItems;

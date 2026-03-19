import React, { useContext, useEffect, useRef, useState } from "react";

import { useParams, useHistory } from "react-router-dom";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  InputBase,
  makeStyles,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import AddIcon from "@material-ui/icons/Add";
import PeopleIcon from "@material-ui/icons/People";
import ChatList from "./ChatList";
import ChatMessages from "./ChatMessages";
import { UsersFilter } from "../../components/UsersFilter";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

import { has, isObject } from "lodash";

import { AuthContext } from "../../context/Auth/AuthContext";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    padding: theme.spacing(2),
    height: `calc(100% - 48px)`,
    overflow: "hidden",
    backgroundColor: "#f4f4f4",
  },
  gridContainer: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  gridItem: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRight: "1px solid rgba(0,0,0,0.08)",
  },
  gridItemRight: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  leftPane: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    position: "relative",
  },
  chatHeader: {
    padding: theme.spacing(2),
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    fontWeight: 600,
    fontSize: "1.125rem",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1, 2),
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: "0.9375rem",
  },
  listWrap: {
    flex: 1,
    overflow: "auto",
    minHeight: 0,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(4),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
  emptyIcon: {
    fontSize: 64,
    color: "rgba(0,0,0,0.2)",
    marginBottom: theme.spacing(2),
  },
  emptyTitle: {
    fontWeight: 600,
    fontSize: "1rem",
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.primary,
  },
  emptySub: {
    fontSize: "0.875rem",
    marginBottom: theme.spacing(2),
  },
  btnNewChat: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontWeight: 600,
    textTransform: "uppercase",
    padding: "10px 20px",
    "&:hover": {
      backgroundColor: "#333",
    },
  },
  fabNew: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#1a1a1a",
    color: "#fff",
    zIndex: 10,
    "&:hover": {
      backgroundColor: "#333",
    },
  },
  gridItemTab: {
    height: "92%",
    width: "100%",
  },
  btnContainer: {
    textAlign: "right",
    padding: 10,
  },
}));

export function ChatModal({
  open,
  chat,
  type,
  handleClose,
  handleLoadNewChat,
}) {
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle("");
    setUsers([]);
    if (type === "edit") {
      const userList = chat.users.map((u) => ({
        id: u.user.id,
        name: u.user.name,
      }));
      setUsers(userList);
      setTitle(chat.title);
    }
  }, [chat, open, type]);

  const handleSave = async () => {
    try {
      if (!title) {
        alert(i18n.t("chat.toasts.fillTitle"));
        return;
      }

      if (!users || users.length === 0) {
        alert(i18n.t("chat.toasts.fillUser"));
        return;
      }

      if (type === "edit") {
        await api.put(`/chats/${chat.id}`, {
          users,
          title,
        });
      } else {
        const { data } = await api.post("/chats", {
          users,
          title,
        });
        handleLoadNewChat(data);
      }
      handleClose();
    } catch (err) {}
  };  

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{i18n.t("chat.modal.title")}</DialogTitle>
      <DialogContent>
        <Grid spacing={2} container>
          <Grid xs={12} style={{ padding: 18 }} item>
            <TextField
              label={i18n.t("chat.modal.titleField")}
              placeholder={i18n.t("chat.modal.titleField")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid xs={12} item>
            <UsersFilter
              onFiltered={(users) => setUsers(users)}
              initialUsers={users}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {i18n.t("chat.buttons.close")}
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          {i18n.t("chat.buttons.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Chat(props) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const history = useHistory();

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState("new");
  const [currentChat, setCurrentChat] = useState({});
  const [chats, setChats] = useState([]);
  const [chatsPageInfo, setChatsPageInfo] = useState({ hasMore: false });
  const [messages, setMessages] = useState([]);
  const [messagesPageInfo, setMessagesPageInfo] = useState({ hasMore: false });
  const [messagesPage, setMessagesPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [searchChat, setSearchChat] = useState("");
  const isMounted = useRef(true);
  const scrollToBottomRef = useRef();
  const { id } = useParams();

  const filteredChats = React.useMemo(() => {
    if (!Array.isArray(chats)) return [];
    const q = (searchChat || "").trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q)
    );
  }, [chats, searchChat]);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      findChats().then((data) => {
        const { records } = data;
        if (records.length > 0) {
          setChats(records);
          setChatsPageInfo(data);

          if (id && records.length) {
            const chat = records.find((r) => r.uuid === id);
            selectChat(chat);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isObject(currentChat) && has(currentChat, "id")) {
      findMessages(currentChat.id).then(() => {
        if (typeof scrollToBottomRef.current === "function") {
          setTimeout(() => {
            scrollToBottomRef.current();
          }, 300);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-chat-user-${user.id}`, (data) => {
      if (data.action === "create") {
        setChats((prev) => [data.record, ...prev]);
      }
      if (data.action === "update") {
        const changedChats = chats.map((chat) => {
          if (chat.id === data.record.id) {
            setCurrentChat(data.record);
            return {
              ...data.record,
            };
          }
          return chat;
        });
        setChats(changedChats);
      }
    });

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "delete") {
        const filteredChats = chats.filter((c) => c.id !== +data.id);
        setChats(filteredChats);
        setMessages([]);
        setMessagesPage(1);
        setMessagesPageInfo({ hasMore: false });
        setCurrentChat({});
        history.push("/chats");
      }
    });

    if (isObject(currentChat) && has(currentChat, "id")) {
      socket.on(`company-${companyId}-chat-${currentChat.id}`, (data) => {
        if (data.action === "new-message") {
          setMessages((prev) => [...prev, data.newMessage]);
          const changedChats = chats.map((chat) => {
            if (chat.id === data.newMessage.chatId) {
              return {
                ...data.chat,
              };
            }
            return chat;
          });
          setChats(changedChats);
          scrollToBottomRef.current();
        }

        if (data.action === "update") {
          const changedChats = chats.map((chat) => {
            if (chat.id === data.chat.id) {
              return {
                ...data.chat,
              };
            }
            return chat;
          });
          setChats(changedChats);
          scrollToBottomRef.current();
        }
      });
    }

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat, socketManager]);

  const selectChat = (chat) => {
    try {
      setMessages([]);
      setMessagesPage(1);
      setCurrentChat(chat);
      setTab(1);
    } catch (err) {}
  };

  const sendMessage = async (contentMessage) => {
    setLoading(true);
    try {
      await api.post(`/chats/${currentChat.id}/messages`, {
        message: contentMessage,
      });
    } catch (err) {}
    setLoading(false);
  };

  const deleteChat = async (chat) => {
    try {
      await api.delete(`/chats/${chat.id}`);
    } catch (err) {}
  };

  const findMessages = async (chatId) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/chats/${chatId}/messages?pageNumber=${messagesPage}`
      );
      setMessagesPage((prev) => prev + 1);
      setMessagesPageInfo(data);
      setMessages((prev) => [...data.records, ...prev]);
    } catch (err) {}
    setLoading(false);
  };

  const loadMoreMessages = async () => {
    if (!loading) {
      findMessages(currentChat.id);
    }
  };

  const findChats = async () => {
    try {
      const { data } = await api.get("/chats");
      return data;
    } catch (err) {
      console.log(err);
    }
  };

  const renderGrid = () => {
    const hasChatSelected = isObject(currentChat) && has(currentChat, "id");
    return (
      <Grid className={classes.gridContainer} container>
        <Grid className={classes.gridItem} md={4} item>
          <div className={classes.leftPane}>
            <Typography className={classes.chatHeader}>Chat Interno</Typography>
            <div className={classes.searchWrap}>
              <SearchIcon style={{ color: "rgba(0,0,0,0.4)" }} />
              <InputBase
                className={classes.searchInput}
                placeholder="Buscar conversas..."
                value={searchChat}
                onChange={(e) => setSearchChat(e.target.value)}
                inputProps={{ "aria-label": "buscar conversas" }}
              />
            </div>
            <div className={classes.listWrap}>
              {filteredChats.length === 0 ? (
                <div className={classes.emptyState}>
                  <PeopleIcon className={classes.emptyIcon} />
                  <Typography className={classes.emptyTitle}>
                    Nenhuma conversa encontrada
                  </Typography>
                  <Typography className={classes.emptySub}>
                    Comece uma nova conversa para começar a mensagear
                  </Typography>
                  <Button
                    className={classes.btnNewChat}
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setDialogType("new");
                      setShowDialog(true);
                    }}
                  >
                    + CRIAR NOVA CONVERSA
                  </Button>
                </div>
              ) : (
                <ChatList
                  chats={filteredChats}
                  pageInfo={chatsPageInfo}
                  loading={loading}
                  handleSelectChat={(chat) => selectChat(chat)}
                  handleDeleteChat={(chat) => deleteChat(chat)}
                  handleEditChat={() => {
                    setDialogType("edit");
                    setShowDialog(true);
                  }}
                />
              )}
            </div>
            <Fab
              className={classes.fabNew}
              size="medium"
              aria-label="nova conversa"
              onClick={() => {
                setDialogType("new");
                setShowDialog(true);
              }}
            >
              <AddIcon />
            </Fab>
          </div>
        </Grid>
        <Grid className={classes.gridItemRight} md={8} item>
          {hasChatSelected ? (
            <ChatMessages
              chat={currentChat}
              scrollToBottomRef={scrollToBottomRef}
              pageInfo={messagesPageInfo}
              messages={messages}
              loading={loading}
              handleSendMessage={sendMessage}
              handleLoadMore={loadMoreMessages}
            />
          ) : (
            <div
              className={classes.emptyState}
              style={{
                flex: 1,
                justifyContent: "center",
                minHeight: 0,
                display: "flex",
              }}
            >
              <div>
                <PeopleIcon className={classes.emptyIcon} />
                <Typography className={classes.emptyTitle}>
                  Selecione uma conversa
                </Typography>
                <Typography className={classes.emptySub}>
                  Escolha uma conversa da lista para começar a mensagear
                </Typography>
              </div>
            </div>
          )}
        </Grid>
      </Grid>
    );
  };

  const renderTab = () => {
    return (
      <Grid className={classes.gridContainer} container>
        <Grid md={12} item>
          <Tabs
            value={tab}
            indicatorColor="primary"
            textColor="primary"
            onChange={(e, v) => setTab(v)}
            aria-label="disabled tabs example"
          >
            <Tab label={i18n.t("chat.chats")} />
            <Tab label={i18n.t("chat.messages")} />
          </Tabs>
        </Grid>
        {tab === 0 && (
          <Grid className={classes.gridItemTab} md={12} item>
            <div className={classes.btnContainer}>
              <Button
                onClick={() => setShowDialog(true)}
                color="primary"
                variant="contained"
              >
                {i18n.t("chat.buttons.newChat")}
              </Button>
            </div>
            <ChatList
              chats={chats}
              pageInfo={chatsPageInfo}
              loading={loading}
              handleSelectChat={(chat) => selectChat(chat)}
              handleDeleteChat={(chat) => deleteChat(chat)}
            />
          </Grid>
        )}
        {tab === 1 && (
          <Grid className={classes.gridItemTab} md={12} item>
            {isObject(currentChat) && has(currentChat, "id") && (
              <ChatMessages
                scrollToBottomRef={scrollToBottomRef}
                pageInfo={messagesPageInfo}
                messages={messages}
                loading={loading}
                handleSendMessage={sendMessage}
                handleLoadMore={loadMoreMessages}
              />
            )}
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <>
      <ChatModal
        type={dialogType}
        open={showDialog}
        chat={currentChat}
        handleLoadNewChat={(data) => {
          setMessages([]);
          setMessagesPage(1);
          setCurrentChat(data);
          setTab(1);
          history.push(`/chats/${data.uuid}`);
        }}
        handleClose={() => setShowDialog(false)}
      />
      <Paper className={classes.mainContainer}>
        {isWidthUp("md", props.width) ? renderGrid() : renderTab()}
      </Paper>
    </>
  );
}

export default withWidth()(Chat);

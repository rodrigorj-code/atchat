import React, { useState, useEffect, useMemo, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import SearchIcon from "@material-ui/icons/Search";
import Alert from "@material-ui/lab/Alert";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import SubscriptionModal from "../../components/SubscriptionModal";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

import moment from "moment";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  search: {
    marginBottom: theme.spacing(2),
    maxWidth: 360,
  },
  emptyBox: {
    padding: theme.spacing(6),
    textAlign: "center",
  },
  idCell: {
    fontFamily: "monospace",
    fontSize: "0.85rem",
  },
}));

function getInvoiceVisualStatus(record) {
  const paid = String(record.status).toLowerCase() === "paid";
  if (paid) return "paid";
  const vencimento = moment(record.dueDate);
  const hoje = moment().startOf("day");
  if (vencimento.isBefore(hoje, "day")) return "overdue";
  return "open";
}

const Invoices = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [searchParam, setSearchParam] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [storagePlans, setStoragePlans] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/invoices/all");
      const list = Array.isArray(data) ? data : [];
      setInvoices(list);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filtered = useMemo(() => {
    const q = searchParam.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        String(inv.id).includes(q) ||
        String(inv.detail || "")
          .toLowerCase()
          .includes(q)
    );
  }, [invoices, searchParam]);

  const handleOpenContactModal = (inv) => {
    setStoragePlans(inv);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setStoragePlans(null);
  };

  const renderStatusChip = (record) => {
    const key = getInvoiceVisualStatus(record);
    const map = {
      paid: { label: i18n.t("invoices.statusLabels.paid"), color: "primary" },
      overdue: {
        label: i18n.t("invoices.statusLabels.overdue"),
        color: "secondary",
      },
      open: { label: i18n.t("invoices.statusLabels.open"), color: "default" },
    };
    const cfg = map[key] || map.open;
    return (
      <Chip
        size="small"
        label={cfg.label}
        color={cfg.color}
        variant={key === "open" ? "outlined" : "default"}
      />
    );
  };

  const finance = user?.finance;

  return (
    <MainContainer>
      <SubscriptionModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        Invoice={storagePlans}
      />
      <MainHeader>
        <Title>{i18n.t("invoices.title")}</Title>
      </MainHeader>

      {finance?.delinquent && (
        <Alert severity="warning" style={{ marginBottom: 16 }}>
          <Typography variant="subtitle2" component="span">
            {i18n.t("finance.page.delinquentAlert")}
          </Typography>
        </Alert>
      )}

      <TextField
        className={classes.search}
        placeholder={i18n.t("invoices.searchPlaceholder")}
        type="search"
        value={searchParam}
        onChange={(e) => setSearchParam(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
        }}
        variant="outlined"
        size="small"
        fullWidth
      />

      <Paper className={classes.mainPaper} variant="outlined">
        {loading && !invoices.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">#</TableCell>
                <TableCell align="center">{i18n.t("invoices.details")}</TableCell>
                <TableCell align="center">{i18n.t("invoices.value")}</TableCell>
                <TableCell align="center">{i18n.t("invoices.dueDate")}</TableCell>
                <TableCell align="center">{i18n.t("invoices.status")}</TableCell>
                <TableCell align="center">{i18n.t("invoices.action")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRowSkeleton columns={6} />
              <TableRowSkeleton columns={6} />
            </TableBody>
          </Table>
        ) : filtered.length === 0 ? (
          <Box className={classes.emptyBox}>
            <Typography color="textSecondary" variant="body1" gutterBottom>
              {i18n.t("invoices.empty")}
            </Typography>
            <Typography color="textSecondary" variant="body2">
              {i18n.t("invoices.emptyHint")}
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">#</TableCell>
                <TableCell align="left">{i18n.t("invoices.details")}</TableCell>
                <TableCell align="right">{i18n.t("invoices.value")}</TableCell>
                <TableCell align="center">{i18n.t("invoices.dueDate")}</TableCell>
                <TableCell align="center">{i18n.t("invoices.status")}</TableCell>
                <TableCell align="center">{i18n.t("invoices.action")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((inv) => {
                const visual = getInvoiceVisualStatus(inv);
                const rowBg =
                  visual === "overdue"
                    ? "rgba(244, 67, 54, 0.06)"
                    : visual === "paid"
                    ? "rgba(36, 199, 118, 0.06)"
                    : "transparent";
                return (
                  <TableRow key={inv.id} style={{ backgroundColor: rowBg }}>
                    <TableCell align="center" className={classes.idCell}>
                      {inv.id}
                    </TableCell>
                    <TableCell align="left">{inv.detail}</TableCell>
                    <TableCell align="right" style={{ fontWeight: 600 }}>
                      {Number(inv.value).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell align="center">
                      {moment(inv.dueDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell align="center">{renderStatusChip(inv)}</TableCell>
                    <TableCell align="center">
                      {visual !== "paid" ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleOpenContactModal(inv)}
                        >
                          {i18n.t("invoices.PAY")}
                        </Button>
                      ) : (
                        <Chip
                          size="small"
                          label={i18n.t("invoices.PAID")}
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {loading && (
                <TableRowSkeleton columns={6} avatar={false} />
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </MainContainer>
  );
};

export default Invoices;

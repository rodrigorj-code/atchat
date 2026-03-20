import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

import {
  Button,
  Grid,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";

import Rating from "@material-ui/lab/Rating";
import AssessmentOutlinedIcon from "@material-ui/icons/AssessmentOutlined";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import EvaluationModal from "../../components/EvaluationModal";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  summaryCard: {
    padding: theme.spacing(2),
    borderRadius: 12,
    textAlign: "center",
    backgroundColor: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    height: "100%",
  },
  summaryValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#24c776",
  },
  summaryLabel: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  tableRowClick: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(36, 199, 118, 0.06)",
    },
  },
}));

const Evaluation = () => {
  const classes = useStyles();
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [summary, setSummary] = useState({
    attendants: [],
    avgRating: "0.0",
    totalRatings: 0,
  });
  const [ratings, setRatings] = useState([]);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    setDateFrom(lastMonth.toISOString().slice(0, 10));
    setDateTo(today);
  }, []);

  useEffect(() => {
    setPageNumber(1);
  }, [dateFrom, dateTo]);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get("/rating-templates");
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = { dateFrom, dateTo };
        const { data } = await api.get("/user-ratings/summary", { params });
        setSummary({
          attendants: data.attendants || [],
          avgRating: data.avgRating || "0.0",
          totalRatings: data.totalRatings || 0,
        });
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    (async () => {
      setLoadingList(true);
      try {
        const params = { pageNumber, dateFrom, dateTo };
        const { data } = await api.get("/user-ratings", { params });
        const newRatings = Array.isArray(data?.ratings) ? data.ratings : [];
        setRatings((prev) => (pageNumber === 1 ? newRatings : [...prev, ...newRatings]));
        setHasMore(data?.hasMore || false);
      } catch (err) {
        toastError(err);
        if (pageNumber === 1) setRatings([]);
      } finally {
        setLoadingList(false);
      }
    })();
  }, [pageNumber, dateFrom, dateTo]);

  const filteredRatings =
    searchParam.trim() === ""
      ? ratings
      : ratings.filter(
          (r) =>
            r.contactName?.toLowerCase().includes(searchParam.toLowerCase()) ||
            r.userName?.toLowerCase().includes(searchParam.toLowerCase()) ||
            String(r.contactNumber).includes(searchParam)
        );

  const handleRowClick = (rating) => {
    if (rating.ticketUuid) {
      history.push(`/tickets/${rating.ticketUuid}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <MainContainer>
      <EvaluationModal
        open={evaluationModalOpen}
        onClose={() => setEvaluationModalOpen(false)}
        onSave={fetchTemplates}
      />

      <MainHeader>
        <Title>
          <AssessmentOutlinedIcon style={{ marginRight: 8, verticalAlign: "middle" }} />
          {i18n.t("evaluation.title", "Avaliação")}
        </Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            style={{ backgroundColor: "#1a1a1a", color: "#fff", textTransform: "uppercase" }}
            onClick={() => setEvaluationModalOpen(true)}
          >
            {i18n.t("evaluation.addButton", "Adicionar")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Grid container spacing={2} style={{ marginBottom: 16 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper className={classes.summaryCard} variant="outlined">
            <Typography className={classes.summaryValue}>
              {summary.avgRating}
            </Typography>
            <Typography className={classes.summaryLabel}>
              {i18n.t("evaluation.avgRating", "Avaliação Média")}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper className={classes.summaryCard} variant="outlined">
            <Typography className={classes.summaryValue}>
              {summary.totalRatings}
            </Typography>
            <Typography className={classes.summaryLabel}>
              {i18n.t("evaluation.totalRatings", "Total de Avaliações")}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              type="date"
              label={i18n.t("evaluation.dateFrom", "De")}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              variant="outlined"
            />
            <TextField
              type="date"
              label={i18n.t("evaluation.dateTo", "Até")}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              variant="outlined"
            />
          </div>
        </Grid>
      </Grid>

      {templates.length > 0 && (
        <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
          <Typography variant="subtitle1" style={{ marginBottom: 12, fontWeight: 600 }}>
            {i18n.t("evaluation.templatesTitle", "Templates de Avaliação")}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{i18n.t("evaluation.templateName", "Nome")}</TableCell>
                <TableCell>{i18n.t("evaluationModal.messageLabel", "Mensagem")}</TableCell>
                <TableCell>{i18n.t("evaluationModal.optionsTitle", "Opções")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell style={{ maxWidth: 200 }}>{t.message || "-"}</TableCell>
                  <TableCell>
                    {Array.isArray(t.options)
                      ? t.options
                          .sort((a, b) => a.value - b.value)
                          .map((o) => `${o.value} - ${o.name}`)
                          .join(", ")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Grid container spacing={2} style={{ marginBottom: 16 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" style={{ marginBottom: 8, fontWeight: 600 }}>
            {i18n.t("evaluation.byAttendant", "Por Atendente")}
          </Typography>
          <TableAttendantsStatus loading={loading} attendants={summary.attendants} />
        </Grid>
      </Grid>

      <Paper className={classes.mainPaper} variant="outlined">
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <TextField
            placeholder={i18n.t("evaluation.searchPlaceholder", "Buscar por contato ou atendente...")}
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            size="small"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
            style={{ minWidth: 280 }}
          />
        </div>

        {loadingList ? (
          <TableRowSkeleton />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{i18n.t("evaluation.table.date", "Data")}</TableCell>
                <TableCell>{i18n.t("evaluation.table.contact", "Contato")}</TableCell>
                <TableCell>{i18n.t("evaluation.table.attendant", "Atendente")}</TableCell>
                <TableCell>{i18n.t("evaluation.table.setor", "Setor")}</TableCell>
                <TableCell align="center">{i18n.t("evaluation.table.rating", "Avaliação")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRatings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" style={{ padding: 40 }}>
                    {i18n.t("evaluation.noRatings", "Nenhuma avaliação encontrada no período.")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRatings.map((r) => (
                  <TableRow
                    key={r.id}
                    className={classes.tableRowClick}
                    onClick={() => handleRowClick(r)}
                  >
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    <TableCell>
                      {r.contactName}
                      {r.contactNumber && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          {r.contactNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{r.userName}</TableCell>
                    <TableCell>{r.queueName || "-"}</TableCell>
                    <TableCell align="center">
                      <Rating value={r.rate} max={5} readOnly size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {hasMore && filteredRatings.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Button
              variant="outlined"
              onClick={() => setPageNumber((p) => p + 1)}
              disabled={loadingList}
            >
              {i18n.t("evaluation.loadMore", "Carregar mais")}
            </Button>
          </div>
        )}
      </Paper>
    </MainContainer>
  );
};

export default Evaluation;

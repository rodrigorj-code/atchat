import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

import {
  Box,
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
import { alpha } from "@material-ui/core/styles";
import Alert from "@material-ui/lab/Alert";

import Rating from "@material-ui/lab/Rating";
import AssessmentOutlinedIcon from "@material-ui/icons/AssessmentOutlined";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";

import MainContainer from "../../components/MainContainer";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import {
  AppPageHeader,
  AppSectionCard,
  AppActionBar,
} from "../../ui";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";

/** Escala única (alinhada ao WhatsApp e ao backend). */
const RATING_MAX = 3;

const useStyles = makeStyles((theme) => ({
  pageRoot: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    flex: 1,
    minHeight: 0,
    [theme.breakpoints.up("md")]: {
      gap: theme.spacing(3),
    },
  },
  titleWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  filtersBar: {
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  searchField: {
    flex: "1 1 260px",
    minWidth: 200,
    maxWidth: 400,
  },
  dateField: {
    flex: "0 1 160px",
  },
  tableCard: {
    flex: 1,
    minHeight: 0,
  },
  sectionTitle: {
    fontWeight: 600,
  },
  flowAlert: {
    marginBottom: theme.spacing(2),
    width: "100%",
    "& .MuiAlert-message": {
      width: "100%",
    },
  },
  flowAlertBody: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
  sectionSpacing: {
    marginBottom: theme.spacing(2),
  },
  summaryCard: {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    textAlign: "center",
    height: "100%",
  },
  summaryValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: theme.palette.success.main,
  },
  summaryLabel: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  tableRowClick: {
    cursor: "pointer",
    "&.MuiTableRow-hover:hover": {
      backgroundColor: alpha(theme.palette.success.main, 0.1),
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
    <MainContainer className={classes.pageRoot}>
      <AppPageHeader
        title={
          <Typography
            variant="h5"
            color="primary"
            component="h1"
            className={classes.titleWithIcon}
          >
            <AssessmentOutlinedIcon fontSize="small" />
            {i18n.t("evaluation.title", "Avaliação")}
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="textSecondary" component="p">
            {i18n.t("evaluation.pageSubtitle")}
          </Typography>
        }
      />

      <Alert
        severity="info"
        variant="outlined"
        className={classes.flowAlert}
      >
        <Box className={classes.flowAlertBody}>
          <Typography variant="body2" component="p">
            {i18n.t("evaluation.flowInfo")}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            {i18n.t("evaluation.scaleHint")}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            {i18n.t("evaluation.listHint")}
          </Typography>
        </Box>
      </Alert>

      <Grid container spacing={2} className={classes.sectionSpacing}>
        <Grid item xs={12} sm={6}>
          <Paper className={classes.summaryCard} variant="outlined">
            <Typography className={classes.summaryValue}>
              {summary.avgRating}
            </Typography>
            <Typography className={classes.summaryLabel}>
              {i18n.t("evaluation.avgRating", "Avaliação Média")}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper className={classes.summaryCard} variant="outlined">
            <Typography className={classes.summaryValue}>
              {summary.totalRatings}
            </Typography>
            <Typography className={classes.summaryLabel}>
              {i18n.t("evaluation.totalRatings", "Total de Avaliações")}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <AppSectionCard dense variant="outlined">
        <AppActionBar className={classes.filtersBar}>
          <TextField
            className={classes.dateField}
            type="date"
            label={i18n.t("evaluation.dateFrom", "De")}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            variant="outlined"
          />
          <TextField
            className={classes.dateField}
            type="date"
            label={i18n.t("evaluation.dateTo", "Até")}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            variant="outlined"
          />
          <TextField
            className={classes.searchField}
            placeholder={i18n.t("evaluation.searchPlaceholder", "Buscar por contato ou atendente...")}
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            size="small"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </AppActionBar>
      </AppSectionCard>

      <Grid container spacing={2} className={classes.sectionSpacing}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom className={classes.sectionTitle}>
            {i18n.t("evaluation.byAttendant", "Por Atendente")}
          </Typography>
          <TableAttendantsStatus loading={loading} attendants={summary.attendants} />
        </Grid>
      </Grid>

      <AppSectionCard scrollable className={classes.tableCard} variant="outlined">
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
                <TableCell align="center">
                  {i18n.t("evaluation.table.rating", "Avaliação")}
                  <Typography variant="caption" display="block" color="textSecondary">
                    {i18n.t("evaluation.table.ratingSub")}
                  </Typography>
                </TableCell>
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
                    hover
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
                      <Rating
                        value={Math.min(Number(r.rate) || 0, RATING_MAX)}
                        max={RATING_MAX}
                        readOnly
                        size="small"
                      />
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
      </AppSectionCard>
    </MainContainer>
  );
};

export default Evaluation;

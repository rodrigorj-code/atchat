import React, { useState, useEffect } from "react";
import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import FormHelperText from "@material-ui/core/FormHelperText";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";

import AssignmentOutlinedIcon from "@material-ui/icons/AssignmentOutlined";
import ScheduleOutlinedIcon from "@material-ui/icons/ScheduleOutlined";
import CheckCircleOutlinedIcon from "@material-ui/icons/CheckCircleOutlined";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import ChatBubbleOutlinedIcon from "@material-ui/icons/ChatBubbleOutlined";
import FilterListIcon from "@material-ui/icons/FilterList";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import ButtonWithSpinner from "../../components/ButtonWithSpinner";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { isArray } from "lodash";
import useDashboard from "../../hooks/useDashboard";
import useContacts from "../../hooks/useContacts";
import { ChatsUser } from "./ChartsUser";
import { isEmpty } from "lodash";
import moment from "moment";
import { ChartsDate } from "./ChartsDate";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
  },
  reportButton: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 8,
    textTransform: "none",
    fontWeight: 600,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    "&:hover": {
      backgroundColor: "#333",
    },
  },
  card: {
    padding: theme.spacing(2.5),
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing(1),
  },
  cardTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      fontSize: 22,
    },
  },
  iconBlue: {
    backgroundColor: "rgba(33, 150, 243, 0.12)",
    color: "#2196f3",
  },
  iconOrange: {
    backgroundColor: "rgba(255, 152, 0, 0.12)",
    color: "#ff9800",
  },
  iconGreen: {
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    color: "#4caf50",
  },
  cardValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  cardSub: {
    fontSize: "0.8125rem",
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.25),
  },
  chartWrap: {
    marginTop: "auto",
    height: 56,
    width: "100%",
    marginLeft: -theme.spacing(1),
    marginRight: -theme.spacing(1),
    marginBottom: -theme.spacing(0.5),
  },
  filterBar: {
    padding: theme.spacing(2),
    borderRadius: 12,
    marginBottom: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  fullWidth: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
    color: theme.palette.text.primary,
  },
  badgeGreen: {
    display: "inline-block",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    color: "#4caf50",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 6,
    marginRight: theme.spacing(1),
  },
}));

// Converte série real (por dia) em dados para o mini gráfico. Se não houver série, usa valor único (linha estável).
function seriesToSparkData(series, valueKey, fallbackValue = 0) {
  if (isArray(series) && series.length > 0) {
    return series.map((p, i) => ({
      name: p.date ? String(p.date).slice(0, 10) : `${i + 1}`,
      value: Number(p[valueKey]) || 0,
    }));
  }
  const v = Number(fallbackValue) || 0;
  return [{ name: "1", value: v }, { name: "2", value: v }];
}

const Dashboard = () => {
  const classes = useStyles();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [series, setSeries] = useState([]);
  const [period, setPeriod] = useState(0);
  const [filterType, setFilterType] = useState(1);
  const [dateFrom, setDateFrom] = useState(moment().startOf("month").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [messageStats, setMessageStats] = useState({ sent: 0, received: 0 });
  const { find } = useDashboard();

  const GetContacts = (all) => {
    const props = all ? {} : {};
    const { count } = useContacts(props);
    return count;
  };

  useEffect(() => {
    let mounted = true;
    async function firstLoad() {
      await fetchData();
    }
    const t = setTimeout(() => {
      firstLoad();
    }, 800);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, []);

  const handleChangePeriod = (value) => setPeriod(value);
  const handleChangeFilterType = (value) => {
    setFilterType(value);
    if (value === 1) setPeriod(0);
    else {
      setDateFrom("");
      setDateTo("");
    }
  };

  async function fetchData() {
    setLoading(true);
    let params = {};
    if (period > 0) params = { days: period };
    if (!isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = { ...params, date_from: moment(dateFrom).format("YYYY-MM-DD") };
    }
    if (!isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = { ...params, date_to: moment(dateTo).format("YYYY-MM-DD") };
    }
    if (Object.keys(params).length === 0) {
      toast.error(i18n.t("dashboard.toasts.selectFilterError"));
      setLoading(false);
      return;
    }
    try {
      const data = await find(params);
      setCounters(data.counters || {});
      setAttendants(isArray(data.attendants) ? data.attendants : []);
      setMessageStats(data.messageStats || { sent: 0, received: 0 });
      setSeries(isArray(data.series) ? data.series : []);
    } catch (e) {
      setCounters({});
      setAttendants([]);
      setSeries([]);
    }
    setLoading(false);
  }

  function formatTime(minutes) {
    if (minutes == null || isNaN(minutes)) return "0 min";
    const m = Math.round(Number(minutes));
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min ? `${h}h ${min}min` : `${h}h`;
  }

  const totalAtendimentos =
    (Number(counters.supportHappening) || 0) +
    (Number(counters.supportPending) || 0) +
    (Number(counters.supportFinished) || 0) || 0;
  const taxaResolucao =
    totalAtendimentos > 0
      ? ((Number(counters.supportFinished) || 0) / totalAtendimentos * 100).toFixed(1)
      : "0";
  const pendentes = Number(counters.supportPending) || 0;
  const fechados = Number(counters.supportFinished) || 0;
  const emAtendimento = Number(counters.supportHappening) || 0;
  const percentPendentes =
    totalAtendimentos > 0 ? ((pendentes / totalAtendimentos) * 100).toFixed(0) : 0;
  const totalMensagens =
    (messageStats.sent || 0) + (messageStats.received || 0);
  const sent = messageStats.sent || 0;
  const received = messageStats.received || 0;

  const avgWaitMin = counters.avgWaitTime != null ? Math.round(Number(counters.avgWaitTime)) : 0;
  const avgSupportMin = counters.avgSupportTime != null ? Math.round(Number(counters.avgSupportTime)) : 0;

  function renderFilters() {
    if (filterType === 1) {
      return (
        <>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label={i18n.t("dashboard.filters.initialDate")}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label={i18n.t("dashboard.filters.finalDate")}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </>
      );
    }
    return (
      <Grid item xs={12} sm={6} md={4}>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="period-selector-label">
            {i18n.t("dashboard.periodSelect.title")}
          </InputLabel>
          <Select
            labelId="period-selector-label"
            id="period-selector"
            value={period}
            onChange={(e) => handleChangePeriod(e.target.value)}
          >
            <MenuItem value={0}>{i18n.t("dashboard.periodSelect.options.none")}</MenuItem>
            <MenuItem value={3}>{i18n.t("dashboard.periodSelect.options.last3")}</MenuItem>
            <MenuItem value={7}>{i18n.t("dashboard.periodSelect.options.last7")}</MenuItem>
            <MenuItem value={15}>{i18n.t("dashboard.periodSelect.options.last15")}</MenuItem>
            <MenuItem value={30}>{i18n.t("dashboard.periodSelect.options.last30")}</MenuItem>
            <MenuItem value={60}>{i18n.t("dashboard.periodSelect.options.last60")}</MenuItem>
            <MenuItem value={90}>{i18n.t("dashboard.periodSelect.options.last90")}</MenuItem>
          </Select>
          <FormHelperText>{i18n.t("dashboard.periodSelect.helper")}</FormHelperText>
        </FormControl>
      </Grid>
    );
  }

  const sparkTotal = seriesToSparkData(series, "total", totalAtendimentos);
  const sparkPendentes = seriesToSparkData(series, "pending", pendentes);
  const sparkFechados = seriesToSparkData(series, "closed", fechados);
  const sparkWait = seriesToSparkData(series, "avgWait", avgWaitMin);
  const sparkSupport = seriesToSparkData(series, "avgSupport", avgSupportMin);
  const sparkMsg =
    series.length > 0
      ? series.map((p, i) => ({
          name: p.date ? String(p.date).slice(0, 10) : `${i + 1}`,
          value: (Number(p.sent) || 0) + (Number(p.received) || 0),
        }))
      : [{ name: "1", value: totalMensagens }, { name: "2", value: totalMensagens }];

  return (
    <div>
      <Container maxWidth="lg" className={classes.container}>
        {/* Cabeçalho: Filtros + Criar Relatório (BETA) */}
        <div className={classes.headerRow}>
          <div className={classes.filterLabel}>
            <FilterListIcon fontSize="small" />
            <span>{i18n.t("dashboard.header.filters", "Filtros")}</span>
          </div>
          <Button
            className={classes.reportButton}
            startIcon={<DescriptionOutlinedIcon />}
            endIcon={<ArrowDropDownIcon />}
          >
            {i18n.t("dashboard.header.createReport", "Criar Relatório (BETA)")}
          </Button>
        </div>

        {/* Barra de filtros */}
        <Paper className={classes.filterBar} elevation={0} variant="outlined">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl className={classes.selectContainer} size="small" fullWidth>
                <InputLabel id="filter-type-label">
                  {i18n.t("dashboard.filters.filterType.title")}
                </InputLabel>
                <Select
                  labelId="filter-type-label"
                  value={filterType}
                  onChange={(e) => handleChangeFilterType(e.target.value)}
                >
                  <MenuItem value={1}>
                    {i18n.t("dashboard.filters.filterType.options.perDate")}
                  </MenuItem>
                  <MenuItem value={2}>
                    {i18n.t("dashboard.filters.filterType.options.perPeriod")}
                  </MenuItem>
                </Select>
                <FormHelperText>{i18n.t("dashboard.filters.filterType.helper")}</FormHelperText>
              </FormControl>
            </Grid>
            {renderFilters()}
            <Grid item xs={12} sm={6} md={2}>
              <ButtonWithSpinner
                loading={loading}
                onClick={() => fetchData()}
                variant="contained"
                color="primary"
                fullWidth
              >
                {i18n.t("dashboard.buttons.filter")}
              </ButtonWithSpinner>
            </Grid>
          </Grid>
        </Paper>

        {/* 6 cards no estilo da imagem */}
        <Grid container spacing={3}>
          {/* 1. Total de Atendimentos */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper className={classes.card} elevation={0}>
              <div className={classes.cardHeader}>
                <Typography className={classes.cardTitle}>
                  {i18n.t("dashboard.cards.totalAttendances", "Total de Atendimentos")}
                </Typography>
                <div className={`${classes.iconCircle} ${classes.iconBlue}`}>
                  <AssignmentOutlinedIcon />
                </div>
              </div>
              <Typography className={classes.cardValue}>{totalAtendimentos}</Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.inAttendance", "Em Atendimento")}: {emAtendimento}
              </Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.resolutionRate", "Taxa Resolução")}: {taxaResolucao}%
              </Typography>
              <div className={classes.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkTotal} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2196f3" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2196f3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#2196f3" fill="url(#areaBlue)" strokeWidth={1.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>

          {/* 2. Pendentes */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper className={classes.card} elevation={0}>
              <div className={classes.cardHeader}>
                <Typography className={classes.cardTitle}>
                  {i18n.t("dashboard.counters.waiting", "Pendentes")}
                </Typography>
                <div className={`${classes.iconCircle} ${classes.iconOrange}`}>
                  <ScheduleOutlinedIcon />
                </div>
              </div>
              <Typography className={classes.cardValue}>{pendentes}</Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.ofTotal", "Do Total")}: {percentPendentes}%
              </Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.statusWaiting", "Status: Aguardando Atendimento")}
              </Typography>
              <div className={classes.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkPendentes} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff9800" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ff9800" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#ff9800" fill="url(#areaOrange)" strokeWidth={1.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>

          {/* 3. Fechados */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper className={classes.card} elevation={0}>
              <div className={classes.cardHeader}>
                <Typography className={classes.cardTitle}>
                  {i18n.t("dashboard.counters.finished", "Fechados")}
                </Typography>
                <div className={`${classes.iconCircle} ${classes.iconGreen}`}>
                  <CheckCircleOutlinedIcon />
                </div>
              </div>
              <Typography className={classes.cardValue}>
                <span className={classes.badgeGreen}>^ {taxaResolucao}%</span>
                {fechados}
              </Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.resolutionRate", "Taxa Resolução")}: {taxaResolucao}%
              </Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.ofTotal", "Do Total")}: {totalAtendimentos}
              </Typography>
              <div className={classes.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkFechados} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4caf50" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#4caf50" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#4caf50" fill="url(#areaGreen)" strokeWidth={1.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>

          {/* 4. Tempo Médio 1° Resposta */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper className={classes.card} elevation={0}>
              <div className={classes.cardHeader}>
                <Typography className={classes.cardTitle}>
                  {i18n.t("dashboard.cards.avgFirstResponse", "Tempo Médio 1° Resposta")}
                </Typography>
                <div className={`${classes.iconCircle} ${classes.iconBlue}`}>
                  <AccessTimeIcon />
                </div>
              </div>
              <Typography className={classes.cardValue}>{formatTime(avgWaitMin)}</Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.inMinutes", "Em Minutos")}: {avgWaitMin} min
              </Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.status", "Status")}: {avgWaitMin <= 5 ? "Ótimo" : avgWaitMin <= 15 ? "Rápido" : "Normal"}
              </Typography>
              <div className={classes.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkWait} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaBlue2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2196f3" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2196f3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#2196f3" fill="url(#areaBlue2)" strokeWidth={1.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>

          {/* 5. Tempo Médio Atendimento */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper className={classes.card} elevation={0}>
              <div className={classes.cardHeader}>
                <Typography className={classes.cardTitle}>
                  {i18n.t("dashboard.counters.averageTalkTime", "Tempo Médio Atendimento")}
                </Typography>
                <div className={`${classes.iconCircle} ${classes.iconOrange}`}>
                  <ScheduleOutlinedIcon />
                </div>
              </div>
              <Typography className={classes.cardValue}>{formatTime(avgSupportMin)}</Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.inMinutes", "Em Minutos")}: {avgSupportMin} min
              </Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.status", "Status")}: {avgSupportMin <= 20 ? "Rápido" : "Normal"}
              </Typography>
              <div className={classes.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkSupport} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaOrange2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff9800" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ff9800" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#ff9800" fill="url(#areaOrange2)" strokeWidth={1.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>

          {/* 6. Total de Mensagens */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper className={classes.card} elevation={0}>
              <div className={classes.cardHeader}>
                <Typography className={classes.cardTitle}>
                  {i18n.t("dashboard.cards.totalMessages", "Total de Mensagens")}
                </Typography>
                <div className={`${classes.iconCircle} ${classes.iconBlue}`}>
                  <ChatBubbleOutlinedIcon />
                </div>
              </div>
              <Typography className={classes.cardValue}>{totalMensagens}</Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.sent", "Enviadas")}: {sent}
              </Typography>
              <Typography className={classes.cardSub}>
                {i18n.t("dashboard.cards.received", "Recebidas")}: {received}
              </Typography>
              <div className={classes.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkMsg} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaBlue3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2196f3" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2196f3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#2196f3" fill="url(#areaBlue3)" strokeWidth={1.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid>
        </Grid>

        {/* Status dos atendentes */}
        <Typography className={classes.sectionTitle}>
          {i18n.t("dashboard.onlineTable.title", "Status dos atendentes")}
        </Typography>
        {attendants.length > 0 ? (
          <Paper elevation={0} variant="outlined" style={{ borderRadius: 12, overflow: "hidden" }}>
            <TableAttendantsStatus attendants={attendants} loading={loading} />
          </Paper>
        ) : null}

        {/* Gráficos */}
        <Grid container spacing={3} style={{ marginTop: 8 }}>
          <Grid item xs={12} md={6}>
            <ChatsUser />
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartsDate />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;

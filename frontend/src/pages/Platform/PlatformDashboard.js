import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import MainContainer from "../../components/MainContainer";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import PlatformPageHeader from "./PlatformPageHeader";

export default function PlatformDashboard() {
  const [stats, setStats] = useState({ count: 0, loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/companies", { params: { pageNumber: 1 } });
        if (!cancelled) {
          setStats({ count: data.count ?? 0, loading: false });
        }
      } catch {
        if (!cancelled) setStats({ count: 0, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MainContainer>
      <PlatformPageHeader
        titleKey="platform.dashboard.title"
        subtitleKey="platform.dashboard.subtitle"
      />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper style={{ padding: 24 }} variant="outlined">
            <Typography color="textSecondary" variant="body2">
              {i18n.t("platform.dashboard.companiesTotal")}
            </Typography>
            <Typography variant="h4" style={{ marginTop: 8 }}>
              {stats.loading ? "…" : stats.count}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </MainContainer>
  );
}

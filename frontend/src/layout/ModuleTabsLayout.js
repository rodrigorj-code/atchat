import React from "react";
import { Link, useLocation } from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    marginRight: theme.spacing(-2),
    marginLeft: theme.spacing(-2),
    marginTop: theme.spacing(-2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  tabs: {
    minHeight: 44,
    "& .MuiTab-root": {
      minHeight: 44,
      textTransform: "none",
      fontWeight: 500,
    },
  },
}));

/**
 * Abas de módulo: navegação por rota (URLs inalteradas).
 * @param {{ path: string, label: string }[]} tabs — ordem importa para o índice ativo
 */
export default function ModuleTabsLayout({ tabs, children }) {
  const location = useLocation();
  const classes = useStyles();
  const pathname = location.pathname;

  let activeIndex = 0;
  let bestLen = -1;
  tabs.forEach((tab, i) => {
    const p = tab.path;
    const match =
      p === "/"
        ? pathname === "/" || pathname === ""
        : pathname === p || pathname.startsWith(`${p}/`);
    if (match) {
      const len = p.length;
      if (len > bestLen) {
        bestLen = len;
        activeIndex = i;
      }
    }
  });

  if (tabs.length === 0) {
    return <>{children}</>;
  }

  return (
    <>
      <Paper className={classes.root} elevation={0} square>
        <Tabs
          value={activeIndex}
          aria-label="module-tabs"
          className={classes.tabs}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab) => (
            <Tab key={tab.path} label={tab.label} component={Link} to={tab.path} />
          ))}
        </Tabs>
      </Paper>
      {children}
    </>
  );
}

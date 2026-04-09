import React from "react";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import InboxOutlinedIcon from "@material-ui/icons/InboxOutlined";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: theme.spacing(4, 3),
    minHeight: 200,
    maxWidth: 440,
    margin: "0 auto",
    width: "100%",
  },
  icon: {
    fontSize: 52,
    color: theme.palette.text.secondary,
    opacity: 0.45,
    marginBottom: theme.spacing(1.5),
  },
  title: {
    fontWeight: 600,
    fontSize: "1.125rem",
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  description: {
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
    lineHeight: 1.55,
    marginBottom: theme.spacing(0),
  },
  hint: {
    color: theme.palette.text.secondary,
    fontSize: "0.8125rem",
    lineHeight: 1.5,
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(255,255,255,0.06)"
        : theme.palette.grey[100],
    border: `1px dashed ${theme.palette.divider}`,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    maxWidth: "100%",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    justifyContent: "center",
    marginTop: theme.spacing(1),
  },
}));

/**
 * Estado vazio padrão: ícone, título, texto e ação opcional (children).
 */
const AppEmptyState = ({
  icon: IconComponent,
  title,
  description,
  hint,
  children,
  className,
  ...boxProps
}) => {
  const classes = useStyles();
  const Icon = IconComponent || InboxOutlinedIcon;

  return (
    <Box
      className={className ? `${classes.root} ${className}` : classes.root}
      role="status"
      aria-live="polite"
      {...boxProps}
    >
      <Icon className={classes.icon} aria-hidden />
      <Typography component="h2" className={classes.title}>
        {title}
      </Typography>
      {description ? (
        <Typography className={classes.description}>{description}</Typography>
      ) : null}
      {hint ? (
        <Typography component="p" className={classes.hint}>
          {hint}
        </Typography>
      ) : null}
      {children ? <div className={classes.actions}>{children}</div> : null}
    </Box>
  );
};

export default AppEmptyState;

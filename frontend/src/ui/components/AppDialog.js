import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

/**
 * Estilos opcionais para casos em que o modal não usa os subcomponentes AppDialog*.
 * O tema global (MuiDialog*) define padding e separadores; aqui reforçamos raio do paper e título.
 */
export const useAppDialogStyles = makeStyles((theme) => ({
  titleHeading: {
    fontWeight: 600,
    fontSize: "1.125rem",
    lineHeight: 1.35,
    color: theme.palette.text.primary,
  },
  subtitle: {
    display: "block",
    marginTop: theme.spacing(0.75),
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    color: theme.palette.text.secondary,
    fontWeight: 400,
  },
}));

function mergePaperClasses(...parts) {
  return parts.filter(Boolean).join(" ").trim();
}

/**
 * Dialog padrão: fullWidth, scroll em paper, maxWidth configurável (sm | md | lg | xs).
 */
export function AppDialog({
  children,
  paperClassName,
  maxWidth = "sm",
  fullWidth = true,
  scroll = "paper",
  classes: dialogClassesProp,
  ...rest
}) {
  const paper = mergePaperClasses(
    paperClassName,
    dialogClassesProp && dialogClassesProp.paper
  );
  return (
    <Dialog
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      scroll={scroll}
      classes={{ ...dialogClassesProp, ...(paper ? { paper } : {}) }}
      {...rest}
    >
      {children}
    </Dialog>
  );
}

/**
 * Título com hierarquia consistente. Use disableTypography quando o título for JSX composto (ex.: ScheduleModal).
 */
export function AppDialogTitle({
  children,
  subtitle,
  disableTypography,
  className,
  ...rest
}) {
  const classes = useAppDialogStyles();
  if (disableTypography) {
    return (
      <DialogTitle className={className} {...rest}>
        {children}
      </DialogTitle>
    );
  }
  return (
    <DialogTitle disableTypography className={className} {...rest}>
      <Typography component="h2" variant="h6" className={classes.titleHeading}>
        {children}
      </Typography>
      {subtitle != null && subtitle !== "" && (
        typeof subtitle === "string" ? (
          <Typography component="span" variant="body2" className={classes.subtitle}>
            {subtitle}
          </Typography>
        ) : (
          subtitle
        )
      )}
    </DialogTitle>
  );
}

export function AppDialogContent({ className, dividers = true, ...rest }) {
  return <DialogContent dividers={dividers} className={className} {...rest} />;
}

export function AppDialogActions({ className, ...rest }) {
  return <DialogActions className={className} {...rest} />;
}

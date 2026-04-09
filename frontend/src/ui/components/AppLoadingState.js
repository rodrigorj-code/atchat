import React from "react";
import Box from "@material-ui/core/Box";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(5, 3),
    minHeight: 200,
    width: "100%",
  },
  message: {
    marginTop: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
    textAlign: "center",
    maxWidth: 320,
  },
}));

/**
 * Carregamento centralizado (listas, secções). Para tabelas use AppTableRowSkeleton.
 */
const AppLoadingState = ({
  message,
  size = 40,
  className,
  ...boxProps
}) => {
  const classes = useStyles();
  return (
    <Box
      className={className ? `${classes.root} ${className}` : classes.root}
      role="status"
      aria-busy="true"
      aria-live="polite"
      {...boxProps}
    >
      <CircularProgress size={size} thickness={3.6} />
      {message ? (
        <Typography variant="body2" component="p" className={classes.message}>
          {message}
        </Typography>
      ) : null}
    </Box>
  );
};

export default AppLoadingState;

import React from "react";
import clsx from "clsx";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    transition: theme.transitions.create(["box-shadow"], {
      duration: 200,
      easing: theme.transitions.easing.easeInOut,
    }),
    "@media (hover: hover)": {
      "&:hover": {
        boxShadow:
          theme.palette.type === "light"
            ? "0 2px 12px rgba(15, 23, 42, 0.09)"
            : "0 2px 12px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  dense: {
    padding: theme.spacing(1),
  },
  scrollable: {
    flex: 1,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  outlined: {
    borderColor: theme.palette.divider,
  },
}));

/**
 * Card de secção para listagens e formulários em página.
 * @param {boolean} scrollable — aplica overflow + scrollbar do tema
 * @param {boolean} dense — padding reduzido (listagens densas)
 */
const AppSectionCard = ({
  children,
  className,
  scrollable,
  dense,
  variant = "outlined",
  elevation = 0,
  ...paperProps
}) => {
  const classes = useStyles();
  return (
    <Paper
      variant={variant}
      elevation={elevation}
      className={clsx(
        classes.root,
        dense && classes.dense,
        scrollable && classes.scrollable,
        variant === "outlined" && classes.outlined,
        className
      )}
      {...paperProps}
    >
      {children}
    </Paper>
  );
};

export default AppSectionCard;

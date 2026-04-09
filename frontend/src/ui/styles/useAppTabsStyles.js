import { makeStyles } from "@material-ui/core/styles";

/**
 * Estilo unificado para abas de listagem (Atendimentos, etc.).
 * Indicador fino, cor primary, texto sem uppercase forçado pelo tema global.
 */
const useAppTabsStyles = makeStyles((theme) => ({
  root: {
    minHeight: 48,
    transition: theme.transitions.create(["border-color"], {
      duration: 200,
      easing: theme.transitions.easing.easeInOut,
    }),
    "& .MuiTab-root": {
      textTransform: "none",
      fontWeight: 500,
      minHeight: 48,
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      transition: theme.transitions.create(["color", "background-color"], {
        duration: 200,
        easing: theme.transitions.easing.easeInOut,
      }),
    },
  },
  indicator: {
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.palette.primary.main,
    transition: theme.transitions.create(["left", "width"], {
      duration: 220,
      easing: theme.transitions.easing.easeOut,
    }),
  },
}));

export default useAppTabsStyles;

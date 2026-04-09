import { makeStyles } from "@material-ui/core/styles";

/**
 * Overlay de loading reutilizável nos botões do design system (evita cliques duplos em ações async).
 */
export const useAppButtonLoadingOverlay = makeStyles((theme) => ({
  relative: {
    position: "relative",
  },
  progress: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

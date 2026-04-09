import React from "react";
import clsx from "clsx";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import { useAppButtonLoadingOverlay } from "../styles/appInteractionStyles";

/**
 * Ação secundária: outlined + primary (borda e texto primary; hover com alpha no tema).
 * `loading`: desabilita o botão e mostra spinner (ações async).
 */
const AppSecondaryButton = React.forwardRef(function AppSecondaryButton(
  { size = "medium", variant = "outlined", color = "primary", loading, disabled, className, children, ...rest },
  ref
) {
  const loadCls = useAppButtonLoadingOverlay();
  return (
    <Button
      ref={ref}
      size={size}
      variant={variant}
      color={color}
      disabled={disabled || loading}
      className={clsx(loading && loadCls.relative, className)}
      {...rest}
    >
      {children}
      {loading && (
        <CircularProgress size={24} className={loadCls.progress} color="inherit" />
      )}
    </Button>
  );
});

export default AppSecondaryButton;

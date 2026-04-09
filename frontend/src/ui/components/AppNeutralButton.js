import React from "react";
import clsx from "clsx";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import { useAppButtonLoadingOverlay } from "../styles/appInteractionStyles";

/**
 * Ação neutra: outlined + default (texto text.primary / borda neutra via tema).
 * `loading`: desabilita o botão e mostra spinner (ações async).
 */
const AppNeutralButton = React.forwardRef(function AppNeutralButton(
  { size = "medium", variant = "outlined", color = "default", loading, disabled, className, children, ...rest },
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

export default AppNeutralButton;

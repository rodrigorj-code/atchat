import React from "react";
import clsx from "clsx";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import { useAppButtonLoadingOverlay } from "../styles/appInteractionStyles";

/**
 * Ação principal: contained + primary (cores e hover do tema global).
 * `loading`: desabilita o botão e mostra spinner (ações async, evita cliques repetidos).
 */
const AppPrimaryButton = React.forwardRef(function AppPrimaryButton(
  { size = "medium", variant = "contained", color = "primary", loading, disabled, className, children, ...rest },
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
        <CircularProgress size={24} color="inherit" className={loadCls.progress} />
      )}
    </Button>
  );
});

export default AppPrimaryButton;

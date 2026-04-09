import React from "react";
import clsx from "clsx";
import IconButton from "@material-ui/core/IconButton";

/**
 * Ação destrutiva compacta (ícone). Estilos vêm do tema (`MuiIconButton` + data-app-danger).
 */
const AppDangerAction = React.forwardRef(function AppDangerAction(
  { size = "small", className, ...rest },
  ref
) {
  return (
    <IconButton
      ref={ref}
      size={size}
      className={clsx(className)}
      data-app-danger="true"
      {...rest}
    />
  );
});

export default AppDangerAction;

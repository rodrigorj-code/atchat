import React from "react";

/**
 * Painel de aba: só monta `children` quando `value === name`.
 * Abas inativas não ficam no DOM (evita listas/socket duplicados entre abas principais).
 */
const TabPanel = ({ children, value, name, ...rest }) => {
	if (value === name) {
		return (
			<div
				role="tabpanel"
				id={`simple-tabpanel-${name}`}
				aria-labelledby={`simple-tab-${name}`}
				{...rest}
			>
				<>{children}</>
			</div>
		);
	} else return null;
};

export default TabPanel;

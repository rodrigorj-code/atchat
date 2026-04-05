import React from "react";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
	mainContainer: {
		flex: 1,
		width: "100%",
		maxWidth: "100%",
		padding: theme.spacing(1.5, 2),
		minHeight: 0,
		boxSizing: "border-box",
		[theme.breakpoints.up("md")]: {
			padding: theme.spacing(2, 2.5),
		},
	},

	contentWrapper: {
		flex: 1,
		minHeight: 0,
		width: "100%",
		maxWidth: "100%",
		display: "flex",
		flexDirection: "column",
		overflow: "visible",
	},
}));

const MainContainer = ({ children, className }) => {
	const classes = useStyles();

	return (
		<Container
			maxWidth={false}
			disableGutters
			className={clsx(classes.mainContainer, className)}
		>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;

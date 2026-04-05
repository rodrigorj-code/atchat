import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
	mainContainer: {
		flex: 1,
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
		display: "flex",
		flexDirection: "column",
		overflow: "visible",
	},
}));

const MainContainer = ({ children }) => {
	const classes = useStyles();

	return (
		<Container className={classes.mainContainer}>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;

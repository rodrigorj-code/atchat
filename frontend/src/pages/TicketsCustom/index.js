import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";
import logo from "../../assets/logo.png";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	chatContainer: {
		flex: 1,
		padding: theme.spacing(1),
		height: `calc(100% - 48px)`,
		overflowY: "hidden",
		backgroundColor: "#f4f4f4",
	},

	chatPapper: {
		display: "flex",
		height: "100%",
	},

	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
	},
	messagesWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
	},
	welcomeMsg: {
		backgroundColor: theme.palette.boxticket || "#fff",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		height: "100%",
		textAlign: "center",
		padding: theme.spacing(4),
	},
	welcomeLogo: {
		maxWidth: "70%",
		height: "auto",
		marginBottom: theme.spacing(2),
	},
	welcomeText: {
		color: theme.palette.text.secondary,
		fontSize: "0.9375rem",
		marginTop: theme.spacing(1),
	},
}));

const TicketsCustom = () => {
	const classes = useStyles();
	const { ticketId } = useParams();

	return (
		<div className={classes.chatContainer}>
			<div className={classes.chatPapper}>
				<Grid container spacing={0}>
					<Grid item xs={4} className={classes.contactsWrapper}>
						<TicketsManager />
					</Grid>
					<Grid item xs={8} className={classes.messagesWrapper}>
						{ticketId ? (
							<>
								<Ticket />
							</>
						) : (
							<Paper square variant="outlined" className={classes.welcomeMsg}>
								<img className={classes.welcomeLogo} src={logo} alt="" />
								<Typography className={classes.welcomeText}>
									{i18n.t("chat.noTicketMessage")}
								</Typography>
							</Paper>
						)}
					</Grid>
				</Grid>
			</div>
		</div>
	);
};

export default TicketsCustom;

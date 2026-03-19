import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { versionSystem } from "../../../package.json";
import { i18n } from "../../translate/i18n";
import { nomeEmpresa } from "../../../package.json";
import { AuthContext } from "../../context/Auth/AuthContext";
import logo from "../../assets/logo.png";
import {
	LanguageOutlined,
	Visibility,
	VisibilityOff,
	WhatsApp,
} from "@material-ui/icons";
import {
	Checkbox,
	Fab,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Menu,
	MenuItem,
} from "@material-ui/core";
import LanguageControl from "../../components/LanguageControl";


const Copyright = () => {
	return (
		<Typography variant="body2" style={{ color: "rgba(0,0,0,0.55)" }} align="center">
			{"Copyright "}
			<Link style={{ color: "rgba(0,0,0,0.7)" }} href="#">
				{nomeEmpresa} - v {versionSystem}
			</Link>{" "}
			{new Date().getFullYear()}
			{"."}
 		</Typography>
 	);
 };

const useStyles = makeStyles(theme => ({
	root: {
		width: "100vw",
		height: "100vh",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		backgroundColor: "#ffffff",
		[theme.breakpoints.down("sm")]: {
			padding: theme.spacing(2),
		},
	},
	card: {
		width: "100%",
		maxWidth: 420,
		backgroundColor: "#fff",
		borderRadius: 8,
		boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
		padding: theme.spacing(4, 4, 3),
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		[theme.breakpoints.down("sm")]: {
			padding: theme.spacing(3, 2.5, 2.5),
		},
	},
	logoWrap: {
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: theme.spacing(2.5),
	},
	form: {
		width: "100%",
		maxWidth: 360,
	},
	logo: {
		maxWidth: 260,
		width: "100%",
		height: "auto",
		objectFit: "contain",
	},
	input: {
		"& .MuiOutlinedInput-root": {
			borderRadius: 4,
			backgroundColor: "#fff",
		},
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: "rgba(0,0,0,0.20)",
		},
	},
	submit: {
		margin: theme.spacing(2.5, 0, 1.5),
		borderRadius: 4,
		fontWeight: 700,
		padding: "10px 0",
		background: "linear-gradient(180deg, #111 0%, #000 100%)",
		color: "#fff",
		boxShadow: "0 8px 14px rgba(0,0,0,0.25)",
		"&:hover": {
			background: "linear-gradient(180deg, #222 0%, #000 100%)",
		},
	},
	linksWrap: {
		width: "100%",
		display: "flex",
		flexDirection: "column",
		gap: theme.spacing(0.75),
		marginTop: theme.spacing(1),
	},
	linkRow: {
		display: "flex",
		alignItems: "center",
		gap: theme.spacing(1),
		color: "rgba(0,0,0,0.7)",
		textDecoration: "none",
		fontSize: 13,
		fontWeight: 500,
		"&:hover": {
			color: "rgba(0,0,0,0.9)",
			textDecoration: "underline",
		},
	},
	rememberRow: {
		marginTop: theme.spacing(0.5),
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
	},
	rememberLabel: {
		"& .MuiFormControlLabel-label": {
			fontSize: 12.5,
			color: "rgba(0,0,0,0.7)",
		},
	},
	languageControl: {
		position: "absolute",
		top: 12,
		right: 12,
		zIndex: 1,
	},
	footer: {
		position: "absolute",
		bottom: 14,
		left: 0,
		right: 0,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 6,
		padding: theme.spacing(0, 2),
		[theme.breakpoints.down("sm")]: {
			position: "static",
			marginTop: theme.spacing(2.5),
		},
	},
	footerLinks: {
		display: "flex",
		alignItems: "center",
		gap: theme.spacing(1),
		fontSize: 12.5,
		color: "rgba(0,0,0,0.55)",
		"& a": {
			color: "rgba(0,0,0,0.65)",
			textDecoration: "none",
		},
		"& a:hover": {
			textDecoration: "underline",
		},
	},
	supportWrap: {
		position: "fixed",
		right: 18,
		bottom: 18,
		display: "flex",
		alignItems: "center",
		gap: 10,
		zIndex: 1500,
	},
	supportBadge: {
		background: "#fff",
		borderRadius: 4,
		padding: "6px 10px",
		boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
		border: "1px solid rgba(0,0,0,0.08)",
		fontSize: 12.5,
		color: "rgba(0,0,0,0.7)",
		whiteSpace: "nowrap",
	},
	whatsFab: {
		backgroundColor: "#25D366",
		color: "#fff",
		"&:hover": {
			backgroundColor: "#1fb857",
		},
	},
}));

const Login = () => {
	const classes = useStyles();

	const [user, setUser] = useState({ email: "", password: "" });
	const [remember, setRemember] = useState(true);
	const [showPassword, setShowPassword] = useState(false);

	// Languages
	const [anchorElLanguage, setAnchorElLanguage] = useState(null);
	const [menuLanguageOpen, setMenuLanguageOpen] = useState(false);

	const { handleLogin } = useContext(AuthContext);

	useEffect(() => {
		try {
			const savedEmail = localStorage.getItem("login_email") || "";
			const savedRemember = localStorage.getItem("login_remember") !== "false";
			setRemember(savedRemember);
			if (savedRemember && savedEmail) {
				setUser(prev => ({ ...prev, email: savedEmail }));
			}
		} catch (err) {}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem("login_remember", remember ? "true" : "false");
			if (!remember) localStorage.removeItem("login_email");
		} catch (err) {}
	}, [remember]);

	const handleChangeInput = e => {
		const next = { ...user, [e.target.name]: e.target.value };
		setUser(next);
		if (remember && e.target.name === "email") {
			try {
				localStorage.setItem("login_email", e.target.value);
			} catch (err) {}
		}
	};

	const handlSubmit = e => {
		e.preventDefault();
		handleLogin(user);
	};

	const handlemenuLanguage = ( event ) => {
		setAnchorElLanguage(event.currentTarget);
		setMenuLanguageOpen( true );
	}

	const handleCloseMenuLanguage = (  ) => {
		setAnchorElLanguage(null);
		setMenuLanguageOpen(false);
	}

	const supportNumber = useMemo(() => {
		const raw = process.env.REACT_APP_NUMBER_SUPPORT || "5551997058551";
		return String(raw).replace(/\D/g, "");
	}, []);
	
	return (
		<div className={classes.root}>
			<div className={classes.languageControl}>
				<IconButton edge="start" onClick={handlemenuLanguage} style={{ color: "rgba(0,0,0,0.55)" }}>
					<LanguageOutlined aria-label="Idioma" />
				</IconButton>
				<Menu
					id="menu-appbar-language"
					anchorEl={anchorElLanguage}
					getContentAnchorEl={null}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
					open={menuLanguageOpen}
					onClose={handleCloseMenuLanguage}
				>
					<MenuItem><LanguageControl /></MenuItem>
				</Menu>
			</div>

			<div className={classes.card}>
				<div className={classes.logoWrap}>
					<img className={classes.logo} src={logo} alt={nomeEmpresa} />
				</div>

				<form className={classes.form} noValidate onSubmit={handlSubmit}>
					<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="email"
						label={`${i18n.t("login.form.email")} *`}
						name="email"
						value={user.email}
						onChange={handleChangeInput}
						autoComplete="email"
						autoFocus
						className={classes.input}
					/>

					<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						name="password"
						label={`${i18n.t("login.form.password")} *`}
						type={showPassword ? "text" : "password"}
						id="password"
						value={user.password}
						onChange={handleChangeInput}
						autoComplete="current-password"
						className={classes.input}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
										onClick={() => setShowPassword(v => !v)}
										edge="end"
										size="small"
									>
										{showPassword ? <VisibilityOff /> : <Visibility />}
									</IconButton>
								</InputAdornment>
							),
						}}
					/>

					<div className={classes.rememberRow}>
						<FormControlLabel
							className={classes.rememberLabel}
							control={
								<Checkbox
									checked={remember}
									onChange={e => setRemember(e.target.checked)}
									color="primary"
									size="small"
								/>
							}
							label="Salvar login"
						/>
					</div>

					<Button type="submit" fullWidth variant="contained" className={classes.submit}>
						{i18n.t("login.buttons.submit")}
					</Button>

					<div className={classes.linksWrap}>
						<Link component={RouterLink} to="/forgetpsw" className={classes.linkRow}>
							<span role="img" aria-label="key">
								🔑
							</span>
							Esqueci minha senha
						</Link>

						<Link component={RouterLink} to="/signup" className={classes.linkRow}>
							<span role="img" aria-label="pen">
								📝
							</span>
							Não tem uma conta? Cadastre-se!
						</Link>
					</div>
				</form>
			</div>

			<div className={classes.footer}>
				<div className={classes.footerLinks}>
					<a href="#" onClick={e => e.preventDefault()}>
						Política de Privacidade
					</a>
					<span>|</span>
					<a href="#" onClick={e => e.preventDefault()}>
						Termos de Uso
					</a>
				</div>
				<Copyright />
			</div>

			<div className={classes.supportWrap}>
				<div className={classes.supportBadge}>Suporte disponível</div>
				<Fab
					size="medium"
					className={classes.whatsFab}
					component="a"
					href={`https://wa.me/${supportNumber}`}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="WhatsApp"
				>
					<WhatsApp />
				</Fab>
			</div>
		</div>
	);
};

export default Login;

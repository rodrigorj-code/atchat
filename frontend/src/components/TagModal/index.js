import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import Chip from "@material-ui/core/Chip";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { Colorize } from "@material-ui/icons";
import { ColorBox } from "material-ui-color";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { IconButton, InputAdornment } from "@material-ui/core";
import { FormControlLabel, Checkbox } from "@material-ui/core";

const DEFAULT_COLOR = "#A4CCCC";

const chipTextColor = (hex) => {
	if (!hex || typeof hex !== "string") return "#fff";
	const h = hex.replace("#", "").slice(0, 6);
	if (h.length !== 6) return "#fff";
	const r = parseInt(h.substr(0, 2), 16);
	const g = parseInt(h.substr(2, 2), 16);
	const b = parseInt(h.substr(4, 2), 16);
	if (Number.isNaN(r + g + b)) return "#fff";
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 186 ? "#111" : "#fff";
};

const useStyles = makeStyles((theme) => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
	},

	btnWrapper: {
		position: "relative",
	},

	buttonProgress: {
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
	colorAdorment: {
		width: 22,
		height: 22,
		borderRadius: 4,
		border: `1px solid ${theme.palette.divider}`,
	},
	previewBox: {
		padding: theme.spacing(2),
		borderRadius: theme.shape.borderRadius,
		backgroundColor: theme.palette.background.default,
		marginBottom: theme.spacing(2),
		border: `1px solid ${theme.palette.divider}`,
	},
}));

const TagModal = ({ open, onClose, tagId, reload }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
	const [kanban, setKanban] = useState(0);
	const [initialValues, setInitialValues] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleCloseInternal = useCallback(() => {
		setColorPickerModalOpen(false);
		setInitialValues(null);
		setKanban(0);
		onClose();
	}, [onClose]);

	const validationSchema = useMemo(
		() =>
			Yup.object().shape({
				name: Yup.string()
					.trim()
					.min(2, i18n.t("tagModal.formErrors.nameShort"))
					.max(80, i18n.t("tagModal.formErrors.nameLong"))
					.required(i18n.t("tagModal.formErrors.nameRequired")),
				color: Yup.string(),
			}),
		[]
	);

	useEffect(() => {
		if (!open) {
			setInitialValues(null);
			return;
		}

		let cancelled = false;

		if (!tagId) {
			setKanban(0);
			setColorPickerModalOpen(false);
			setInitialValues({
				name: "",
				color: DEFAULT_COLOR,
			});
			return;
		}

		(async () => {
			setLoading(true);
			try {
				const { data } = await api.get(`/tags/${tagId}`);
				if (cancelled) return;
				setKanban(data.kanban || 0);
				setInitialValues({
					name: data.name || "",
					color: data.color || DEFAULT_COLOR,
				});
			} catch (err) {
				toastError(err);
				onClose();
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [open, tagId, onClose]);

	const handleSaveTag = async (values) => {
		const tagData = { ...values, kanban };
		try {
			if (tagId) {
				await api.put(`/tags/${tagId}`, tagData);
			} else {
				await api.post("/tags", tagData);
			}
			toast.success(i18n.t("tagModal.success"));
			if (typeof reload === "function") {
				reload();
			}
		} catch (err) {
			toastError(err);
			return;
		}
		handleCloseInternal();
	};

	const showForm = open && initialValues && !loading;

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleCloseInternal}
				maxWidth="sm"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{tagId
						? `${i18n.t("tagModal.title.edit")}`
						: `${i18n.t("tagModal.title.add")}`}
				</DialogTitle>
				{loading && tagId ? (
					<DialogContent>
						<Box display="flex" justifyContent="center" py={4}>
							<CircularProgress />
						</Box>
					</DialogContent>
				) : showForm ? (
					<Formik
						initialValues={initialValues}
						enableReinitialize
						validationSchema={validationSchema}
						onSubmit={(values, actions) => {
							setTimeout(() => {
								handleSaveTag(values);
								actions.setSubmitting(false);
							}, 400);
						}}
					>
						{({ touched, errors, isSubmitting, values, setFieldValue }) => (
							<Form>
								<DialogContent dividers>
									<Box className={classes.previewBox}>
										<Typography
											variant="caption"
											color="textSecondary"
											display="block"
											gutterBottom
										>
											{i18n.t("tagModal.preview")}
										</Typography>
										<Box mt={1}>
											<Chip
												label={
													values.name ||
													i18n.t("tagModal.previewPlaceholder")
												}
												size="medium"
												style={{
													backgroundColor: values.color || DEFAULT_COLOR,
													color: chipTextColor(values.color || DEFAULT_COLOR),
													fontWeight: 600,
													maxWidth: "100%",
												}}
											/>
										</Box>
									</Box>

									<div className={classes.multFieldLine}>
										<Field
											as={TextField}
											label={i18n.t("tagModal.form.name")}
											name="name"
											error={touched.name && Boolean(errors.name)}
											helperText={touched.name && errors.name}
											variant="outlined"
											margin="dense"
											fullWidth
										/>
									</div>
									<br />
									<div className={classes.multFieldLine}>
										<Field
											as={TextField}
											fullWidth
											label={i18n.t("tagModal.form.color")}
											name="color"
											id="color"
											error={touched.color && Boolean(errors.color)}
											helperText={touched.color && errors.color}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<div
															style={{
																backgroundColor:
																	values.color || DEFAULT_COLOR,
															}}
															className={classes.colorAdorment}
														/>
													</InputAdornment>
												),
												endAdornment: (
													<IconButton
														size="small"
														color="default"
														type="button"
														onClick={() =>
															setColorPickerModalOpen(!colorPickerModalOpen)
														}
													>
														<Colorize />
													</IconButton>
												),
											}}
											variant="outlined"
											margin="dense"
										/>
									</div>
									{(user.profile === "admin" ||
										user.profile === "supervisor") && (
										<>
											<div className={classes.multFieldLine}>
												<FormControlLabel
													control={
														<Checkbox
															checked={kanban === 1}
															onChange={(e) =>
																setKanban(e.target.checked ? 1 : 0)
															}
															color="primary"
														/>
													}
													label="Kanban"
													labelPlacement="start"
												/>
											</div>
											<br />
										</>
									)}
									{colorPickerModalOpen && (
										<div>
											<ColorBox
												disableAlpha={true}
												hslGradient={false}
												style={{ margin: "20px auto 0" }}
												value={
													(values.color || DEFAULT_COLOR).replace("#", "")
												}
												onChange={(val) => {
													const hex = val.hex ? `#${val.hex}` : values.color;
													setFieldValue("color", hex);
												}}
											/>
										</div>
									)}
								</DialogContent>
								<DialogActions>
									<Button
										onClick={handleCloseInternal}
										color="secondary"
										disabled={isSubmitting}
										variant="outlined"
									>
										{i18n.t("tagModal.buttons.cancel")}
									</Button>
									<Button
										type="submit"
										color="primary"
										disabled={isSubmitting}
										variant="contained"
										className={classes.btnWrapper}
									>
										{tagId
											? `${i18n.t("tagModal.buttons.okEdit")}`
											: `${i18n.t("tagModal.buttons.okAdd")}`}
										{isSubmitting && (
											<CircularProgress
												size={24}
												className={classes.buttonProgress}
											/>
										)}
									</Button>
								</DialogActions>
							</Form>
						)}
					</Formik>
				) : null}
			</Dialog>
		</div>
	);
};

export default TagModal;

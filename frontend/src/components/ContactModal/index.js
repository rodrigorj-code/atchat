import React, { useState, useEffect, useRef, useMemo } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";
import Chip from "@material-ui/core/Chip";
import Box from "@material-ui/core/Box";
import Autocomplete from "@material-ui/lab/Autocomplete";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	textField: {
		marginRight: theme.spacing(1),
		flex: 1,
	},

	extraAttr: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
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
	tagsRow: {
		display: "flex",
		flexWrap: "wrap",
		gap: theme.spacing(0.5),
		marginTop: theme.spacing(1),
		marginBottom: theme.spacing(1),
	},
}));

const ContactModal = ({ open, onClose, contactId, initialValues, onSave, onContactSaved }) => {
	const classes = useStyles();
	const isMounted = useRef(true);

	const initialState = {
		name: "",
		number: "",
		email: "",
		notes: "",
		extraInfo: [],
	};

	const [contact, setContact] = useState(initialState);
	const [localTags, setLocalTags] = useState([]);
	const [allTags, setAllTags] = useState([]);
	const [summary, setSummary] = useState(null);
	const [summaryLoading, setSummaryLoading] = useState(false);

	const validationSchema = useMemo(
		() =>
			Yup.object().shape({
				name: Yup.string()
					.min(2, i18n.t("contactModal.formErrors.name.short"))
					.max(50, i18n.t("contactModal.formErrors.name.long"))
					.required(i18n.t("contactModal.formErrors.name.required")),
				number: contactId
					? Yup.string()
							.min(8, i18n.t("contactModal.formErrors.phone.short"))
							.max(50, i18n.t("contactModal.formErrors.phone.long"))
					: Yup.string()
							.min(8, i18n.t("contactModal.formErrors.phone.short"))
							.max(50, i18n.t("contactModal.formErrors.phone.long"))
							.required(i18n.t("contactModal.formErrors.phone.required")),
				email: Yup.string().email(
					i18n.t("contactModal.formErrors.email.invalid")
				),
				notes: Yup.string().nullable().max(5000),
			}),
		[contactId]
	);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	useEffect(() => {
		const fetchContact = async () => {
			if (!open) return;

			if (!contactId) {
				setContact({
					...initialState,
					...(initialValues || {}),
				});
				setLocalTags([]);
				setSummary(null);
				return;
			}

			try {
				const { data } = await api.get(`/contacts/${contactId}`);
				if (isMounted.current) {
					setContact({
						...data,
						number: data.number,
						notes: data.notes ?? "",
					});
					setLocalTags(Array.isArray(data.tags) ? data.tags : []);
				}
			} catch (err) {
				toastError(err);
			}
		};

		fetchContact();
	}, [contactId, open, initialValues]);

	useEffect(() => {
		if (!open || !contactId) {
			setSummary(null);
			return;
		}
		let cancelled = false;
		(async () => {
			setSummaryLoading(true);
			try {
				const { data } = await api.get(`/contacts/${contactId}/summary`);
				if (!cancelled && isMounted.current) setSummary(data);
			} catch (err) {
				toastError(err);
			} finally {
				if (!cancelled && isMounted.current) setSummaryLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, contactId]);

	useEffect(() => {
		if (!open || !contactId) return;
		let cancelled = false;
		(async () => {
			try {
				const { data } = await api.get("/tags/list");
				if (!cancelled && isMounted.current) setAllTags(Array.isArray(data) ? data : []);
			} catch (err) {
				toastError(err);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, contactId]);

	const handleClose = () => {
		onClose();
		setContact(initialState);
		setLocalTags([]);
		setSummary(null);
	};

	const handleSaveContact = async values => {
		try {
			if (contactId) {
				const { data } = await api.put(`/contacts/${contactId}`, values);
				if (onContactSaved) {
					onContactSaved({ ...data, tags: localTags });
				}
				handleClose();
			} else {
				const { data } = await api.post("/contacts", values);
				if (onSave) {
					onSave(data);
				}
				handleClose();
			}
			toast.success(i18n.t("contactModal.success"));
		} catch (e) {
			toastError(e);
		}
	};

	const handleRemoveTag = async tag => {
		if (!contactId) return;
		try {
			await api.delete(`/contacts/${contactId}/tags/${tag.id}`);
			setLocalTags(prev => prev.filter(t => t.id !== tag.id));
			toast.success(i18n.t("contactModal.tags.removed"));
		} catch (e) {
			toastError(e);
		}
	};

	const handleAddTag = async tag => {
		if (!contactId || !tag) return;
		if (localTags.some(t => t.id === tag.id)) return;
		try {
			await api.post(`/contacts/${contactId}/tags`, { tagId: tag.id });
			setLocalTags(prev =>
				[...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
			);
			toast.success(i18n.t("contactModal.tags.added"));
		} catch (e) {
			toastError(e);
		}
	};

	const tagOptions = allTags.filter(
		at => !localTags.some(lt => lt.id === at.id)
	);

	return (
		<div className={classes.root}>
			<Dialog open={open} onClose={handleClose} maxWidth="lg" scroll="paper">
				<DialogTitle id="form-dialog-title">
					{contactId
						? `${i18n.t("contactModal.title.edit")}`
						: `${i18n.t("contactModal.title.add")}`}
				</DialogTitle>
				<Formik
					initialValues={contact}
					enableReinitialize={true}
					validationSchema={validationSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveContact(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ values, errors, touched, isSubmitting }) => (
						<Form>
							<DialogContent dividers>
								{contactId && (
									<Box marginBottom={2}>
										<Typography variant="subtitle1" gutterBottom>
											{i18n.t("contactModal.summary.title")}
										</Typography>
										{summaryLoading ? (
											<CircularProgress size={22} />
										) : summary ? (
											<>
												<Typography variant="body2" color="textSecondary">
													{i18n.t("contactModal.summary.tickets")}:{" "}
													<strong>{summary.totalTickets}</strong>
												</Typography>
												<Typography variant="body2" color="textSecondary">
													{i18n.t("contactModal.summary.lastInteraction")}:{" "}
													{summary.lastInteraction
														? new Date(summary.lastInteraction).toLocaleString()
														: "—"}
												</Typography>
												<Typography variant="body2" color="textSecondary" noWrap>
													{i18n.t("contactModal.summary.lastMessage")}:{" "}
													{summary.lastMessage || "—"}
												</Typography>
											</>
										) : null}
									</Box>
								)}

								<Typography variant="subtitle1" gutterBottom>
									{i18n.t("contactModal.form.mainInfo")}
								</Typography>
								<Field
									as={TextField}
									label={i18n.t("contactModal.form.name")}
									name="name"
									autoFocus
									error={touched.name && Boolean(errors.name)}
									helperText={touched.name && errors.name}
									variant="outlined"
									margin="dense"
									className={classes.textField}
								/>
								<Field
									as={TextField}
									name="number"
									label={i18n.t("contactModal.form.number")}
									error={touched.number && Boolean(errors.number)}
									helperText={touched.number && errors.number}
									placeholder=""
									variant="outlined"
									margin="dense"
									disabled={Boolean(contactId)}
									InputProps={{
										readOnly: Boolean(contactId),
									}}
								/>

								<div>
									<Field
										as={TextField}
										label={i18n.t("contactModal.form.email")}
										name="email"
										error={touched.email && Boolean(errors.email)}
										helperText={touched.email && errors.email}
										placeholder="Email address"
										fullWidth
										margin="dense"
										variant="outlined"
									/>
								</div>

								<Field
									as={TextField}
									label={i18n.t("contactModal.form.notes")}
									name="notes"
									error={touched.notes && Boolean(errors.notes)}
									helperText={touched.notes && errors.notes}
									fullWidth
									margin="dense"
									variant="outlined"
									multiline
									minRows={3}
								/>

								{contactId && (
									<>
										<Typography
											style={{ marginBottom: 8, marginTop: 12 }}
											variant="subtitle1"
										>
											{i18n.t("contactModal.form.tags")}
										</Typography>
										<div className={classes.tagsRow}>
											{localTags.map(tag => (
												<Chip
													key={tag.id}
													label={tag.name}
													size="small"
													style={{
														backgroundColor: tag.color || "#eee",
													}}
													onDelete={() => handleRemoveTag(tag)}
												/>
											))}
										</div>
										<Autocomplete
											options={tagOptions}
											getOptionLabel={option => option.name || ""}
											onChange={(_, value) => {
												if (value) handleAddTag(value);
											}}
											renderInput={params => (
												<TextField
													{...params}
													variant="outlined"
													margin="dense"
													label={i18n.t("contactModal.form.addTag")}
													fullWidth
												/>
											)}
										/>
									</>
								)}

								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.whatsapp")}{" "}
									{contact?.whatsapp ? contact?.whatsapp.name : ""}
								</Typography>
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.extraInfo")}
								</Typography>

								<FieldArray name="extraInfo">
									{({ push, remove }) => (
										<>
											{values.extraInfo &&
												values.extraInfo.length > 0 &&
												values.extraInfo.map((info, index) => (
													<div
														className={classes.extraAttr}
														key={`${index}-info`}
													>
														<Field
															as={TextField}
															label={i18n.t("contactModal.form.extraName")}
															name={`extraInfo[${index}].name`}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
														<Field
															as={TextField}
															label={i18n.t("contactModal.form.extraValue")}
															name={`extraInfo[${index}].value`}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
														<IconButton
															size="small"
															onClick={() => remove(index)}
														>
															<DeleteOutlineIcon />
														</IconButton>
													</div>
												))}
											<div className={classes.extraAttr}>
												<Button
													style={{ flex: 1, marginTop: 8 }}
													variant="outlined"
													color="primary"
													onClick={() => push({ name: "", value: "" })}
												>
													{`+ ${i18n.t("contactModal.buttons.addExtraInfo")}`}
												</Button>
											</div>
										</>
									)}
								</FieldArray>
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("contactModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{contactId
										? `${i18n.t("contactModal.buttons.okEdit")}`
										: `${i18n.t("contactModal.buttons.okAdd")}`}
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
			</Dialog>
		</div>
	);
};

export default ContactModal;

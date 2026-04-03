import React, { useState, useEffect, useRef, useMemo } from "react";

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
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import IconButton from "@material-ui/core/IconButton";
import { i18n } from "../../translate/i18n";
import { head } from "lodash";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import MessageVariablesPicker from "../MessageVariablesPicker";
import { Grid, Paper, Typography } from "@material-ui/core";
import ConfirmationModal from "../ConfirmationModal";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		flexWrap: "wrap",
		"& > *": {
			flex: "1 1 200px",
			minWidth: 0,
		},
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
	formControl: {
		margin: theme.spacing(1),
		minWidth: 120,
	},
	previewPaper: {
		padding: theme.spacing(1.5),
		marginTop: theme.spacing(1),
		backgroundColor: theme.palette.action.hover,
	},
}));

const QuickMessageDialog = ({ open, onClose, quickemessageId, reload }) => {
	const classes = useStyles();
	const messageInputRef = useRef();

	const initialState = {
		shortcode: "",
		message: "",
		category: "",
	};

	const [confirmationOpen, setConfirmationOpen] = useState(false);
	const [quickemessage, setQuickemessage] = useState(initialState);
	const [attachment, setAttachment] = useState(null);
	const attachmentFile = useRef(null);

	const validationSchema = useMemo(
		() =>
			Yup.object().shape({
				shortcode: Yup.string()
					.min(2, i18n.t("quickMessages.validation.shortcodeMin"))
					.max(80, i18n.t("quickMessages.validation.shortcodeMax"))
					.required(i18n.t("quickMessages.validation.shortcodeRequired")),
				message: Yup.string()
					.min(1, i18n.t("quickMessages.validation.messageRequired"))
					.max(5000, i18n.t("quickMessages.validation.messageMax"))
					.required(i18n.t("quickMessages.validation.messageRequired")),
				category: Yup.string().max(
					120,
					i18n.t("quickMessages.validation.categoryMax")
				),
			}),
		[]
	);

	useEffect(() => {
		const load = async () => {
			if (!quickemessageId) {
				setQuickemessage(initialState);
				return;
			}
			try {
				const { data } = await api.get(`/quick-messages/${quickemessageId}`);
				setQuickemessage(prev => ({
					...prev,
					...data,
					category: data.category || "",
				}));
			} catch (err) {
				toastError(err);
			}
		};
		if (open) {
			load();
		}
	}, [quickemessageId, open]);

	const handleClose = () => {
		setQuickemessage(initialState);
		setAttachment(null);
		if (attachmentFile.current) {
			attachmentFile.current.value = null;
		}
		onClose();
	};

	const handleAttachmentFile = e => {
		const file = head(e.target.files);
		if (file) {
			setAttachment(file);
		}
	};

	const handleSaveQuickeMessage = async values => {
		const payload = {
			shortcode: values.shortcode,
			message: values.message,
			category:
				values.category && String(values.category).trim() !== ""
					? String(values.category).trim()
					: null,
		};

		try {
			if (quickemessageId) {
				await api.put(`/quick-messages/${quickemessageId}`, payload);
				if (attachment != null) {
					const formData = new FormData();
					formData.append("typeArch", "quickMessage");
					formData.append("file", attachment);
					await api.post(
						`/quick-messages/${quickemessageId}/media-upload`,
						formData
					);
				}
			} else {
				const { data } = await api.post("/quick-messages", payload);
				if (attachment != null) {
					const formData = new FormData();
					formData.append("typeArch", "quickMessage");
					formData.append("file", attachment);
					await api.post(`/quick-messages/${data.id}/media-upload`, formData);
				}
			}
			toast.success(i18n.t("quickMessages.toasts.success"));
			if (typeof reload === "function") {
				reload();
			}
			handleClose();
		} catch (err) {
			toastError(err);
		}
	};

	const deleteMedia = async () => {
		if (attachment) {
			setAttachment(null);
			if (attachmentFile.current) {
				attachmentFile.current.value = null;
			}
		}

		if (quickemessage.mediaPath) {
			await api.delete(`/quick-messages/${quickemessage.id}/media-upload`);
			setQuickemessage(prev => ({
				...prev,
				mediaPath: null,
				mediaName: null,
			}));
			toast.success(i18n.t("quickMessages.toasts.deletedMedia"));
			if (typeof reload === "function") {
				reload();
			}
		}
		setConfirmationOpen(false);
	};

	const handleClickMsgVar = async (msgVar, setValueFunc) => {
		const el = messageInputRef.current;
		if (!el) return;
		const firstHalfText = el.value.substring(0, el.selectionStart);
		const secondHalfText = el.value.substring(el.selectionEnd);
		const newCursorPos = el.selectionStart + msgVar.length;

		setValueFunc("message", `${firstHalfText}${msgVar}${secondHalfText}`);

		await new Promise(r => setTimeout(r, 100));
		if (messageInputRef.current) {
			messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
		}
	};

	return (
		<div className={classes.root}>
			<ConfirmationModal
				title={i18n.t("quickMessages.confirmationModal.deleteTitle")}
				open={confirmationOpen}
				onClose={() => setConfirmationOpen(false)}
				onConfirm={deleteMedia}
			>
				{i18n.t("quickMessages.confirmationModal.deleteMessage")}
			</ConfirmationModal>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="sm"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{quickemessageId
						? `${i18n.t("quickMessages.dialog.edit")}`
						: `${i18n.t("quickMessages.dialog.add")}`}
				</DialogTitle>
				<div style={{ display: "none" }}>
					<input
						type="file"
						ref={attachmentFile}
						onChange={e => handleAttachmentFile(e)}
					/>
				</div>
				<Formik
					initialValues={quickemessage}
					enableReinitialize={true}
					validationSchema={validationSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveQuickeMessage(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting, setFieldValue, values }) => (
						<Form>
							<DialogContent dividers>
								<Grid spacing={2} container>
									<Grid item xs={12} sm={6}>
										<Field
											as={TextField}
											autoFocus
											label={i18n.t("quickMessages.dialog.shortcode")}
											name="shortcode"
											placeholder={i18n.t(
												"quickMessages.dialog.shortcodeHint"
											)}
											error={touched.shortcode && Boolean(errors.shortcode)}
											helperText={
												(touched.shortcode && errors.shortcode) ||
												i18n.t("quickMessages.dialog.shortcodeHelper")
											}
											variant="outlined"
											margin="dense"
											fullWidth
										/>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Field
											as={TextField}
											label={i18n.t("quickMessages.dialog.category")}
											name="category"
											error={touched.category && Boolean(errors.category)}
											helperText={touched.category && errors.category}
											variant="outlined"
											margin="dense"
											fullWidth
										/>
									</Grid>
									<Grid item xs={12}>
										<Field
											as={TextField}
											label={i18n.t("quickMessages.dialog.message")}
											name="message"
											inputRef={messageInputRef}
											error={touched.message && Boolean(errors.message)}
											helperText={touched.message && errors.message}
											variant="outlined"
											margin="dense"
											multiline={true}
											rows={6}
											fullWidth
										/>
									</Grid>
									<Grid item>
										<MessageVariablesPicker
											disabled={isSubmitting}
											onClick={value =>
												handleClickMsgVar(value, setFieldValue)
											}
										/>
									</Grid>
									<Grid item xs={12}>
										<Typography variant="caption" color="textSecondary">
											{i18n.t("quickMessages.dialog.previewLabel")}
										</Typography>
										<Paper className={classes.previewPaper} variant="outlined">
											<Typography variant="body2" component="div">
												{values.message && String(values.message).trim()
													? values.message
													: i18n.t("quickMessages.dialog.previewEmpty")}
											</Typography>
										</Paper>
									</Grid>
									{(quickemessage.mediaPath || attachment) && (
										<Grid xs={12} item>
											<Button startIcon={<AttachFileIcon />}>
												{attachment
													? attachment.name
													: quickemessage.mediaName}
											</Button>
											<IconButton
												onClick={() => setConfirmationOpen(true)}
												color="secondary"
											>
												<DeleteOutlineIcon color="secondary" />
											</IconButton>
										</Grid>
									)}
								</Grid>
							</DialogContent>
							<DialogActions>
								{!attachment && !quickemessage.mediaPath && (
									<Button
										color="primary"
										onClick={() => attachmentFile.current.click()}
										disabled={isSubmitting}
										variant="outlined"
									>
										{i18n.t("quickMessages.buttons.attach")}
									</Button>
								)}
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("quickMessages.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{quickemessageId
										? `${i18n.t("quickMessages.buttons.edit")}`
										: `${i18n.t("quickMessages.buttons.add")}`}
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

export default QuickMessageDialog;

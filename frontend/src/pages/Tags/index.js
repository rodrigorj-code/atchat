import React, {
	useState,
	useEffect,
	useReducer,
	useCallback,
	useContext,
} from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";

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

const reducer = (state, action) => {
	if (action.type === "LOAD_TAGS") {
		const tags = action.payload;
		const newTags = [];

		tags.forEach((tag) => {
			const tagIndex = state.findIndex((s) => s.id === tag.id);
			if (tagIndex !== -1) {
				state[tagIndex] = tag;
			} else {
				newTags.push(tag);
			}
		});

		return [...state, ...newTags];
	}

	if (action.type === "UPDATE_TAGS") {
		const tag = action.payload;
		const tagIndex = state.findIndex((s) => s.id === tag.id);

		if (tagIndex !== -1) {
			state[tagIndex] = tag;
			return [...state];
		} else {
			return [tag, ...state];
		}
	}

	if (action.type === "DELETE_TAG") {
		const tagId = action.payload;

		const tagIndex = state.findIndex((s) => s.id === tagId);
		if (tagIndex !== -1) {
			state.splice(tagIndex, 1);
		}
		return [...state];
	}

	if (action.type === "RESET") {
		return [];
	}
};

const useStyles = makeStyles((theme) => ({
	mainPaper: {
		flex: 1,
		padding: theme.spacing(2),
		overflowY: "auto",
		...theme.scrollbarStyles,
	},
	swatch: {
		width: 28,
		height: 28,
		borderRadius: 4,
		border: `1px solid ${theme.palette.divider}`,
		margin: "0 auto",
	},
}));

const Tags = () => {
	const classes = useStyles();

	const { user } = useContext(AuthContext);

	const [loading, setLoading] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [selectedTag, setSelectedTag] = useState(null);
	const [deletingTag, setDeletingTag] = useState(null);
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [searchParam, setSearchParam] = useState("");
	const [tags, dispatch] = useReducer(reducer, []);
	const [tagModalOpen, setTagModalOpen] = useState(false);

	const fetchTags = useCallback(async () => {
		try {
			const { data } = await api.get("/tags/", {
				params: { searchParam, pageNumber },
			});
			dispatch({ type: "LOAD_TAGS", payload: data.tags });
			setHasMore(data.hasMore);
			setLoading(false);
		} catch (err) {
			toastError(err);
			setLoading(false);
		}
	}, [searchParam, pageNumber]);

	const socketManager = useContext(SocketContext);

	useEffect(() => {
		dispatch({ type: "RESET" });
		setPageNumber(1);
	}, [searchParam]);

	useEffect(() => {
		setLoading(true);
		const delayDebounceFn = setTimeout(() => {
			fetchTags();
		}, 300);
		return () => clearTimeout(delayDebounceFn);
	}, [searchParam, pageNumber, fetchTags]);

	useEffect(() => {
		const companyId = user.companyId || localStorage.getItem("companyId");
		const socket = socketManager.getSocket(companyId);

		const onTagEvent = (data) => {
			if (data.action === "update" || data.action === "create") {
				dispatch({ type: "UPDATE_TAGS", payload: data.tag });
			}
			if (data.action === "delete") {
				dispatch({ type: "DELETE_TAG", payload: +data.tagId });
			}
		};

		socket.on("tag", onTagEvent);

		return () => {
			socket.off("tag", onTagEvent);
		};
	}, [socketManager, user]);

	const handleOpenTagModal = () => {
		setSelectedTag(null);
		setTagModalOpen(true);
	};

	const handleCloseTagModal = () => {
		setSelectedTag(null);
		setTagModalOpen(false);
	};

	const handleSearch = (event) => {
		setSearchParam(event.target.value);
	};

	const handleEditTag = (tag) => {
		setSelectedTag(tag);
		setTagModalOpen(true);
	};

	const handleDeleteTag = async (tagId) => {
		try {
			await api.delete(`/tags/${tagId}`);
			toast.success(i18n.t("tags.toasts.deleted"));
			dispatch({ type: "DELETE_TAG", payload: tagId });
		} catch (err) {
			toastError(err);
		}
		setDeletingTag(null);
		setConfirmModalOpen(false);
	};

	const loadMore = () => {
		setPageNumber((prevState) => prevState + 1);
	};

	const handleScroll = (e) => {
		if (!hasMore || loading) return;
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
		if (scrollHeight - (scrollTop + 100) < clientHeight) {
			loadMore();
		}
	};

	const formatCreated = (d) => {
		if (!d) return "—";
		try {
			return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
		} catch {
			return "—";
		}
	};

	const usageOf = (tag) =>
		tag.usageCount ?? tag.ticketsCount ?? 0;

	return (
		<MainContainer>
			<ConfirmationModal
				title={
					deletingTag && `${i18n.t("tags.confirmationModal.deleteTitle")}`
				}
				open={confirmModalOpen}
				onClose={() => setConfirmModalOpen(false)}
				onConfirm={() => handleDeleteTag(deletingTag.id)}
			>
				{deletingTag && usageOf(deletingTag) > 0 ? (
					<>
						<Typography variant="body2" paragraph>
							{i18n.t("tags.confirmationModal.deleteWarningInUse", {
								count: usageOf(deletingTag),
							})}
						</Typography>
						<Typography variant="body2" color="textSecondary">
							{i18n.t("tags.confirmationModal.deleteMessage")}
						</Typography>
					</>
				) : (
					i18n.t("tags.confirmationModal.deleteMessage")
				)}
			</ConfirmationModal>
			<TagModal
				open={tagModalOpen}
				onClose={handleCloseTagModal}
				reload={fetchTags}
				aria-labelledby="form-dialog-title"
				tagId={selectedTag && selectedTag.id}
			/>
			<MainHeader>
				<Title>{i18n.t("tags.title")}</Title>
				<MainHeaderButtonsWrapper>
					<TextField
						placeholder={i18n.t("tags.searchPlaceholder")}
						type="search"
						value={searchParam}
						onChange={handleSearch}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon style={{ color: "gray" }} />
								</InputAdornment>
							),
						}}
					/>
					<Button
						variant="contained"
						color="primary"
						onClick={handleOpenTagModal}
					>
						{i18n.t("tags.buttons.add")}
					</Button>
				</MainHeaderButtonsWrapper>
			</MainHeader>
			<Paper
				className={classes.mainPaper}
				variant="outlined"
				onScroll={handleScroll}
			>
				{!loading && tags.length === 0 ? (
					<Box py={8} textAlign="center">
						<Typography variant="h6" color="textSecondary" gutterBottom>
							{i18n.t("tags.empty.title")}
						</Typography>
						<Typography variant="body2" color="textSecondary">
							{i18n.t("tags.empty.subtitle")}
						</Typography>
					</Box>
				) : (
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>{i18n.t("tags.table.name")}</TableCell>
								<TableCell align="center">
									{i18n.t("tags.table.color")}
								</TableCell>
								<TableCell align="center">
									{i18n.t("tags.table.usage")}
								</TableCell>
								<TableCell align="center">
									{i18n.t("tags.table.createdAt")}
								</TableCell>
								<TableCell align="center">
									{i18n.t("tags.table.actions")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<>
								{tags.map((tag) => (
									<TableRow key={tag.id} hover>
										<TableCell>
											<Chip
												label={tag.name}
												size="small"
												style={{
													backgroundColor: tag.color || "#ccc",
													color: chipTextColor(tag.color),
													fontWeight: 600,
													border: "none",
												}}
											/>
										</TableCell>
										<TableCell align="center">
											<Box
												className={classes.swatch}
												style={{
													backgroundColor: tag.color || "#ccc",
												}}
												title={tag.color}
											/>
										</TableCell>
										<TableCell align="center">
											{usageOf(tag)}
										</TableCell>
										<TableCell align="center">
											{formatCreated(tag.createdAt)}
										</TableCell>
										<TableCell align="center">
											<IconButton
												size="small"
												onClick={() => handleEditTag(tag)}
												aria-label="edit"
											>
												<EditIcon />
											</IconButton>

											<IconButton
												size="small"
												onClick={() => {
													setConfirmModalOpen(true);
													setDeletingTag(tag);
												}}
												aria-label="delete"
											>
												<DeleteOutlineIcon />
											</IconButton>
										</TableCell>
									</TableRow>
								))}
								{loading && <TableRowSkeleton columns={5} />}
							</>
						</TableBody>
					</Table>
				)}
			</Paper>
		</MainContainer>
	);
};

export default Tags;

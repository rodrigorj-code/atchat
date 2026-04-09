import { Box, Grid, IconButton, makeStyles, Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import {
  AppDialog,
  AppDialogTitle,
  AppDialogContent,
  AppDialogActions,
  AppPrimaryButton,
  AppSecondaryButton,
} from "../../ui";
import { CloseOutlined, FontDownload, ImportContacts } from "@material-ui/icons";
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import * as XLSX from 'xlsx';
import { array } from "yup";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    dialogImport: {
        minWidth: 500,
    },
    iFile: {
        display: "none"
    },
    lbFile: {
        border: "dashed",
        borderWidth: 2,
        padding: 18,
        cursor: "pointer",
        display: "inline-block",
        width: "70%"
    },
    btnWrapper: {
        position: "relative"
    },
    iconPlanilha: {
        marginRight: 10
    },
    cLbFile: {
        textAlign: "center"
    },
    titleLb: {
        textTransform: "uppercase",
        fontWeight: "bolder",
        marginTop:10
    },
    iconDownload: {
        color: theme.palette.primary.main,
        fontSize: 18
    },
    cModal: {
        paddingTop: 50,
        paddingBottom: 50
    },
    importResultAlert: {
        marginTop: theme.spacing(3),
        width: "100%",
        "& .MuiAlert-message": {
            width: "100%",
        },
    },
    resultLine: {
        marginTop: theme.spacing(0.5),
    },
    errorList: {
        margin: 0,
        paddingLeft: theme.spacing(2.5),
    },
    titleResult: {
        fontWeight: theme.typography.fontWeightMedium,
        marginBottom: theme.spacing(0.5),
    },
    cCloseModal: {
        textAlign: "end"
    }
}))

const ImportContactsModal = ( props ) => {

    const classes = useStyles();

    const {
        open,
        onClose
    } = props;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameFile, setNameFile] = useState('');
    const [listcontacts, setListContacts] = useState([]);
    const [successUpload, setSuccessUpload] = useState([]);
    const [errorUpload, setErrorUpload] = useState([]);

    const handleNewFile = ( e ) => {

        const file = e.target.files[0];

        if(!file) return;

        setNameFile( file.name );
        readXlsx( file );
    }

    const readXlsx = ( file ) => {

        const reader = new FileReader();
        reader.onload = ( e ) => {

            const ab = e.target.result;
            const wb = XLSX.read(ab,{type: 'array'})

            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            const data = XLSX.utils.sheet_to_json(ws);
            setListContacts(data);
        }

        reader.readAsArrayBuffer(file);
    }

    const handleSaveListContacts = async (  ) => {

        setIsSubmitting(true);
        try{

            const {data: responseData} = await api.post("/contacts/upload", listcontacts);
            setSuccessUpload(responseData.newContacts);
            setErrorUpload(responseData.errorBag);

        }catch(e){
            toastError(e);
        }finally{
            setIsSubmitting(false);
        }
    }

    const handleDownloadModel = (  ) => {
        
        window.location.href = `${window.location.protocol}//${window.location.host}/import-contatos.xlsx`;
    }

    return (
        <div >
            <AppDialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
                <AppDialogTitle disableTypography>
                    <Grid container alignItems="center">
                        <Grid item xs={6}>
                            {i18n.t("contactImportModal.title")}
                        </Grid>
                        <Grid item xs={6} className={classes.cCloseModal}>
                            <IconButton onClick={onClose} aria-label="close">
                                <CloseOutlined />  
                            </IconButton>                                                                          
                        </Grid>
                    </Grid>
                </AppDialogTitle>
                <AppDialogContent dividers className={classes.cModal}>
                    <div className={classes.cLbFile}>
                        <label className={classes.lbFile} htmlFor="i-import-contacts">
                            <FaDownload className={classes.iconDownload} />
                            <div className={classes.titleLb}>
                                {i18n.t("contactImportModal.labels.import")}
                            </div>
                            {nameFile !== '' && (
                                <div>
                                    ({ nameFile } - {listcontacts.length} {i18n.t("contactImportModal.labels.result")})
                                </div> 
                            )}                                                      
                        </label>
                        <input onChange={handleNewFile} className={classes.iFile} type="file" accept=".xlsx" id="i-import-contacts"/>
                    </div>
                    {successUpload.length > 0 && (
                        <Alert
                            severity="success"
                            variant="outlined"
                            className={classes.importResultAlert}
                        >
                            <Typography variant="subtitle2" className={classes.titleResult} component="div">
                                {i18n.t("contactImportModal.labels.added")}
                            </Typography>
                            {successUpload.map((contact, idx) => (
                                <Typography
                                    key={contact.contactId != null ? String(contact.contactId) : `ok-${idx}`}
                                    variant="body2"
                                    display="block"
                                    className={classes.resultLine}
                                >
                                    {contact.contactId} · {contact.contactName} — {i18n.t("contactImportModal.labels.savedContact")}
                                </Typography>
                            ))}
                        </Alert>
                    )}
                    {errorUpload.length > 0 && (
                        <Alert
                            severity="error"
                            variant="outlined"
                            className={classes.importResultAlert}
                        >
                            <Typography variant="subtitle2" className={classes.titleResult} component="div">
                                {i18n.t("contactImportModal.labels.errors")}
                            </Typography>
                            <Box component="ul" className={classes.errorList}>
                                {errorUpload.map((contact, idx) => (
                                    <Typography
                                        key={idx}
                                        component="li"
                                        variant="body2"
                                        className={classes.resultLine}
                                    >
                                        {contact.contactName} — {contact.error && contact.error.message}
                                    </Typography>
                                ))}
                            </Box>
                        </Alert>
                    )}
                </AppDialogContent>
                <AppDialogActions>
                    <AppSecondaryButton
                        disabled={isSubmitting}
                        onClick={handleDownloadModel}
                    >
                        <ImportContacts className={classes.iconPlanilha} />
                        {i18n.t("contactImportModal.buttons.download")}
                    </AppSecondaryButton>
                    <AppPrimaryButton
                        disabled={isSubmitting}
                        className={classes.btnWrapper}
                        onClick={handleSaveListContacts}
                    >
                        {i18n.t("contactImportModal.buttons.import")}
                    </AppPrimaryButton>
                </AppDialogActions>
            </AppDialog>
        </div>
    );
}

export default ImportContactsModal;
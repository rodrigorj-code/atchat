import { toast } from "react-toastify";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

const toastError = err => {
    const errorMsg = err.response?.data?.error;
    if (errorMsg) {
        if (i18n.exists(`backendErrors.${errorMsg}`)) {
            console.error(`Error: ${i18n.t(`backendErrors.${errorMsg}`)}`);
            // Optionally log the error to an external service here
            
            toast.error(i18n.t(`backendErrors.${errorMsg}`), {
                toastId: errorMsg,
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            
            return;
        } else {
            
            toast.error(errorMsg, {
                toastId: errorMsg,
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            
            return;
        }
    } if (isString(err)) {
        console.error(`Error: ${err}`);
        toast.error(err);
        return;
    } else {
        const msg = err?.message || err?.response?.statusText;
        const isAxios = err?.isAxiosError === true;
        const isNetworkError =
            err?.message === "Network Error" ||
            err?.code === "ERR_NETWORK" ||
            (isAxios && !err?.response && err?.request);
        console.error("An error occurred!", err);
        const displayMsg = isNetworkError
            ? (i18n.exists("errors.connectionError") ? i18n.t("errors.connectionError") : "Não foi possível conectar ao servidor. Verifique a URL do backend e se o servidor está online.")
            : (msg || (i18n.exists("errors.generic") ? i18n.t("errors.generic") : "Ocorreu um erro. Tente novamente."));
        toast.error(displayMsg, { autoClose: 5000 });
        return;
    }
};

export default toastError;

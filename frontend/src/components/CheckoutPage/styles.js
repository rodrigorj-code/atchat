import { makeStyles } from '@material-ui/core/styles';
export default makeStyles(theme => ({
  contextAlert: {
    width: '100%',
    marginBottom: theme.spacing(2),
    '& .MuiAlert-message': {
      width: '100%',
    },
  },
  contextAlertTight: {
    width: '100%',
    marginBottom: theme.spacing(1.5),
    '& .MuiAlert-message': {
      width: '100%',
    },
  },
  stepper: {
    padding: theme.spacing(3, 0, 5)
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1)
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative'
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%'
  }
}));

import PropTypes from 'prop-types';
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import {
    Fragment,
    useState
} from 'react';
import axios from 'axios';

export default function AddDeviceDialog(props) {
  const { token } = props;
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFieldChange = (event) => {
    setDeviceId(event.target.value);
  };

  const validateSubmit = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/device/${deviceId}`;
    const config = {headers: {"Authorization": `Bearer ${token}`}, data: {"deviceId": deviceId}}
    const inUse = await axios.get(url, config);
    return !!inUse;
  };

  return (
    <Fragment>
      <Button 
        variant="contained"
        onClick={handleClickOpen}
      >
        Register new Device
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: async (event) => {
            const inUse = await validateSubmit();
            if (!!inUse) {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const formJson = Object.fromEntries(formData.entries());
                setDeviceId(formJson.text);
                console.log(deviceId);
                handleClose();
            }
            else {
                
            }
          },
        }}
      >
        <DialogTitle>Register Device</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the device ID
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"  
            id="name"
            name="text"
            label="Device Id"
            type="text"
            fullWidth
            variant="standard"
            onChange={handleFieldChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Register Device</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}

AddDeviceDialog.PropTypes = {
    token: PropTypes.string.isReqiuired
}
import PropTypes from 'prop-types';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Fragment, useState } from 'react';
import axios from 'axios';
import { useAuth } from 'src/hooks/use-auth';

export default function AddDeviceDialog(props) {
  const { onChange } = props;

  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [deviceIdErrorText, setDeviceIdErrorText] = useState('');

  const handleClickOpen = () => {
    setOpen(true);
    setDeviceIdErrorText('');
  };

  const handleClose = () => {
    setOpen(false);
    setDeviceIdErrorText('');
  };

  const handleFieldChange = (event) => {
    setDeviceId(event.target.value);
    setDeviceIdErrorText('');
  };

  return (
    <Fragment>
      <Button variant="contained" onClick={handleClickOpen}>
        Register new Device
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            setDeviceId(formJson.text);

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/devices/registerDevice`;
            try {
              const response = await axios.post(
                url,
                { deviceId: deviceId },
                { headers: { Authorization: `Bearer ${user.token}` } }
              );
              onChange(formJson.text);
              handleClose();
            } catch (err) {
              if (err.response.status === 409) {
                setDeviceIdErrorText('Device already registered');
              } else {
                setDeviceIdErrorText('An error has occurred, plase try again later');
              }
            }
          },
        }}
      >
        <DialogTitle>Register Device</DialogTitle>
        <DialogContent>
          <DialogContentText>Enter the device ID</DialogContentText>
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
            error={!!deviceIdErrorText}
            onChange={handleFieldChange}
            helperText={deviceIdErrorText}
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

AddDeviceDialog.propTypes = {
  onChange: PropTypes.func.isRequired,
};

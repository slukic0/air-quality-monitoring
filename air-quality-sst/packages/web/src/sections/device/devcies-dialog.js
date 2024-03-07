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
import DeviceEditTable from './edit-dialog-selectable-table';

export default function DeviceDialog(props) {
  const { deviceAuthorizedUsers } = props;
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleRemove = () => {
    console.log('TODO');
  };

  return (
    <Fragment>
      <Button variant="outlined" onClick={handleClickOpen}>
        Open Edit Menu
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            const email = formJson.email;
            console.log(email);
            handleClose();
          },
        }}
      >
        <DialogTitle>Manage users for this Device</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the email or name of a user to allow access to this device
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="email"
            label="Name or Email Address"
            type="email"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DeviceEditTable deviceAuthorizedUsers={deviceAuthorizedUsers} />
        <DialogActions>
          <Button onClick={handleRemove} variant="outlined" color="error">
            Remove Device
          </Button>
          <Button onClick={handleClose} variant="outlined" color="primary">
            Cancel
          </Button>
          <Button type="submit" variant="outlined" color="success">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}

DeviceDialog.propTypes = {
  deviceAuthorizedUsers: PropTypes.array.isRequired,
};

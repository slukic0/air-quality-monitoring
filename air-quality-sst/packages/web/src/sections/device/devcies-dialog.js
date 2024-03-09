import axios from 'axios';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Popover,
} from '@mui/material';
import { Fragment, useState } from 'react';
import DeviceEditTable from './edit-dialog-selectable-table';
import { removeUsersFromDevice } from 'src/utils/batch-remove-users';

export default function DeviceDialog(props) {
  const { deviceAuthorizedUsers, deviceId, token, onRemove, onDeviceRemove } = props;
  const [open, setOpen] = useState(false);
  const [removedUsers, setRemovedUsers] = useState([]);
  const [changesPending, setChangesPending] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [usersToAdd, setUsersToAdd] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setSearchedUsers([]);
    setOpen(false);
  };

  const handleRemove = () => {
    console.log('TODO');
  };

  const onRemoveUsers = (removed) => {
    setRemovedUsers(removed);
    setChangesPending(true);
  };

  const removeDevice = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/devices/unregisterDevice`;
    try {
      await axios.post(
        url,
        { deviceId: deviceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDeviceRemove(deviceId);
      handlePopoverClose();
      handleClose();
    } catch (err) {
      console.log(err);
    }
  };

  const handleSearchUsers = async (event) => {
    console.log('search text ', event.target.value);
    console.log('search text len ', event.target.value.length);
    if (event.target.value.length === 1) {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/users/${event.target.value}`;
      try {
        const newSearchedUsers = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(newSearchedUsers.data);
        setSearchedUsers(newSearchedUsers.data);
      } catch (err) {
        console.log(err);
      }
    } else if (event.target.value.length === 0) {
      setSearchedUsers([]);
    } else {
      const searchedUsers_filtered = searchedUsers.filter(
        (user) =>
          user.name.startsWith(event.target.value) || user.email.startsWith(event.target.value)
      );
      setSearchedUsers(searchedUsers_filtered);
    }
    console.log('search results ', searchedUsers);
  };

  const handlePopoverClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);
  const popoverId = open ? 'remove-deivec-popover' : undefined;

  return (
    <Fragment>
      <Button variant="outlined" onClick={handleClickOpen}>
        Open Edit Menu
      </Button>
      <Dialog
        fullWidth
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            const email = formJson.email;
            try {
              await removeUsersFromDevice(deviceId, removedUsers, token);
              onRemove(deviceId, removedUsers);
              handleClose();
            } catch (err) {
              console.log(err);
            }
          },
        }}
      >
        <DialogTitle>{`Manage users for ${deviceId}`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the email address of a user to allow access to this device
          </DialogContentText>
          <Autocomplete
            disablePortal
            id="users-search"
            options={searchedUsers.map((user) => user.email)}
            renderInput={(params) => (
              <TextField {...params} label="Email Address" fullWidth onChange={handleSearchUsers} />
            )}
          />
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2 }}>
              <Typography
                sx={{ flex: '1 1 100%', m: 2 }}
                variant="subtitle1"
                id="tableTitle"
                component="div"
              >
                New Users To add
              </Typography>
              <Table sx={{ width: '100' }} aria-labelledby="tableTitle" size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" padding="normal">
                      User Name
                    </TableCell>
                    <TableCell align="center" padding="normal">
                      User Email
                    </TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersToAdd.map((user, index) => {
                    const labelId = `addded-users-table-${index}`;

                    return (
                      <TableRow key={user.userId}>
                        <TableCell
                          align="center"
                          component="th"
                          id={labelId}
                          scope="row"
                          padding="none"
                        >
                          {user.name ?? user.userId ?? 'NA'}
                        </TableCell>
                        <TableCell align="center">{user.email ?? 'NA'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Box>
          <DeviceEditTable deviceAuthorizedUsers={deviceAuthorizedUsers} onRemove={onRemoveUsers} />
        </DialogContent>
        <DialogActions>
          <Button
            aria-describedby={popoverId}
            onClick={handlePopoverClick}
            variant="outlined"
            color="error"
          >
            Remove Device
          </Button>
          <Popover
            id={popoverId}
            open={openPopover}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <Typography sx={{ p: 2, mt: 2 }} variant="p">
              Confirm deletion
            </Typography>
            <div>
              <Button sx={{ m: 1 }} onClick={handlePopoverClose} variant="outlined" color="primary">
                Cancel
              </Button>
              <Button sx={{ m: 1 }} onClick={() => removeDevice()} variant="outlined" color="error">
                Confirm
              </Button>
            </div>
          </Popover>
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
  deviceId: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDeviceRemove: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
};

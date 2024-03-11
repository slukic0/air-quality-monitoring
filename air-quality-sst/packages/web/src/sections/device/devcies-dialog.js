import axios from 'axios';
import PropTypes from 'prop-types';
import {
  autocompleteClasses,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useAutocomplete,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Popover,
} from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import DeviceEditTable from './edit-dialog-selectable-table';
import { addUsersToDevice } from 'src/utils/batch-add-users';
import { removeUsersFromDevice } from 'src/utils/batch-remove-users';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const InputWrapper = styled('div')(
  ({ theme }) => `
  width: 100%;
  border: 1px solid ${theme.palette.mode === 'dark' ? '#434343' : '#d9d9d9'};
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  border-radius: 4px;
  padding: 1px;
  display: flex;
  flex-wrap: wrap;

  &:hover {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
  }

  &.focused {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  & input {
    background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
    color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'};
    height: 30px;
    box-sizing: border-box;
    padding: 4px 6px;
    width: 0;
    min-width: 30px;
    flex-grow: 1;
    border: 0;
    margin: 0;
    outline: 0;
  }
`
);

const StyledTag = styled(Tag)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  height: 24px;
  margin: 2px;
  line-height: 22px;
  background-color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fafafa'};
  border: 1px solid ${theme.palette.mode === 'dark' ? '#303030' : '#e8e8e8'};
  border-radius: 2px;
  box-sizing: content-box;
  padding: 0 4px 0 10px;
  outline: 0;
  overflow: hidden;

  &:focus {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
    background-color: ${theme.palette.mode === 'dark' ? '#003b57' : '#e6f7ff'};
  }

  & span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  & svg {
    font-size: 12px;
    cursor: pointer;
    padding: 4px;
  }
`
);

const Listbox = styled('ul')(
  ({ theme }) => `
  width: 100%;
  margin: 2px 0 0;
  padding: 0;
  position: absolute;
  list-style: none;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  overflow: auto;
  max-height: 250px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;

  & li {
    padding: 5px 12px;
    display: flex;

    & span {
      flex-grow: 1;
    }

    & svg {
      color: transparent;
    }
  }

  & li[aria-selected='true'] {
    background-color: ${theme.palette.mode === 'dark' ? '#2b2b2b' : '#fafafa'};
    font-weight: 600;

    & svg {
      color: #1890ff;
    }
  }

  & li.${autocompleteClasses.focused} {
    background-color: ${theme.palette.mode === 'dark' ? '#003b57' : '#e6f7ff'};
    cursor: pointer;

    & svg {
      color: currentColor;
    }
  }
`
);

export default function DeviceDialog(props) {
  const {
    deviceAuthorizedUsers,
    deviceId,
    userId,
    token,
    onAddNewUsers,
    onRemove,
    onDeviceRemove,
  } = props;
  const [open, setOpen] = useState(false);
  const [removedUsers, setRemovedUsers] = useState([]);
  const [usersToAdd, setUsersToAdd] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  const onRemoveUsers = (removed) => {
    setRemovedUsers(removed);
  };

  const onAddUsers = (addedUsers) => {
    setUsersToAdd(addedUsers);
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
              await addUsersToDevice(deviceId, usersToAdd, token);
              onAddNewUsers(deviceId, usersToAdd);
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
          <CustomizedHook addUsersCallback={onAddUsers} userId={userId} token={token} />
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
  onAddNewUsers: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDeviceRemove: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
};

function CustomizedHook(props) {
  const { addUsersCallback, userId, token } = props;
  const [searchedUsers, setSearchedUsers] = useState([]);

  const {
    getRootProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused,
    setAnchorEl,
  } = useAutocomplete({
    id: 'search-users-bar',
    multiple: true,
    options: searchedUsers,
    getOptionLabel: (user) => user.email,
  });

  const defaultOnChange = getInputProps().onChange;
  const handleSearchUsers = async (event) => {
    defaultOnChange(event);
    if (event.target.value.length === 1) {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/users/${event.target.value}`;
      try {
        const newSearchedUsers = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchedUsers(newSearchedUsers.data.filter((user) => user.userId !== userId));
      } catch (err) {
        console.log(err);
      }
    } else if (event.target.value.length === 0) {
      setSearchedUsers([]);
    } else {
      const searchedUsers_filtered = searchedUsers.filter(
        (user) =>
          (user.name.startsWith(event.target.value) || user.email.startsWith(event.target.value)) &&
          user.userId !== userId
      );
      setSearchedUsers(searchedUsers_filtered);
    }
  };

  useEffect(() => {
    addUsersCallback(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Fragment>
      <div {...getRootProps()}>
        <InputWrapper ref={setAnchorEl} className={focused ? 'focused' : ''}>
          <input {...getInputProps()} onChange={handleSearchUsers} />
          {value.map((user, index) => (
            <StyledTag
              label={user.email ?? user.userId}
              {...getTagProps({ index })}
              key={user.userId}
            />
          ))}
        </InputWrapper>
      </div>
      {groupedOptions.length > 0 ? (
        <Listbox {...getListboxProps()}>
          {groupedOptions.map((user, index) => (
            <li {...getOptionProps({ option: user, index })} key={index}>
              <span>{user.email ?? user.userId}</span>
              <CheckIcon fontSize="inherit" />
            </li>
          ))}
        </Listbox>
      ) : null}
    </Fragment>
  );
}

CustomizedHook.propTypes = {
  addUsersCallback: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
};

function Tag(props) {
  const { label, onDelete, ...other } = props;
  return (
    <div {...other}>
      <span>{label}</span>
      <CloseIcon fontSize="inherit" onClick={onDelete} />
    </div>
  );
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
};

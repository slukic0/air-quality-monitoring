import PropTypes from 'prop-types';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Fragment, useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeviceDialog from 'src/sections/device/devcies-dialog';

export const DevicesTable = (props) => {
  const { items, user, onAddUsers, onRemoveUsers, onRemoveDevice } = props;

  return (
    <TableContainer component={Paper}>
      <Table aria-label="Device Table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Device ID</TableCell>
            <TableCell align="right">Device Name</TableCell>
            <TableCell align="right">Owner Name</TableCell>
            <TableCell align="right">Email</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((device) => (
            <Device
              key={device.deviceId}
              device={device}
              user={user}
              onAddUsers={onAddUsers}
              onRemoveUsers={onRemoveUsers}
              onRemoveDevice={onRemoveDevice}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

DevicesTable.propTypes = {
  items: PropTypes.array,
  user: PropTypes.object.isRequired,
  onAddUsers: PropTypes.func.isRequired,
  onRemoveUsers: PropTypes.func.isRequired,
  onRemoveDevice: PropTypes.func.isRequired,
};

function Device(props) {
  const { device, user, onAddUsers, onRemoveUsers, onRemoveDevice } = props;
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand device"
            size="small"
            onClick={() => {
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="device">
          {device.deviceId}
        </TableCell>
        <TableCell align="right">{device.name ? device.name : 'NA'}</TableCell>
        <TableCell align="right">{device.adminId.name}</TableCell>
        <TableCell align="right">{device.adminId.email}</TableCell>
        <TableCell align="right">
          {user.userId === device.adminId.userId && (
            <DeviceDialog
              deviceAuthorizedUsers={device.authorizedUsers}
              deviceId={device.deviceId}
              userId={user.userId}
              token={user.token}
              onAddNewUsers={onAddUsers}
              onRemove={onRemoveUsers}
              onDeviceRemove={onRemoveDevice}
            />
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Stack direction="row" justifyContent="space-between" spacing={4}>
                <Stack spacing={1}>
                  <Typography variant="p">Users</Typography>
                  <Stack alignItems="center" direction="row" spacing={1}></Stack>
                </Stack>
              </Stack>
              <Table size="small" aria-label="Users">
                <TableHead>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell>User Email</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {device.authorizedUsers.map((authedUser) => {
                    console.log('devId ', device.deviceId, ' usrId ', authedUser.userId);
                    return (
                      <TableRow key={authedUser.userId}>
                        <TableCell component="th" scope="device" align="left">
                          {authedUser.name ?? authedUser.userId ?? 'NA'}
                        </TableCell>
                        <TableCell align="left">
                          {authedUser.email ? authedUser.email : 'NA'}
                        </TableCell>
                        {/*<TableCell align='right'>
                          <Button
                            startIcon={(
                              <SvgIcon fontSize='small'>
                                <TrashIcon />
                              </SvgIcon>
                            )}
                            variant='contained'
                            color='error'
                            onClick={() => handleRemove(device.deviceId, authedUser.userId, user.token)}
                          >
                            Remove User
                          </Button>
                        </TableCell>*/}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

Device.propTypes = {
  device: PropTypes.shape({
    deviceId: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  user: PropTypes.object.isRequired,
  onAddUsers: PropTypes.func.isRequired,
  onRemoveUsers: PropTypes.func.isRequired,
  onRemoveDevice: PropTypes.func.isRequired,
};

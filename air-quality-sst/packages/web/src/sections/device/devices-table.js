import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  Box,
  Button,
  Card,
  Collapse,
  IconButton,
  Paper,
  Stack,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { Fragment, useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { RemoveUser } from 'src/utils/remove-user';
import { useAuth } from 'src/hooks/use-auth';
import DeviceDialog from 'src/sections/device/devcies-dialog';

function Device(props) {
  const { device, user } = props;
  const[open, setOpen] = useState(false);
  console.log("token table",user.token)

  const handleRemove = async(deviceId, userId, token) => {
    await RemoveUser(deviceId, userId, token)
  }

  return (
    <Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label='expand device'
            size='small'
            onClick={() => {setOpen(!open)}}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell
          component="th"
          scope="device"
        >
            {device.deviceId}
        </TableCell>
        <TableCell align='right'>
          {device.name? device.name : "NA"}
        </TableCell>
        <TableCell align='right'>
          {device.adminId.name}
        </TableCell>
        <TableCell align='right'>
          {device.adminId.email}
        </TableCell>
        <TableCell align='right'>
          <DeviceDialog />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell 
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6}
        >
          <Collapse in={open} 
            timeout='auto'
            unmountOnExit
          >
            <Box sx={{ margin: 1 }}>
              <Stack
                  direction="row"
                  justifyContent="space-between"
                  spacing={4}
                  
                >
                    <Stack spacing={1}>
                      <Typography variant="p">
                        Users
                      </Typography>
                      <Stack
                        alignItems="center"
                        direction="row"
                        spacing={1}
                      >
                      </Stack>
                    </Stack>
                  </Stack>
              <Table size='small' 
                aria-label='Users'
              >
                <TableHead>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell>User Email</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {device.authorizedUsers.map((authedUser) => {
                    console.log("devId ", device.deviceId, " usrId ", authedUser.userId);
                    return (
                      <TableRow key={authedUser.userId}>
                        <TableCell 
                        component='th' 
                        scope='device'
                        align='left'
                        >
                          {authedUser.name ?? authedUser.userId ?? "NA"}
                        </TableCell>
                        <TableCell align='left'>{authedUser.email? authedUser.email : "NA"}</TableCell>
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
                    )})}
                  </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
};

Device.PropTypes = {
  device: PropTypes.shape({
    deviceId: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  user: PropTypes.object.isRequired
};

export const DevicesTable = (props) => {
  const {
    count = 0,
    items = [],
    user,
  } = props;

  return (
    <TableContainer component={Paper}>
      <Table aria-label='Device Table'>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>
              Device ID
            </TableCell>
            <TableCell align='right'>
              Device Name
            </TableCell>
            <TableCell align='right'>
              Owner Name
            </TableCell>
            <TableCell align='right'>
              Email
            </TableCell>
            <TableCell align='right' />
          </TableRow>
        </TableHead>
        <TableBody>
          {console.log("items",items)}
          {items.map((device) => (
            <Device 
              key={device.deviceId} 
              device={device}
              user={user}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

DevicesTable.PropTypes = {
  count: PropTypes.number,
  items: PropTypes.array,
  user: PropTypes.object.isRequired
};

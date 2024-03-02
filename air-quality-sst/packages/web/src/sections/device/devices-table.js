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

export const DevicesTable = (props) => {
  const {
    count = 0,
    items = [],
  } = props;

  const[open, setOpen] = useState(false);

  return (
    <TableContainer component={Paper}>
      <Table>
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
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((device) => {
            return (
              <>
                <TableRow
                  sx={{ '& > *': { borderBottom: 'unset' } }}
                  key={device.deviceId}
                >
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
                    scope="row"
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
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }}>
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
                              <div>
                                <Button
                                  startIcon={(
                                    <SvgIcon fontSize="small">
                                      <PlusIcon />
                                    </SvgIcon>
                                  )}
                                  variant="contained"
                                >
                                  Add User
                                </Button>
                              </div>
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
                            {device.authorizedUsers.map((authedUser) => (
                                <TableRow key={authedUser.userId}>
                                  <TableCell>{authedUser.name? authedUser.name : "NA"}</TableCell>
                                  <TableCell>{authedUser.email? authedUser.email : "NA"}</TableCell>
                                  <TableCell>
                                    <Button
                                      startIcon={(
                                        <SvgIcon fontSize="small">
                                          <TrashIcon />
                                        </SvgIcon>
                                      )}
                                      variant="contained"
                                    >
                                      Remove User
                                  </Button>
                                </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

DevicesTable.propTypes = {
  count: PropTypes.number,
  items: PropTypes.array,
};

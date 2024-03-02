import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  Box,
  Card,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material';
import { Fragment, useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export const DevicesTable = (props) => {
  const {
    count = 0,
    items = [],
  } = props;

  const[open, setOpen] = useState(false);

  return (
    <TableContainer component={Paper}
      sx={{ minWidth: 800 }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>
              Device ID
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
                  <TableCell align='right' 
                    component="th"
                    scope="row"
                  >
                    <Stack
                      alignItems="center"
                      direction="row"
                      spacing={2}
                    >
                      <Typography variant="subtitle2">
                        {device.deviceId}
                      </Typography>
                    </Stack>
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
                      <Box>
                        <Typography variant='p'
                          gutterBottom
                          component='div'
                        >
                          Users
                        </Typography>
                        <Table size='small' 
                          aria-label='Users'
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>User name</TableCell>
                              <TableCell>User ID</TableCell>
                              <TableCell align='right'>Device Name</TableCell>
                              <TableCell align='right'>Device Location</TableCell>
                              <TableCell align='right'>Is Admin?</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {device.authorizedUsers.map((authedUser) => {
                              return (
                                <TableRow key={authedUser.userId}>
                                  <TableCell></TableCell>
                                  <TableCell>{authedUser.userId}</TableCell>
                                  <TableCell align='right'></TableCell>
                                  <TableCell align='right'></TableCell>
                                  <TableCell align='right'></TableCell>
                                </TableRow>
                              )})}
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

import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  Checkbox,
  IconButton,
  Paper,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';

export default function DeviceEditTable(props) {
  const { deviceAuthorizedUsers, onRemove } = props;
  const [users, setUsers] = useState([...deviceAuthorizedUsers]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [removedUsers, setRemovedUsers] = useState([]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - deviceUser.length) : 0;
  const visibleRows = useMemo(
    () => users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [users, page, rowsPerPage]
  );

  const handleRemoveUser = (userToRemove) => {
    const removed = [...removedUsers, userToRemove];
    setRemovedUsers(removed);
    onRemove(removed);
    const newUserData = users.filter((user) => user.userId !== userToRemove.userId);
    setUsers(newUserData);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Typography
          sx={{ flex: '1 1 100%', m: 2 }}
          variant="subtitle1"
          id="tableTitle"
          component="div"
        >
          Existing Authorized Users
        </Typography>
        <TableContainer>
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
              {visibleRows.map((deviceUser, index) => {
                const labelId = `device-edit-table-${index}`;

                return (
                  <TableRow role="checkbox" tabIndex={-1} key={deviceUser.userId}>
                    <TableCell
                      align="center"
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                    >
                      {deviceUser.name ?? deviceUser.userId ?? 'NA'}
                    </TableCell>
                    <TableCell align="center">{deviceUser.email ?? 'NA'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleRemoveUser(deviceUser)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

DeviceEditTable.propTypes = {
  deviceAuthorizedUsers: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
};

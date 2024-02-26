import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import ArrowDownOnSquareIcon from '@heroicons/react/24/solid/ArrowDownOnSquareIcon';
import ArrowUpOnSquareIcon from '@heroicons/react/24/solid/ArrowUpOnSquareIcon';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import { Box, Button, Container, Stack, SvgIcon, Typography } from '@mui/material';
import { useSelection } from 'src/hooks/use-selection';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { DevicesTable } from 'src/sections/device/devices-table';
import { DevicesSearch } from 'src/sections/device/devices-search';
import { applyPagination } from 'src/utils/apply-pagination';
import { useAuth } from 'src/hooks/use-auth';
import axios from 'axios';

// const useDevices = (page, rowsPerPage) => {
//   return useMemo(
//     () => {
//       return applyPagination(data, page, rowsPerPage);
//     },
//     [page, rowsPerPage]
//   );
// };

// const useDeviceIds = (devices) => {
//   return useMemo(
//     () => {
//       return devices.map((device) => device.id);
//     },
//     [devices]
//   );
// };

const Page = () => {
    const { user } = useAuth();

    const [devices, setDevices] = useState([])

    useEffect(() => {
      const getDevices = async() => {
        const devices = [];

        if (user.adminDevices) devices.push(...user.adminDevices)
        if (user.authorizedDevices) devices.push(...user.authorizedDevices)
        console.log('EFFFFF', user, devices);


        const devicePromises = [];
        devices.forEach(deviceId => {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/device/${deviceId}?hydrate=true`;
          devicePromises.push(axios.get(url, {headers: {"Authorization": `Bearer ${user.token}`}}));
        });
        const resolvedDevicePromises = await Promise.all(devicePromises)
        const deviceData = [];
        resolvedDevicePromises.forEach(result => {
          console.log("result", result.data);
          deviceData.push(result.data);
        });
        setDevices(deviceData);
      };
      getDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    
  // const [page, setPage] = useState(0);
  // const [rowsPerPage, setRowsPerPage] = useState(5);

  // const handlePageChange = useCallback(
  //   (event, value) => {
  //     setPage(value);
  //   },
  //   []
  // );

  // const handleRowsPerPageChange = useCallback(
  //   (event) => {
  //     setRowsPerPage(event.target.value);
  //   },
  //   []
  // );

  return (
    <>
      <Head>
        <title>
          Devices | Devias Kit
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Devices
                </Typography>
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                >
                  <Button
                    color="inherit"
                    startIcon={(
                      <SvgIcon fontSize="small">
                        <ArrowUpOnSquareIcon />
                      </SvgIcon>
                    )}
                  >
                    Import
                  </Button>
                  <Button
                    color="inherit"
                    startIcon={(
                      <SvgIcon fontSize="small">
                        <ArrowDownOnSquareIcon />
                      </SvgIcon>
                    )}
                  >
                    Export
                  </Button>
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
                  Add
                </Button>
              </div>
            </Stack>
            <DevicesSearch />
            <DevicesTable
              count={devices.length}
              items={devices}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;

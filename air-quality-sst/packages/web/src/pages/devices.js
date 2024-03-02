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
import { getDevicesData } from 'src/utils/get-devices-data';

const Page = () => {
    const { user } = useAuth();
    const [devices, setDevices] = useState([]);

    useEffect(() => {
      const getDevices = async () => {
        setDevices(await getDevicesData(user));
      };
      getDevices();
    }, [ user ]);
    
  // TODO: Pagination

  return (
    <>
      <Head>
        <title>
          Device Management | Air Quality Monitoring
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
                  Device Management
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
                  Add
                </Button>
              </div>
            </Stack>
            {/*<DevicesSearch /> TODO search for devices*/}
            
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

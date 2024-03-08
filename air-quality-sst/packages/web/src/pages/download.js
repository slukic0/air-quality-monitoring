import Head from 'next/head';
import { Box, Container, Stack, Typography, Grid, Paper } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { Chart } from 'src/components/chart';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from 'src/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';
import { Selector } from 'src/sections/core/Selector';
import {
  deviceAggregateDataPeriods,
  getDeviceAggregateDataChartData,
  deviceMetrics,
} from 'src/api/devices';

const Page = () => {
  const { user } = useAuth();
  const devices = useMemo(
    () => (!!user ? [...user.adminDevices, ...user.authorizedDevices] : []),
    [user]
  );

  const [device, setDevice] = useState('');
  const [period, setPeriod] = useState('');
  const [deviceData, setDeviceData] = useState({ x: [], y: [] });

  const onDeviceSelectorChange = (value) => {
    setDevice(value);
  };
  const onPeriodSelectorChange = (value) => {
    setPeriod(value);
  };

  // Get device data
  useEffect(() => {
    const getDeviceData = async () => {
      if (device === '' || period === '') {
        return;
      }
      const data = await getDeviceAggregateDataChartData(user.token, device, period);
      setDeviceData(data);
    };
    getDeviceData();
  }, [device, period, user.token]);

  return (
    <>
      <Head>
        <title>Download | Air Quality Monitoring</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <div>
              <Typography variant="h4">Download</Typography>
            </div>
            <div>
              <Typography variant="body1">
                Select a device and time period to download sensor data in a JSON format
              </Typography>
            </div>
            <div sx={{ p: 4 }}>
              <Grid container spacing={2}>
                <Grid item sm={6} xs={12}>
                  <Selector
                    defaultText={'Select Device'}
                    items={devices}
                    onChange={onDeviceSelectorChange}
                  />
                </Grid>
                <Grid item sm={6} xs={12}>
                  <Selector
                    defaultText={'Select Period'}
                    items={deviceAggregateDataPeriods}
                    onChange={onPeriodSelectorChange}
                  />
                </Grid>
              </Grid>
            </div>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;

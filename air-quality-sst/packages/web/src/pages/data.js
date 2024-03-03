import Head from 'next/head';
import { Box, Container, Stack, Typography, Grid, Paper } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { Chart } from 'src/components/chart';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from 'src/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';
import { Selector } from 'src/sections/core/Selector';
import { deviceAggregateDataPeriods, getDeviceAggregateDataChartData } from 'src/api/devices';

const useChartOptions = (categories) => {
  const theme = useTheme();

  return {
    chart: {
      background: 'transparent',
      stacked: false,
      toolbar: {
        show: true,
      },
    },
    colors: [theme.palette.primary.main, alpha(theme.palette.primary.main, 0.25)],
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 1,
      type: 'solid',
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      show: false,
    },
    // stroke: {
    //   show: true,
    //   width: 2
    // },
    animations: {
      enabled: false,
    },
    theme: {
      mode: theme.palette.mode,
    },
    xaxis: {
      categories,
      title: {
        text: 'Time (UTC)'
      },
      axisBorder: {
        color: theme.palette.divider,
        show: true,
      },
      axisTicks: {
        color: theme.palette.divider,
        show: true,
      },
      labels: {
        offsetY: 5,
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => (value > 0 ? `${value}K` : `${value}`),
        offsetX: -10,
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
  };
};

const Page = () => {
  const { user } = useAuth();
  const devices = useMemo(
    () => (!!user ? [...user.adminDevices, ...user.authorizedDevices] : []),
    [user]
  );
  const hasDevices = devices.length > 0;
  const timePeriods = deviceAggregateDataPeriods;

  const [device, setDevice] = useState('');
  const [period, setPeriod] = useState('');
  const [deviceChartData, setDeviceChartData] = useState({x: [], y:[]});

  const onDeviceSelectorChange = (value) => {
    setDevice(value);
  };
  const onPeriodSelectorChange = (value) => {
    setPeriod(value);
  };

  const chartOptions = useChartOptions(deviceChartData.x);

  useEffect(() => {
    const getDeviceData = async()=> {
      if (device === '' || period === ''){
        return
      }
      const data = await getDeviceAggregateDataChartData(user.token, device, period)
      // TODO data.y needs to be an array of values, so we need to pick a key (eg: tgasResistance) since we are recording multiple things
      console.log(data);
      setDeviceChartData(data)
    }
    getDeviceData()
  }, [device, period, user.token])

  return (
    <>
      <Head>
        <title>Data | Air Quality Monitoring</title>
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
              <Typography variant="h4">Data</Typography>
            </div>
            <div>
              <Typography variant="body1">Select a device and time period to view more information</Typography>
            </div>
            <div>
              <Chart
                height={350}
                options={chartOptions}
                series={deviceChartData.y}
                type="line"
                width="100%"
              />
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
                    items={timePeriods}
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

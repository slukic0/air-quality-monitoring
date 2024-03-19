import Head from 'next/head';
import { Box, Container, Stack, Typography, Grid, Paper } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { Chart } from 'src/components/chart';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from 'src/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';
import { Selector } from 'src/sections/core/Selector';
import {
  deviceDataPeriods,
  getDeviceAggregateDataChartData,
  deviceMetrics,
  deviceMetricLabels,
  numSensors,
} from 'src/api/devices';
import { cloneDeep } from 'lodash';

const useChartOptions = (categories, yaxisLabel) => {
  const theme = useTheme();

  return {
    chart: {
      background: 'transparent',
      stacked: false,
      toolbar: {
        show: true,
      },
    },
    // colors: [theme.palette.primary.main],
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
        text: 'Time',
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
        // offsetY: 5,
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
    yaxis: {
      title: {
        text: yaxisLabel,
      },
      labels: {
        formatter: (value) => {
          if (!value) return 'N/A';
          const roundedVal = value.toFixed(2);
          const roundedValinK = (value / 1000).toFixed(2);
          return value > 1000 ? `${roundedValinK}K` : `${roundedVal}`;
        },
        // offsetX: -10,
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
    markers: {
      size: 0,
      colors: undefined,
      strokeColors: '#fff',
      strokeWidth: 2,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      shape: 'circle',
      radius: 2,
      offsetX: 0,
      offsetY: 0,
      onClick: undefined,
      onDblClick: undefined,
      showNullDataPoints: true,
      hover: {
        size: undefined,
        sizeOffset: 3,
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

  const [device, setDevice] = useState('');
  const [period, setPeriod] = useState('');
  const [metric, setMetric] = useState(deviceMetrics[0]);
  const [deviceData, setDeviceData] = useState({ x: [], y: [] });
  const [deviceChartData, setDeviceChartData] = useState({ x: [], y: [] });
  const [yAxisLabel, setyAxisLabel] = useState(null);

  const onDeviceSelectorChange = (value) => {
    setDevice(value);
  };
  const onPeriodSelectorChange = (value) => {
    setPeriod(value);
  };
  const onMetricSelectorChange = (value) => {
    setMetric(value);
  };

  const chartOptions = useChartOptions(deviceChartData.x, yAxisLabel);

  // Get device data
  useEffect(() => {
    const getDeviceData = async () => {
      if (device === '' || period === '') {
        return;
      }
      const data = await getDeviceAggregateDataChartData(user.token, device, period);
      console.log(data);
      setDeviceData(data);
    };
    getDeviceData();
  }, [device, period, user.token]);

  // Filter device data to only plot the desired metric
  useEffect(() => {
    if (deviceData.y.length > 0) {
      if (metric !== deviceMetrics[0]) {
        const metricData = deviceData.y[0].data.map((item) => {
          return !!item && item[metric] ? Number(item[metric]) : null;
        });
        setDeviceChartData({ x: cloneDeep(deviceData.x), y: [{ name: metric, data: metricData }] });
      } else {
        // gas is a special case where we want to plot each gas sensor individually

        const gasSensorMap = {};
        for (let i = 0; i < numSensors; i++) {
          gasSensorMap[i] = { name: `sensor_${i}`, data: [] };
        }

        const metricData = deviceData.y[0].data;

        metricData.forEach((sensorDataItem) => {
          Object.keys(gasSensorMap).forEach((key) => {
            gasSensorMap[key].data.push(
              !!sensorDataItem?.tgasResistanceIndividualSensors
                ? sensorDataItem.tgasResistanceIndividualSensors[key]
                : sensorDataItem?.tgasResistance ?? null
            );
          });
        });

        setDeviceChartData({ x: cloneDeep(deviceData.x), y: Object.values(gasSensorMap) });
      }
    }
    // Set the y axis label
    setyAxisLabel(deviceMetricLabels[deviceMetrics.findIndex((element) => element === metric)]);
  }, [deviceData, metric]);

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
              <Typography variant="body1">
                Select a device and time period to view more information
              </Typography>
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
                <Grid item sm={3} xs={6}>
                  <Selector
                    defaultText={'Select Period'}
                    items={deviceDataPeriods}
                    onChange={onPeriodSelectorChange}
                  />
                </Grid>
                <Grid item sm={3} xs={6}>
                  <Selector
                    defaultItem={deviceMetrics[0]}
                    items={deviceMetrics}
                    onChange={onMetricSelectorChange}
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

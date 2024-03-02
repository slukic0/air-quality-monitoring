import Head from 'next/head';
import { Box, Container, Stack, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { Chart } from 'src/components/chart';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from 'src/hooks/use-auth';
import { useMemo, useState } from 'react'
import { DeviceSelector } from 'src/sections/data/device-selector'

const useChartOptions = () => {
  const theme = useTheme();

  return {
    chart: {
      background: 'transparent',
      stacked: false,
      toolbar: {
        show: true
      }
    },
    colors: [theme.palette.primary.main, alpha(theme.palette.primary.main, 0.25)],
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1,
      type: 'solid'
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    legend: {
      show: false
    },
    // stroke: {
    //   show: true,
    //   width: 2
    // },
    animations: {
      enabled: false
    },
    theme: {
      mode: theme.palette.mode
    },
    xaxis: {
      axisBorder: {
        color: theme.palette.divider,
        show: true
      },
      axisTicks: {
        color: theme.palette.divider,
        show: true
      },
      labels: {
        offsetY: 5,
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => (value > 0 ? `${value}K` : `${value}`),
        offsetX: -10,
        style: {
          colors: theme.palette.text.secondary
        }
      }
    }
  };
};



const Page = () => {
  const chartOptions = useChartOptions();
  const { user } = useAuth();
  const devices = useMemo(() => !!user ? [...user.adminDevices, ...user.authorizedDevices] : [], [user])
  const hasDevices = devices.length > 0;

  const [item, setItem] = useState('')

  const onSelectorChange = (value) => {
    setItem(value);
  }

  const chartSeries = [
    {
        name: 'This year',
        data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20],
    },
    {
        name: 'Last year',
        data: [12, 11, 4, 6, 2, 9, 9, 10, 11, 12, 13, 13],
    },
]

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
              <Typography variant="body1">Select a device to view more information</Typography>
            </div>
            <div>
              <Chart
                height={350}
                options={chartOptions}
                series={chartSeries}
                type="line"
                width="100%"
              />
            </div>
            <div sx={{p: 4}}>
              <DeviceSelector 
                items={devices}
                onChange={onSelectorChange}
              />
            </div>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;

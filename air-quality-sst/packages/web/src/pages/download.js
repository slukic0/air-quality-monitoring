import Head from 'next/head';
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
import {
  Box,
  Container,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Page = () => {
  const { user } = useAuth();
  const devices = useMemo(
    () => (!!user ? [...user.adminDevices, ...user.authorizedDevices] : []),
    [user]
  );

  const [deviceData, setDeviceData] = useState({ x: [], y: [] });

  const [device, setDevice] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState();

  const onDeviceSelectorChange = (value) => {
    setDevice(value);
  };

  const handleSubmit = () => {
    console.log('Selected Device:', device);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
  };

  const lastDate = new Date();
  const minTime = new Date();
  minTime.setHours(0);
  minTime.setMinutes(0);
  minTime.setSeconds(0);

  const limitStartTime = !startDate || startDate.getDay() === lastDate.getDay();
  const limitEndTime = !endDate || endDate.getDay() === lastDate.getDay();
  const isSubmitDisabled = !startDate || !endDate || !device;

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
              <FormControl>
                <Grid container spacing={1}>
                  <Grid item sm={6} xs={12}>
                    <Selector
                      defaultText={'Select Device'}
                      items={devices}
                      onChange={onDeviceSelectorChange}
                    />
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Grid container direction="column" alignItems="center" justifyContent="center">
                      <Grid item xs={12}>
                        <DatePicker
                          maxWidth
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          placeholderText="Start Date"
                          showTimeSelect
                          dateFormat="MMMM d, yyyy h:mm aa"
                          minTime={limitStartTime ? minTime : undefined}
                          maxTime={limitStartTime ? lastDate : undefined}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <DatePicker
                          maxWidth
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          placeholderText="End Date"
                          showTimeSelect
                          dateFormat="MMMM d, yyyy h:mm aa"
                          minTime={limitEndTime ? minTime : undefined}
                          maxTime={limitEndTime ? lastDate : undefined}
                          minDate={startDate}
                          maxDate={lastDate}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitDisabled}
                    >
                      Submit
                    </Button>
                  </Grid>
                </Grid>
              </FormControl>
            </div>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;

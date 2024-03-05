import Head from 'next/head';
import {
  Box,
  InputLabel,
  MenuItem,
  FormControl,
  Container,
  Stack,
  Typography,
  Select,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useEffect, useState } from 'react';
import { getDevicesData } from 'src/utils/get-devices-data';
import { useAuth } from 'src/hooks/use-auth';

const Page = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState('');

  useEffect(() => {
    const getDevices = async () => {
      setDevices(await getDevicesData(user));
    };
    getDevices();
  }, [user]);

  const handleChange = (event) => {
    setDevice(event.target.change);
  };

  return (
    <>
      <Head>
        <title>Administartion | Air Quality Monitoring</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container>
          <Stack spacing={3}>
            <span>
              <Typography variant="h4">Admin stuff</Typography>
              <FormControl variant="standard" sx={{ maxWidth: 500, minWidth: 250, m: 1 }}>
                <InputLabel id="demo-simple-select-standard-label">Device ID</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={device}
                  onChange={handleChange}
                  label="Device ID"
                >
                  {console.log('devices in map: ', devices)}
                  {devices.map((deviceId) => {
                    console.log('deviceId: ', deviceId);
                    return (
                      <MenuItem key={deviceId.deviceId} value={deviceId.deviceId}>
                        {deviceId.deviceId}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </span>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { DevicesTable } from 'src/sections/device/devices-table';
import { useAuth } from 'src/hooks/use-auth';
import { getDevicesData } from 'src/utils/get-devices-data';
import AddDeviceDialog from 'src/sections/device/add-device-dialog';

const Page = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        setDevices(await getDevicesData(user));
      } catch (err) {
        console.log(err);
      }
    };
    getDevices();
  }, [user]);

  const onRegisterDevice = (value) => {
    const newDevice = {
      deviceId: value,
      adminId: {
        name: user.name,
        email: user.email,
        userId: user.userId,
      },
      authorizedUsers: [],
    };
    setDevices([...devices, newDevice]);
  };

  const onRemoveDevice = (deviceId) => {
    const devicesCopy = [...devices];
    const updatedDevices = devicesCopy.map((device) => {
      if (device.deviceId !== deviceId) {
        return device;
      }
    });
    setDevices(updatedDevices);
  };

  const onRemovedUsers = (deviceId, removedUsers) => {
    const devicesCopy = [...devices];
    const removedUserIds = removedUsers.map((userObj) => userObj.userId);

    const updatedDevices = devicesCopy.map((device) => {
      if (device.deviceId === deviceId) {
        device.authorizedUsers = device.authorizedUsers.filter(
          (user) => !removedUserIds.includes(user.userId)
        );
      }
      return device;
    });

    setDevices(updatedDevices);
  };

  // TODO: Pagination
  return (
    <>
      <Head>
        <title>Device Management | Air Quality Monitoring</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" spacing={4}>
              <Stack spacing={1}>
                <Typography variant="h4">Device Management</Typography>
                <Stack alignItems="center" direction="row" spacing={1}></Stack>
              </Stack>
              <AddDeviceDialog onChange={onRegisterDevice} />
            </Stack>
            {/*<DevicesSearch /> TODO search for devices*/}

            <DevicesTable
              items={devices}
              user={user}
              onRemoveUsers={onRemovedUsers}
              onRemoveDevice={onRemoveDevice}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;

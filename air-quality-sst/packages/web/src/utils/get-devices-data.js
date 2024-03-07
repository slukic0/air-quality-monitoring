import axios from 'axios';

export const getDevicesData = async (user) => {
  const devices = [];

  // Null check
  if (user.adminDevices) devices.push(...user.adminDevices);
  if (user.authorizedDevices) devices.push(...user.authorizedDevices);

  const devicePromises = [];
  devices.forEach((deviceId) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/device/${deviceId}?hydrate=true`;
    devicePromises.push(axios.get(url, { headers: { Authorization: `Bearer ${user.token}` } }));
  });
  const resolvedDevicePromises = await Promise.allSettled(devicePromises);
  const deviceData = [];
  resolvedDevicePromises.forEach((result) => {
    deviceData.push(result.data);
  });
  return deviceData;
};

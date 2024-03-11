import axios from 'axios';

export const addUsersToDevice = async (deviceId, addedusrs, token) => {
  const devicePromises = [];
  addedusrs.forEach((addedUser) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/devices/addUser`;
    devicePromises.push(
      axios.post(
        url,
        { deviceId: deviceId, userId: addedUser.userId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );
  });
  await Promise.all(devicePromises);
};

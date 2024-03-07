import axios from 'axios';

export const removeUsersFromDevice = async (deviceId, removedUsers, token) => {
  const devicePromises = [];
  removedUsers.forEach((removedUser) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/devices/removeUser`;
    devicePromises.push(
      axios.post(
        url,
        { deviceId: deviceId, userId: removedUser.userId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );
  });
  await Promise.allSettled(devicePromises);
};

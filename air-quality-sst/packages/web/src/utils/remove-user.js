import axios from 'axios';

export const RemoveUser = async (deviceId, userId, token) => {
    console.log("post",token);
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/devices/removeUser`;
  try {
    console.log('post DevId ', deviceId, ' post UsrId ', userId);
    console.log('token ', token);
    const { data } = await axios.post(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
       data: { "deviceId": deviceId, "userId": userId },
    });
    return data
  } catch (err) {
    console.log(err);
  }
};

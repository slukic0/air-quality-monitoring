import axios from 'axios';
import { getTimestampMinutesAgo } from 'src/utils/timestamps';

export const getMlData = async (token, deviceId) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/ml/${deviceId}`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

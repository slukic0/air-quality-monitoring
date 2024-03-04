import axios from 'axios';
import { getTimestampHour, getTimestampHoursAgo } from 'src/utils/timestamps';

export const deviceAggregateDataPeriods = ['24 Hours'];

export const getDeviceAggregateDataChartData = async (token, deviceId, period) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sensorData/${deviceId}/average`;
  const now = Date.now();

  if (period === deviceAggregateDataPeriods[0]) {
    const currentUtcHour = new Date(getTimestampHour(now)).getUTCHours();
    const last24Hours = Array.from({ length: 24 }, (_, i) => (currentUtcHour + 1 + i) % 24);

    const nullData = {
      x: last24Hours,
      y: [{ name: deviceId, data: Array.from({ length: 24 }, () => null) }],
    };

    try {
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          recordedTimestampEnd: now,
          recordedTimestampStart: getTimestampHoursAgo(23, now), // need 23 since the hour corresponds to the previous hour
        },
      });

      if (data.length === 0) {
        return nullData;
      }

      data.forEach((item) => {
        if (item) {
          const timestamp = item.hourTimestamp;
          item.hour = new Date(timestamp).getUTCHours();
        }
      });

      return {
        x: last24Hours,
        y: [{ name: deviceId, data }],
      };
    } catch (error) {
      console.log(error);
      return nullData;
    }
  } else {
    // oopsies
    console.error('ERROR: INVALID PERIOD');
    return nullData;
  }
};
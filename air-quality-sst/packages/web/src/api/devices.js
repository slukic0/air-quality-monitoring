import axios from 'axios';
import { getTimestampHour, getTimestampHoursAgo } from 'src/utils/timestamps';

export const deviceAggregateDataPeriods = ['24 Hours'];

export const deviceMetrics = ['tgasResistance', 'thumidity', 'tiaq', 'tpressure', 'ttemperature'];

export const numSensors = 7;

export const getDeviceAggregateDataChartData = async (token, deviceId, period) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sensorData/${deviceId}/average`;
  const now = Date.now();

  if (period === deviceAggregateDataPeriods[0]) {
    const currentHour = new Date(getTimestampHour(now)).getHours();
    const last24Hours = Array.from({ length: 25 }, (_, i) => (currentHour + i) % 24);

    const nullData = {
      x: last24Hours,
      y: [{ name: deviceId, data: Array.from({ length: 25 }, () => null) }],
    };

    try {
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          recordedTimestampEnd: now,
          recordedTimestampStart: getTimestampHoursAgo(24, now),
        },
      });

      if (data.length === 0) {
        return nullData;
      }

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

export const getDeviceSensorData = async (token, deviceId, startDate, endDate) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sensorData/${deviceId}`;
  const recordedTimestampStart = startDate.getTime();
  const recordedTimestampEnd = endDate.getTime();

  try {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        recordedTimestampEnd,
        recordedTimestampStart,
      },
    });
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

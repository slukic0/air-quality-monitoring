import axios from 'axios';
import { getTimestampHour, getTimestampHoursAgo } from 'src/utils/timestamps';

export const deviceAggregateDataPeriods = ['24 Hours'];

export const deviceMetrics = ['tgasResistance', 'thumidity', 'tiaq', 'tpressure', 'ttemperature']

export const getDeviceAggregateDataChartData = async (token, deviceId, period) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sensorData/${deviceId}/average`;
  const now = Date.now();

  if (period === deviceAggregateDataPeriods[0]) {
    const currentUtcHour = new Date(getTimestampHour(now)).getUTCHours();
    const last24Hours = Array.from({ length: 25 }, (_, i) => (currentUtcHour + 1 + i) % 24);

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

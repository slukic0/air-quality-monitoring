import axios from 'axios';
import { getDateFromTimestamp, getTimestampHour, getTimestampHoursAgo } from 'src/utils/timestamps';

export const deviceAggregateDataPeriods = ['24 Hours'];

export const getDeviceAggregateDataChartData = async (token, deviceId, period) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sensorData/${deviceId}`;
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
          recordedTimestampStart: getTimestampHoursAgo(24, now),
        },
      });

      if (data.length === 0) {
        return nullData;
      }
      
      // convert timestamps to utc hours
      const timeStampConvertedData = data.map((reading) => {
        const timestamp = reading.keys()[0];
        const date = getDateFromTimestamp(timestamp);
        const hour = date.getUTCHours();
        return { [hour]: reading[timestamp] };
      });

      // pad in missing hours
      for (const hour of last24Hours) {
        if (!timeStampConvertedData[hour]) {
          timeStampConvertedData.hour = null;
        }
      }

      return {
        x: last24Hours,
        y: [{ name: deviceId, data: timeStampConvertedData }],
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

import axios from 'axios';
import { getDateFromTimestamp, getTimestampHour, getTimestampHoursAgo } from 'src/utils/timestamps';

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
          recordedTimestampStart: getTimestampHoursAgo(24, now),
        },
      });

      if (data.length === 0) {
        return nullData;
      }
      
      /** 
       * The api will return an array of objects, each of which contain
       * a key (timestamp) associated with another object containing the
       * recorded data.
       * 
       * We need to convert the timestamps to hours and also fill ensure 
       * that the final array has a length of 24 elements.
      **/ 
      const resultArray = Array.from({ length: 24 }, () => null)

      data.forEach((reading) => {
        const timestamp = Number(Object.keys(reading)[0]);
        const date = getDateFromTimestamp(timestamp);
        const hour = date.getUTCHours();
        resultArray[hour] = Object.keys(reading[timestamp]).length === 0 ? null : reading[timestamp];
      });

      return {
        x: last24Hours,
        y: [{ name: deviceId, data: resultArray }],
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

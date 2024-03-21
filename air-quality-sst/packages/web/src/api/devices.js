import axios from 'axios';
import {
  getTimestampHour,
  getTimestampMinutesAgo,
  getTimestampHoursAgo,
} from 'src/utils/timestamps';

export const deviceDataPeriods = ['Last 24 Hours', 'Last 30 mins'];

export const deviceMetrics = ['tgasResistance', 'thumidity', 'tiaq', 'tpressure', 'ttemperature'];
export const deviceMetricLabels = [
  'Gas Resistance in Ohms',
  '% Humidity',
  'Air Quality',
  'Pressure in Pa',
  'Degrees Celcius',
];

export const numSensors = 7;

export const getDeviceChartData = async (token, deviceId, period) => {
  const now = Date.now();

  if (period === deviceDataPeriods[0]) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sensorData/${deviceId}/average`;
    const currentHour = new Date(getTimestampHour(now)).getHours();
    const last24Hours = Array.from({ length: 25 }, (_, i) => (currentHour + i) % 24).map(
      (hour) => `${hour}:00`
    );

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
  } else if (period === deviceDataPeriods[1]) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sensorData/${deviceId}`;

    const now = new Date();
    const currentMin = now.getMinutes();
    const currentHour = now.getHours();

    // Calculate the minutes for the last 30 minutes
    let last30minsIndex = {};
    const resultArray = [];
    let last30mins = [];
    for (let i = 0; i < 30; i++) {
      let minute = (currentMin - i) % 60;
      let hour = currentHour;

      // If minute becomes negative, decrement the hour
      if (minute < 0) {
        minute += 60;
        hour--;
      }

      // TODO this code is basically duplicatd from the backend get aggreagate function, the backend should be refactored

      // Convert to a string format like 'hh:mm'
      let formattedHour = hour.toString().padStart(2, '0');
      let formattedMinute = minute.toString().padStart(2, '0');
      last30mins.unshift(`${formattedHour}:${formattedMinute}`);
      resultArray.push(null);
      last30minsIndex[minute] = 30 - resultArray.length - 1;
    }

    const nullData = {
      x: last30mins,
      y: [{ name: deviceId, data: Array.from({ length: 30 }, () => null) }],
    };

    try {
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          recordedTimestampEnd: now.getTime(),
          recordedTimestampStart: getTimestampMinutesAgo(30, now.getTime()),
        },
      });

      if (data.length === 0) {
        return nullData;
      }

      // map data
      const sensorData = data.map((element) => {
        const { deviceId, recordedTimestamp, payload } = element;
        return { deviceId, recordedTimestamp, ...payload.data };
      });

      const averagedSensorData = sensorData.map((reading) => {
        const tgasResistanceIndividualSensors = [];
        const sensorReadings = [];

        // get all the sensor readings into an array
        for (let i = 0; i < numSensors; i++) {
          sensorReadings.push(reading[i]);
          tgasResistanceIndividualSensors.push(reading[i].tgasResistance);
        }

        // get the sum of the other sensor values
        const deviceDataAverage = sensorReadings.reduce(
          (accumulator, currentValue) => {
            for (const key of Object.keys(accumulator)) {
              accumulator[key] += currentValue[key];
            }
            return accumulator;
          },
          {
            tgasResistance: 0,
            tiaq: 0,
            tpressure: 0,
            ttemperature: 0,
            thumidity: 0,
          }
        );

        // divide the sums
        for (const [key, value] of Object.entries(deviceDataAverage)) {
          deviceDataAverage[key] = value / numSensors;
        }

        const minute = new Date(reading.recordedTimestamp).getMinutes();
        return {
          minute,
          tgasResistanceIndividualSensors,
          ...deviceDataAverage,
        };
      });

      // TODO this code is basically duplicatd from the backend get aggreagate function, the backend should be refactored

      // fill in our array in the right spots
      for (const item of averagedSensorData) {
        const minute = item.minute;
        const index = last30minsIndex[minute];
        resultArray[index] = item;
      }

      return {
        x: last30mins,
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

/**
 * Get a timestamp in milliseconds from a given number of minutes ago
 * @param {number} hours
 * @param {number} time
 * @returns
 */
export const getTimestampMinutesAgo = (minutes, time = Date.now()) => time - 60 * 1000 * minutes; // 60 s * 1000 ms

/**
 * Get a timestamp in milliseconds from a given number of hours ago
 * @param {number} hours
 * @param {number} time
 * @returns
 */
export const getTimestampHoursAgo = (hours, time = Date.now()) => time - 3600 * 1000 * hours; // 3600 s * 1000 ms

/**
 * Get the timestamp in milliseconds representation of hour of the given timestamp in milliseconds
 * @param {number} time
 * @returns
 */
export const getTimestampHour = (time = Date.now()) =>
  Math.floor(time / (3600 * 1000)) * (3600 * 1000); // get just the hour

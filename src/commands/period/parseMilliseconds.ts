
export type IncrementalTimes = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const millisecondsPerSecond = 1000;
const millisecondsPerMinute = millisecondsPerSecond * 60;
const millisecondsPerHour = millisecondsPerMinute * 60;
const millisecondsPerDay = millisecondsPerHour * 24;

export const parseMilliseconds = (milliseconds: number): IncrementalTimes => {
  const days = Math.floor(milliseconds / millisecondsPerDay);
  milliseconds -= days * millisecondsPerDay;
  const hours = Math.floor(milliseconds / millisecondsPerHour);
  milliseconds -= hours * millisecondsPerHour;
  const minutes = Math.floor(milliseconds / millisecondsPerMinute);
  milliseconds -= minutes * millisecondsPerMinute;
  const seconds = Math.floor(milliseconds / millisecondsPerSecond);

  return { days, hours, minutes, seconds };
};

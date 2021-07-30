const hours = new Date().getHours();
const isDay = hours >= 6 && hours <= 22;

export default {
  duration: 22_000,
  value: isDay ? 100 : 0,
};

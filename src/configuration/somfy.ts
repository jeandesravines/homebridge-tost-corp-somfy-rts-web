const hours = new Date().getHours();
const isDay = hours >= 6 && hours <= 22;

export default {
  duration: 20_000,
  initialPosition: isDay ? 100 : 0,
};

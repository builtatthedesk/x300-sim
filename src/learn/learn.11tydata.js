// Lesson order lives here once; each lesson gets prev/next links from it.
const ORDER = [
  ["/learn/schedule/", "1. A time schedule"],
  ["/learn/thermostat/", "2. A thermostat"],
  ["/learn/day-night/", "3. Day and night"],
  ["/learn/weekdays/", "4. Weekdays"],
  ["/learn/timers/", "5. Timers"],
  ["/learn/outside-feed/", "6. Data from outside"],
  ["/learn/seasons/", "7. Seasons"],
];
export default {
  eleventyComputed: {
    prev: (d) => {
      const i = ORDER.findIndex(([u]) => u === d.page.url);
      return i > 0 ? { url: ORDER[i - 1][0], title: ORDER[i - 1][1] } : null;
    },
    next: (d) => {
      const i = ORDER.findIndex(([u]) => u === d.page.url);
      return i >= 0 && i < ORDER.length - 1 ? { url: ORDER[i + 1][0], title: ORDER[i + 1][1] } : null;
    },
  },
};

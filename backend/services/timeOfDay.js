'use strict';

/**
 * timeOfDay — shared helpers for departure/arrival time-of-day preference
 * signals (EP-02 preference signals / EP-09 engagement).
 *
 * Travellers cluster around when they like to fly (early-morning commuters vs
 * red-eye bargain hunters). We bucket the hour-of-day so the preference engine
 * can learn it and the ranking/notification layers can use it.
 */

const BUCKETS = [
  { name: 'red-eye',       start: 0,  end: 4  },  // 00:00–04:59
  { name: 'early-morning', start: 5,  end: 7  },  // 05:00–07:59
  { name: 'morning',       start: 8,  end: 11 },  // 08:00–11:59
  { name: 'afternoon',     start: 12, end: 16 },  // 12:00–16:59
  { name: 'evening',       start: 17, end: 20 },  // 17:00–20:59
  { name: 'night',         start: 21, end: 23 }   // 21:00–23:59
];

/** Map an hour (0–23) to a time-of-day bucket name. */
function hourToBucket(hour) {
  if (hour === null || hour === undefined || Number.isNaN(Number(hour))) return null;
  const h = ((Math.floor(Number(hour)) % 24) + 24) % 24;
  const b = BUCKETS.find(x => h >= x.start && h <= x.end);
  return b ? b.name : null;
}

/** Map a Date (or ISO string) to a time-of-day bucket name. */
function dateToBucket(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return hourToBucket(d.getHours());
}

/** Extract the local hour (0–23) from a Date/ISO string, or null. */
function dateToHour(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours();
}

module.exports = { hourToBucket, dateToBucket, dateToHour, BUCKETS };

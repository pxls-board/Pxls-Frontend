/**
 * Small replacement for the moment.js calls the old client used. Output
 * matches moment's English formatting for the patterns below.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/**
 * Formats a date using moment-style tokens:
 * `YYYY MMMM MMM MM DD Do dddd HH hh h mm ss A a`.
 */
export function formatDate(input: Date | number, pattern: string): string {
  const date = typeof input === 'number' ? new Date(input) : input;
  const hours = date.getHours();
  const hours12 = hours % 12 || 12;
  const tokens: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MMMM: MONTHS[date.getMonth()]!,
    MMM: MONTHS[date.getMonth()]!.slice(0, 3),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    Do: ordinal(date.getDate()),
    dddd: DAYS[date.getDay()]!,
    HH: pad(hours),
    hh: pad(hours12),
    h: String(hours12),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    A: hours < 12 ? 'AM' : 'PM',
    a: hours < 12 ? 'am' : 'pm',
  };
  return pattern.replace(/YYYY|MMMM|MMM|MM|DD|Do|dddd|HH|hh|h|mm|ss|A|a/g, (token) => tokens[token] ?? token);
}

export const fromUnix = (seconds: number) => new Date(seconds * 1000);

/** moment.duration(seconds).humanize() */
export function humanizeDuration(totalSeconds: number): string {
  const seconds = Math.abs(totalSeconds);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (seconds < 45) return 'a few seconds';
  if (seconds < 90) return 'a minute';
  if (minutes < 45) return `${minutes} minutes`;
  if (minutes < 90) return 'an hour';
  if (hours < 22) return `${hours} hours`;
  if (hours < 36) return 'a day';
  if (days < 26) return `${days} days`;
  if (days < 45) return 'a month';
  if (days < 320) return `${months} months`;
  if (days < 548) return 'a year';
  return `${years} years`;
}

export function chatTimestamp(date: Date, use24h: boolean): string {
  return formatDate(date, use24h ? 'HH:mm' : 'hh:mm A');
}

export const LONG_TIMESTAMP = 'MMM Do YYYY, hh:mm:ss A';

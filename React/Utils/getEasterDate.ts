/**
 * Date of Western (Gregorian) Easter Sunday for a given year.
 *
 * Uses the Anonymous Gregorian algorithm (a.k.a. Meeus/Jones/Butcher Computus),
 * the standard closed-form computation. Returns a Date at local midnight so it
 * compares cleanly against other local-time dates (see isWithinDaysBefore).
 *
 * @param year four-digit Gregorian year
 */
const getEasterDate = (year: number) => {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
	const day = ((h + l - 7 * m + 114) % 31) + 1;

	// Months are 0-based in JavaScript Date.
	return new Date(year, month - 1, day);
};

export default getEasterDate;

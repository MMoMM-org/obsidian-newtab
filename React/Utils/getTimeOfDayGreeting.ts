import { GREETINGS, Greeting } from "./greetings";

/**
 * Returns a time-of-day greeting (e.g. "Good morning") in the given locale,
 * falling back to English for any unsupported locale.
 */
const getTimeOfDayGreeting = (locale = "en"): string => {
	const hours = new Date().getHours();
	const bucket: keyof Greeting =
		hours >= 18 || hours < 5
			? "evening"
			: hours >= 12
			? "afternoon"
			: "morning";

	return (GREETINGS[locale] ?? GREETINGS.en)[bucket];
};

export default getTimeOfDayGreeting;

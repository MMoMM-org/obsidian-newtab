/**
 * Turn a user-entered font family into a value safe to drop into a CSS
 * `font-family` declaration (or a `--var`). A bare multi-word name like
 * `Times New Roman` is quoted; an already-quoted name or a full stack
 * (`Inter, sans-serif`) is left untouched. An empty input yields "" so callers
 * can omit the property and inherit instead.
 */
export function cssFontFamily(family: string): string {
	const trimmed = family.trim();
	if (!trimmed) {
		return "";
	}
	// A comma means the user supplied their own stack; quotes mean it's already
	// a quoted family. Either way, don't second-guess it.
	if (
		trimmed.includes(",") ||
		trimmed.startsWith('"') ||
		trimmed.startsWith("'")
	) {
		return trimmed;
	}
	// Quote multi-word names so the spaces aren't misread as separate tokens.
	return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
}

import { BackgroundTheme } from "src/Types/Enums";

/**
 * Whether a background theme resolves its image from Unsplash (and therefore
 * needs an Unsplash access key). The non-Unsplash themes are the ones that get
 * their pixels elsewhere: a user URL (custom), vault files (local), or nothing
 * (the transparent themes).
 */
export const themeUsesUnsplash = (theme: BackgroundTheme): boolean =>
	![
		BackgroundTheme.CUSTOM,
		BackgroundTheme.LOCAL,
		BackgroundTheme.TRANSPARENT,
		BackgroundTheme.TRANSPARENT_WITH_SHADOWS,
	].includes(theme);

export interface SettingsHeaderProps {
	name: string;
	version: string;
	/** Raw manifest author string; may be "Name <email>". */
	author: string;
	authorUrl?: string;
	documentationUrl: string;
}

/**
 * Curated identity tagline shown under the header. Deliberately separate from
 * the manifest description (the longer, search-friendly blurb Obsidian shows in
 * its Community Plugins listing) — this one is a short, punchy identity line.
 */
const TAGLINE = "Every new tab, made yours";

/**
 * A compact branded header for the settings tab:
 * `<name> v<version> · <author> · Documentation`, with a tagline beneath.
 * Mirrors the imperative banner in obsidian-archivist, but as a React component
 * to match this plugin's React stack. All data comes from the plugin manifest.
 */
const SettingsHeader = ({
	name,
	version,
	author,
	authorUrl,
	documentationUrl,
}: SettingsHeaderProps) => {
	// The manifest author can be "Name <email>"; show only the display name.
	const authorName = (author.split("<")[0] ?? author).trim();

	return (
		<div className="newtab-settings-header">
			<div className="newtab-settings-header-identity">
				<span className="newtab-settings-header-name">{name}</span>
				<span className="newtab-settings-header-version">
					{" "}
					v{version}
				</span>
				{authorName && (
					<>
						<span className="newtab-settings-header-sep"> · </span>
						<a href={authorUrl || documentationUrl}>{authorName}</a>
					</>
				)}
				<span className="newtab-settings-header-sep"> · </span>
				<a href={documentationUrl}>Documentation</a>
			</div>
			<div className="newtab-settings-header-tagline">{TAGLINE}</div>
		</div>
	);
};

export default SettingsHeader;

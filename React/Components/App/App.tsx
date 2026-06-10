import React, { useEffect, useMemo, useState, useRef } from "react";
import { useObsidian } from "../../Context/ObsidianAppContext";
import { TFile, getIcon } from "obsidian";
import getTime from "React/Utils/getTime";
import Observable from "src/Utils/Observable";
import NewTabPlugin from "main";
import getBackground, { UNSPLASH_SECRET_ID } from "React/Utils/getBackground";
import getTimeOfDayGreeting from "React/Utils/getTimeOfDayGreeting";
import { getBookmarks } from "React/Utils/getBookmarks";
import { NewTabPluginSettings } from "src/Settings/Settings";
import getQuote, { Quote } from "React/Utils/getQuote";
import { BackgroundTheme } from "src/Types/Enums";

/**
 * Given an icon name, converts a Obsidian icon to a usable SVG string and embeds it into a span.
 * @returns
 */
const Icon = ({ name }: { name: string }) => {
	const iconText = new XMLSerializer().serializeToString(
		getIcon(name) || new Node()
	);

	return (
		<span
			className="newtab-icon"
			dangerouslySetInnerHTML={{
				__html: iconText,
			}}
		></span>
	);
};

const App = ({
	settingsObservable,
	plugin,
}: {
	settingsObservable: Observable;
	plugin: NewTabPlugin;
}) => {
	const [quote, setQuote] = useState<Quote | null>(null);
	const [settings, setSettings] = useState<NewTabPluginSettings>(
		settingsObservable.getValue()
	);
	const [time, setTime] = useState(getTime(settings.timeFormat));
	const mainDivRef = useRef<HTMLDivElement>(null);

	const obsidian = useObsidian();
	const [background, setBackground] = useState<string | null>(null);
	useEffect(() => {
		let cancelled = false;
		// The Unsplash key lives in SecretStorage, not in the synced settings.
		const accessKey =
			obsidian?.secretStorage.getSecret(UNSPLASH_SECRET_ID) ?? null;
		void getBackground(
			settings.backgroundTheme,
			settings.customBackground,
			settings.customTopic,
			settings.localBackgrounds,
			accessKey
		).then((url) => {
			if (!cancelled) {
				setBackground(url);
			}
		});
		return () => {
			cancelled = true;
		};
		// Depend on the whole settings object so entering the key (which nudges
		// the settings observable) re-resolves the background; the per-day cache
		// keeps redundant runs from making extra API calls.
	}, [obsidian, settings]);

	const allVaultFiles = obsidian?.vault.getAllLoadedFiles();
	const latestModifiedMarkdownFiles = useMemo(() => {
		const files = allVaultFiles?.filter(
			(file) => file instanceof TFile && file.extension === "md"
		);
		files?.sort((a, b) =>
			a instanceof TFile && b instanceof TFile
				? b.stat.mtime - a.stat.mtime
				: 0
		);
		return files?.slice(0, 5);
	}, [allVaultFiles]);

	const bookmarks = useMemo(
		() => getBookmarks(obsidian, settings).slice(0, 5),
		[obsidian, settings]
	);

	/**
	 * Keep the time up to date by updating it every second
	 * Note that this shouldn't cause extra renders because calling "setTime" with a duplicate value should skip the render
	 */
	useEffect(() => {
		const timer = setInterval(() => {
			setTime(getTime(settings.timeFormat));
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, [setTime, settings]);

	/**
	 * Get a random quote
	 */
	useEffect(() => {
		getQuote(settings.quoteSource, settings.customQuotes).then(
			(newQuote: any) => {
				setQuote(newQuote);
			}
		);
	}, [setQuote, settings.quoteSource, settings.customQuotes]);

	/**
	 * Subscribe to settings from Obsidian
	 */
	useEffect(() => {
		const unsubscribe = settingsObservable.onChange(
			(newSettings: NewTabPluginSettings) => {
				setSettings(newSettings);
			}
		);

		return () => {
			unsubscribe();
		};
	}, [setSettings]);

	/**
	 * Auto focus so key presses launch search
	 */
	useEffect(() => {
		mainDivRef?.current?.focus();
	}, []);

	return (
		<div
			className={`newtab-root ${
				settings.backgroundTheme === BackgroundTheme.TRANSPARENT &&
				"newtab-root--transparent"
			}
			
			${
				settings.backgroundTheme ===
					BackgroundTheme.TRANSPARENT_WITH_SHADOWS &&
				"newtab-root--transparentWithShadows"
			}
			`}
			// @ts-ignore
			style={{
				backgroundImage: background
					? `url("${background}")`
					: undefined,
			}}
			onKeyDown={(e) => {
				if (!e.ctrlKey && !e.altKey && /^[A-Za-z0-9]$/.test(e.key)) {
					plugin.openSwitcherCommand(
						settings.inlineSearchProvider.command
					);
				}
			}}
			tabIndex={0} // Make the div focusable so we can capture key strokes
			ref={mainDivRef}
		>
			<div className="newtab-wrapper">
				<div className="newtab-top">
					{settings.showTopLeftSearchButton && (
						<a
							className="newtab-iconbutton"
							onClick={() => {
								plugin.openSwitcherCommand(
									settings.topLeftSearchProvider.command
								);
							}}
						>
							<span className="newtab-iconbutton-text">
								Open Search
							</span>
							<Icon name="search" />
						</a>
					)}
				</div>
				<div className="newtab-center">
					{settings.showTime && (
						<div className="newtab-time">{time}</div>
					)}
					{settings.showGreeting && (
						<div className="newtab-greeting">
							{settings.greetingText.replace(
								/{{greeting}}/gi,
								getTimeOfDayGreeting()
							)}
						</div>
					)}
				</div>
				<div className="newtab-bottom">
					<div className="newtab-search">
						{settings.showInlineSearch && (
							<a
								className="newtab-search-wrapper"
								onClick={() => {
									plugin.openSwitcherCommand(
										settings.inlineSearchProvider.command
									);
								}}
							>
								<Icon name="search" />
								<span className="newtab-search-text">
									Search
								</span>
							</a>
						)}
					</div>
					{settings.showRecentFiles && (
						<div className="newtab-recentlyedited">
							{latestModifiedMarkdownFiles?.map(
								(file) =>
									file instanceof TFile && (
										<a
											key={file.path}
											className="newtab-recentlyedited-file"
											data-path={file.path}
											onClick={() => {
												const leaf =
													obsidian?.workspace.getMostRecentLeaf();
												if (file instanceof TFile) {
													leaf?.openFile(file);
												}
											}}
										>
											<Icon name="file" />
											<span className="newtab-recentlyedited-file-name">
												{file.basename}
											</span>
										</a>
									)
							)}
						</div>
					)}
					{settings.showBookmarks && (
						<div className="newtab-recentlyedited">
							{bookmarks?.map(
								(file: TFile) =>
									file && (
										<a
											key={file.path}
											className="newtab-recentlyedited-file"
											data-path={file.path}
											onClick={() => {
												const leaf =
													obsidian?.workspace.getMostRecentLeaf();
												if (file instanceof TFile) {
													leaf?.openFile(file);
												}
											}}
										>
											<Icon name="bookmark" />
											<span className="newtab-recentlyedited-file-name">
												{file.basename}
											</span>
										</a>
									)
							)}
						</div>
					)}
				</div>
				<div className="newtab-quote">
					{quote?.content && settings.showQuote && (
						<div className="newtab-quote-content">
							&quot;{quote.content}&quot;
						</div>
					)}
					{quote?.content && settings.showQuote && (
						<div className="newtab-quote-author">
							{quote.author}
						</div>
					)}
					{quote?.content &&
						quote.fromZenQuotes &&
						settings.showQuote && (
							<div className="newtab-quote-attribution">
								Quotes provided by{" "}
								<a
									href="https://zenquotes.io/"
									target="_blank"
									rel="noopener"
								>
									ZenQuotes API
								</a>
							</div>
						)}
				</div>
			</div>
		</div>
	);
};

export default App;

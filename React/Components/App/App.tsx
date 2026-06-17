import React, { useEffect, useMemo, useState, useRef } from "react";
import { useObsidian } from "../../Context/ObsidianAppContext";
import { TFile, WorkspaceLeaf, setIcon } from "obsidian";
import { appInternals, getLeafHistory } from "src/Types/ObsidianInternals";
import getTime from "React/Utils/getTime";
import Observable from "src/Utils/Observable";
import NewTabPlugin from "main";
import getBackground, { hourStamp } from "React/Utils/getBackground";
import { resolveLocalBackgroundUrls } from "React/Utils/resolveLocalBackgrounds";
import getTimeOfDayGreeting from "React/Utils/getTimeOfDayGreeting";
import { resolveGreetingLocale } from "React/Utils/greetings";
import { getBookmarks } from "React/Utils/getBookmarks";
import { NewTabPluginSettings } from "src/Settings/Settings";
import getQuote, { Quote } from "React/Utils/getQuote";
import { getVaultQuotes } from "React/Utils/getVaultQuotes";
import { BackgroundTheme } from "src/Types/Enums";
import { debugLog } from "React/Utils/debug";

/**
 * Renders an Obsidian icon by name. Uses setIcon() to inject the SVG via
 * Obsidian's own DOM helper rather than dangerouslySetInnerHTML, avoiding the
 * XSS surface of injecting raw HTML.
 */
const Icon = ({ name }: { name: string }) => {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (ref.current) {
			setIcon(ref.current, name);
		}
	}, [name]);

	return <span className="newtab-icon" ref={ref}></span>;
};

const App = ({
	settingsObservable,
	plugin,
	leaf,
}: {
	settingsObservable: Observable<NewTabPluginSettings>;
	plugin: NewTabPlugin;
	leaf: WorkspaceLeaf;
}) => {
	const [quote, setQuote] = useState<Quote | null>(null);
	const [settings, setSettings] = useState<NewTabPluginSettings>(
		settingsObservable.getValue()
	);
	const [time, setTime] = useState(getTime(settings.timeFormat));
	const mainDivRef = useRef<HTMLDivElement>(null);

	const obsidian = useObsidian();

	// This leaf's back/forward navigation stacks (internal API). Null when the
	// build doesn't expose it — in that case the buttons are hidden entirely
	// rather than rendered inert. Read once: the view re-mounts whenever the user
	// lands back on the new tab, so the stack lengths are re-evaluated each time.
	const history = useMemo(() => getLeafHistory(leaf), [leaf]);
	const canGoBack = (history?.backHistory.length ?? 0) > 0;
	const canGoForward = (history?.forwardHistory.length ?? 0) > 0;

	// Navigate this leaf's history. Calling history.back()/forward() directly
	// was unreliable, so make the leaf active and run Obsidian's own core
	// navigation command — the exact path the keyboard shortcut / menu uses.
	const navigate = (command: "app:go-back" | "app:go-forward") => {
		if (!obsidian) {
			return;
		}
		// Make this leaf active so the core navigation command targets it, then
		// run Obsidian's own command — the exact path the keyboard shortcut uses.
		obsidian.workspace.setActiveLeaf(leaf, { focus: true });
		appInternals(obsidian).commands.executeCommandById(command);
	};

	// Local backgrounds live in the configured vault folder; resolve them to
	// app:// resource URLs the browser can render.
	const localBackgroundUrls = useMemo(
		() =>
			resolveLocalBackgroundUrls(
				obsidian,
				settings.localBackgroundFolder
			),
		[obsidian, settings.localBackgroundFolder]
	);

	const [background, setBackground] = useState<string | null>(null);
	// Bucket the current hour so an open tab re-resolves its background when the
	// hour rolls over (the cache key in getBackground is hour-scoped). Updated by
	// the clock interval below; only a changed value re-renders / re-resolves.
	const [hourBucket, setHourBucket] = useState(hourStamp());
	useEffect(() => {
		let cancelled = false;
		// The Unsplash key lives in SecretStorage under the user-chosen ID; only
		// that ID is persisted in settings. Resolve it to the live value here.
		const secretId = settings.unsplashKeySecretId;
		const accessKey = secretId
			? obsidian?.secretStorage.getSecret(secretId) ?? null
			: null;
		// Debounce: typing a custom topic changes settings.customTopic on every
		// keystroke, and each partial query is a distinct Unsplash request /
		// cache entry. Coalesce rapid edits into one resolve after typing stops.
		const timer = window.setTimeout(() => {
			void getBackground(
				settings.backgroundTheme,
				settings.customBackground,
				settings.customTopic,
				localBackgroundUrls,
				accessKey
			).then((url) => {
				if (!cancelled) {
					debugLog(
						"background",
						url
							? "applying background image"
							: "no background image resolved (url=null)",
						url
					);
					setBackground(url);
				}
			});
		}, 250);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
		// Depend only on the fields that actually drive the background, so
		// editing unrelated settings (e.g. the greeting text) doesn't re-resolve
		// it. Entering the key changes unsplashKeySecretId, which is covered.
	}, [
		obsidian,
		settings.backgroundTheme,
		settings.customBackground,
		settings.customTopic,
		localBackgroundUrls,
		settings.unsplashKeySecretId,
		// Re-resolve when the hour changes so the image refreshes on the hour.
		hourBucket,
	]);

	// "Recent files" must reflect what the user actually opened most recently,
	// not what changed on disk. getLastOpenFiles() is Obsidian's own recently-
	// opened history (most-recent first). The previous approach sorted every
	// markdown file by stat.mtime, which surfaced sync/background edits and
	// missed notes that were only viewed, not modified.
	const recentFiles = useMemo(() => {
		const recentPaths = obsidian?.workspace.getLastOpenFiles() ?? [];
		return recentPaths
			.map((path) => obsidian?.vault.getFileByPath(path))
			.filter(
				(file): file is TFile =>
					file instanceof TFile && file.extension === "md"
			)
			.slice(0, 5);
	}, [obsidian]);

	const bookmarks = useMemo(
		() => getBookmarks(obsidian, settings).slice(0, 5),
		[obsidian, settings]
	);

	/**
	 * Keep the time up to date by updating it every second
	 * Note that this shouldn't cause extra renders because calling "setTime" with a duplicate value should skip the render
	 */
	useEffect(() => {
		const timer = window.setInterval(() => {
			setTime(getTime(settings.timeFormat));
			// Cheap hour-boundary check: setHourBucket with an unchanged value
			// skips the render, so this only triggers a background re-resolve
			// once per hour.
			setHourBucket(hourStamp());
		}, 1000);

		return () => {
			window.clearInterval(timer);
		};
	}, [setTime, settings]);

	// Resolve quotes from vault notes (frontmatter) whenever the selection
	// config changes; cheap, reads only the metadata cache.
	const vaultQuotes = useMemo(
		() =>
			getVaultQuotes(obsidian, {
				selectionMode: settings.quoteVaultSelectionMode,
				tag: settings.quoteVaultTag,
				folder: settings.quoteVaultFolder,
				contentProperty: settings.quoteVaultContentProperty,
				authorProperty: settings.quoteVaultAuthorProperty,
			}),
		[
			obsidian,
			settings.quoteVaultSelectionMode,
			settings.quoteVaultTag,
			settings.quoteVaultFolder,
			settings.quoteVaultContentProperty,
			settings.quoteVaultAuthorProperty,
		]
	);

	/**
	 * Get a random quote from whichever sources are enabled.
	 *
	 * Re-resolves on the hour boundary (via hourBucket) so the quote rotates
	 * together with the background image, which is keyed off the same bucket.
	 */
	useEffect(() => {
		void getQuote({
			useOnline: settings.quoteUseOnline,
			useMyQuotes: settings.quoteUseMyQuotes,
			useVaultNotes: settings.quoteUseVaultNotes,
			customQuotes: settings.customQuotes,
			vaultQuotes,
		}).then((newQuote: Quote) => {
			setQuote(newQuote);
		});
	}, [
		setQuote,
		settings.quoteUseOnline,
		settings.quoteUseMyQuotes,
		settings.quoteUseVaultNotes,
		settings.customQuotes,
		vaultQuotes,
		hourBucket,
	]);

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
			style={{
				backgroundImage: background
					? `url("${background}")`
					: undefined,
			}}
			onKeyDown={(e) => {
				if (e.ctrlKey || e.altKey || e.metaKey) {
					return;
				}
				// An IME can't compose on this non-editable div, so the input
				// method never activates here (#41). Open the switcher so
				// composition can continue in its real input. The in-progress
				// composition character can't be forwarded, so don't pass one.
				// `isComposing` / key "Process" both flag an IME keystroke (the
				// modern replacement for the deprecated keyCode === 229 check).
				if (e.nativeEvent.isComposing || e.key === "Process") {
					plugin.openSwitcherCommand(
						settings.inlineSearchProvider.command
					);
					return;
				}
				// Any single printable character opens the switcher and is
				// forwarded, so the first keystroke isn't swallowed (#73).
				if (e.key.length === 1) {
					e.preventDefault();
					plugin.openSwitcherCommand(
						settings.inlineSearchProvider.command,
						e.key
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
					{settings.showNavButtons && history && (
						<div className="newtab-nav">
							<button
								type="button"
								className="newtab-iconbutton newtab-nav-button"
								aria-label="Go back"
								disabled={!canGoBack}
								onClick={() => navigate("app:go-back")}
							>
								<Icon name="arrow-left" />
							</button>
							<button
								type="button"
								className="newtab-iconbutton newtab-nav-button"
								aria-label="Go forward"
								disabled={!canGoForward}
								onClick={() => navigate("app:go-forward")}
							>
								<Icon name="arrow-right" />
							</button>
						</div>
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
								getTimeOfDayGreeting(
									resolveGreetingLocale(
										settings.greetingLanguage
									)
								)
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
							{recentFiles.map(
								(file) =>
									file instanceof TFile && (
										<a
											key={file.path}
											className="newtab-recentlyedited-file"
											data-path={file.path}
											aria-label={file.basename}
											onClick={() => {
												const leaf =
													obsidian?.workspace.getMostRecentLeaf();
												if (file instanceof TFile) {
													void leaf?.openFile(file);
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
											aria-label={file.basename}
											onClick={() => {
												const leaf =
													obsidian?.workspace.getMostRecentLeaf();
												if (file instanceof TFile) {
													void leaf?.openFile(file);
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
							{quote.sourcePath ? (
								<a
									className="newtab-quote-link"
									data-path={quote.sourcePath}
									aria-label={quote.sourcePath}
									onClick={() => {
										const file = obsidian?.vault.getFileByPath(
											quote.sourcePath ?? ""
										);
										if (file) {
											void obsidian?.workspace
												.getMostRecentLeaf()
												?.openFile(file);
										}
									}}
								>
									&quot;{quote.content}&quot;
								</a>
							) : (
								<>&quot;{quote.content}&quot;</>
							)}
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

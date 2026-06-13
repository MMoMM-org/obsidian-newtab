# [1.0.0](https://github.com/MMoMM-org/obsidian-newtab/compare/0.4.0...1.0.0) (2026-06-13)


### Features

* graduate to a stable 1.0.0 release ([56cd081](https://github.com/MMoMM-org/obsidian-newtab/commit/56cd081f651e4095a36ce9718e9721d10166c52e))


### BREAKING CHANGES

* first stable release (1.0.0). No code changes — this marks
the graduation from 0.x to a stable, semver-governed API.

# [0.4.0](https://github.com/MMoMM-org/obsidian-newtab/compare/0.3.0...0.4.0) (2026-06-13)


### Features

* warn when BeautiTab is enabled + lifecycle logging ([#27](https://github.com/MMoMM-org/obsidian-newtab/issues/27)) ([d2deb7f](https://github.com/MMoMM-org/obsidian-newtab/commit/d2deb7f70e725227ed6012cf34f106535a45b389))

# [0.3.0](https://github.com/MMoMM-org/obsidian-newtab/compare/0.2.1...0.3.0) (2026-06-12)


### Features

* change background on the hour, not the day ([#18](https://github.com/MMoMM-org/obsidian-newtab/issues/18)) ([04a29fc](https://github.com/MMoMM-org/obsidian-newtab/commit/04a29fc86b6112feec32b8ab50d8a6c438aa0cf3))
* localize new-tab title via Obsidian's i18n ([#18](https://github.com/MMoMM-org/obsidian-newtab/issues/18)) ([8a60d89](https://github.com/MMoMM-org/obsidian-newtab/commit/8a60d8972e43a5f582410e106965af8c9672c77e))

## [0.2.1](https://github.com/MMoMM-org/obsidian-newtab/compare/0.2.0...0.2.1) (2026-06-12)


### Bug Fixes

* drop redundant ArrayBuffer assertion in Beautitab import ([5831d2f](https://github.com/MMoMM-org/obsidian-newtab/commit/5831d2f9058613c8037b5f35b9676253d88e8268))

# [0.2.0](https://github.com/MMoMM-org/obsidian-newtab/compare/0.1.0...0.2.0) (2026-06-12)


### Features

* give the new-tab view a layout-dashboard icon ([fc5e42d](https://github.com/MMoMM-org/obsidian-newtab/commit/fc5e42da00aae4fe056910c981c99757929781db))

# [0.1.0](https://github.com/MMoMM-org/obsidian-newtab/compare/0.0.0...0.1.0) (2026-06-12)


### Bug Fixes

* base "Recent files" on recently-opened, not modified time ([#4](https://github.com/MMoMM-org/obsidian-newtab/issues/4)) ([63ddd1b](https://github.com/MMoMM-org/obsidian-newtab/commit/63ddd1b050f2d97e0f35f28e3c2a49f840df4002))
* don't swallow the first character / IME input in a new tab ([#3](https://github.com/MMoMM-org/obsidian-newtab/issues/3)) ([41d8365](https://github.com/MMoMM-org/obsidian-newtab/commit/41d83654c748a54aac5e056dd038634040c1328d)), closes [#73](https://github.com/MMoMM-org/obsidian-newtab/issues/73) [#41](https://github.com/MMoMM-org/obsidian-newtab/issues/41)
* guard the Unsplash key trim against a null onChange value ([bf208e2](https://github.com/MMoMM-org/obsidian-newtab/commit/bf208e26b8e1dd1ce8df42198389ebfe66325e14))
* make the Unsplash app URL clickable in background settings ([4555ecc](https://github.com/MMoMM-org/obsidian-newtab/commit/4555ecc5988b3032a24512fd28db1435926e38ae))
* move selected search provider under its description ([9078d7b](https://github.com/MMoMM-org/obsidian-newtab/commit/9078d7b600e90dad970cf3de861c2a59af8fd461))
* new note replaces the NewTab view instead of opening beside it ([#5](https://github.com/MMoMM-org/obsidian-newtab/issues/5)) ([c2461a2](https://github.com/MMoMM-org/obsidian-newtab/commit/c2461a234d9f472dd2e772d6815a03b7b40b895f))
* replace dead quotable API with ZenQuotes ([#1](https://github.com/MMoMM-org/obsidian-newtab/issues/1)) ([1ad08cc](https://github.com/MMoMM-org/obsidian-newtab/commit/1ad08cc2e0e6dd63994c81e9937abede0154270a))
* restore the unmount try/catch so disabling with the tab active is clean ([1fa9586](https://github.com/MMoMM-org/obsidian-newtab/commit/1fa958614dd811743276cdecf4bb85d9529c021a))
* stop settings edits from re-resolving the background ([#9](https://github.com/MMoMM-org/obsidian-newtab/issues/9)) ([bbbe813](https://github.com/MMoMM-org/obsidian-newtab/commit/bbbe8138af8ba50cd434f2d7e21856c9a18d1d25))
* stop the settings dialog crashing when the plugin is disabled ([ea86a8c](https://github.com/MMoMM-org/obsidian-newtab/commit/ea86a8ce229d22a36bec910793fe2f599d0bb4f5))
* stop version check from throwing an uncaught 404 on enable ([5a49bba](https://github.com/MMoMM-org/obsidian-newtab/commit/5a49bbaec063d592ff136b59849b45fc7c5aac71)), closes [#30](https://github.com/MMoMM-org/obsidian-newtab/issues/30)
* store the Unsplash SecretComponent ID, not the key value ([f72ea58](https://github.com/MMoMM-org/obsidian-newtab/commit/f72ea58047f19e61fd36124fda88b4728375dc9b))
* trim the Unsplash access key to avoid spurious 401s ([475ea14](https://github.com/MMoMM-org/obsidian-newtab/commit/475ea147fe2df374b27ce05d4536ab14a58c578e))
* unmount the view synchronously to avoid a blank pane on disable ([13345d6](https://github.com/MMoMM-org/obsidian-newtab/commit/13345d63275e9ae089c0c62ef40f00545d3f4faa))


### Features

* add a branded React header to the settings tab ([#14](https://github.com/MMoMM-org/obsidian-newtab/issues/14)) ([fe25ad0](https://github.com/MMoMM-org/obsidian-newtab/commit/fe25ad0e46b1d21ebc088232f9738e076cb04715)), closes [#13](https://github.com/MMoMM-org/obsidian-newtab/issues/13)
* add a custom Unsplash topic background theme ([#2](https://github.com/MMoMM-org/obsidian-newtab/issues/2)) ([508896d](https://github.com/MMoMM-org/obsidian-newtab/commit/508896d1f1a5fcd05bbdd51087a96836c95f1889))
* add a Debug logging toggle in settings ([#10](https://github.com/MMoMM-org/obsidian-newtab/issues/10)) ([30d7570](https://github.com/MMoMM-org/obsidian-newtab/commit/30d75705e2efca18c4f5bea5ac36ac29646df9f0))
* add gated debug logging for the external providers ([1f4794c](https://github.com/MMoMM-org/obsidian-newtab/commit/1f4794c13f66705886a0f3fd6df869b0a6035b43))
* add vault notes as a combinable quote source ([#7](https://github.com/MMoMM-org/obsidian-newtab/issues/7)) ([e35fe6c](https://github.com/MMoMM-org/obsidian-newtab/commit/e35fe6c942c035cd0cd69b156ccb1b97adc045e1))
* link vault-note quotes to their source note ([#7](https://github.com/MMoMM-org/obsidian-newtab/issues/7)) ([61e3742](https://github.com/MMoMM-org/obsidian-newtab/commit/61e3742c110ee67e379fe29246affcb058c270f2))
* localize the time-of-day greeting by language + config ([#12](https://github.com/MMoMM-org/obsidian-newtab/issues/12)) ([b21081a](https://github.com/MMoMM-org/obsidian-newtab/commit/b21081a893c1563a8b0c3769ce122657833286a1))
* one-time BeautiTab settings import with settings fallback ([#17](https://github.com/MMoMM-org/obsidian-newtab/issues/17)) ([3ffde1e](https://github.com/MMoMM-org/obsidian-newtab/commit/3ffde1e9878a2e40621182ec7b2fe1006632637b))
* scaffold New Tab plugin (beautitab fork) on MiYo build pipeline ([5442acf](https://github.com/MMoMM-org/obsidian-newtab/commit/5442acfd8c8df4a8eb6ff79a04a882bede4859aa))
* show post-import checklist and next steps after BeautiTab import ([#17](https://github.com/MMoMM-org/obsidian-newtab/issues/17)) ([73a90c4](https://github.com/MMoMM-org/obsidian-newtab/commit/73a90c44292b41b254d111875f310537ca9e22ef))
* show ZenQuotes attribution when an online quote is displayed ([fb784fc](https://github.com/MMoMM-org/obsidian-newtab/commit/fb784fc9ff08dc002013a7aaedcf1f453334abde)), closes [#1](https://github.com/MMoMM-org/obsidian-newtab/issues/1)
* store local backgrounds in a vault folder instead of base64 ([#6](https://github.com/MMoMM-org/obsidian-newtab/issues/6)) ([e0a0fd9](https://github.com/MMoMM-org/obsidian-newtab/commit/e0a0fd90e4c2c95e41543cde9b291837df267423)), closes [#60](https://github.com/MMoMM-org/obsidian-newtab/issues/60)
* themed backgrounds via the official Unsplash API ([#2](https://github.com/MMoMM-org/obsidian-newtab/issues/2)) ([f9571fb](https://github.com/MMoMM-org/obsidian-newtab/commit/f9571fb03097abd2913fb94c98b075977088235a))
* tooltip with full name on truncated file/bookmark names ([#8](https://github.com/MMoMM-org/obsidian-newtab/issues/8)) ([3e21b51](https://github.com/MMoMM-org/obsidian-newtab/commit/3e21b518d22dfa54661debfa422b54160ef328d6))

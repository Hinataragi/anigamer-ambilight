# Privacy policy

[繁體中文](PRIVACY.md) | English

Updated October 1, 2026. Applies to this project's userscript, Chromium extension, and Firefox extension.

## Scope and permissions

Site scripts run only on `https://ani.gamer.com.tw/*`. The extensions request settings storage permission, not browsing history, passwords, or access to other sites. The project does not take over login, intercept video ads, or bypass DRM or subscription restrictions.

## Video and page data

Video sampling, black-bar detection, and lighting rendering happen inside your browser. Sampled frames are used for rendering, without creating a viewing record or uploading images. The project has no collection server, analytics integration, or telemetry endpoint.

The code reads page elements and player state to apply styles, provide collapse controls, and schedule rendering. It does not send account details, comments, danmu, or viewing history to the author.

## Stored settings

Stored data consists of selected colors, fonts, lighting, layout, and feature settings. The userscript uses its manager's storage; backups and synchronization depend on that manager and your configuration. Extensions use browser `storage.sync`; your browser provider may sync these settings through your account. The project does not separately send settings to the author or store AniGamer login credentials.

## External connections

System fonts are the default. Selecting Google Fonts, or enabling Google loading for a custom family, contacts `fonts.googleapis.com` and `fonts.gstatic.com` for styles and font files. Google receives connection information needed for downloads, such as your IP address and request information supplied by the browser. See [Google's privacy policy](https://policies.google.com/privacy).

Switching to system fonts or disabling online custom-font loading stops new font requests added by this tool. Downloaded files may remain cached. Connections made by AniGamer itself are outside this tool's control.

Userscripts installed from GitHub contain update URLs. Your manager may contact GitHub to check for or download updates. Other installation platforms may handle updates differently. Manually loaded extension packages have no configured remote automatic update service.

## Export, import, and removal

Export downloads settings as JSON without uploading it. Import parses files inside the browser, validates known fields, and ignores unknown fields. Backups include custom font names and other settings; review them before sharing.

Resetting defaults replaces settings; it does not erase manager or browser storage. To remove stored data, use your manager's deletion or data-clearing options, or uninstall the extension and follow your browser's data-removal instructions. Synced and backed-up copies require separate handling through their services. Disabling the tool and reloading stops its page changes.

## Changes and contact

New connections, stored fields, or data handling should be reflected in this policy and explained in release notes. This policy does not cover AniGamer, browsers, script managers, or third-party distribution platforms.

Questions can be raised through [GitHub Issues](https://github.com/Hinataragi/anigamer-ambilight/issues). Do not post credentials or sensitive information publicly. The author may not check issues regularly and cannot guarantee an immediate response.

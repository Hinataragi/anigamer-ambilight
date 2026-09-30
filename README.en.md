# anigamer-ambilight

[繁體中文](README.md) | English

Ambient lighting and a playback page theme editor for AniGamer. Extend video colors around the player, or customize the page without enabling video sampling.

Inspired by [youtube-ambilight](https://github.com/WesselKroos/youtube-ambilight), with additional reference to [bilibili-ambilight](https://github.com/iceorange-dev/bilibili-ambilight). This is an unofficial project that keeps AniGamer's player and account flows.

I may not check issues regularly or release updates on a fixed schedule. Replies and fixes may take time. Forks, contributions, and substantial improvements to rendering, performance, mobile use, and site compatibility are welcome.

## Installation

Use **one installation method at a time**. Disable older copies and extensions with the same purpose to avoid duplicate rendering and styles. The interface uses Traditional Chinese; the labels below help you locate its controls.

### Userscript — recommended

1. Install a compatible script manager from the [Violentmonkey website](https://violentmonkey.github.io/).
2. Open the [latest userscript](https://github.com/Hinataragi/anigamer-ambilight/releases/latest/download/anigamer-ambilight.user.js). If it downloads instead, import the file through your manager.
3. Check the name, source, and version, then install or update.
4. Reload AniGamer and open **觀影設定** (Viewing settings) in the page header.

Mobile and tablet support depends on the browser and script manager. The settings panel adapts to narrower screens.

### Chromium extension

1. Download the Chromium ZIP from [Releases](https://github.com/Hinataragi/anigamer-ambilight/releases/latest) and extract it into a permanent folder.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode, choose **Load unpacked**, and select the folder containing `manifest.json`.
4. To update, replace the files in that folder, reload the extension, and reload AniGamer.

### Firefox extension

The Firefox package is **unsigned and intended for temporary loading**. Standard Firefox removes it when the browser restarts. Use the userscript for regular use.

1. Download and extract the Firefox ZIP from Releases.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on** and select `manifest.json` in the extracted folder.
4. Reload AniGamer. Reload updated files through the same debugging page.

See Mozilla's [temporary installation documentation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) for the limitations. There are currently no plans to publish in browser extension stores.

## Independent controls

| Control                       | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| 動態環境光 — Ambient lighting | Sample the video and render surrounding light             |
| 主題配色 — Page theme         | Apply colors, backgrounds, and transparency               |
| 版型重排 — Page layout        | Adjust information layout, spacing, and collapse controls |

**You can use this as a regular AniGamer theme.** Turn off ambient lighting and keep the page theme enabled. Layout changes have a separate switch, so you can keep the site's original arrangement.

## Lighting effects

| Method            | Appearance                                         |
| ----------------- | -------------------------------------------------- |
| Radial projection | Extend the image outward; the default method       |
| Rounded diffusion | Soften the corners                                 |
| Contour extension | Continue colors from the image boundary            |
| Soft diffusion    | Retain color while reducing detail                 |
| Edge reflection   | Mirror the edge and retain more detail             |
| Edge light bands  | Show edge colors without copying image detail      |
| Edge stretch      | Stretch source pixels to suggest an extended scene |
| Swirl extension   | Gradually rotate the outward extension             |

These methods do not generate new scenery or use AI. Stretching and reflection can distort people, buildings, and text. Each method has its own shape controls, alongside brightness, spread, blur, detail, saturation, and contrast. Quick presets affect lighting only; resolution and scheduling are configured separately.

## Page customization

- Six presets: immersive blue, graphite, warm paper, forest night, dusk violet, and high-readability colors. Dark, light, and system appearance options are separate.
- A custom palette accepts color picker input or `#112233` / `#123` codes for backgrounds, panels, controls, primary text, secondary text, and accents. Disable it to return to your selected theme.
- Independent opacity controls for the header, danmu list, information, related anime, news, and comments. Footer transparency is enabled by default and can be disabled.
- Controls and search fields can use themed backgrounds, transparent backgrounds, or original site colors.
- Collapse episodes, information, related anime, news, and comments. Focus mode hides surrounding content; the danmu list also has its own collapse control. Episode buttons can wrap or scroll horizontally.
- Comment column layout, density, image size, and width controls. The danmu scrollbar can be hidden while retaining scrolling.
- The player keeps the site's responsive layout by default. A custom theater width requires explicit enabling.
- System fonts, selected Google Fonts, and custom family names. Font sizing, line height, corner radius, and section spacing are adjustable. Icon fonts are preserved. Optional danmu font changes apply to DOM text, not canvas text or subtitles embedded in the video.
- Optional hiding of sidebar display ads. In-video ads are not skipped or intercepted, and video sampling pauses during them.

## Settings and backups

| Category                                 | Contents                                              |
| ---------------------------------------- | ----------------------------------------------------- |
| 預設主題 — Themes                        | Theme presets, accent, custom palette                 |
| 光暈效果 — Lighting                      | Quick presets, extension methods, image detail        |
| 外觀與字體 — Appearance and fonts        | Dark/light appearance, fonts, text size, menu opacity |
| 透明度與按鈕 — Transparency and controls | Section backgrounds and control surfaces              |
| 版面與間距 — Layout and spacing          | Section layout, player layout, spacing                |
| 顯示與收合 — Visibility and collapse     | Surrounding content, danmu list, collapse controls    |
| 流暢度與畫質 — Performance and quality   | Lighting resolution, scheduling, renderer status      |
| 影片黑條 — Black bars                    | Sampling crop and optional coverage                   |
| 其他與備份 — Other and backups           | Sidebar ads, import, export, reset                    |

Settings save automatically. Reset icons work per field and per category. **所有設定** returns to the overview; Esc first returns there, then closes the panel. The menu opacity slider is in the header and defaults to 70%.

Updates preserve settings. Export a backup before updating. New fields use defaults when importing older backups; unknown fields are ignored. The settings format has its own version, separate from the application version. Future incompatible changes should document their migration requirements.

## Performance and limits

The default starts at a 960 px lighting canvas and follows new video frames, rather than redrawing a 24 fps anime at 60 fps. Frame blending defaults to zero to avoid old-frame trails. Adaptive quality reduces pixel count under load and can be disabled.

WebGL 2 is preferred, with a Canvas fallback. GPU timing is used when available; otherwise scheduling relies on submission time and missed-frame signals. Browser, driver, and system settings determine hardware acceleration.

Black-bar detection avoids uncertain dark scenes or detected text. Actual black-bar coverage is a separate opt-in setting. Small or dark text can still escape detection. DRM or cross-origin restrictions may prevent sampling; the original player remains available.

Automated tests cover settings interactions, black-bar fixtures, and GPU API calls. Browser API fallbacks exist for Chrome, Edge, Firefox, and Safari; full playback testing across these browsers is still pending.

## Privacy

Video sampling stays in the browser. This project has no analytics endpoint or data collection server. Settings are stored by your script manager or browser; extension settings may sync through your browser account. Selected online fonts contact Google Fonts. See the [privacy policy](docs/PRIVACY.en.md) for storage, external connections, exports, and removal.

## Development

Source files are maintained separately; the build produces a readable single-file userscript. Node.js and npm are required.

```sh
npm ci
npm test
npm run build
```

| Path                | Contents                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| `src/`              | Settings, rendering, black-bar detection, site integration, and styles |
| `scripts/build.mjs` | Distribution builder                                                   |
| `tests/`            | Settings, black-bar fixtures, and GPU API contracts                    |
| `docs/`             | Installation and privacy documentation                                 |
| `.github/`          | Bilingual issue forms, CI, and release workflow                        |

Outputs: `dist/ani-ambilight.user.js`, `dist/extension/`, and `dist/extension-firefox/`. Dependencies, generated distributions, and ZIP files are excluded from version control.

GitHub Actions runs tests and builds on commits and pull requests. Version tags matching the package version create a Release with all three installation packages.

For bug reports, include browser and manager versions, the affected page, settings, and reproduction steps. Remove personal information from screenshots and backups before sharing.

## License and credits

Released under the [MIT license](LICENSE). Redistribution must retain copyright and license notices. The license applies to project code, not AniGamer trademarks, website assets, or video content.

- [youtube-ambilight](https://github.com/WesselKroos/youtube-ambilight), by Wessel Kroos: primary inspiration for lighting effects and performance approaches. Original notice: [LICENSE.youtube-ambilight](LICENSE.youtube-ambilight).
- [bilibili-ambilight](https://github.com/iceorange-dev/bilibili-ambilight), by iceorange-dev: reference for integration into an anime playback site. Original notice: [LICENSE.bilibili-ambilight](LICENSE.bilibili-ambilight), including the upstream Wessel Kroos notice.

The software is provided **as is**, without warranties. Full warranty and liability terms are in LICENSE. This project is not affiliated with Bahamut and is not endorsed by AniGamer or the authors of the referenced projects.

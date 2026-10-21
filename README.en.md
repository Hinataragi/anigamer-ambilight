# anigamer-ambilight

[繁體中文](README.md) | English

**Ambient lighting and a page theme editor for AniGamer (ani.gamer.com.tw).**
Video colors extend around the player, and you can restyle colors, fonts, transparency and layout. Lighting and theme are independent — use either one alone.

Three ways to install, with identical features and settings: **Userscript**, **Chromium extension** (Chrome, Edge), **Firefox extension**.

> Unofficial. It keeps AniGamer's own player and sign-in flow and never reads account credentials. Inspired by [youtube-ambilight](https://github.com/WesselKroos/youtube-ambilight), with additional reference to [bilibili-ambilight](https://github.com/iceorange-dev/bilibili-ambilight).

The interface is in Traditional Chinese; Chinese labels are given in parentheses below so you can find them.

## What it does

| Feature                       | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Ambient lighting (動態環境光) | Samples the video and casts a glow around the player, with eight spread modes |
| Page theme (主題配色)         | Six presets, dark / light / follow system, every color customizable           |
| Page layout (版型重排)        | Rearranges episodes, info, related anime, news and comments, each collapsible |
| Fonts                         | Bundled CJK fonts, any Google Font, or fonts installed on your device         |
| Letterbox (影片黑條)          | Detects black bars and covers them with the glow (off by default)             |

Each main feature has its own switch. **If you only want a nicer theme, turn off ambient lighting.** Nothing is sampled and there is no extra rendering cost.

## Installation

Use **one method at a time**. Running several copies duplicates the glow and styles.

| Method             | Best for                      | Updates                             |
| ------------------ | ----------------------------- | ----------------------------------- |
| Userscript         | Daily use, phones and tablets | Checked by your script manager      |
| Chromium extension | Desktop Chrome and Edge       | Replace files, then reload manually |
| Firefox extension  | Trying it out                 | Removed when Firefox restarts       |

### Userscript (recommended)

1. Install a script manager such as [Violentmonkey](https://violentmonkey.github.io/).
2. Install the script from one source:
   - [Greasy Fork](https://greasyfork.org/en/scripts/598131-anigamer-ambilight)
   - [Latest GitHub release](https://github.com/Hinataragi/anigamer-ambilight/releases/latest/download/anigamer-ambilight.user.js)
3. Check the name and source, then confirm the installation.
4. Reload AniGamer and open **觀影設定** (Viewing settings) in the page header.

If the browser downloads the file instead, import it through your manager. Chrome 138+ may require enabling "Allow user scripts" in the manager's extension details.

### Chromium extension

1. Download the Chromium ZIP from [Releases](https://github.com/Hinataragi/anigamer-ambilight/releases/latest) and extract it to a permanent folder.
2. Open `chrome://extensions` (`edge://extensions` in Edge) and enable Developer mode.
3. Choose **Load unpacked** and select the folder containing `manifest.json`.
4. Reload AniGamer. The toolbar icon opens the same settings in a popup; the page header also has **觀影設定**.

To update, replace the files and press **Reload** on the extensions page. There are no plans to publish to the Chrome Web Store or Edge Add-ons.

### Firefox extension

This package is **unsigned and for temporary loading only**. Standard Firefox removes it when the browser restarts. Use the userscript for regular use.

1. Download and extract the Firefox ZIP from Releases.
2. Open `about:debugging#/runtime/this-firefox` and choose **Load Temporary Add-on**.
3. Select `manifest.json` in the extracted folder and reload AniGamer.

See Mozilla's [temporary installation documentation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) for the limitations. For more detail and troubleshooting, see the [installation guide](docs/INSTALL.md) (Traditional Chinese).

## Quick start

1. Open **觀影設定** and go to Preset themes (預設主題). Pick a palette.
2. Go to Light effects (光暈效果) and choose a quick preset: natural, sharp, soft color or pale glow.
3. Fine-tune the rest as needed. Changes apply immediately and are saved automatically.

The reset icon beside a setting restores only that setting; the icon at the top right of a category restores the whole category; Other & backup (其他與備份) resets everything.

## Themes

The six presets change colors, text size and transparency only. They **do not touch player layout, lighting or performance settings**.

| Theme (中文)                   | Character                            |
| ------------------------------ | ------------------------------------ |
| Immersive Ink (沉浸墨藍)       | Ink-blue base, sky-blue buttons and links |
| Low-chroma Graphite (低彩石墨) | Muted grey-black, warm beige accent, good at night |
| Warm Paper (暖紙淺色)          | Warm paper base, terracotta accent, good by day |
| Forest Night (森林夜色)        | Deep green base, grey-green accent   |
| Dusk Violet (暮紫)             | Grey-violet base, soft violet accent |
| Clear Reading (清楚閱讀)       | Larger text, opaque info panels      |

Turn on custom palette (使用自訂色票) to set background, panel, button, primary text, secondary text and accent colors with a picker or hex codes (`#112233`, `#123`). Turning it off returns to the selected theme.

You can also adjust accent hue and vividness, text size, line height, corner radius, section spacing, and the background opacity of the header, danmaku list, info, related anime, news and comments independently. Buttons and the search box can follow the theme, let the glow show through, or keep the original site colors.

## Lighting

| Mode            | Look                                                           |
| --------------- | -------------------------------------------------------------- |
| Radial project  | Spreads outward in all directions (default)                    |
| Round diffuse   | Softens the corners to reduce the boxy look                    |
| Contour extend  | Continues the colors of the frame edge                         |
| Soft diffuse    | Blurs detail and keeps color                                   |
| Edge reflection | Mirrors the edges and keeps more detail                        |
| Edge band       | Shows only the colors of the frame                             |
| Edge stretch    | Fake extension from source pixels; people and text may distort |
| Swirl           | Rotates gradually as it extends; rotation is adjustable        |

These are not AI outpainting and never generate scenes beyond the video. Each mode has its own shape settings, plus brightness, range, blur, detail, saturation and contrast. Quick presets change only the look of the glow; resolution and update mode are set under Smoothness & quality (流暢度與畫質).

## Layout and controls

- Episodes, info, related anime, news and comments are expanded by default with collapse buttons. Episodes can also wrap or scroll in one row.
- Focus mode hides surrounding information. Collapse danmaku hides only the side list; press again to restore.
- The danmaku list can hide its scrollbar while still scrolling. Comments have adjustable width, density and image size.
- The player follows the site's adaptive layout by default; a custom theater width must be enabled separately.
- Sidebar display ads can be hidden. Video ads are neither skipped nor blocked, and sampling pauses during them.
- Turning off page layout keeps the original arrangement while lighting and colors still work.
- The All Anime filters become rows of pill buttons, with the selected one in the accent color.
- My Anime becomes a poster grid, with view-count and paid badges as pills of the same height.
- AniGamer's own notice dialogs follow the theme.
- Light mode was re-tuned for contrast, so badges, episode labels and the bottom announcement bar stay readable on white.

## Fonts

The default is Noto Sans TC. Also bundled: system fonts, Noto Serif TC, Iansui, LXGW WenKai TC, Chiron Hei and Chiron Sung. You can enter any Google Fonts family name too. To avoid downloading fonts, switch to system fonts or use a font installed on your device.

Fonts apply to navigation, titles, info, news, comments, the danmaku list and the settings panel; icon fonts are untouched. Player danmaku can optionally use the font, but only DOM text — canvas danmaku and the video's built-in subtitles cannot be changed by page CSS.

## Settings categories

| Category                            | What it controls                                |
| ----------------------------------- | ----------------------------------------------- |
| Preset themes (預設主題)            | Six palettes, accent and custom palette         |
| Light effects (光暈效果)            | Quick presets, spread mode and image detail     |
| Appearance & fonts (外觀與字體)     | Light/dark, font, reading size, panel opacity   |
| Opacity & buttons (透明度與按鈕)    | Section backgrounds and control fills           |
| Layout & spacing (版面與間距)       | Section rearrangement, player layout, spacing   |
| Display & folding (顯示與收合)      | What to show, folding and the danmaku list      |
| Smoothness & quality (流暢度與畫質) | Glow resolution, update mode and render status  |
| Letterbox (影片黑條)                | Sampling crop and optional bar cover            |
| Other & backup (其他與備份)         | Page ads, settings import/export and full reset |

On desktop the panel is a centered two-column view (categories on the left, content on the right). Phones and tablets use a single column: choose a category, then enter it. Esc goes back to the overview first, then closes the panel.

## Performance and limits

- Defaults to a 960 px glow resolution and follows new video frames instead of redrawing 24 fps footage at 60 fps. Frame blending defaults to 0 to avoid trails.
- Auto quality reduces pixel count under load. If WebGL 2 is unavailable it falls back to Canvas. Hardware acceleration is decided by your browser, driver and system and cannot be forced.
- Letterbox cover is off by default. With subtitles, graphics or dark scenes it keeps the original frame, and may still miss very small or dark text.
- Some DRM or cross-origin video cannot be sampled; the original player is kept and playback is unaffected.
- Full real-device testing across browsers is not finished. Phones and tablets need a browser or manager that supports userscripts.

## Privacy

Settings are stored by the script manager or browser; extensions may sync them through your browser account depending on its settings. The default font, Noto Sans TC, is downloaded from Google Fonts. Switch to a system or device font and no request is made. Account credentials are never read and sign-in is never intercepted. See the [privacy policy](docs/PRIVACY.en.md).

## Development

Requires Node.js and npm. All three packages are built from the same `src/`.

```sh
npm ci
npm test
npm run build
```

| Output                       | Purpose                     |
| ---------------------------- | --------------------------- |
| `dist/ani-ambilight.user.js` | Single-file userscript      |
| `dist/extension/`            | Chromium extension          |
| `dist/extension-firefox/`    | Firefox temporary extension |

```text
src/                   settings, renderer, letterbox detection, page integration, styles
  settings.js          setting definitions, theme presets, panel DOM
  settings-ui.css      settings panel and extension popup styles
  effects.css          theme colors (light/dark and custom palette)
  content.css          page layout rearrangement
  ambient-renderer.js  WebGL 2 / Canvas glow renderer
scripts/build.mjs      builds the three packages
tests/                 settings, letterbox and GPU API tests
docs/                  install and privacy notes
```

CI runs tests and a build on every push and pull request. Pushing a `v*.*.*` tag that matches the project version creates a GitHub Release automatically.

## Contributing

This project is a starting point; I may not check issues often and replies can take time. Forks and substantial improvements to rendering, performance, mobile use and site compatibility are welcome.

When reporting a problem, include browser and manager versions, the AniGamer page URL, the effect and settings in use, and steps to reproduce. Please crop out account notifications and personal data from screenshots.

## License and credits

[MIT](LICENSE): use, modify, redistribute and use commercially, keeping the copyright and license notice. The license covers this project's code, not AniGamer trademarks, site assets or video content.

- [youtube-ambilight](https://github.com/WesselKroos/youtube-ambilight) by Wessel Kroos — main inspiration for the glow effects and performance approach. License: [LICENSE.youtube-ambilight](LICENSE.youtube-ambilight).
- [bilibili-ambilight](https://github.com/iceorange-dev/bilibili-ambilight) by iceorange-dev — reference for integrating ambient light into an anime site. License: [LICENSE.bilibili-ambilight](LICENSE.bilibili-ambilight).

The software is provided as is, with no guarantee of continued compatibility or freedom from errors; see LICENSE. This project is not affiliated with Gamer (Bahamut) and is not endorsed by AniGamer or the projects above.

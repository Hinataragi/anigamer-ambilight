# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Viewers of 動畫瘋 (ani.gamer.com.tw) in Taiwan who watch anime in the browser on desktop, and sometimes on phone or tablet through a userscript manager. (Inferred: the main viewing scene is evening, lights low, dark theme first. Light mode is a supported second scene for daytime.)

## Product Purpose

anigamer-ambilight extends the video's colour onto the page around the player, and restyles the 動畫瘋 site with themes, fonts, layout rearrangement and per-section opacity. Success: the page recedes, the video and its light lead, and every page of the site feels like one coherent viewing room.

## Positioning

A live ambient glow sampled from the playing frame (WebGL 2 with Canvas fallback, eight extension methods) combined with a full theme editor for one specific site. The glow, the theme and the layout are independent switches.

## Operating Context

- Settings open from the page header button 「觀影設定」 as an in-page panel, and from the browser toolbar as the extension popup. Both render the same settings DOM from `src/settings.js`.
- Pages themed: home, all-anime list with filters, my-anime grid, watch history, the player page (episodes, info, related, news, comments, danmaku list), the site's own notice dialogs and bottom announcement bar.
- One `src/` builds a Userscript, a Chromium extension and a Firefox extension.

## Capabilities and Constraints

- Six theme presets (沉浸墨藍, 低彩石墨, 暖紙淺色, 森林夜色, 暮紫, 清楚閱讀), dark / light / follow system, and a custom swatch editor for base, surface, soft, text, muted and accent.
- Accent hue and strength, font size, line height, radius, spacing, per-section opacity.
- Fonts: default Noto Sans TC via Google Fonts, other built-in presets, any Google Fonts family, or device fonts.
- Must not touch login, account data, or the original player; must not skip or block video ads.
- CSS overrides live on top of the site's own CSS and need `!important` in many places. The site's DOM is not ours and can change.

## Brand Commitments

- Name: 動畫瘋環境光 / anigamer-ambilight. Unofficial, not affiliated with Bahamut.
- UI copy is Traditional Chinese (Taiwan).

## Evidence on Hand

No screenshots, testimonials or usage numbers beyond the repository. Do not invent any.

## Product Principles

1. The video leads. Chrome stays quiet enough that the glow is the brightest thing on the page.
2. Every switch is independent. Theme without glow, glow without layout, all must work.
3. Settings are operated often and quickly. Nothing becomes harder to find or one more level deep.
4. Preserve the site's function and affordances. Restyle, never break.

## Accessibility & Inclusion

Text and badges must keep at least 4.5:1 contrast in both dark and light themes. Keyboard focus stays visible in the settings panel. Touch targets 44px on mobile.

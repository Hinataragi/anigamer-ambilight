(() => {
  'use strict';

  // ── 一、啟動狀態與網站相容選擇器 ──
  const options = globalThis.AniAmbientSettings;
  if (!options) return;
  const DEFAULTS = options.defaults;
  // Prefer the official player, but allow its surrounding markup to change.
  const VIDEO_SELECTOR =
    '#video-container video, #ani_video video, section.player video, video.vjs-tech';
  const SAMPLE_WIDTH = 192;
  const SAMPLE_HEIGHT = 108;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const settings = { ...DEFAULTS };
  const systemAppearance = matchMedia('(prefers-color-scheme:light)');
  systemAppearance.addEventListener('change', () => {
    if (settings.appearance === 'system') applyPageTheme();
  });
  let active = null;
  let rebindTimer;
  let saveTimer;
  let settingsPanel;
  let watchLayout;
  let infoLinkPlacement = null;
  const regionFolds = new Map();
  const originalControlStyles = new Map();
  let navLayout;
  let fontLink;
  let fontStatus = '使用系統字體，無需下載。';
  let fontRequest = 0;
  const fonts = {
    wenkai: {
      family: '"LXGW WenKai TC"',
      url: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@300;400;700&display=swap',
    },
    chironHei: {
      family: '"Chiron Hei HK"',
      url: 'https://fonts.googleapis.com/css2?family=Chiron+Hei+HK:wght@400;500;700&display=swap',
    },
    chironSung: {
      family: '"Chiron Sung HK"',
      url: 'https://fonts.googleapis.com/css2?family=Chiron+Sung+HK:wght@400;600;700&display=swap',
    },
    sans: {
      family: '"Noto Sans TC"',
      url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap',
    },
    serif: {
      family: '"Noto Serif TC"',
      url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600;700&display=swap',
    },
    iansui: {
      family: '"Iansui"',
      url: 'https://fonts.googleapis.com/css2?family=Iansui&display=swap',
    },
  };
  const imageObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const image = entry.target;
              imageObserver.unobserve(image);
              if (image.src.startsWith('data:image/gif') && image.dataset.src) {
                image.src = image.dataset.src;
              }
            }
          },
          { rootMargin: '500px 0px' },
        )
      : null;

  const storage =
    globalThis.AniAmbientStorage || globalThis.chrome?.storage?.sync;
  if (storage) {
    storage.get(DEFAULTS, (saved) => {
      if (globalThis.chrome?.runtime?.lastError) return;
      Object.assign(settings, options.normalize(saved));
      applyPageTheme();
      active?.applySettings();
      active?.refresh();
      syncSettingsPanel();
    });
    (
      globalThis.AniAmbientStorage?.onChanged ||
      globalThis.chrome?.storage?.onChanged
    )?.addListener((changes, area) => {
      if (area !== 'sync') return;
      const updated = {};
      for (const key of Object.keys(DEFAULTS))
        if (changes[key]) updated[key] = changes[key].newValue;
      Object.assign(settings, options.normalize(updated, settings));
      applyPageTheme();
      active?.applySettings();
      active?.refresh();
      syncSettingsPanel();
    });
  }

  // ── 二、主題配色、字體與可逆的頁面重排 ──
  function applyPageTheme() {
    document.body?.classList.toggle(
      'ani-controls-transparent',
      settings.controlStyle === 'transparent',
    );
    document.body?.classList.toggle(
      'ani-custom-danmu-font',
      settings.danmuFontEnabled,
    );
    document.body?.style.setProperty(
      '--ani-editor-opacity',
      String(settings.settingsOpacity / 100),
    );
    document.body?.style.setProperty(
      '--ani-collapsed-player-spacing',
      `${settings.collapsedPlayerSpacing}px`,
    );
    const danmuButton = document.querySelector('.ani-danmu-toggle');
    if (danmuButton) {
      danmuButton.textContent = settings.showDanmu ? '收合彈幕' : '展開彈幕';
      danmuButton.setAttribute('aria-expanded', String(settings.showDanmu));
    }
    document.body?.classList.toggle('ani-focus-mode', settings.focusMode);
    document.body?.classList.toggle('ani-footer-glow', settings.footerGlow);
    document.body?.classList.toggle(
      'ani-hidden-danmu-scrollbar',
      settings.hideDanmuScrollbar,
    );
    document.body?.style.setProperty(
      '--ani-button-opacity',
      String(settings.buttonOpacity / 100),
    );
    document.body?.style.setProperty(
      '--ani-comment-width',
      `${settings.commentWidth}px`,
    );
    const focusButton = document.querySelector('.ani-focus-toggle');
    if (focusButton) {
      focusButton.textContent = settings.focusMode ? '結束專注' : '專注觀看';
      focusButton.setAttribute('aria-pressed', String(settings.focusMode));
    }
    const font =
      settings.fontFamily === 'custom' && settings.customFontName
        ? {
            family: JSON.stringify(settings.customFontName),
            url: settings.customFontGoogle
              ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.customFontName)}&display=swap`
              : null,
          }
        : fonts[settings.fontFamily];
    if (font?.url && fontLink?.getAttribute('href') !== font.url) {
      const request = ++fontRequest;
      fontStatus = '正在載入 Google 字體…';
      fontLink?.remove();
      fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = font.url;
      fontLink.onload = async () => {
        try {
          const loaded = await document.fonts.load(
            `16px ${font.family}`,
            '動畫瘋看見光故事',
          );
          if (!loaded.length) throw new Error('Font unavailable');
          if (request === fontRequest) {
            fontStatus = '字體已載入，已套用頁面文字。';
            syncSettingsPanel();
          }
        } catch {
          if (request === fontRequest) {
            fontStatus = '字體未能載入，目前使用系統字體。';
            syncSettingsPanel();
          }
        }
      };
      fontLink.onerror = () => {
        if (request === fontRequest) {
          fontStatus = '無法連線 Google Fonts，目前使用系統字體。';
          syncSettingsPanel();
        }
      };
      document.head.append(fontLink);
    } else if (!font?.url) {
      fontRequest++;
      fontLink?.remove();
      fontLink = null;
      fontStatus = font
        ? '使用裝置字體；裝置未安裝時會使用備用字體。'
        : '使用系統字體，無需下載。';
    }
    document.body?.style.setProperty(
      '--ani-font',
      font
        ? `${font.family},system-ui,"Microsoft JhengHei",sans-serif`
        : 'system-ui,"Microsoft JhengHei",sans-serif',
    );
    document.body?.classList.toggle('ani-custom-font', Boolean(font));
    document.body?.classList.toggle(
      'ani-ambientlight-page',
      Boolean(settings.themeEnabled),
    );
    document.body?.classList.toggle(
      'ani-ambientlight-ui',
      Boolean(settings.uiEffectsEnabled),
    );
    for (const [suffix, key] of Object.entries({
      nav: 'navLayout',
      watch: 'watchLayout',
      episodes: 'episodesLayout',
      info: 'infoLayout',
      related: 'relatedLayout',
      news: 'newsLayout',
      comments: 'commentsLayout',
    }))
      document.body?.classList.toggle(
        `ani-layout-${suffix}`,
        Boolean(settings.themeEnabled && settings[key]),
      );
    document.body?.classList.toggle(
      'ani-custom-watch-width',
      Boolean(settings.customWatchWidth),
    );
    document.body?.classList.toggle(
      'ani-episodes-scroll',
      settings.episodeStyle === 'scroll',
    );
    document.body?.classList.toggle(
      'ani-comments-compact',
      settings.commentDensity === 'compact',
    );
    for (const [suffix, key] of Object.entries({
      info: 'showInfo',
      related: 'showRelated',
      news: 'showNews',
      comments: 'showComments',
    }))
      document.body?.classList.toggle(`ani-hide-${suffix}`, !settings[key]);
    document.body?.classList.toggle(
      'ani-hide-sidebar-ads',
      Boolean(settings.hideSidebarAds),
    );
    document.body?.classList.toggle('ani-hide-danmu', !settings.showDanmu);
    document.body?.classList.toggle(
      'ani-theme-light',
      settings.appearance === 'light' ||
        (settings.appearance === 'system' && systemAppearance.matches),
    );
    for (const key of [
      'headerOpacity',
      'headerTint',
      'panelOpacity',
      'panelTint',
      'infoOpacity',
      'relatedOpacity',
      'newsOpacity',
      'commentOpacity',
    ])
      document.body?.style.setProperty(
        `--ani-${key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())}`,
        String(
          (settings.uiEffectsEnabled ? settings[key] : DEFAULTS[key]) / 100,
        ),
      );
    document.body?.style.setProperty(
      '--ani-watch-width',
      `${settings.watchWidth}px`,
    );
    for (const [name, value] of Object.entries({
      'text-size': `${settings.textSize}px`,
      'text-leading': settings.textLeading / 100,
      radius: `${settings.cornerRadius}px`,
      'section-spacing': `${settings.sectionSpacing}px`,
      'comment-image-width': `${settings.commentImageWidth}px`,
      'danmu-font': `${settings.danmuTextSize}px`,
      'danmu-row-spacing': `${settings.danmuRowSpacing}px`,
      'danmu-width': `${settings.danmuWidth}px`,
    }))
      document.body?.style.setProperty(`--ani-${name}`, String(value));
    const light =
      settings.appearance === 'light' ||
      (settings.appearance === 'system' && systemAppearance.matches);
    const palettes = {
      slate: {
        dark: ['#0b1017', '19,29,39', '#202d38', '#f2f5f8', '#b7c7d3'],
        light: ['#eef3f7', '248,251,254', '#e2ebf1', '#17212b', '#435365'],
      },
      neutral: {
        dark: ['#121212', '26,26,26', '#292929', '#f5f5f5', '#c4c4c4'],
        light: ['#f4f4f4', '252,252,252', '#e7e7e7', '#202020', '#505050'],
      },
      paper: {
        dark: ['#191611', '35,30,25', '#38312a', '#faf4eb', '#d3c5b5'],
        light: ['#f5f1e8', '255,251,244', '#e9e0d3', '#302820', '#615446'],
      },
      forest: {
        dark: ['#121916', '27,36,31', '#2b3931', '#edf2ed', '#bdcdc0'],
        light: ['#eef5ef', '249,253,248', '#dceadf', '#182c20', '#3d5b47'],
      },
      violet: {
        dark: ['#19171e', '35,31,41', '#37313f', '#f1edf5', '#ccc3d5'],
        light: ['#f3f0f5', '251,249,253', '#e6e0eb', '#302a38', '#5d5268'],
      },
    };
    const surfaceRgb = settings.customSurface
      .slice(1)
      .match(/.{2}/g)
      .map((c) => parseInt(c, 16))
      .join(',');
    const palette = settings.customPalette
      ? [
          settings.customBase,
          surfaceRgb,
          settings.customSoft,
          settings.customText,
          settings.customMuted,
        ]
      : palettes[settings.colorTheme][light ? 'light' : 'dark'];
    if (settings.uiEffectsEnabled) {
      ['base', 'surface-rgb', 'soft', 'text', 'muted'].forEach((key, index) =>
        document.body?.style.setProperty(`--ani-${key}`, palette[index]),
      );
      document.body?.style.setProperty(
        '--ani-accent',
        settings.customPalette
          ? settings.customAccent
          : `hsl(${settings.accentHue} ${settings.accentStrength}% ${light ? 29 : 77}%)`,
      );
      document.body?.style.setProperty(
        '--ani-line',
        light ? '#2a425738' : '#b7c7d330',
      );
    } else
      for (const key of [
        'base',
        'surface-rgb',
        'soft',
        'text',
        'muted',
        'accent',
        'line',
      ])
        document.body?.style.removeProperty(`--ani-${key}`);
    arrangeWatchPage();
    arrangeNavigation();
    syncCollapsibleRegions();
    syncNativeControls();
  }
  applyPageTheme();

  function arrangeWatchPage() {
    const enabled =
      settings.themeEnabled && settings.watchLayout && settings.episodesLayout;
    if (watchLayout && (!watchLayout.root.isConnected || !enabled)) {
      if (watchLayout.anchor.isConnected)
        watchLayout.anchor.replaceWith(watchLayout.season);
      watchLayout.season.hidden = false;
      watchLayout.season.classList.remove('ani-fold-content');
      watchLayout.shelf.remove();
      watchLayout = null;
    }
    if (watchLayout) {
      syncEpisodeFold();
    }
    if (!enabled || watchLayout) return;
    const root = document.querySelector(
      '#BH_background > .container-player:has(> section.player)',
    );
    const title = root?.querySelector(':scope > .anime-title');
    const season = title?.querySelector('.season');
    if (!root || !season) return;
    const anchor = document.createComment('ani-original-episodes');
    season.before(anchor);
    const shelf = document.createElement('section');
    shelf.className = 'ani-episode-shelf';
    shelf.setAttribute('aria-label', '選擇集數');
    const heading = document.createElement('div');
    heading.className = 'ani-episode-heading';
    const label = document.createElement('h2');
    label.textContent = '選擇集數';
    const count = document.createElement('span');
    count.textContent = `${season.querySelectorAll('li').length} 集`;
    heading.append(label, count);
    shelf.append(heading, season);
    title.after(shelf);
    for (const link of season.querySelectorAll('li.playing a'))
      link.setAttribute('aria-current', 'page');
    watchLayout = { root, season, anchor, shelf, heading };
    syncEpisodeFold();
  }

  // 收合僅由使用者開啟；取消功能時，原內容與顯示狀態會復原。
  function syncEpisodeFold() {
    if (!watchLayout) return;
    const { season, heading } = watchLayout;
    const enabled =
      settings.quickCollapse || settings.episodeStyle === 'collapse';
    if (!enabled) {
      watchLayout.foldButton?.remove();
      watchLayout.foldButton = null;
      season.classList.remove('ani-fold-content');
      season.hidden = false;
      return;
    }
    if (watchLayout.foldButton) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'ani-region-toggle ani-section-toggle ani-episode-section-toggle';
    season.id = season.id || 'ani-episode-list';
    button.setAttribute('aria-controls', season.id);
    const refreshLabel = () => {
      const action = season.hidden ? '展開' : '收合';
      button.setAttribute('aria-label', action + '集數');
      button.innerHTML = `<strong>選擇集數 <small>${season.querySelectorAll('li').length} 集</small></strong><span>${action}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    };
    const toggle = () => {
      season.hidden = !season.hidden;
      button.setAttribute('aria-expanded', String(!season.hidden));
      refreshLabel();
    };
    season.classList.add('ani-fold-content');
    season.hidden = settings.episodeStyle === 'collapse';
    button.setAttribute('aria-expanded', String(!season.hidden));
    refreshLabel();
    button.addEventListener('click', toggle);
    heading.append(button);
    watchLayout.foldButton = button;
  }

  function syncCollapsibleRegions() {
    const rearrangeInfo = settings.themeEnabled && settings.infoLayout;
    if (!rearrangeInfo && infoLinkPlacement) {
      const { poster, link, posterAnchor, linkAnchor, rail } =
        infoLinkPlacement;
      posterAnchor.replaceWith(poster);
      linkAnchor.replaceWith(link);
      rail.remove();
      infoLinkPlacement = null;
    } else if (rearrangeInfo && !infoLinkPlacement) {
      const file = document.querySelector('section.data .data-file');
      const poster = file?.querySelector(':scope > .data-img');
      const link = file?.querySelector('.data-intro .link');
      if (poster && link) {
        const posterAnchor = document.createComment('ani-original-poster');
        const linkAnchor = document.createComment('ani-original-info-links');
        const rail = document.createElement('div');
        rail.className = 'ani-info-poster';
        poster.before(posterAnchor);
        link.before(linkAnchor);
        posterAnchor.after(rail);
        rail.append(poster, link);
        infoLinkPlacement = { poster, link, posterAnchor, linkAnchor, rail };
      }
    }
    document.body?.classList.toggle(
      'ani-comments-double',
      settings.commentArrangement === 'double',
    );
    const commentHeader = document.querySelector(
      '.commend-title .commend-segment-wrapper',
    );
    let columnsButton = commentHeader?.querySelector(
      '.ani-comment-columns-toggle',
    );
    if (commentHeader && settings.themeEnabled && settings.commentsLayout) {
      if (!columnsButton) {
        columnsButton = document.createElement('button');
        columnsButton.type = 'button';
        columnsButton.className = 'ani-comment-columns-toggle';
        columnsButton.addEventListener('click', () =>
          updateSetting(
            'commentArrangement',
            settings.commentArrangement === 'double' ? 'single' : 'double',
          ),
        );
        commentHeader.append(columnsButton);
      }
      const double = settings.commentArrangement === 'double';
      columnsButton.textContent = double ? '雙欄' : '單欄';
      columnsButton.setAttribute(
        'aria-label',
        double ? '改為單欄留言' : '改為雙欄留言',
      );
      columnsButton.setAttribute('aria-pressed', String(double));
    } else columnsButton?.remove();
    const regions = {
      info: ['section.data', '作品資訊', 'foldInfo', 'showInfo', 3],
      related: ['.old_list', '相關動畫', 'foldRelated', 'showRelated', 4],
      news: [
        '.animate-theme-list:has(.theme-extend-block)',
        '相關新聞',
        'foldNews',
        'showNews',
        5,
      ],
      comments: ['#w-post-box', '留言', 'foldComments', 'showComments', 6],
    };
    for (const [key, [selector, name, flag, visible, order]] of Object.entries(
      regions,
    )) {
      const target = document.querySelector('#BH_background ' + selector);
      let state = regionFolds.get(key);
      const enabled =
        settings.themeEnabled &&
        (settings.quickCollapse || settings[flag]) &&
        settings[visible] &&
        target;
      if (
        state &&
        (!enabled || state.target !== target || !state.target.isConnected)
      ) {
        state.target.hidden = state.originalHidden;
        state.target.classList.remove('ani-fold-content');
        state.button.remove();
        regionFolds.delete(key);
        state = null;
      }
      if (!enabled || state) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ani-region-toggle ani-region-fold-control';
      if (key !== 'comments') button.classList.add('ani-section-toggle');
      button.style.order = String(order);
      const originalHidden = target.hidden;
      target.id = target.id || 'ani-fold-' + key;
      button.setAttribute('aria-controls', target.id);
      button.setAttribute('aria-expanded', String(!originalHidden));
      const refreshLabel = () => {
        const action = target.hidden ? '展開' : '收合';
        button.setAttribute('aria-label', action + name);
        if (key === 'comments') button.textContent = action + name;
        else
          button.innerHTML = `<strong>${name}</strong><span>${action}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
      };
      refreshLabel();
      button.addEventListener('click', () => {
        target.hidden = !target.hidden;
        button.setAttribute('aria-expanded', String(!target.hidden));
        refreshLabel();
      });
      target.classList.add('ani-fold-content');
      const commentHeader =
        key === 'comments'
          ? document.querySelector(
              '#BH_background .commend-title .commend-segment-wrapper',
            )
          : null;
      if (commentHeader) commentHeader.append(button);
      else target.before(button);
      regionFolds.set(key, { target, button, originalHidden });
    }
  }

  // 原站模式保留實際底色與文字色，切回主題時還原既有行內樣式。
  function syncNativeControls() {
    if (settings.controlStyle !== 'native' || !settings.uiEffectsEnabled) {
      for (const [node, styles] of originalControlStyles) {
        for (const [key, [value, priority]] of Object.entries(styles)) {
          if (value) node.style.setProperty(key, value, priority);
          else node.style.removeProperty(key);
        }
      }
      originalControlStyles.clear();
      return;
    }
    for (const node of originalControlStyles.keys())
      if (!node.isConnected) originalControlStyles.delete(node);
    const body = document.body,
      active = body.classList.contains('ani-ambientlight-ui');
    body.classList.remove('ani-ambientlight-ui');
    const props = ['background-color', 'color', 'border-color'];
    for (const node of document.querySelectorAll(
      '.anime_search-input,.anime_search-input input,.anime_search-icon,.anime_name>button,.ani-episode-shelf .season a,.subtitle button,.user-score-more',
    )) {
      if (originalControlStyles.has(node)) continue;
      const saved = Object.fromEntries(
        props.map((key) => [
          key,
          [
            node.style.getPropertyValue(key),
            node.style.getPropertyPriority(key),
          ],
        ]),
      );
      const computed = getComputedStyle(node),
        colors = props.map((key) => computed.getPropertyValue(key));
      originalControlStyles.set(node, saved);
      props.forEach((key, index) =>
        node.style.setProperty(key, colors[index], 'important'),
      );
    }
    if (active) body.classList.add('ani-ambientlight-ui');
  }

  function arrangeNavigation() {
    if (
      navLayout &&
      (!settings.themeEnabled ||
        !settings.navLayout ||
        !navLayout.root.isConnected)
    ) {
      for (const item of navLayout.items)
        if (item.anchor.isConnected) item.anchor.replaceWith(item.node);
      navLayout.more.remove();
      navLayout = null;
    }
    if (!settings.themeEnabled || !settings.navLayout || navLayout) return;
    const root = document.querySelector('.mainmenu > .container-player > ul');
    if (!root) return;
    const utilities = [...root.children].filter((item) => {
      const href = item.querySelector(':scope > a')?.getAttribute('href') || '';
      return /redeem\.php|animeAgeValidate\.php|forms\.gle|apps\.apple\.com|dynamic_link_anime/.test(
        href,
      );
    });
    if (!utilities.length) return;
    const more = document.createElement('li');
    more.className = 'ani-nav-more';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML =
      '更多<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const menu = document.createElement('ul');
    menu.className = 'ani-nav-more-menu';
    menu.hidden = true;
    const items = utilities.map((node) => {
      const anchor = document.createComment('ani-original-navigation');
      node.before(anchor);
      menu.append(node);
      return { node, anchor };
    });
    more.append(button, menu);
    root.append(more);
    button.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
      button.setAttribute('aria-expanded', String(!menu.hidden));
    });
    navLayout = { root, more, menu, button, items };
  }
  document.addEventListener('pointerdown', (event) => {
    if (navLayout && !navLayout.more.contains(event.target)) {
      navLayout.menu.hidden = true;
      navLayout.button.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLayout && !navLayout.menu.hidden) {
      navLayout.menu.hidden = true;
      navLayout.button.setAttribute('aria-expanded', 'false');
      navLayout.button.focus();
    }
  });

  function enhanceSiteControls() {
    for (const item of document.querySelectorAll(
      '.sky .member > li:has(> .tooltip)',
    )) {
      const link = item.querySelector(':scope > a'),
        label = item.querySelector(':scope > .tooltip')?.textContent;
      if (link && label && !link.getAttribute('aria-label'))
        link.setAttribute('aria-label', label);
    }
    for (const row of document.querySelectorAll(
      '#sub_list .sub-list-li:not([data-ani-keyboard-row])',
    )) {
      row.dataset.aniKeyboardRow = 'true';
      row.tabIndex = 0;
    }
    // Follow the site's active tab rather than replacing its click handlers.
    // Only opt into panel layout when both a native tab and its target exist.
    for (const content of document.querySelectorAll(
      '.subtitle .ani-tab-content',
    )) {
      if (content.dataset.aniTabsReady) continue;
      const tabs = content.parentElement?.querySelector('.ani-tabs');
      if (!tabs) continue;
      const syncTabs = () => {
        const id = tabs
          .querySelector('.ani-tabs-link.is-active')
          ?.getAttribute('href')
          ?.slice(1);
        const panels = [
          ...content.querySelectorAll(':scope > .ani-tab-content__item'),
        ];
        const selected = panels.find((panel) => panel.id === id);
        for (const panel of panels) {
          if (selected) panel.dataset.aniTabActive = String(panel === selected);
          else delete panel.dataset.aniTabActive;
        }
      };
      syncTabs();
      const tabObserver = new MutationObserver(syncTabs);
      tabObserver.observe(tabs, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'href'],
      });
      content.dataset.aniTabsReady = 'true';
    }
    if (settings.themeEnabled && imageObserver) {
      for (const image of document.querySelectorAll(
        '#blockVideoInSeason .anime-blocker img[data-src]',
      )) {
        if (image.dataset.aniImageObserved) continue;
        image.dataset.aniImageObserved = 'true';
        imageObserver.observe(image);
      }
    }
    const menu = document.querySelector('.mainmenu .menu_btn.toggle');
    if (menu && !menu.dataset.aniKeyboardReady) {
      menu.dataset.aniKeyboardReady = 'true';
      menu.setAttribute('role', 'button');
      menu.setAttribute('tabindex', '0');
      menu.setAttribute('aria-label', '開啟導覽選單');
      const syncMenu = () => {
        const expanded = menu.classList.contains('active');
        menu.setAttribute('aria-expanded', String(expanded));
        menu.setAttribute(
          'aria-label',
          expanded ? '關閉導覽選單' : '開啟導覽選單',
        );
      };
      menu.addEventListener('click', () => setTimeout(syncMenu, 0));
      menu.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        menu.click();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !menu.classList.contains('active'))
          return;
        menu.click();
        menu.focus();
      });
      syncMenu();
    }
    const search = document.querySelector('.anime_search-icon');
    if (search && !search.dataset.aniKeyboardReady) {
      search.dataset.aniKeyboardReady = 'true';
      search.setAttribute('role', 'button');
      search.setAttribute('tabindex', '0');
      search.setAttribute('aria-label', '搜尋動畫');
      search.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        search.click();
      });
    }
    for (const link of document.querySelectorAll('.mainmenu li.is-active a')) {
      link.setAttribute('aria-current', 'page');
    }
  }

  function saveEnabled(enabled) {
    updateSetting('enabled', enabled);
  }

  function updateSetting(key, value) {
    updateSettings(options.normalize({ [key]: value }, settings));
  }

  // ── 三、設定儲存與觀影選單 ──
  let layoutChangeId = 0;
  function updateSettings(values) {
    const changingLayout =
      values.showDanmu !== settings.showDanmu ||
      values.focusMode !== settings.focusMode;
    const tools = changingLayout
      ? document.querySelector('.ani-watch-tools')
      : null;
    const toolsTop = tools?.getBoundingClientRect().top;
    const changeId = ++layoutChangeId;
    Object.assign(settings, values);
    applyPageTheme();
    active?.applySettings();
    active?.refresh();
    syncSettingsPanel();
    // 保住剛按下的觀看工具位置，避免原站重新計算播放器後整頁突然滑動。
    if (
      tools &&
      toolsTop >= 0 &&
      toolsTop < window.innerHeight &&
      window.scrollY > 0
    ) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (changeId !== layoutChangeId || !tools.isConnected) return;
          const delta = tools.getBoundingClientRect().top - toolsTop;
          if (Math.abs(delta) > 1)
            window.scrollBy({ top: delta, behavior: 'instant' });
        }),
      );
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => storage?.set({ ...settings }), 350);
  }

  function syncSettingsPanel() {
    if (!settingsPanel) return;
    options.sync(settingsPanel, settings);
    const fontLabel = settingsPanel.querySelector('[data-font-status]');
    if (fontLabel) fontLabel.textContent = fontStatus;
  }

  function mountSettings() {
    const header = document.querySelector('.top_sky .sky .container-player');
    if (!header || document.querySelector('.ani-view-settings')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ani-view-settings';
    button.setAttribute('aria-label', '觀影設定');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m4 4v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span>觀影設定</span>';
    const danmuButton = document.createElement('button');
    danmuButton.type = 'button';
    danmuButton.className = 'ani-danmu-toggle';
    danmuButton.textContent = settings.showDanmu ? '收合彈幕' : '展開彈幕';
    danmuButton.setAttribute('aria-expanded', String(settings.showDanmu));
    danmuButton.addEventListener('click', () =>
      updateSetting('showDanmu', !settings.showDanmu),
    );
    const watchTools = document.createElement('div');
    watchTools.className = 'ani-watch-tools';
    watchTools.setAttribute('aria-label', '觀看工具');
    watchTools.append(danmuButton);
    const focusButton = document.createElement('button');
    focusButton.type = 'button';
    focusButton.className = 'ani-focus-toggle';
    focusButton.textContent = settings.focusMode ? '結束專注' : '專注觀看';
    focusButton.setAttribute('aria-pressed', String(settings.focusMode));
    focusButton.addEventListener('click', () =>
      updateSetting('focusMode', !settings.focusMode),
    );
    watchTools.append(focusButton);
    const player = document.querySelector('#BH_background section.player');
    if (player) player.after(watchTools);
    const panel = document.createElement('section');
    panel.id = 'ani-view-settings-panel';
    panel.className = 'ani-view-settings-panel';
    panel.setAttribute('aria-label', '觀影設定');
    panel.hidden = true;
    button.setAttribute('aria-controls', panel.id);
    panel.innerHTML =
      '<div class="ani-settings-heading"><h2>觀影設定</h2><div class="ani-settings-header-actions"><div data-editor-opacity-slot></div><button type="button" class="ani-settings-close" aria-label="關閉觀影設定"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" fill="none"/></svg></button></div></div>' +
      '<div class="ani-settings-scroll"><div data-settings-overview><label class="ani-settings-switch"><span>動態環境光</span><input data-setting="enabled" type="checkbox" role="switch"></label>' +
      '<label class="ani-settings-switch"><span>主題配色</span><input data-setting="uiEffectsEnabled" type="checkbox" role="switch"></label>' +
      '<label class="ani-settings-switch"><span>版型重排</span><input data-setting="themeEnabled" type="checkbox" role="switch"></label></div>' +
      options.controlsHTML() +
      '<p class="ani-settings-tip" data-settings-overview>變更會自動儲存。</p></div>';
    const close = () => {
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    };
    button.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (open) {
        const detail = panel.querySelector('[data-settings-detail]');
        (detail && !detail.hidden
          ? panel.querySelector('[data-settings-back]')
          : panel.querySelector('input')
        )?.focus();
      }
    });
    panel.querySelector('.ani-settings-close').addEventListener('click', () => {
      close();
      button.focus();
    });
    // 不透明度放在固定頁首，所有分類都能直接調整。
    const opacityRow = panel
      .querySelector('[data-setting="settingsOpacity"]')
      .closest('.ani-setting-row');
    opacityRow.classList.add('ani-settings-opacity');
    panel.querySelector('[data-editor-opacity-slot]').replaceWith(opacityRow);
    options.wire(panel, () => settings, updateSettings);
    document.addEventListener('pointerdown', (event) => {
      if (
        !panel.hidden &&
        !panel.contains(event.target) &&
        !button.contains(event.target)
      )
        close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !panel.hidden) {
        close();
        button.focus();
      }
    });
    header.append(button);
    document.body.append(panel);
    settingsPanel = panel;
    syncSettingsPanel();
  }

  // ── 四、播放器生命週期：一個影片只建立一組渲染資源 ──
  function attach(video) {
    const player =
      video.closest('#ani_video, .video-js') || video.parentElement;
    const host = video.closest('.videoframe') || player?.parentElement;
    const stage = host?.closest('section.player');
    const originalClip = video.style.clipPath;
    const controlBar = player?.querySelector('.vjs-control-bar');
    if (!player || !host || !document.body) return null;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'vjs-control ani-ambientlight-toggle';
    toggle.setAttribute('aria-label', '切換環境光');
    toggle.innerHTML =
      '<svg class="ani-ambientlight-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m13-5v4a1 1 0 0 1-1 1h-4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    const controlsEnd = controlBar?.querySelector('.vjs-fullscreen-control');
    if (controlBar)
      controlBar.insertBefore(
        toggle,
        controlsEnd?.parentElement === controlBar ? controlsEnd : null,
      );
    else {
      toggle.classList.add('ani-ambientlight-floating-toggle');
      host.append(toggle);
    }
    toggle.addEventListener('click', () => saveEnabled(!settings.enabled));

    host.classList.add('ani-ambientlight-host');

    let pageGlow = document.createElement('canvas');
    pageGlow.className = 'ani-ambientlight-page-glow';
    pageGlow.width = 960;
    pageGlow.height = 540;
    pageGlow.setAttribute('aria-hidden', 'true');
    document.body.prepend(pageGlow);

    const sample = document.createElement('canvas');
    sample.width = SAMPLE_WIDTH;
    sample.height = SAMPLE_HEIGHT;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    let renderer = globalThis.AniAmbientRenderer?.create(
      pageGlow,
      settings.renderer === 'canvas',
    );
    let rendererPreference = settings.renderer;
    function useCanvasFallback() {
      renderer?.destroy();
      const replacement = pageGlow.cloneNode(false);
      pageGlow.replaceWith(replacement);
      pageGlow = replacement;
      renderer = globalThis.AniAmbientRenderer?.create(pageGlow, true);
    }
    if (!renderer) useCanvasFallback();
    let stopped = false;
    let failed = false;
    let frameHandle = null;
    let lastDraw = 0;
    let effectiveFps = 60;
    let renderScale = 1;
    let lastMetrics = 0;
    let meanCost = 0;
    let lastPresentedCount = -1;
    let fallbackWithoutFrameCount = false;
    let slowFrames = 0;
    let lastRecovery = 0;
    let lastCropCheck = 0;
    let lastColorSample = 0;
    let sampleHandle = null;
    let samplingFailed = false;
    let lastVideoFrame = 0;
    let geometryHandle = null;
    let crop = { left: 0, top: 0, right: 0, bottom: 0 };
    let pendingCrop = null;
    let cropVotes = 0;
    let hasFrame = false;
    let previousColor = null;
    let notice = null;

    function isAd() {
      return (
        player.classList.contains('vjs-ad-playing') ||
        player.classList.contains('vjs-anigamer-ad-playing') ||
        player.classList.contains('vjs-anigamer-m3u8-ad-playing')
      );
    }

    function showNotice(message) {
      notice?.remove();
      notice = document.createElement('div');
      notice.className = 'ani-ambientlight-notice';
      notice.textContent = message;
      player.append(notice);
      setTimeout(() => notice?.remove(), 6500);
    }

    function shouldShow() {
      return (
        settings.enabled &&
        !failed &&
        !document.hidden &&
        video.duration > 60 &&
        !isAd() &&
        !document.fullscreenElement?.contains(player)
      );
    }

    function applySettings() {
      if (rendererPreference !== settings.renderer) {
        rendererPreference = settings.renderer;
        renderer?.destroy();
        const replacement = pageGlow.cloneNode(false);
        pageGlow.replaceWith(replacement);
        pageGlow = replacement;
        renderer = globalThis.AniAmbientRenderer?.create(
          pageGlow,
          settings.renderer === 'canvas',
        );
        if (!renderer) useCanvasFallback();
        hasFrame = false;
      }
      // The page redesign is opt-in and its precise grid is used only when
      // the two native columns exist. Ambilight itself survives either change.
      const nativeMode =
        host.classList.contains('vjs-fullwindow') ||
        host.querySelector('.video.fullwindow') ||
        document.body.classList.contains('fullscreen') ||
        document.fullscreenElement;
      document.body.classList.toggle(
        'ani-native-player-mode',
        Boolean(nativeMode),
      );
      document.body.classList.toggle(
        'ani-theater-layout',
        Boolean(
          settings.themeEnabled &&
            settings.playerLayout === 'columns' &&
            !nativeMode &&
            stage &&
            host.matches('.videoframe') &&
            host.parentElement === stage &&
            stage.querySelector(':scope > .subtitle'),
        ),
      );
      document.body.classList.toggle(
        'ani-ambientlight-active',
        Boolean(settings.enabled),
      );
      document.body.classList.toggle(
        'ani-hide-sidebar-ads',
        Boolean(settings.hideSidebarAds),
      );
      pageGlow.style.opacity =
        shouldShow() && Number(settings.intensity) > 0 ? '1' : '0';
      if (!shouldShow() || !settings.coverBars) {
        video.style.clipPath = originalClip;
        host.classList.remove('ani-bar-coverage');
      }
      pageGlow.style.filter = 'none';
      pageGlow.style.transitionDuration = matchMedia(
        '(prefers-reduced-motion:reduce)',
      ).matches
        ? '0s'
        : `${settings.fadeIn / 1000}s`;
      host.style.setProperty(
        '--ani-glow-opacity',
        String(clamp(Number(settings.intensity) || 0, 0, 100) / 100),
      );
      host.style.setProperty(
        '--ani-glow-radius',
        `${clamp(Number(settings.radius) || 0, 10, 100)}px`,
      );
      host.style.setProperty(
        '--ani-glow-saturation',
        String(clamp(Number(settings.saturation) || 100, 100, 220) / 100),
      );
      host.classList.toggle('ani-ambientlight-hidden', !shouldShow());
      pageGlow.classList.toggle('ani-ambientlight-hidden', !shouldShow());
      document.body.classList.toggle(
        'ani-ambientlight-page',
        Boolean(settings.themeEnabled),
      );
      stage?.classList.toggle(
        'ani-ambientlight-stage',
        Boolean(settings.themeEnabled),
      );
      toggle.setAttribute('aria-pressed', String(Boolean(settings.enabled)));
      toggle.title = failed
        ? '無法讀取此影片畫面'
        : settings.enabled
          ? '關閉環境光'
          : '開啟環境光';
      if (settings.enabled && !video.paused) schedule();
    }

    // ── 五、黑條與場景色取樣：不改動原站的控制項 ──
    function updateCrop(now, data) {
      if (!settings.cropBars && !settings.coverBars) {
        crop = { left: 0, top: 0, right: 0, bottom: 0 };
        return;
      }
      if (now - lastCropCheck < 300) return;
      lastCropCheck = now;
      const candidate = globalThis.AniAmbientBlackBars?.detect(
        data,
        SAMPLE_WIDTH,
        SAMPLE_HEIGHT,
        settings.barThreshold,
      ) || { left: 0, top: 0, right: 0, bottom: 0 };
      const same =
        pendingCrop &&
        Object.keys(candidate).every(
          (key) => candidate[key] === pendingCrop[key],
        );
      cropVotes = same ? cropVotes + 1 : 1;
      pendingCrop = candidate;
      if (!Object.values(candidate).some(Boolean)) crop = candidate;
      else if (cropVotes >= 2) crop = candidate;
    }

    function averageEdges(data) {
      const sides = [[], [], [], []];
      const left = crop.left + 1,
        right = SAMPLE_WIDTH - crop.right - 2;
      const top = crop.top + 1,
        bottom = SAMPLE_HEIGHT - crop.bottom - 2;
      for (let x = left; x <= right; x += 2) {
        sides[0].push((top * SAMPLE_WIDTH + x) * 4);
        sides[2].push((bottom * SAMPLE_WIDTH + x) * 4);
      }
      for (let y = top; y <= bottom; y += 2) {
        sides[1].push((y * SAMPLE_WIDTH + right) * 4);
        sides[3].push((y * SAMPLE_WIDTH + left) * 4);
      }
      const colors = sides.map((positions) => {
        const channels = [0, 0, 0];
        let total = 0;
        for (const i of positions) {
          const weight =
            0.35 +
            Math.sqrt(
              (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) /
                255,
            );
          total += weight;
          for (let c = 0; c < 3; c++) channels[c] += data[i + c] * weight;
        }
        return channels.map((value) => Math.round(value / Math.max(total, 1)));
      });
      ['top', 'right', 'bottom', 'left'].forEach((side, index) =>
        document.body.style.setProperty(
          `--ani-scene-${side}-rgb`,
          colors[index].join(','),
        ),
      );
      return [0, 1, 2].map(
        (channel) => colors.reduce((sum, color) => sum + color[channel], 0) / 4,
      );
    }

    function videoIsVisible() {
      const rect = video.getBoundingClientRect();
      return (
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        rect.right > 0 &&
        rect.left < innerWidth
      );
    }

    // ── 六、畫面同步：依實際影片矩形對齊光暈 ──
    function paintPageFrame() {
      const r = video.getBoundingClientRect();
      if (r.width < 160 || r.height < 90) return;
      if (!settings.adaptiveQuality) {
        renderScale = 1;
        effectiveFps = 60;
      }
      const width = Math.round(
        Math.min(innerWidth, settings.renderWidth) * renderScale,
      );
      const height = Math.round((width * innerHeight) / innerWidth);
      if (pageGlow.width !== width || pageGlow.height !== height) {
        pageGlow.width = width;
        pageGlow.height = height;
      }
      pageGlow.dataset.renderer = renderer?.kind || 'unavailable';
      pageGlow.dataset.acceleration = renderer?.acceleration || 'unknown';
      const scale = Math.min(
        r.width / video.videoWidth,
        r.height / video.videoHeight,
      );
      const vw = video.videoWidth * scale,
        vh = video.videoHeight * scale;
      const trim = {
        left: Math.min(0.4, crop.left / SAMPLE_WIDTH + settings.cropX / 100),
        right: Math.min(0.4, crop.right / SAMPLE_WIDTH + settings.cropX / 100),
        top: Math.min(0.35, crop.top / SAMPLE_HEIGHT + settings.cropY / 100),
        bottom: Math.min(
          0.35,
          crop.bottom / SAMPLE_HEIGHT + settings.cropY / 100,
        ),
      };
      const left = r.left + (r.width - vw) / 2 + vw * trim.left;
      const top = r.top + (r.height - vh) / 2 + vh * trim.top;
      if (settings.coverBars && shouldShow()) {
        const actual = {
          left: (r.width - vw) / 2 + (vw * crop.left) / SAMPLE_WIDTH,
          right: (r.width - vw) / 2 + (vw * crop.right) / SAMPLE_WIDTH,
          top: (r.height - vh) / 2 + (vh * crop.top) / SAMPLE_HEIGHT,
          bottom: (r.height - vh) / 2 + (vh * crop.bottom) / SAMPLE_HEIGHT,
        };
        const covered = Object.values(actual).some((v) => v > 1);
        host.classList.toggle('ani-bar-coverage', covered);
        const clip = covered
          ? `inset(${actual.top}px ${actual.right}px ${actual.bottom}px ${actual.left}px)`
          : originalClip;
        if (video.style.clipPath !== clip) video.style.clipPath = clip;
      }
      const ratio = width / innerWidth;
      const bounds = [
        left * ratio,
        top * ratio,
        vw * (1 - trim.left - trim.right) * ratio,
        vh * (1 - trim.top - trim.bottom) * ratio,
      ];
      const sourceCrop = [
        trim.left,
        trim.top,
        1 - trim.left - trim.right,
        1 - trim.top - trim.bottom,
      ];
      if (renderer && !renderer.draw(video, bounds, sourceCrop, settings)) {
        useCanvasFallback();
        applySettings();
        renderer?.draw(video, bounds, sourceCrop, settings);
      }
    }

    function draw(now) {
      if (
        !shouldShow() ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !video.videoWidth
      )
        return;
      const fps =
        settings.fps === 0
          ? Math.min(effectiveFps, fallbackWithoutFrameCount ? 30 : Infinity)
          : Math.min(clamp(Number(settings.fps), 5, 60), effectiveFps);
      // Allow timestamp jitter so 24/30fps videos are not accidentally halved.
      if (
        (settings.fps !== 0 ||
          effectiveFps < 60 ||
          fallbackWithoutFrameCount) &&
        now - lastDraw < 1000 / fps - 2
      )
        return;
      lastDraw = now;

      try {
        const started = performance.now();
        // Submit the current video texture before the occasional CPU readback.
        paintPageFrame();
        const renderCost = performance.now() - started;
        // Native theme colors need no video readback when scene tints are off.
        // Black-bar detection runs less often than the frame renderer.
        const needsSceneColor =
          settings.uiEffectsEnabled &&
          (settings.headerTint > 0 || settings.panelTint > 0);
        if (
          !samplingFailed &&
          (needsSceneColor || settings.cropBars || settings.coverBars) &&
          sampleHandle === null &&
          (now - lastColorSample >= (needsSceneColor ? 250 : 500) || !hasFrame)
        ) {
          lastColorSample = now;
          // A separate task keeps synchronous pixel readback out of the frame submission.
          sampleHandle = setTimeout(() => {
            sampleHandle = null;
            if (stopped || !shouldShow() || video.readyState < 2) return;
            try {
              sampleCtx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
              const sampled = sampleCtx.getImageData(
                0,
                0,
                SAMPLE_WIDTH,
                SAMPLE_HEIGHT,
              );
              updateCrop(performance.now(), sampled.data);
              if (needsSceneColor) {
                previousColor = averageEdges(sampled.data);
                document.body.style.setProperty(
                  '--ani-scene-rgb',
                  previousColor.join(','),
                );
              }
            } catch (error) {
              samplingFailed = true;
              console.warn(
                '[動畫瘋環境光] 此影片無法讀取黑條取樣，已停用此影片的取樣',
                error,
              );
            }
          }, 0);
        }
        hasFrame = true;

        const cost = performance.now() - started;
        meanCost = meanCost ? meanCost * 0.9 + cost * 0.1 : cost;
        const frameCost = Math.max(renderCost, renderer?.gpuCost || 0);
        slowFrames =
          frameCost > 8 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
        if (settings.adaptiveQuality && slowFrames >= 4) {
          // Preserve frame cadence on GPU: reduce pixels before frame rate.
          const minScale = Math.min(
            1,
            settings.renderFloor / Math.min(innerWidth, settings.renderWidth),
          );
          if (renderer?.kind === 'gpu')
            renderScale = Math.max(minScale, renderScale * 0.8);
          else if (renderScale > minScale)
            renderScale = Math.max(minScale, renderScale * 0.8);
          else effectiveFps = Math.max(15, Math.floor(effectiveFps * 0.8));
          slowFrames = 0;
          lastRecovery = now;
        } else if (
          settings.adaptiveQuality &&
          now - lastRecovery > 10000 &&
          frameCost < 4 &&
          (effectiveFps < 60 || renderScale < 1)
        ) {
          if (effectiveFps < 60) effectiveFps = Math.min(60, effectiveFps + 5);
          else renderScale = Math.min(1, renderScale + 0.1);
          lastRecovery = now;
        }
        if (now - lastMetrics > 1000) {
          lastMetrics = now;
          pageGlow.dataset.drawCost = meanCost.toFixed(1);
          pageGlow.dataset.fpsLimit = String(
            Math.min(settings.fps || effectiveFps, effectiveFps),
          );
          const label = settingsPanel?.querySelector('[data-render-status]');
          if (label) {
            const acceleration =
              renderer?.acceleration === 'software'
                ? '軟體渲染'
                : renderer?.acceleration === 'hardware'
                  ? '硬體加速'
                  : '加速狀態未公開';
            label.textContent = `${renderer?.kind === 'gpu' ? 'WebGL 2' : 'Canvas 相容模式'} · ${acceleration} · ${pageGlow.width} px · ${settings.fps === 0 && effectiveFps === 60 ? '跟隨影片影格' : `上限 ${Math.min(settings.fps || effectiveFps, effectiveFps)} fps`} · 提交 ${meanCost.toFixed(1)} ms${renderer?.kind === 'canvas' ? '。延展效果為相容近似。' : ''}`;
          }
        }
      } catch (error) {
        failed = true;
        applySettings();
        showNotice('此影片不允許讀取畫面，環境光已暫停。');
        console.warn('[動畫瘋環境光] 無法讀取影片畫面', error);
      }
    }

    // ── 七、影格排程：先預約下一影格，避免工作完成後才排程漏幀 ──
    function onFrame(now, metadata) {
      frameHandle = null;
      if (stopped) return;
      if (!metadata) {
        const count =
          video.getVideoPlaybackQuality?.().totalVideoFrames ??
          video.webkitDecodedFrameCount;
        fallbackWithoutFrameCount = !(Number.isFinite(count) && count > 0);
        if (Number.isFinite(count) && count > 0) {
          if (count === lastPresentedCount) {
            schedule();
            return;
          }
          lastPresentedCount = count;
        }
      } else fallbackWithoutFrameCount = false;
      schedule();
      if (metadata?.presentedFrames) {
        if (lastVideoFrame && metadata.presentedFrames - lastVideoFrame > 1)
          slowFrames += 2;
        lastVideoFrame = metadata.presentedFrames;
      }
      draw(now);
    }

    function schedule() {
      if (
        stopped ||
        !shouldShow() ||
        !videoIsVisible() ||
        video.paused ||
        frameHandle !== null
      )
        return;
      if (video.requestVideoFrameCallback) {
        frameHandle = video.requestVideoFrameCallback(onFrame);
      } else {
        frameHandle = requestAnimationFrame(onFrame);
      }
    }

    function sampleOnce() {
      if (videoIsVisible()) {
        hasFrame = false;
        lastDraw = 0;
        draw(performance.now());
      }
      applySettings();
    }

    function onGeometryChange() {
      if (geometryHandle !== null) return;
      geometryHandle = requestAnimationFrame(() => {
        geometryHandle = null;
        sampleOnce();
      });
    }

    const onStateChange = () => {
      applySettings();
      if (video.paused) sampleOnce();
    };
    const onLoadStart = () => {
      failed = false;
      hasFrame = false;
      previousColor = null;
      lastPresentedCount = -1;
      pendingCrop = null;
      cropVotes = 0;
      crop = { left: 0, top: 0, right: 0, bottom: 0 };
      renderer?.clear();
      applySettings();
    };
    video.addEventListener('play', onStateChange);
    video.addEventListener('pause', onStateChange);
    video.addEventListener('ended', onStateChange);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('seeked', sampleOnce);
    video.addEventListener('loadeddata', sampleOnce);
    window.addEventListener('resize', onGeometryChange);
    window.addEventListener('scroll', onGeometryChange, { passive: true });
    document.addEventListener('visibilitychange', applySettings);
    document.addEventListener('fullscreenchange', applySettings);
    // Our own host classes must not retrigger a native-state observer. Compare
    // only site-owned flags, otherwise paused/verification pages can loop.
    const nativeClassSignature = () =>
      [
        [...player.classList]
          .filter(
            (name) =>
              !name.startsWith('ani-ambientlight-') &&
              name !== 'ani-bar-coverage',
          )
          .join(' '),
        host.classList.contains('vjs-fullwindow'),
        host.querySelector(':scope > .video')?.classList.contains('fullwindow'),
      ].join('|');
    let lastNativeClassSignature = nativeClassSignature();
    const classObserver = new MutationObserver(() => {
      const signature = nativeClassSignature();
      if (signature === lastNativeClassSignature) return;
      lastNativeClassSignature = signature;
      applySettings();
    });
    classObserver.observe(player, {
      attributes: true,
      attributeFilter: ['class'],
    });
    if (host !== player)
      classObserver.observe(host, {
        attributes: true,
        attributeFilter: ['class'],
      });
    const nativeVideoBox = host.querySelector(':scope > .video');
    if (nativeVideoBox)
      classObserver.observe(nativeVideoBox, {
        attributes: true,
        attributeFilter: ['class'],
      });
    // Let the site's resize handlers update native player geometry after a
    // sidebar/layout change. Width-only comparison prevents resize feedback.
    let lastHostWidth = 0,
      nativeResizeHandle = null;
    const sizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver((entries) => {
            if (
              stage &&
              document.body.classList.contains('ani-theater-layout')
            ) {
              const height = host
                .querySelector(':scope > .video')
                ?.getBoundingClientRect().height;
              if (height > 0)
                stage.style.setProperty('--ani-player-height', `${height}px`);
            }
            const width = Math.round(entries[0].contentRect.width);
            if (width === lastHostWidth) return;
            lastHostWidth = width;
            if (nativeResizeHandle !== null)
              cancelAnimationFrame(nativeResizeHandle);
            nativeResizeHandle = requestAnimationFrame(() => {
              nativeResizeHandle = null;
              if (!stopped) window.dispatchEvent(new Event('resize'));
            });
          })
        : null;
    sizeObserver?.observe(host);
    applySettings();

    return {
      video,
      player,
      host,
      toggle,
      applySettings,
      refresh: sampleOnce,
      stop() {
        stopped = true;
        if (sampleHandle !== null) clearTimeout(sampleHandle);
        if (frameHandle !== null) {
          if (video.cancelVideoFrameCallback)
            video.cancelVideoFrameCallback(frameHandle);
          else cancelAnimationFrame(frameHandle);
        }
        classObserver.disconnect();
        sizeObserver?.disconnect();
        if (nativeResizeHandle !== null)
          cancelAnimationFrame(nativeResizeHandle);
        video.removeEventListener('play', onStateChange);
        video.removeEventListener('pause', onStateChange);
        video.removeEventListener('ended', onStateChange);
        video.removeEventListener('loadstart', onLoadStart);
        video.removeEventListener('seeked', sampleOnce);
        video.removeEventListener('loadeddata', sampleOnce);
        if (geometryHandle !== null) cancelAnimationFrame(geometryHandle);
        window.removeEventListener('resize', onGeometryChange);
        window.removeEventListener('scroll', onGeometryChange);
        document.removeEventListener('visibilitychange', applySettings);
        document.removeEventListener('fullscreenchange', applySettings);
        notice?.remove();
        video.style.clipPath = originalClip;
        host.classList.remove('ani-bar-coverage');
        toggle.remove();
        document.body.classList.remove('ani-theater-layout');
        document.body.classList.remove('ani-ambientlight-active');
        pageGlow.remove();
        renderer?.destroy();
        applyPageTheme();
        host.classList.remove(
          'ani-ambientlight-host',
          'ani-ambientlight-hidden',
        );
        stage?.classList.remove('ani-ambientlight-stage');
      },
    };
  }

  // ── 八、換集與頁面變動：解除舊監聽及資源後再綁定 ──
  function bindPlayer() {
    mountSettings();
    arrangeWatchPage();
    arrangeNavigation();
    syncCollapsibleRegions();
    enhanceSiteControls();
    const video =
      [...document.querySelectorAll(VIDEO_SELECTOR)].find(
        (candidate) =>
          candidate.isConnected &&
          candidate.closest('#ani_video, .video-js, section.player'),
      ) || null;
    if (
      active &&
      active.video === video &&
      active.video.isConnected &&
      active.toggle.isConnected
    )
      return;
    active?.stop();
    active = video ? attach(video) : null;
  }

  const observer = new MutationObserver((records) => {
    // Native progress labels and in-video comments change constantly. They do
    // not require scanning the entire page or rebuilding site controls.
    const structural = records.some((record) => {
      const target =
        record.target.nodeType === 1
          ? record.target
          : record.target.parentElement;
      if (target?.closest('.ani-view-settings-panel')) return false;
      if (!target?.closest('.video-js,.videoframe')) return true;
      return [...record.addedNodes, ...record.removedNodes].some(
        (node) =>
          node.nodeType === 1 &&
          (node.matches('video') || node.querySelector('video')),
      );
    });
    if (!structural) return;
    clearTimeout(rebindTimer);
    rebindTimer = setTimeout(bindPlayer, 180);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  bindPlayer();
})();

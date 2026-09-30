(() => {
  'use strict';

  // ── 一、設定預設值與欄位規格 ──
  const defaults = Object.freeze({
    enabled: true,
    uiEffectsEnabled: true,
    themeEnabled: true,
    appearance: 'dark',
    fontFamily: 'system',
    method: 'project',
    intensity: 95,
    radius: 80,
    blur: 20,
    detail: 90,
    saturation: 100,
    contrast: 100,
    backgroundBrightness: 100,
    smoothing: 0,
    fadeIn: 100,
    headerOpacity: 0,
    headerTint: 0,
    panelOpacity: 0,
    panelTint: 0,
    infoOpacity: 80,
    relatedOpacity: 85,
    newsOpacity: 85,
    commentOpacity: 85,
    renderWidth: 960,
    renderFloor: 640,
    adaptiveQuality: true,
    fps: 0,
    renderer: 'auto',
    watchWidth: 1720,
    projectionDepth: 50,
    radialRoundness: 50,
    contourStrength: 50,
    swirlAmount: 35,
    reflectCompression: 50,
    diffusionDepth: 50,
    bandWidth: 50,
    stretchDepth: 50,
    customWatchWidth: false,
    watchLayout: true,
    navLayout: true,
    playerLayout: 'native',
    episodesLayout: true,
    infoLayout: true,
    relatedLayout: true,
    newsLayout: true,
    commentsLayout: true,
    colorTheme: 'slate',
    customPalette: false,
    customBase: '#0b1017',
    customSurface: '#131d27',
    customSoft: '#202d38',
    customText: '#f2f5f8',
    customMuted: '#b7c7d3',
    customAccent: '#9fe8ed',
    footerGlow: true,
    textSize: 16,
    textLeading: 175,
    cornerRadius: 12,
    sectionSpacing: 28,
    accentHue: 185,
    accentStrength: 65,
    showInfo: true,
    showRelated: true,
    showNews: true,
    showComments: true,
    quickCollapse: true,
    focusMode: false,
    hideDanmuScrollbar: true,
    buttonOpacity: 80,
    controlStyle: 'theme',
    customFontName: '',
    customFontGoogle: true,
    danmuFontEnabled: false,
    commentWidth: 880,
    commentArrangement: 'single',
    settingsOpacity: 70,
    collapsedPlayerSpacing: 24,
    foldInfo: false,
    foldRelated: false,
    foldNews: false,
    foldComments: false,
    episodeStyle: 'wrap',
    commentDensity: 'comfortable',
    commentImageWidth: 440,
    danmuTextSize: 13,
    danmuRowSpacing: 10,
    danmuWidth: 340,
    showDanmu: true,
    cropBars: true,
    coverBars: false,
    barThreshold: 20,
    cropX: 0,
    cropY: 0,
    hideSidebarAds: true,
  });
  const themeFields = [
    [
      'controlStyle',
      '按鈕與搜尋欄底色',
      'select',
      [
        ['theme', '跟隨主題'],
        ['transparent', '讓光暈透出'],
        ['native', '使用原站'],
      ],
    ],
    ['customFontName', '自訂字體名稱', 'text'],
    ['customFontGoogle', '從 Google Fonts 載入自訂字體', 'boolean'],
    ['danmuFontEnabled', '也套用到播放器文字彈幕', 'boolean'],
    ['settingsOpacity', '選單不透明度', 0, 100, 5, '%'],
    [
      'colorTheme',
      '配色',
      'select',
      [
        ['slate', '墨藍'],
        ['neutral', '石墨'],
        ['paper', '暖紙'],
        ['forest', '森林'],
        ['violet', '暮紫'],
      ],
    ],
    ['textSize', '資訊與留言文字大小', 13, 20, 1, ' px'],
    ['textLeading', '閱讀行距', 140, 210, 5, '%'],
    ['cornerRadius', '資訊區圓角', 0, 24, 2, ' px'],
    ['sectionSpacing', '區塊間距', 12, 64, 4, ' px'],
    ['accentHue', '重點色相', 0, 360, 5, '°'],
    ['accentStrength', '重點色鮮豔度', 0, 100, 5, '%'],
    ['customPalette', '使用自訂色票', 'boolean'],
    ['customBase', '頁面背景色', 'color'],
    ['customSurface', '資訊面板底色', 'color'],
    ['customSoft', '按鈕與輸入欄底色', 'color'],
    ['customText', '主要文字色', 'color'],
    ['customMuted', '次要文字色', 'color'],
    ['customAccent', '重點色', 'color'],
    ['footerGlow', '頁尾透出光暈', 'boolean'],
  ];
  const layoutFields = [
    ['watchLayout', '重排播放頁區塊', 'boolean'],
    ['navLayout', '重排頁首導覽', 'boolean'],
    [
      'playerLayout',
      '播放器布局',
      'select',
      [
        ['native', '原站自適應'],
        ['columns', '自訂影片與彈幕並列'],
      ],
    ],
    ['episodesLayout', '重排集數選單', 'boolean'],
    ['infoLayout', '重排作品資訊', 'boolean'],
    ['relatedLayout', '重排相關動畫', 'boolean'],
    ['newsLayout', '重排相關新聞', 'boolean'],
    ['commentsLayout', '重排留言區', 'boolean'],
    ['customWatchWidth', '啟用劇院最大寬度', 'boolean'],
  ];
  const contentFields = [
    ['collapsedPlayerSpacing', '收合彈幕後的播放器留白', 0, 64, 4, ' px'],
    ['focusMode', '專注觀看：暫時隱藏影片以外的資訊', 'boolean'],
    ['quickCollapse', '在各區塊顯示收合按鈕', 'boolean'],
    ['hideDanmuScrollbar', '隱藏彈幕列表捲軸（仍可捲動）', 'boolean'],
    ['commentWidth', '留言區寬度上限', 640, 1600, 40, ' px'],
    [
      'commentArrangement',
      '留言排列',
      'select',
      [
        ['single', '單欄閱讀'],
        ['double', '雙欄並排（寬螢幕）'],
      ],
    ],
    ['foldInfo', '作品資訊的收合按鈕', 'boolean'],
    ['foldRelated', '相關動畫的收合按鈕', 'boolean'],
    ['foldNews', '相關新聞的收合按鈕', 'boolean'],
    ['foldComments', '留言區的收合按鈕', 'boolean'],
    ['showInfo', '顯示作品資訊', 'boolean'],
    ['showRelated', '顯示相關動畫', 'boolean'],
    ['showNews', '顯示相關新聞', 'boolean'],
    ['showComments', '顯示留言區', 'boolean'],
    [
      'episodeStyle',
      '集數排列',
      'select',
      [
        ['wrap', '自動換行'],
        ['scroll', '單列捲動'],
        ['collapse', '可收合集數列表'],
      ],
    ],
    [
      'commentDensity',
      '留言密度',
      'select',
      [
        ['comfortable', '舒適'],
        ['compact', '緊湊'],
      ],
    ],
    ['commentImageWidth', '留言圖片最大寬度', 240, 640, 40, ' px'],
    ['danmuTextSize', '彈幕列表字級', 12, 18, 1, ' px'],
    ['danmuRowSpacing', '彈幕列表行距', 4, 16, 2, ' px'],
    ['danmuWidth', '自訂布局的彈幕欄寬度', 240, 420, 20, ' px'],
  ];
  const groups = [
    {
      name: '光暈',
      open: true,
      fields: [
        [
          'method',
          '延伸方式',
          'select',
          [
            ['project', '放射投影 · 向四周展開'],
            ['radial', '圓弧擴散 · 柔化四角'],
            ['contour', '輪廓延展 · 延續邊緣色彩'],
            ['diffuse', '柔光擴散 · 減少畫面細節'],
            ['reflect', '邊緣反射 · 保留原有細節'],
            ['band', '邊緣光帶 · 不複製畫面'],
            ['stretch', '邊緣拉伸 · 偽畫面延伸'],
            ['swirl', '旋流延伸 · 向外旋轉畫面'],
          ],
        ],
        ['intensity', '亮度', 0, 100, 5, '%'],
        ['radius', '延伸範圍', 10, 100, 2, '%'],
        ['blur', '模糊程度', 0, 100, 5, '%'],
        ['detail', '邊緣細節', 0, 100, 5, '%'],
        ['saturation', '色彩濃度', 0, 220, 5, '%'],
        ['contrast', '對比', 50, 150, 5, '%'],
        ['backgroundBrightness', '遠處背景亮度', 0, 100, 5, '%'],
        ['smoothing', '畫面平滑（越高越容易拖影）', 0, 90, 5, '%'],
        ['fadeIn', '光暈淡入時間', 0, 1500, 50, ' ms'],
        ['projectionDepth', '投影縱深', 0, 100, 5, '%'],
        ['radialRoundness', '圓弧柔化', 0, 100, 5, '%'],
        ['contourStrength', '輪廓延續強度', 0, 100, 5, '%'],
        ['reflectCompression', '反射壓縮', 0, 100, 5, '%'],
        ['diffusionDepth', '柔光擴散程度', 0, 100, 5, '%'],
        ['bandWidth', '光帶寬度', 0, 100, 5, '%'],
        ['stretchDepth', '取用邊緣厚度', 0, 100, 5, '%'],
        ['swirlAmount', '旋轉幅度', 0, 100, 5, '%'],
      ],
    },
    {
      name: '頁面',
      fields: [
        [
          'fontFamily',
          '字體 · Google Fonts',
          'select',
          [
            ['system', '系統字體'],
            ['sans', 'Noto Sans TC · 俐落黑體'],
            ['serif', 'Noto Serif TC · 閱讀宋體'],
            ['iansui', '芫荽 Iansui · 手寫感'],
            ['wenkai', '霞鶩文楷 TC · 清楚楷體'],
            ['chironHei', '昭源黑體 · 現代繁中字形'],
            ['chironSung', '昭源宋體 · 印刷閱讀感'],
            ['custom', '自訂字體'],
          ],
        ],
        [
          'appearance',
          '外觀',
          'select',
          [
            ['dark', '深色'],
            ['light', '淺色'],
            ['system', '跟隨系統'],
          ],
        ],
        ['buttonOpacity', '集數與訂閱按鈕底色', 0, 100, 5, '%'],
        ['headerOpacity', '頁首背景不透明度', 0, 100, 5, '%'],
        ['headerTint', '頁首跟隨影片配色', 0, 100, 5, '%'],
        ['panelOpacity', '彈幕列表背景不透明度', 0, 100, 5, '%'],
        ['panelTint', '彈幕列表跟隨影片配色', 0, 60, 2, '%'],
        ['infoOpacity', '作品資訊背景不透明度', 0, 100, 5, '%'],
        ['relatedOpacity', '相關動畫背景不透明度', 0, 100, 5, '%'],
        ['newsOpacity', '相關新聞背景不透明度', 0, 100, 5, '%'],
        ['commentOpacity', '留言區背景不透明度', 0, 100, 5, '%'],
        ['watchWidth', '劇院最大寬度', 1000, 2200, 40, ' px'],
        ['showDanmu', '顯示旁邊的彈幕列表', 'boolean'],
      ],
    },
    {
      name: '品質',
      fields: [
        ['adaptiveQuality', '自動調整光暈畫質', 'boolean'],
        ['renderFloor', '光暈解析度下限', 320, 1280, 160, ' px'],
        [
          'renderWidth',
          '光暈解析度上限',
          'select',
          [
            [640, '640 px · 省電'],
            [960, '960 px'],
            [1280, '1280 px · 均衡'],
            [1600, '1600 px · 清晰'],
            [1920, '1920 px · 高品質'],
          ],
        ],
        [
          'fps',
          '光暈更新率',
          'select',
          [
            [0, '跟隨影片影格（建議）'],
            ...Array.from({ length: 12 }, (_, i) => [
              (i + 1) * 5,
              `上限 ${(i + 1) * 5} fps`,
            ]),
          ],
        ],
        [
          'renderer',
          '繪製方式',
          'select',
          [
            ['auto', '自動 · 優先 WebGL'],
            ['gpu', 'WebGL · 不可用時退回 Canvas'],
            ['canvas', 'Canvas · 相容模式'],
          ],
        ],
      ],
    },
    {
      name: '黑邊',
      fields: [
        ['cropBars', '偵測黑條並避開取樣', 'boolean'],
        ['coverBars', '用光暈覆蓋影片黑條', 'boolean'],
        ['barThreshold', '黑邊亮度門檻', 0, 60, 2, ' / 255'],
        ['cropX', '左右額外取樣裁切', 0, 20, 1, '%'],
        ['cropY', '上下額外取樣裁切', 0, 20, 1, '%'],
      ],
    },
    {
      name: '一般',
      fields: [['hideSidebarAds', '隱藏右側頁面廣告', 'boolean']],
    },
  ];
  const fields = new Map(
    [
      ...groups.flatMap((group) => group.fields),
      ...themeFields,
      ...layoutFields,
      ...contentFields,
    ].map((field) => [field[0], field]),
  );

  // ── 二、選單分類與預設主題 ──
  const categories = [
    {
      id: 'themes',
      name: '預設主題',
      description: '六種配色，也可自訂重點色',
      keys: [
        'colorTheme',
        'accentHue',
        'accentStrength',
        'customPalette',
        'customBase',
        'customSurface',
        'customSoft',
        'customText',
        'customMuted',
        'customAccent',
      ],
    },
    {
      id: 'light',
      name: '光暈效果',
      description: '延伸方式、亮度與清晰度',
      keys: [
        'method',
        'projectionDepth',
        'radialRoundness',
        'contourStrength',
        'reflectCompression',
        'diffusionDepth',
        'bandWidth',
        'stretchDepth',
        'swirlAmount',
        ...groups[0].fields
          .filter(
            (f) =>
              ![
                'method',
                'smoothing',
                'fadeIn',
                'projectionDepth',
                'radialRoundness',
                'contourStrength',
                'reflectCompression',
                'diffusionDepth',
                'bandWidth',
                'stretchDepth',
                'swirlAmount',
              ].includes(f[0]),
          )
          .map((f) => f[0]),
      ],
    },
    {
      id: 'appearance',
      name: '外觀與字體',
      description: '深淺色、中文字體與閱讀大小',
      keys: [
        'fontFamily',
        'customFontName',
        'customFontGoogle',
        'danmuFontEnabled',
        'appearance',
        'textSize',
        'textLeading',
        'settingsOpacity',
      ],
    },
    {
      id: 'surfaces',
      name: '透明度與按鈕',
      description: '調整背景濃淡，讓光暈透出',
      keys: [
        'controlStyle',
        'footerGlow',
        'buttonOpacity',
        'headerOpacity',
        'headerTint',
        'panelOpacity',
        'panelTint',
        'infoOpacity',
        'relatedOpacity',
        'newsOpacity',
        'commentOpacity',
      ],
    },
    {
      id: 'layout',
      name: '版面與間距',
      description: '區塊順序、間距與播放器布局',
      keys: [
        ...layoutFields.map((f) => f[0]),
        'watchWidth',
        'sectionSpacing',
        'cornerRadius',
      ],
    },
    {
      id: 'content',
      name: '顯示與收合',
      description: '隱藏資訊、收合集數與留言',
      keys: [
        'showDanmu',
        'showInfo',
        'showRelated',
        'showNews',
        'showComments',
        ...contentFields
          .filter((f) => !f[0].startsWith('show'))
          .map((f) => f[0]),
      ],
    },
    {
      id: 'performance',
      name: '流暢度與畫質',
      description: '調整光暈清晰度與更新速度',
      keys: [...groups[2].fields.map((f) => f[0]), 'smoothing', 'fadeIn'],
    },
    {
      id: 'bars',
      name: '影片黑條',
      description: '取樣範圍與可選黑條覆蓋',
      keys: groups[3].fields.map((f) => f[0]),
    },
    {
      id: 'general',
      name: '其他與備份',
      description: '頁面廣告、匯入與匯出',
      keys: groups[4].fields.map((f) => f[0]),
    },
  ];
  const presets = {
    balanced: {
      label: '自然延伸',
      values: {
        method: 'project',
        intensity: 95,
        radius: 80,
        blur: 20,
        detail: 90,
        saturation: 100,
        contrast: 100,
        backgroundBrightness: 100,
        smoothing: 0,
        renderWidth: 960,
        fps: 60,
        renderer: 'auto',
      },
    },
    clear: {
      label: '清晰畫面',
      values: {
        method: 'contour',
        intensity: 100,
        radius: 100,
        blur: 0,
        detail: 100,
        saturation: 105,
        contrast: 100,
        backgroundBrightness: 100,
        smoothing: 0,
        renderWidth: 1920,
        fps: 60,
        renderer: 'auto',
      },
    },
    soft: {
      label: '柔和色彩',
      values: {
        method: 'diffuse',
        intensity: 65,
        radius: 80,
        blur: 90,
        detail: 15,
        saturation: 115,
        contrast: 100,
        backgroundBrightness: 85,
        smoothing: 0,
        renderWidth: 1280,
        fps: 60,
        renderer: 'auto',
      },
    },
    eco: {
      label: '淡色光暈',
      values: {
        method: 'diffuse',
        intensity: 80,
        radius: 50,
        blur: 35,
        detail: 70,
        saturation: 100,
        contrast: 100,
        backgroundBrightness: 90,
        smoothing: 0,
        renderWidth: 640,
        fps: 30,
        renderer: 'auto',
      },
    },
  };
  // Effect presets change appearance only; performance has its own schemes.
  for (const preset of Object.values(presets))
    for (const key of ['renderWidth', 'fps', 'renderer'])
      delete preset.values[key];
  // Theme presets deliberately leave playback, layout and performance alone.
  const themePresets = {
    cinema: {
      label: '沉浸墨藍',
      description: '墨藍底色，青色按鈕與連結',
      swatches: ['#0b1017', '#202d38', '#79dce4'],
      values: {
        appearance: 'dark',
        colorTheme: 'slate',
        accentHue: 185,
        accentStrength: 65,
        headerOpacity: 0,
        headerTint: 0,
        panelOpacity: 0,
        panelTint: 0,
        infoOpacity: 80,
        relatedOpacity: 85,
        newsOpacity: 85,
        commentOpacity: 90,
        textSize: 16,
        textLeading: 175,
        cornerRadius: 12,
      },
    },
    charcoal: {
      label: '低彩石墨',
      description: '低彩灰黑，適合夜間觀看',
      swatches: ['#121212', '#252525', '#d0d6db'],
      values: {
        appearance: 'dark',
        colorTheme: 'neutral',
        accentHue: 210,
        accentStrength: 15,
        headerOpacity: 0,
        headerTint: 0,
        panelOpacity: 0,
        panelTint: 0,
        infoOpacity: 85,
        relatedOpacity: 90,
        newsOpacity: 90,
        commentOpacity: 95,
        textSize: 16,
        textLeading: 175,
        cornerRadius: 8,
      },
    },
    paper: {
      label: '暖紙淺色',
      description: '溫暖底色，適合白天',
      swatches: ['#f5f1e8', '#e9e0d3', '#665043'],
      values: {
        appearance: 'light',
        colorTheme: 'paper',
        accentHue: 25,
        accentStrength: 40,
        headerOpacity: 0,
        headerTint: 0,
        panelOpacity: 0,
        panelTint: 0,
        infoOpacity: 90,
        relatedOpacity: 95,
        newsOpacity: 95,
        commentOpacity: 100,
        textSize: 16,
        textLeading: 175,
        cornerRadius: 10,
      },
    },
    forest: {
      label: '森林夜色',
      description: '墨綠底色，灰綠重點色',
      swatches: ['#121916', '#2b3931', '#adcbb7'],
      values: {
        appearance: 'dark',
        colorTheme: 'forest',
        accentHue: 150,
        accentStrength: 30,
        headerOpacity: 0,
        headerTint: 0,
        panelOpacity: 0,
        panelTint: 0,
        infoOpacity: 85,
        relatedOpacity: 90,
        newsOpacity: 90,
        commentOpacity: 95,
        textSize: 16,
        textLeading: 175,
        cornerRadius: 12,
      },
    },
    violet: {
      label: '暮紫',
      description: '灰紫底色，柔紫按鈕與連結',
      swatches: ['#19171e', '#37313f', '#c9b8d7'],
      values: {
        appearance: 'dark',
        colorTheme: 'violet',
        accentHue: 275,
        accentStrength: 30,
        headerOpacity: 0,
        headerTint: 0,
        panelOpacity: 0,
        panelTint: 0,
        infoOpacity: 85,
        relatedOpacity: 90,
        newsOpacity: 90,
        commentOpacity: 95,
        textSize: 16,
        textLeading: 175,
        cornerRadius: 12,
      },
    },
    reading: {
      label: '清楚閱讀',
      description: '較大文字，資訊區不透明',
      swatches: ['#eef3f7', '#e2ebf1', '#076777'],
      values: {
        appearance: 'light',
        colorTheme: 'slate',
        accentHue: 185,
        accentStrength: 70,
        headerOpacity: 85,
        headerTint: 0,
        panelOpacity: 95,
        panelTint: 0,
        infoOpacity: 100,
        relatedOpacity: 100,
        newsOpacity: 100,
        commentOpacity: 100,
        textSize: 18,
        textLeading: 190,
        cornerRadius: 8,
      },
    },
  };

  for (const preset of Object.values(themePresets))
    preset.values.customPalette = false;
  // ── 三、輸入驗證：舊設定與匯入檔都只能使用已知欄位 ──
  function normalize(values, base = defaults) {
    const result = { ...base };
    if (!values || typeof values !== 'object' || Array.isArray(values))
      return result;
    for (const key of Object.keys(defaults)) {
      if (!Object.hasOwn(values, key)) continue;
      const field = fields.get(key),
        value = values[key];
      if (typeof defaults[key] === 'boolean') {
        if (typeof value === 'boolean') result[key] = value;
      } else if (field?.[2] === 'select') {
        const choice = field[3].find(([v]) => String(v) === String(value));
        if (choice) result[key] = choice[0];
      } else if (field?.[2] === 'color' && typeof value === 'string') {
        const hex = value.trim().replace(/^#/, '');
        if (/^[0-9a-f]{6}$/i.test(hex)) result[key] = '#' + hex.toLowerCase();
        else if (/^[0-9a-f]{3}$/i.test(hex))
          result[key] =
            '#' +
            [...hex]
              .map((c) => c + c)
              .join('')
              .toLowerCase();
      } else if (field?.[2] === 'text' && typeof value === 'string') {
        result[key] = value
          .slice(0, 80)
          .replace(/[^\p{L}\p{N} ._-]/gu, '')
          .trim();
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        const min = field[2],
          max = field[3],
          step = field[4];
        result[key] = Math.min(
          max,
          Math.max(min, min + Math.round((value - min) / step) * step),
        );
      }
    }
    return result;
  }

  // ── 四、共用選單：userscript 和擴充功能使用同一份控制項 ──
  const resetIcon =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 2 9M4 4v6h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // 依延伸邏輯分組，避免方法增加後變成難掃讀的單一清單。
  const methodGroups = [
    {
      name: '延伸畫面',
      methods: [
        ['project', '放射投影', '向四周展開畫面。'],
        ['reflect', '邊緣反射', '鏡像延伸，保留細節。'],
        ['stretch', '邊緣拉伸', '拉長外框，細節會變形。'],
        ['swirl', '旋流延伸', '向外漸漸旋轉，形成旋流。'],
      ],
    },
    {
      name: '柔化畫面',
      methods: [
        ['radial', '圓弧擴散', '圓弧散開，柔化四角。'],
        ['diffuse', '柔光擴散', '淡化細節，保留色彩。'],
      ],
    },
    {
      name: '延伸色彩',
      methods: [
        ['contour', '輪廓延展', '延續外框的色彩變化。'],
        ['band', '邊緣光帶', '只留光帶，不複製畫面。'],
      ],
    },
  ];
  function controlsHTML() {
    const fieldControlHTML = (field) => {
      const [key, label, type] = field;
      if (type === 'color')
        return `<label class="ani-settings-color">${label}<span><input type="color" data-color-picker="${key}" aria-label="挑選${label}"><input type="text" maxlength="7" data-setting="${key}" aria-label="${label}色碼" placeholder="#112233" spellcheck="false"></span></label>`;
      if (type === 'text')
        return `<label class="ani-settings-select">${label}<input type="text" maxlength="80" data-setting="${key}" placeholder="例如 Noto Sans TC"></label>`;
      if (key === 'method') {
        const methods = methodGroups.flatMap((group) => group.methods);
        return (
          '<fieldset class="ani-method-options"><legend>延伸方式</legend><select hidden aria-hidden="true" tabindex="-1" data-setting="method">' +
          methods
            .map(([value, name]) => `<option value="${value}">${name}</option>`)
            .join('') +
          '</select><div class="ani-method-groups">' +
          methodGroups
            .map(
              (group) =>
                `<section class="ani-method-group" aria-label="${group.name}"><h4>${group.name}</h4><div class="ani-method-list">` +
                group.methods
                  .map(
                    ([value, name, description]) =>
                      `<button type="button" data-method-choice="${value}" aria-pressed="false"><span class="ani-method-marker" aria-hidden="true"></span><span><strong>${name}</strong><small>${description}</small></span></button>`,
                  )
                  .join('') +
                '</div></section>',
            )
            .join('') +
          '</div></fieldset>'
        );
      }
      if (type === 'boolean')
        return `<label class="ani-settings-option"><input type="checkbox" role="switch" data-setting="${key}">${label}</label>`;
      if (type === 'select')
        return `<label class="ani-settings-select">${label}<select data-setting="${key}">${field[3].map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>`;
      return `<label class="ani-settings-range">${label}<output data-value="${key}"></output><input type="range" aria-label="${label}" data-setting="${key}" min="${field[2]}" max="${field[3]}" step="${field[4]}"></label>`;
    };
    const fieldHTML = (field) =>
      `<div class="ani-setting-row">${fieldControlHTML(field)}<button type="button" class="ani-setting-reset" data-reset-setting="${field[0]}" aria-label="還原${field[1]}的預設值" title="恢復預設">${resetIcon}</button>${field[0] === 'customFontGoogle' ? '<div class="ani-settings-help ani-field-help"><p>只在選「自訂字體」時使用。</p><p>填 Google Fonts 的英文名稱，例如 Noto Sans TC。不用貼網址。</p><p>開啟會向 Google 下載字型。</p><p>關閉則使用裝置已安裝的同名字體。找不到時使用系統字體。</p></div>' : ''}</div>`;
    const chevron =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const preset =
      '<label class="ani-settings-select">快速套用<select hidden aria-hidden="true" tabindex="-1" data-preset><option value="custom">自訂</option>' +
      Object.entries(presets)
        .map(
          ([key, preset]) => `<option value="${key}">${preset.label}</option>`,
        )
        .join('') +
      '</select></label><div class="ani-effect-choices" role="group" aria-label="快速套用效果">' +
      Object.entries(presets)
        .map(
          ([key, p]) =>
            `<button type="button" data-effect-choice="${key}" aria-pressed="false">${p.label}</button>`,
        )
        .join('') +
      '</div>';
    const performancePreset =
      '<label class="ani-settings-select">效能方案<select data-performance-preset><option value="custom">自訂</option><option value="smooth">流暢優先（建議）</option><option value="sharp">清晰優先</option><option value="eco">省電</option></select></label><p class="ani-settings-help">只調整光暈，不改影片畫質。負載高時先降低解析度；畫面混合設為 0，可減少拖影。</p>';
    const themes =
      '<div class="ani-theme-presets" role="group" aria-label="預設主題">' +
      Object.entries(themePresets)
        .map(
          ([key, p]) =>
            `<button type="button" data-theme-preset="${key}" aria-pressed="false"><span class="ani-theme-swatches" aria-hidden="true">${p.swatches.map((color) => `<i style="background:${color}"></i>`).join('')}</span><strong>${p.label}</strong><small>${p.description}</small></button>`,
        )
        .join('') +
      '</div><p class="ani-settings-help">套用主題會改變配色、文字大小與透明度。影片排列和光暈速度不會跟著改。</p>';
    const sectionHeadings = {
      themes: { colorTheme: '自訂配色' },
      light: { intensity: '亮度與色彩', blur: '畫面細節' },
      surfaces: {
        headerOpacity: '頁首',
        panelOpacity: '彈幕列表',
        infoOpacity: '其他資訊區',
      },
      layout: { watchLayout: '分區重排', customWatchWidth: '寬度與間距' },
      content: {
        showDanmu: '顯示哪些資訊',
        focusMode: '快速整理頁面',
        foldInfo: '個別收合按鈕',
        episodeStyle: '集數與留言',
      },
      performance: { adaptiveQuality: '自動畫質', fps: '更新與同步' },
    };
    const backup =
      '<div class="ani-settings-actions"><button type="button" data-action="reset">還原預設</button><button type="button" data-action="export">匯出</button><button type="button" data-action="import">匯入</button><input type="file" data-import-file accept="application/json,.json" hidden></div>';
    return (
      '<div class="ani-settings-home" data-settings-home>' +
      categories
        .map(
          (c) =>
            `<button type="button" class="ani-settings-category" data-category="${c.id}" aria-label="${c.name}"><span><strong>${c.name}</strong><small>${c.description}</small></span>${chevron}</button>`,
        )
        .join('') +
      '</div><div class="ani-settings-detail" data-settings-detail hidden><nav class="ani-settings-rail" aria-label="設定分類">' +
      categories
        .map(
          (c) =>
            `<button type="button" data-category-shortcut="${c.id}">${c.name}</button>`,
        )
        .join('') +
      '</nav><div class="ani-settings-breadcrumb"><button type="button" data-settings-back aria-label="返回設定分類">' +
      chevron +
      '<span>所有設定</span></button><h3 data-category-title></h3><button type="button" class="ani-setting-reset ani-category-reset" data-reset-category aria-label="還原此分類的設定" title="恢復此分類的預設值"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 2 9M4 4v6h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
      categories
        .map(
          (c) =>
            `<section data-settings-page="${c.id}" hidden><div class="ani-settings-fields">${c.id === 'themes' ? themes : ''}${c.id === 'performance' ? performancePreset : ''}${c.id === 'light' ? preset : ''}${c.keys.map((k) => (sectionHeadings[c.id]?.[k] ? `<h4 class="ani-settings-subheading">${sectionHeadings[c.id][k]}</h4>` : '') + fieldHTML(fields.get(k))).join('')}</div>${c.id === 'appearance' ? '<p class="ani-font-preview" data-font-preview>動畫瘋・作品資訊與留言 Aa 123</p><p class="ani-settings-help">頁面文字會使用此字體。影片內建字幕不受影響。</p><p data-font-status class="ani-settings-help" role="status"></p>' : ''}${c.id === 'light' ? '<p class="ani-settings-help">選好效果後，可再調整亮度、範圍和模糊程度。</p>' : ''}${c.id === 'performance' ? '<p class="ani-settings-help" data-render-status role="status">播放影片後顯示渲染狀態。</p>' : ''}${c.id === 'bars' ? '<p class="ani-settings-help">「避開取樣」讓光暈不取用黑條。「覆蓋黑條」則會把光暈畫在黑條上；偵測到字幕或圖案時保留。</p>' : ''}${c.id === 'general' ? backup : ''}</section>`,
        )
        .join('') +
      '</div><p class="ani-settings-status" role="status" aria-live="polite"></p>'
    );
  }
  function sync(root, values) {
    for (const picker of root.querySelectorAll('[data-color-picker]'))
      picker.value = values[picker.dataset.colorPicker];
    for (const input of root.querySelectorAll('[data-setting]')) {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') input.checked = Boolean(values[key]);
      else input.value = values[key];
      const output = root.querySelector(`[data-value="${key}"]`);
      if (output) output.value = `${values[key]}${fields.get(key)?.[5] || ''}`;
    }
    for (const button of root.querySelectorAll('[data-method-choice]'))
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.methodChoice === values.method),
      );
    const methodKeys = {
      project: 'projectionDepth',
      radial: 'radialRoundness',
      contour: 'contourStrength',
      reflect: 'reflectCompression',
      diffuse: 'diffusionDepth',
      band: 'bandWidth',
      stretch: 'stretchDepth',
      swirl: 'swirlAmount',
    };
    for (const key of Object.values(methodKeys)) {
      const input = root.querySelector(`[data-setting="${key}"]`);
      if (input)
        input.closest('.ani-setting-row').hidden =
          methodKeys[values.method] !== key;
    }
    for (const key of ['foldInfo', 'foldRelated', 'foldNews', 'foldComments']) {
      const input = root.querySelector(`[data-setting="${key}"]`);
      if (input)
        input.closest('.ani-setting-row').hidden = Boolean(
          values.quickCollapse,
        );
    }
    const perf = root.querySelector('[data-performance-preset]');
    if (perf)
      perf.value =
        values.smoothing === 0 &&
        values.fps === 0 &&
        values.renderWidth === 960 &&
        values.renderFloor === 640 &&
        values.adaptiveQuality
          ? 'smooth'
          : values.smoothing === 0 &&
              values.fps === 0 &&
              values.renderWidth === 1600 &&
              values.renderFloor === 960 &&
              values.adaptiveQuality
            ? 'sharp'
            : values.smoothing === 0 &&
                values.fps === 30 &&
                values.renderWidth === 640 &&
                values.renderFloor === 480 &&
                values.adaptiveQuality
              ? 'eco'
              : 'custom';
    const select = root.querySelector('[data-preset]');
    if (select)
      select.value =
        Object.entries(presets).find(([, p]) =>
          Object.entries(p.values).every(
            ([key, value]) => values[key] === value,
          ),
        )?.[0] || 'custom';
    for (const button of root.querySelectorAll('[data-effect-choice]'))
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.effectChoice === select?.value),
      );
    for (const button of root.querySelectorAll('[data-theme-preset]'))
      button.setAttribute(
        'aria-pressed',
        String(
          Object.entries(themePresets[button.dataset.themePreset].values).every(
            ([key, value]) => values[key] === value,
          ),
        ),
      );
    for (const [key, disabled] of [
      ['renderFloor', !values.adaptiveQuality],
      ['watchWidth', !values.customWatchWidth],
      ['danmuWidth', !values.themeEnabled || values.playerLayout === 'native'],
    ]) {
      const control = root.querySelector(`[data-setting="${key}"]`);
      if (control) {
        control.disabled = disabled;
        control
          .closest('.ani-setting-row')
          .classList.toggle('is-disabled', disabled);
      }
    }
  }

  // ── 五、即時套用、鍵盤返回與設定備份 ──
  function wire(root, getValues, update) {
    const status = root.querySelector('.ani-settings-status');
    const report = (text) => {
      status.textContent = text;
    };
    for (const input of root.querySelectorAll(
      '[data-settings-overview] [data-setting]',
    )) {
      const label = input.closest('label'),
        button = document.createElement('button');
      const name = label.querySelector('span').textContent;
      // 還原按鈕位於同一列，但不應加入開關的朗讀名稱。
      input.setAttribute('aria-label', name);
      button.type = 'button';
      button.className = 'ani-setting-reset';
      button.dataset.resetSetting = input.dataset.setting;
      button.innerHTML = resetIcon;
      button.title = '恢復預設';
      button.setAttribute('aria-label', `還原${name}的預設值`);
      label.append(button);
    }
    const home = root.querySelector('[data-settings-home]'),
      detail = root.querySelector('[data-settings-detail]');
    let current = '';
    const navigate = (id) => {
      current = id;
      home.hidden = Boolean(id);
      detail.hidden = !id;
      for (const node of root.querySelectorAll('[data-settings-overview]'))
        node.hidden = Boolean(id);
      for (const page of root.querySelectorAll('[data-settings-page]'))
        page.hidden = page.dataset.settingsPage !== id;
      for (const item of root.querySelectorAll('[data-category-shortcut]')) {
        if (item.dataset.categoryShortcut === id)
          item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      }
      root.querySelector('[data-category-title]').textContent =
        categories.find((c) => c.id === id)?.name || '';
      (root.nodeType === 9
        ? root.scrollingElement || root.documentElement
        : root.querySelector('.ani-settings-scroll') || root
      ).scrollTop = 0;
      status.textContent = '';
    };
    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-reset-category]')) {
        const category = categories.find((c) => c.id === current);
        if (category) {
          update(
            normalize(
              Object.fromEntries(
                category.keys.map((key) => [key, defaults[key]]),
              ),
              getValues(),
            ),
          );
          report('已恢復此分類的預設值。');
        }
      }
      const effect = event.target.closest('[data-effect-choice]');
      if (effect) {
        const select = root.querySelector('[data-preset]');
        select.value = effect.dataset.effectChoice;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const method = event.target.closest('[data-method-choice]');
      if (method) {
        update(normalize({ method: method.dataset.methodChoice }, getValues()));
      }
      const reset = event.target.closest('[data-reset-setting]');
      if (reset) {
        event.preventDefault();
        const key = reset.dataset.resetSetting;
        update(normalize({ [key]: defaults[key] }, getValues()));
        report('已還原此項設定。');
      }
      const theme = event.target.closest('[data-theme-preset]');
      if (theme) {
        const preset = themePresets[theme.dataset.themePreset];
        update(
          normalize({ ...preset.values, uiEffectsEnabled: true }, getValues()),
        );
        report(`已套用「${preset.label}」。`);
      }
      const category = event.target.closest(
        '[data-category], [data-category-shortcut]',
      );
      if (category) {
        navigate(
          category.dataset.category || category.dataset.categoryShortcut,
        );
        if (!category.hasAttribute('data-category-shortcut'))
          root
            .querySelector('[data-settings-back]')
            .focus({ preventScroll: true });
      }
      if (event.target.closest('[data-settings-back]')) {
        const previous = current;
        navigate('');
        root
          .querySelector(`[data-category="${previous}"]`)
          ?.focus({ preventScroll: true });
      }
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && current) {
        event.preventDefault();
        event.stopPropagation();
        const previous = current;
        navigate('');
        root
          .querySelector(`[data-category="${previous}"]`)
          ?.focus({ preventScroll: true });
      }
    });
    root.addEventListener('input', (event) => {
      const input = event.target,
        key = input.dataset.setting;
      if (input.dataset.colorPicker) {
        update(
          normalize({ [input.dataset.colorPicker]: input.value }, getValues()),
        );
        return;
      }
      if (input.type === 'text') return;
      if (input.matches('[data-performance-preset]')) {
        const schemes = {
          smooth: {
            renderWidth: 960,
            renderFloor: 640,
            adaptiveQuality: true,
            fps: 0,
            smoothing: 0,
          },
          sharp: {
            renderWidth: 1600,
            renderFloor: 960,
            adaptiveQuality: true,
            fps: 0,
            smoothing: 0,
          },
          eco: {
            renderWidth: 640,
            renderFloor: 480,
            adaptiveQuality: true,
            fps: 30,
            smoothing: 0,
          },
        };
        if (schemes[input.value]) {
          update(normalize(schemes[input.value], getValues()));
          report('已套用效能方案。');
        }
        return;
      }
      if (!key) return;
      const value =
        input.type === 'checkbox'
          ? input.checked
          : input.tagName === 'SELECT' || input.type === 'text'
            ? input.value
            : Number(input.value);
      update(normalize({ [key]: value }, getValues()));
    });
    root.addEventListener('change', (event) => {
      const input = event.target;
      if (input.type === 'text' && input.dataset.setting)
        update(
          normalize({ [input.dataset.setting]: input.value }, getValues()),
        );
    });
    root.querySelector('[data-preset]').addEventListener('change', (event) => {
      const preset = presets[event.target.value];
      if (!preset) return;
      update(normalize(preset.values, getValues()));
      report(`已套用「${preset.label}」。`);
    });
    root
      .querySelector('[data-action="reset"]')
      .addEventListener('click', () => {
        update({ ...defaults });
        report('已還原預設。');
      });
    root
      .querySelector('[data-action="export"]')
      .addEventListener('click', () => {
        const blob = new Blob(
          [
            JSON.stringify(
              {
                format: 'anigamer-ambilight',
                version: 1,
                scriptVersion: '1.0.0',
                settings: normalize(getValues()),
              },
              null,
              2,
            ),
          ],
          { type: 'application/json' },
        );
        const url = URL.createObjectURL(blob),
          link = document.createElement('a');
        link.href = url;
        link.download = 'anigamer-ambilight-settings.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        report('已匯出設定。');
      });
    const fileInput = root.querySelector('[data-import-file]');
    root
      .querySelector('[data-action="import"]')
      .addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        if (file.size > 100000) throw new Error('檔案太大');
        const data = JSON.parse(await file.text());
        if (
          !Number.isInteger(data.version) ||
          data.version < 1 ||
          (data.format && data.format !== 'anigamer-ambilight') ||
          !data.settings ||
          !Object.keys(data.settings).some((key) =>
            Object.hasOwn(defaults, key),
          )
        )
          throw new Error('格式不符');
        // 缺少的新欄位補預設，未知欄位不執行；舊檔的 version: 1 仍可匯入。
        update(normalize(data.settings));
        report('已匯入設定。');
      } catch {
        report('無法匯入，請選擇本工具匯出的 JSON 設定檔。');
      }
      fileInput.value = '';
    });
  }
  globalThis.AniAmbientSettings = {
    defaults,
    normalize,
    controlsHTML,
    sync,
    wire,
    themePresets,
  };
})();

(() => {
  'use strict';
  // Spatial evidence only. The caller requires repeated matching detections
  // before applying a crop, so cuts/fades do not change the visible framing.

  // ── 黑條辨識：只接受對稱暗區及明確畫面邊界，亮字或圖案會阻止裁切 ──
  function detect(data, width, height, threshold = 20) {
    const empty = { left: 0, top: 0, right: 0, bottom: 0 };
    const luma = (x, y) => {
      const i = (y * width + x) * 4;
      return data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
    };
    const darkLine = (horizontal, coordinate, start, end) => {
      let dark = 0,
        total = 0;
      for (let p = start; p < end; p++) {
        if ((horizontal ? luma(p, coordinate) : luma(coordinate, p)) <= threshold) dark++;
        total++;
      }
      return total > 0 && dark / total >= 0.99;
    };
    let { left, top, right, bottom } = empty;
    while (top < Math.floor(height * 0.32) && darkLine(true, top, 2, width - 2)) top++;
    while (bottom < Math.floor(height * 0.32) && darkLine(true, height - 1 - bottom, 2, width - 2))
      bottom++;
    if (top < 2 || bottom < 2 || Math.abs(top - bottom) > Math.max(2, height * 0.03))
      top = bottom = 0;
    while (left < Math.floor(width * 0.4) && darkLine(false, left, top + 2, height - bottom - 2))
      left++;
    while (
      right < Math.floor(width * 0.4) &&
      darkLine(false, width - 1 - right, top + 2, height - bottom - 2)
    )
      right++;
    if (left < 2 || right < 2 || Math.abs(left - right) > Math.max(2, width * 0.03))
      left = right = 0;
    if (!(left || top || right || bottom)) return empty;
    let bright = 0,
      total = 0,
      min = 255,
      max = 0;
    for (let y = top + 2; y < height - bottom - 2; y += 3)
      for (let x = left + 2; x < width - right - 2; x += 3) {
        const value = luma(x, y);
        min = Math.min(min, value);
        max = Math.max(max, value);
        if (value > threshold + 12) bright++;
        total++;
      }
    // A uniformly black/fading frame supplies no trustworthy bar boundary.
    if (!total || bright / total < 0.08 || max - min < 12) return empty;
    // Do not crop bright writing/logos that occupy the proposed black bands.
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        if (
          (y < top || y >= height - bottom || x < left || x >= width - right) &&
          luma(x, y) > Math.max(40, threshold + 20)
        )
          return empty;
      }
    return { left, top, right, bottom };
  }
  globalThis.AniAmbientBlackBars = { detect };
})();

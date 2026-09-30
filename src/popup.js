// ── 擴充功能選單：重用頁面設定，延後合併儲存避免每次滑動都寫入 ──
const options = globalThis.AniAmbientSettings;
let values = { ...options.defaults };
let saveTimer;
document.getElementById('settings-controls').innerHTML = options.controlsHTML();
function update(next) {
  values = options.normalize(next, values);
  options.sync(document, values);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => chrome.storage.sync.set({ ...values }), 180);
}
options.wire(document, () => values, update);
options.sync(document, values);
chrome.storage.sync.get(options.defaults, (saved) => {
  values = options.normalize(saved);
  options.sync(document, values);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  values = options.normalize(
    Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue])),
    values,
  );
  options.sync(document, values);
});
document.addEventListener('change', () => {
  clearTimeout(saveTimer);
  chrome.storage.sync.set({ ...values });
});

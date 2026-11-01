(() => {
  const config = window.SITE_CONFIG || {};
  const editableKeys = new Set([
    'meeting_wed_time', 'meeting_sat_time', 'address', 'map', 'whatsapp',
    'telegram', 'telegram_display', 'phone', 'phone_display', 'instagram',
    'threads', 'facebook', 'aarussia',
  ]);

  if (config.morning_rays && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('rays-enabled');
  }

  const applySettings = () => {
    document.querySelectorAll('[data-setting]').forEach((element) => {
      const value = config[element.dataset.setting];
      if (typeof value === 'string' && value.trim()) element.textContent = value.trim();
    });
    document.querySelectorAll('[data-link]').forEach((element) => {
      const key = element.dataset.link;
      const value = config[key];
      const destination = key === 'phone' ? `tel:${value}` : value;
      if (typeof value === 'string' && value.trim() &&
          (key === 'phone' ? /^tel:\+?[\d\s()-]+$/.test(destination) : /^https:\/\//i.test(destination))) {
        element.href = destination;
      }
    });
  };

  const parseCsv = (csv) => {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < csv.length; index += 1) {
      const character = csv[index];
      if (character === '"' && quoted && csv[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((character === '\n' || character === '\r') && !quoted) {
        if (character === '\r' && csv[index + 1] === '\n') index += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += character;
      }
    }
    if (cell || row.length) rows.push([...row, cell]);
    return rows;
  };

  const loadSettings = (url) => fetch(url, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((csv) => {
        const rows = parseCsv(csv.replace(/^\uFEFF/, ''));
        if (rows[0]?.[0]?.trim() !== 'key' || rows[0]?.[1]?.trim() !== 'value') {
          throw new Error('CSV needs key,value columns');
        }
        for (const [key, value] of rows.slice(1)) {
          const name = key?.trim();
          if (editableKeys.has(name) && typeof value === 'string' && value.trim()) {
            config[name] = value.trim();
          }
        }
        applySettings();
      });

  applySettings();
  if (config.google_sheet_csv) {
    loadSettings(config.google_sheet_csv).catch((error) => {
      console.warn('Google Таблица недоступна; загружаю резервные данные.', error);
      if (config.fallback_csv) loadSettings(config.fallback_csv).catch(() => {});
    });
  }
})();

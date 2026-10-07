const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DATA_FILE = () => path.join(app.getPath('userData'), 'veri.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    title: 'Oğuzlar Fiş',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#eef1f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  Menu.setApplicationMenu(null);
  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') mainWindow.webContents.toggleDevTools();
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ---------- Veri ----------
ipcMain.handle('data:load', () => {
  try {
    if (fs.existsSync(DATA_FILE())) return JSON.parse(fs.readFileSync(DATA_FILE(), 'utf8'));
  } catch (err) {
    const bad = DATA_FILE() + '.bozuk-' + Date.now();
    try { fs.copyFileSync(DATA_FILE(), bad); } catch (_) {}
  }
  return null;
});

ipcMain.handle('data:save', (e, data) => {
  const file = DATA_FILE();
  const tmp = file + '.tmp';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
  return true;
});

ipcMain.handle('data:openFolder', () => shell.openPath(app.getPath('userData')));

ipcMain.handle('file:exportJson', async (e, { name, data }) => {
  const r = await dialog.showSaveDialog(mainWindow, {
    defaultPath: name,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePath) return false;
  fs.writeFileSync(r.filePath, JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('file:importJson', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
});

// ---------- Yazdırma ----------
ipcMain.handle('print:printers', async () => {
  const list = await mainWindow.webContents.getPrintersAsync();
  return list.map(p => ({ name: p.name, displayName: p.displayName || p.name, isDefault: !!p.isDefault }));
});

const PAPERS = {
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
  '80mm': { w: 80, h: null },
  '58mm': { w: 58, h: null }
};

async function loadHidden(html) {
  const file = path.join(os.tmpdir(), `oguzlar-fis-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(file, html, 'utf8');
  const win = new BrowserWindow({ show: false, width: 900, height: 1200, webPreferences: { contextIsolation: true } });
  await win.loadFile(file);
  // görsellerin yüklenmesini bekle
  await win.webContents.executeJavaScript(
    'Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))'
  );
  const cleanup = () => {
    try { if (!win.isDestroyed()) win.close(); } catch (_) {}
    try { fs.unlinkSync(file); } catch (_) {}
  };
  return { win, cleanup };
}

async function pageSizeFor(win, paper) {
  const p = PAPERS[paper] || PAPERS.A4;
  if (p.h) return { mm: { w: p.w, h: p.h } };
  const px = await win.webContents.executeJavaScript(
    "Math.ceil((document.querySelector('.page') || document.body).getBoundingClientRect().bottom)"
  );
  const hmm = Math.ceil(px * 25.4 / 96) + 6;
  return { mm: { w: p.w, h: Math.max(hmm, 60) } };
}

ipcMain.handle('print:print', async (e, { html, paper, deviceName, silent, copies }) => {
  const { win, cleanup } = await loadHidden(html);
  try {
    const { mm } = await pageSizeFor(win, paper);
    await win.webContents.insertCSS(`@page { size: ${mm.w}mm ${mm.h}mm; margin: 0; }`);
    const opts = {
      silent: !!silent,
      printBackground: true,
      copies: Math.max(1, Number(copies) || 1),
      margins: { marginType: 'none' },
      pageSize: { width: mm.w * 1000, height: mm.h * 1000 }
    };
    if (deviceName) opts.deviceName = deviceName;
    return await new Promise(resolve => {
      win.webContents.print(opts, (success, failureReason) => resolve({ success, reason: failureReason || '' }));
    });
  } finally {
    setTimeout(cleanup, 500);
  }
});

ipcMain.handle('print:pdf', async (e, { html, paper, name }) => {
  const r = await dialog.showSaveDialog(mainWindow, {
    defaultPath: (name || 'fis') + '.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (r.canceled || !r.filePath) return { success: false, canceled: true };
  const { win, cleanup } = await loadHidden(html);
  try {
    const { mm } = await pageSizeFor(win, paper);
    await win.webContents.insertCSS(`@page { size: ${mm.w}mm ${mm.h}mm; margin: 0; }`);
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: 'none' }
    });
    fs.writeFileSync(r.filePath, pdf);
    shell.openPath(r.filePath);
    return { success: true, path: r.filePath };
  } finally {
    cleanup();
  }
});

// Windows (and macOS/Linux) desktop wrapper. Serves the built web game from
// ./app over a private app:// scheme so ES modules and WebAssembly work.

const { app, BrowserWindow, protocol, net, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

const ROOT = path.join(__dirname, 'app');

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(ROOT, decodeURIComponent(pathname === '/' ? '/index.html' : pathname)));
    if (!file.startsWith(ROOT + path.sep)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#07060a',
    autoHideMenuBar: true,
    title: "Granny's House",
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  // Never navigate away from the game; open external links in the browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) e.preventDefault();
  });
  win.loadURL('app://game/index.html');
});

app.on('window-all-closed', () => app.quit());

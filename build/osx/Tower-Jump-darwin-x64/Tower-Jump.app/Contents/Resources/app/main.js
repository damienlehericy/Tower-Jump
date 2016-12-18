'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if we don't have this, garbage collector can close window.
let mainWindow;

function createWindow () {
	mainWindow = new BrowserWindow({width: 400, height: 520 });

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, './app/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	// Emitted when the window is closed.
	mainWindow.on('closed', function () { mainWindow = null });
}

// Called when electron can build window.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
	if (mainWindow === null) createWindow()
});


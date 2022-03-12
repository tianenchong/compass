const { app } = require('@electron/remote');
const path = require('path');

export function getUserDataFilePath(filename) {
  if (!app) {
    return;
  }

  return path.join(
    app.getPath('userData'),
    app.getName(),
    filename
  );
}

'use strict';

// Audio capture is granted only following the local visual control's explicit action.
function permitsVisualMicrophone(grant, request, now = Date.now()) {
  if (!grant || !request || now > grant.expiresAt || request.webContentsId !== grant.webContentsId) return false;
  try {
    const origin = new URL(request.origin);
    const expected = new URL(grant.origin);
    if (origin.origin !== expected.origin || origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1') return false;
    if (origin.pathname !== '/' && origin.pathname !== '/visual-studio/stage.html') return false;
    const types = request.mediaTypes || [];
    const type = String(request.mediaType || '').toLowerCase();
    if (type && type !== 'audio') return false;
    if (types.length && !types.every(value => value === 'audio')) return false;
    return true;
  } catch (_) { return false; }
}
module.exports = { permitsVisualMicrophone };

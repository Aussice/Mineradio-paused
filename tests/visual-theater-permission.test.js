'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { permitsVisualMicrophone } = require('../desktop/visual-microphone-permission');
const grant = { webContentsId: 7, origin: 'http://127.0.0.1:32841/', expiresAt: 30000 };
const request = { webContentsId: 7, origin: 'http://127.0.0.1:32841/visual-studio/stage.html', mediaTypes: ['audio'] };

test('an explicit visual-stage grant allows only its local microphone request', () => {
  assert.equal(permitsVisualMicrophone(grant, request, 100), true);
  assert.equal(permitsVisualMicrophone(null, request, 100), false);
  assert.equal(permitsVisualMicrophone(grant, request, 30001), false);
});
test('another window, port, document or origin cannot use the grant', () => {
  for (const change of [
    { webContentsId: 8 },
    { origin: 'http://127.0.0.1:32842/visual-studio/stage.html' },
    { origin: 'https://example.com/visual-studio/stage.html' },
    { origin: 'http://127.0.0.1:32841/untrusted.html' },
    { origin: 'not a URL' },
  ]) assert.equal(permitsVisualMicrophone(grant, { ...request, ...change }, 100), false);
});
test('a microphone grant never enables camera or mixed capture', () => {
  for (const change of [{ mediaTypes: ['video'] }, { mediaTypes: ['audio', 'video'] }, { mediaType: 'video' }]) {
    assert.equal(permitsVisualMicrophone(grant, { ...request, ...change }, 100), false);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkConsentIntegrations } from '../scripts/check-consent-integrations.mjs';

test('common future tracker added outside consent fails the build guard; affiliate scope remains excluded', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'btg-consent-'));
  try {
    for (const dir of ['app', 'components/blog', 'lib/consent/services', 'public']) mkdirSync(path.join(root, dir), { recursive: true });
    writeFileSync(path.join(root, 'app/layout.tsx'), '<script src="https://www.googletagmanager.com/gtm.js?id=test" />');
    writeFileSync(path.join(root, 'components/blog/AffiliateHtml.tsx'), 'https://connect.facebook.net/en_US/fbevents.js');
    writeFileSync(path.join(root, 'lib/consent/services/test.ts'), 'https://www.google-analytics.com/analytics.js');
    assert.deepEqual(checkConsentIntegrations(root), ['app/layout.tsx']);
    writeFileSync(path.join(root, 'app/layout.tsx'), 'No optional integration');
    assert.deepEqual(checkConsentIntegrations(root), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

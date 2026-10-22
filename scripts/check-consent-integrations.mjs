import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// This build guard detects common direct integrations. It does not infer purposes,
// execute code, scan visitors, or modify affiliate integrations.
const tracker = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|googleadservices\.com|googlesyndication\.com|doubleclick\.net|connect\.facebook\.net|facebook\.com\/tr|clarity\.ms|static\.hotjar\.com|@next\/third-parties\/google|react-ga4|react-gtm-module|react-facebook-pixel|\bgtag\s*\(|\bfbq\s*\(/i;
export function checkConsentIntegrations(root) {
  const errors = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      const relative = path.relative(root, full).replaceAll(path.sep, '/');
      if (/affiliate/i.test(relative)) continue; // Explicitly excluded from this consent project.
      if (entry.isDirectory()) visit(full);
      else if (/\.(?:[cm]?[jt]sx?|html)$/.test(entry.name)) {
        // Reviewed consent adapters are the only place permitted to initialize a tracker.
        // Registry metadata may list resources but must have no module-level initialization.
        const source = readFileSync(full, 'utf8');
        if (relative !== 'lib/consent/manager.ts' && /\.activate\s*\(/.test(source)) errors.push(relative + ': direct activate call');
        if (relative.startsWith('lib/consent/services/') || relative === 'lib/consent/registry.ts') continue;
        if (tracker.test(source)) errors.push(relative);
      }
    }
  }
  for (const directory of ['app', 'components', 'lib', 'public']) visit(path.join(root, directory));
  return errors;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkConsentIntegrations(process.cwd());
  if (errors.length) {
    console.error('Optional integration outside consent adapter. Declare the service and move initialization into its gated activate method:\n' + errors.join('\n'));
    process.exitCode = 1;
  } else console.log('Consent integration guard passed (affiliate elements excluded).');
}

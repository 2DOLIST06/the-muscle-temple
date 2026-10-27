import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFragment } from 'parse5';
import { defaultAffiliateDesign, makeAffiliateDesign, readAffiliateDesign } from '../lib/content/affiliate-design.ts';
import { applyBanner, getBanners } from '../lib/content/affiliate.ts';

const base = { ...defaultAffiliateDesign, url: 'https://shop.example/offer?a=1&b=%22hello%22', image: 'https://img.example/banner.png', label: 'Voir <l’offre> & "prix"', alt: '"><script>alert(1)</script>' };
test('image and button survive bulk replacement and reopen with all visual settings', () => {
  for (const kind of ['image', 'button']) {
    const design = { ...base, kind, align: 'right', fullWidth: true, newTab: false, radius: 24 };
    const source = makeAffiliateDesign(design);
    const html = applyBanner('<p>Avant</p>' + applyBanner('', { source: 'ancien' }) + '<p>Après</p>', { source });
    assert.equal(getBanners(html).length, 1);
    assert.deepEqual(readAffiliateDesign(getBanners(html)[0].source), design);
    assert.ok(html.startsWith('<p>Avant</p>') && html.endsWith('<p>Après</p>'));
    const root = parseFragment(source).childNodes[0];
    const link = root.childNodes[0];
    assert.equal(link.attrs.find(a => a.name === 'href').value, base.url);
    assert.ok(!link.attrs.some(a => a.name === 'target'));
    assert.equal(link.attrs.find(a => a.name === 'rel').value, 'sponsored nofollow noopener noreferrer');
    if (kind === 'image') {
      assert.equal(link.childNodes.length, 1);
      assert.equal(link.childNodes[0].tagName, 'img');
      assert.equal(link.childNodes[0].attrs.find(a => a.name === 'alt').value, base.alt);
    } else assert.equal(link.childNodes[0].value, base.label);
  }
});
test('unsafe URLs, missing fields and injected CSS are rejected; custom code stays code', () => {
  for (const change of [{ url: 'javascript:alert(1)' }, { image: 'data:image/svg+xml,test' }, { kind: 'button', label: ' ' }, { background: 'red;display:none' }, { align: 'left;display:none' }, { radius: 999 }]) {
    assert.equal(makeAffiliateDesign({ ...base, ...change }), '');
  }
  assert.equal(readAffiliateDesign('<script>custom()</script>'), null);
  assert.equal(readAffiliateDesign(makeAffiliateDesign(base) + '<p>custom</p>'), null);
  assert.equal(readAffiliateDesign(makeAffiliateDesign(base).replace('loading="lazy"', 'loading="eager"')), null);
});

// Old metadata remains byte-for-byte compatible; new sizes apply to the link
// once, with the image filling it rather than multiplying percentages.
test('banner width survives storage and rejects invalid sizes', () => {
  for (const widthPercent of [10, 45, 100]) {
    const design = { ...base, widthPercent };
    const source = makeAffiliateDesign(design);
    const stored = getBanners(applyBanner('<p>Article</p>', { source }))[0];
    assert.deepEqual(readAffiliateDesign(stored.source), design);
    const link = parseFragment(source).childNodes[0].childNodes[0];
    assert.ok(link.attrs.find(a => a.name === 'style').value.includes(`width:${widthPercent}%;`));
    assert.ok(link.childNodes[0].attrs.find(a => a.name === 'style').value.includes('width:100%;'));
  }
  for (const widthPercent of [0, 101, NaN, '50;display:none']) {
    assert.equal(makeAffiliateDesign({ ...base, widthPercent }), '');
  }
  assert.deepEqual(readAffiliateDesign(makeAffiliateDesign(base)), base);
});

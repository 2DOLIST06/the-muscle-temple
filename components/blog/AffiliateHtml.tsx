'use client';
import { useEffect, useRef } from 'react';

function sponsoredLinks(root: HTMLElement) {
  root.querySelectorAll('a[href]').forEach(a => {
    a.setAttribute('rel', [...new Set((a.getAttribute('rel') ?? '').split(/\s+/).concat(['sponsored', 'nofollow', 'noopener', 'noreferrer']).filter(Boolean))].join(' '));
  });
}

export function AffiliateHtml({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];
    // Defer until after React's development effect replay, avoiding duplicate script execution.
    queueMicrotask(() => {
      if (cancelled || !ref.current) return;
      ref.current.querySelectorAll<HTMLElement>('[data-affiliate-block="banner"]').forEach(block => {
        const source = decodeURIComponent(block.dataset.affiliateSource ?? '');
        if (block.dataset.affiliateMode === 'isolated') {
          const frame = document.createElement('iframe');
          frame.title = 'Bannière d’affiliation';
          frame.sandbox.add('allow-scripts', 'allow-popups', 'allow-popups-to-escape-sandbox');
          frame.style.cssText = 'width:100%;height:300px;border:0;resize:vertical;max-width:100%';
          frame.srcdoc = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}img,iframe{max-width:100%}img{height:auto}</style></head><body>${source}<script>function markLinks(){document.querySelectorAll('a[href]').forEach(function(a){a.rel=Array.from(new Set((a.rel||'').split(/\\s+/).concat(['sponsored','nofollow','noopener','noreferrer']))).join(' ')})}markLinks();new MutationObserver(markLinks).observe(document.body,{childList:true,subtree:true});</script></body></html>`;
          block.replaceChildren(frame);
          cleanups.push(() => frame.remove());
          return;
        }
        if (/document\s*\.\s*write\s*\(/i.test(source)) {
          block.textContent = 'Bannière indisponible : ce code nécessite le mode document isolé.';
          return;
        }
        const template = document.createElement('template');
        template.innerHTML = source;
        const scripts = Array.from(template.content.querySelectorAll('script')).map(old => {
          const anchor = document.createComment('affiliate-script');
          old.replaceWith(anchor);
          return { old, anchor };
        });
        // Keep scripts inert until recreated below. Preserve attributes and ordering.
        block.replaceChildren(template.content);
        sponsoredLinks(block);
        const observer = new MutationObserver(() => sponsoredLinks(block));
        observer.observe(block, { childList: true, subtree: true });
        cleanups.push(() => observer.disconnect());
        void (async () => {
          for (const { old, anchor } of scripts) {
            if (cancelled || !block.isConnected) return;
            const script = document.createElement('script');
            for (const attr of old.attributes) script.setAttribute(attr.name, attr.value);
            script.textContent = old.textContent;
            const type = script.type.trim().toLowerCase();
            const executable = !type || type === 'module' || /^(?:(?:text|application)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript))$/i.test(type);
            const ignored = script.noModule && 'noModule' in HTMLScriptElement.prototype;
            const wait = executable && !ignored && !script.hasAttribute('async') && (script.hasAttribute('src') || type === 'module');
            if (!script.hasAttribute('async')) script.async = false;
            const loaded = wait ? new Promise<void>(resolve => {
              script.onload = () => resolve();
              script.onerror = () => {
                if (!cancelled) {
                  const notice = document.createElement('p');
                  notice.textContent = 'Un script de cette bannière n’a pas pu être chargé. Vérifiez les restrictions du fournisseur ou les bloqueurs de contenu.';
                  notice.setAttribute('role', 'status');
                  block.append(notice);
                }
                resolve();
              };
              cleanups.push(resolve);
            }) : null;
            anchor.replaceWith(script);
            if (loaded) await loaded;
          }
        })();
      });
    });
    return () => { cancelled = true; cleanups.forEach(fn => fn()); };
  }, [html]);
  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

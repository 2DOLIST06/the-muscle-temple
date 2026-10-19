import { AffiliateHtml } from './AffiliateHtml';
import { inertBanners } from '@/lib/content/affiliate';
import { Fragment } from 'react';
import { MacroCalculator } from '@/components/calculators/MacroCalculator';
import { addMissingHeadingIds } from '@/lib/content/headings';

const macroCalculatorShortcodePattern = /(?:<p>\s*)?\[\[macro-calculator\]\](?:\s*<\/p>)?/i;

export function RichContentRenderer({ contentHtml, locale = 'fr' }: { contentHtml?: string | null; locale?: string }) {
  const cleaned = addMissingHeadingIds(
    inertBanners(contentHtml ?? '').replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
  );

  if (!macroCalculatorShortcodePattern.test(cleaned)) {
    return <AffiliateHtml key={cleaned} className="rich-content" html={cleaned} />;
  }

  const parts = cleaned.split(macroCalculatorShortcodePattern);

  return (
    <div className="rich-content">
      {parts.map((part, index) => (
        <Fragment key={`${index}-${part.length}`}>
          {part ? <AffiliateHtml key={part} className="contents" html={part} /> : null}
          {index < parts.length - 1 ? <MacroCalculator locale={locale} /> : null}
        </Fragment>
      ))}
    </div>
  );
}

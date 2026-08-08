import type { Metadata } from "next";
import { getLegalPageCopy } from "@/components/legal/LegalPage";
import {
  absoluteUrl,
  getLegalPagePath,
  type LegalPageKey,
  type Locale,
} from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";

export const buildLegalMetadata = (
  page: LegalPageKey,
  locale: Locale,
): Metadata => {
  const content = getLegalPageCopy(locale, page);
  const enPath = getLegalPagePath(page, "en");
  const frPath = getLegalPagePath(page, "fr");
  return buildMetadata({
    title: `${content.title} | Body Training Guide`,
    description: content.paragraphs[0],
    path: getLegalPagePath(page, locale),
    locale,
    noIndex: true,
    hreflang: [
      { hreflang: "en", href: absoluteUrl(enPath) },
      { hreflang: "fr", href: absoluteUrl(frPath) },
      { hreflang: "x-default", href: absoluteUrl(enPath) },
    ],
  });
};

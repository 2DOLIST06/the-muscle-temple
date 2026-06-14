import { addHeadingIds } from '@/lib/content/article-utils';

const cleanRichHtml = (contentHtml: string) =>
  addHeadingIds(
    contentHtml
      .replace(/<p(?:\s[^>]*)?>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
      .replace(/<h([2-4])(?:\s[^>]*)?>(\s|&nbsp;|<br\s*\/?>)*<\/h\1>/gi, '')
      .replace(/<h([2-4])\b([^>]*)>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h\1>/gi, '<h$1$2>$3</h$1>')
      .replace(/<h([2-4])\b([^>]*)>\s*<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>\s*<\/h\1>/gi, '<h$1$2>$3</h$1>')
      .replace(/<h([2-4])\b([^>]*)>\s*<figure[\s\S]*?<\/figure>\s*<\/h\1>/gi, '')
      .replace(/<blockquote(?:\s[^>]*)?>(\s|&nbsp;|<br\s*\/?>)*<\/blockquote>/gi, '')
      .replace(/<p(?:\s[^>]*)?>\s*(<figure[\s\S]*?<\/figure>)\s*<\/p>/gi, '$1')
      .replace(/<img\b(?![^>]*\balt=)/gi, '<img alt=""')
  );

export function RichContentRenderer({ contentHtml }: { contentHtml?: string | null }) {
  const cleaned = cleanRichHtml(contentHtml ?? '');

  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: cleaned }} />;
}

export function RichContentRenderer({ contentHtml }: { contentHtml?: string | null }) {
  const cleaned = (contentHtml ?? '')
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/<h2>\s*<strong>(.*?)<\/strong>\s*<\/h2>/gi, '<h2>$1</h2>')
    .replace(/<h3>\s*<strong>(.*?)<\/strong>\s*<\/h3>/gi, '<h3>$1</h3>');

  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: cleaned }} />;
}

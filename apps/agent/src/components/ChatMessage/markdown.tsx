import MarkdownIt from "markdown-it";
import { useMemo } from "react";

const md = new MarkdownIt({
  html: true,
  xhtmlOut: true,
  breaks: false,
  linkify: false,
});

export function MarkdownRenderer(props: { content: string }) {
  const htmlContent = useMemo(() => (props.content ? markdownToHtml(props.content) : null), [props.content]);
  return htmlContent ? <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: htmlContent }} /> : null;
}

export function markdownToHtml(markdown: string | null | void): string {
  if (typeof markdown !== "string" || !markdown) return "";

  let html = md.render(markdown);

  const trimmedMarkdown = markdown.trim();
  if (html.trim() === trimmedMarkdown) {
    const singleTagMatch = trimmedMarkdown.match(/^<([a-zA-Z][^>\s]*)\/?>$/);
    if (singleTagMatch) {
      if (!isHtmlTags(singleTagMatch[1]!)) {
        html = `<p>${html}</p>`;
      }
    }
  }

  return html;
}

function isHtmlTags(tagName: string) {
  const tags = [
    "a",
    "abbr",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "bdi",
    "bdo",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "link",
    "main",
    "map",
    "mark",
    "math",
    "menu",
    "meta",
    "meter",
    "nav",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "picture",
    "pre",
    "progress",
    "q",
    "rp",
    "rt",
    "ruby",
    "s",
    "samp",
    "script",
    "search",
    "section",
    "select",
    "selectedcontent",
    "slot",
    "small",
    "source",
    "span",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "svg",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "u",
    "ul",
    "var",
    "video",
    "wbr",
  ];
  const tags_void = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "source",
    "track",
    "wbr",
  ];
  return tags.includes(tagName.toLowerCase()) || tags_void.includes(tagName.toLowerCase());
}

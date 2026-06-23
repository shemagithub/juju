/** Split legal page content into heading + paragraph blocks. Lines starting with ## become headings. */
export function parseLegalContent(content = "") {
  if (!content || typeof content !== "string") return [];

  return content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith("## ")) {
        return { type: "heading", text: block.slice(3).trim() };
      }
      return { type: "paragraph", text: block };
    });
}

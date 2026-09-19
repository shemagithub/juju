export const KEYWORD_TOURS = [
  { path: "/gorilla-trekking", match: /volcanoes|gorilla|musanze/i, label: "Gorilla Trekking" },
  { path: "/akagera-safari", match: /akagera/i, label: "Akagera Safari" },
  { path: "/nyungwe-forest", match: /nyungwe/i, label: "Nyungwe Forest" },
  { path: "/lake-kivu", match: /kivu|gisenyi|rubavu/i, label: "Lake Kivu" },
  { path: "/kigali-tours", match: /kigali/i, label: "Kigali City Tours" },
];

export function landingPathForDestination(dest = {}) {
  const hay = `${dest.slug || ""} ${dest.name || ""}`;
  return KEYWORD_TOURS.find((t) => t.match.test(hay))?.path || "/destinations";
}

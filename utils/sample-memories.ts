import type { TemplateCreateInput } from "@/types/template.types";

export const SAMPLE_MEMORIES: TemplateCreateInput[] = [
  {
    content: `Subject: Design system handoff\n\nHi team,\n\nI wrapped the button and form primitives into a single package so new flows can share spacing, states, and accessibility patterns. The next step is wiring the tokens into marketing pages.\n\nBest,\nAri`,
    collections: ["Team Ops"],
    favorite: true
  },
  {
    content: `export async function fetchTemplates(query: string) {\n  const params = new URLSearchParams({ q: query });\n  const response = await fetch(\`/api/search?\${params.toString()}\`, { cache: "no-store" });\n  return response.json();\n}`,
    collections: ["Frontend"],
    pinned: true
  },
  {
    content: `Launch checklist\n\n- verify environment variables\n- run lint + typecheck\n- confirm search ranking on recent memories\n- export backup before deploy`,
    collections: ["Launches"]
  }
];

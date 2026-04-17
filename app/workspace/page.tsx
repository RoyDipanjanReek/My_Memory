import TemplateManager from "@/components/TemplateManager";
import { requireCurrentUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { getTemplates } from "@/services/template.service";
import type { ApiResponseMeta, TemplateRecord } from "@/types/template.types";

export default async function WorkspacePage() {
  const user = await requireCurrentUser();
  let initialTemplates: TemplateRecord[] = [];
  let initialMeta: ApiResponseMeta | undefined;
  const dbUnavailable = !isDatabaseConfigured();

  if (!dbUnavailable) {
    try {
      const result = await getTemplates(user, {
        includeArchived: true,
        limit: 24
      });
      initialTemplates = result.data;
      initialMeta = result.meta;
    } catch (error) {
      console.error("Failed to preload templates:", error);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <TemplateManager
        dbUnavailable={dbUnavailable}
        initialMeta={initialMeta}
        initialTemplates={initialTemplates}
      />
    </main>
  );
}

import { LegalPage } from "@/components/legal/LegalPage";
import { buildLegalMetadata } from "@/lib/seo/legal";

export const metadata = buildLegalMetadata("legal", "en");

export default function Page() {
  return <LegalPage locale="en" page="legal" />;
}

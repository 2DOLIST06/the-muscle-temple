import { LegalPage } from "@/components/legal/LegalPage";
import { buildLegalMetadata } from "@/lib/seo/legal";

export const metadata = buildLegalMetadata("medicalDisclaimer", "fr");

export default function Page() {
  return <LegalPage locale="fr" page="medicalDisclaimer" />;
}

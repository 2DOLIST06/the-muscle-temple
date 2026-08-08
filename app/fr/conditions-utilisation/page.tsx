import { LegalPage } from "@/components/legal/LegalPage";
import { buildLegalMetadata } from "@/lib/seo/legal";

export const metadata = buildLegalMetadata("terms", "fr");

export default function Page() {
  return <LegalPage locale="fr" page="terms" />;
}

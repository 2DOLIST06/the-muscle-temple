import { LegalPage } from "@/components/legal/LegalPage";
import { buildLegalMetadata } from "@/lib/seo/legal";

export const metadata = buildLegalMetadata("terms", "en");

export default function Page() {
  return <LegalPage locale="en" page="terms" />;
}

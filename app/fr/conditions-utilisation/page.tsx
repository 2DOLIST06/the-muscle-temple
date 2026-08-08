import { createLegalPage } from '@/components/legal/createLegalPage';

const legalPage = createLegalPage('terms', 'fr');

export const metadata = legalPage.metadata;
export default legalPage.LegalPage;

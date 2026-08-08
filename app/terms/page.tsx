import { createLegalPage } from '@/components/legal/createLegalPage';

const legalPage = createLegalPage('terms', 'en');

export const metadata = legalPage.metadata;
export default legalPage.LegalPage;

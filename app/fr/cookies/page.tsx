import { createLegalPage } from '@/components/legal/createLegalPage';

const legalPage = createLegalPage('cookies', 'fr');

export const metadata = legalPage.metadata;
export default legalPage.LegalPage;

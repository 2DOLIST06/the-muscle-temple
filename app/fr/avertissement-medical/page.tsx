import { createLegalPage } from '@/components/legal/createLegalPage';

const legalPage = createLegalPage('medical', 'fr');

export const metadata = legalPage.metadata;
export default legalPage.LegalPage;

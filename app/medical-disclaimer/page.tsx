import { createLegalPage } from '@/components/legal/createLegalPage';

const legalPage = createLegalPage('medical', 'en');

export const metadata = legalPage.metadata;
export default legalPage.LegalPage;

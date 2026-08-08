import { createLegalPage } from '@/components/legal/createLegalPage';

const legalPage = createLegalPage('affiliate', 'fr');

export const metadata = legalPage.metadata;
export default legalPage.LegalPage;

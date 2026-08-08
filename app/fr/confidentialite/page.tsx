import { createLegalPage } from '@/components/legal/createLegalPage';

const legalPage = createLegalPage('privacy', 'fr');

export const metadata = legalPage.metadata;
export default legalPage.LegalPage;

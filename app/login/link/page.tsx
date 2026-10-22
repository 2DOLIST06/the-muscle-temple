import { EmailLinkLogin } from '@/components/user/EmailLinkLogin';
export const metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() { return <EmailLinkLogin locale="en" />; }

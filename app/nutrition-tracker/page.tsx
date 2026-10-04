import type { Metadata } from 'next'; import { NutritionTracker } from '@/components/nutrition/NutritionTracker';
export const metadata: Metadata = { title: 'Nutrition tracker | Body Training Guide', robots: { index: false, follow: false } };
export default function Page() { return <NutritionTracker locale="en" />; }

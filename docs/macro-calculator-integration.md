# MacroCalculator integration

The easiest way to add the calculator inside an article is to insert this shortcode exactly where it should appear:

```html
[[macro-calculator]]
```

In the admin rich-text editor, click the **Calculatrice macros** toolbar button to insert the shortcode automatically. The public article renderer replaces the shortcode with the React `MacroCalculator` component.

You can also use the component directly in React/TSX pages:

```tsx
import { MacroCalculator } from '@/components/calculators/MacroCalculator';

export function ArticleBody() {
  return (
    <article>
      <h1>Macros en musculation</h1>
      <MacroCalculator locale="fr" />
      <MacroCalculator locale="en-CA" headingLevel="h3" hideTitle={false} />
    </article>
  );
}
```

## Calculation choices

- BMR uses the Mifflin-St Jeor formula.
- Maintenance calories are BMR multiplied by the selected activity factor.
- Target calories use conservative goal adjustments: maintenance, +5%, +10%, or -15%.
- Protein and fat are calculated per kilogram of body weight; carbs use the remaining calories.

## Easy-to-edit coefficients

Update these constants in `components/calculators/MacroCalculator.tsx`:

- `activityFactors` for activity multipliers.
- `goalAdjustments` for calorie surplus/deficit targets.
- `macroCoefficients` for protein and fat grams per kilogram.
- `translations` for visible French, English, and Canadian English copy.

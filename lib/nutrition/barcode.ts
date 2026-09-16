export type UniversalSearchInput =
  | { kind: 'empty' }
  | { kind: 'barcode'; value: string }
  | { kind: 'invalid-barcode'; value: string }
  | { kind: 'text'; value: string };

const hasValidGtinCheckDigit = (value: string) => {
  const digits = [...value].map(Number);
  const checkDigit = digits.pop();
  const sum = digits.reduce(
    (total, digit, index) => total + digit * ((digits.length - index) % 2 === 1 ? 3 : 1),
    0,
  );
  return checkDigit === (10 - (sum % 10)) % 10;
};

const hasValidUpcECheckDigit = (value: string) => {
  if (!/^[01]\d{7}$/.test(value)) return false;
  const [numberSystem, first, second, third, fourth, fifth, sixth, checkDigit] = value;
  let upcABody: string;

  if ('012'.includes(sixth)) upcABody = `${numberSystem}${first}${second}${sixth}0000${third}${fourth}${fifth}`;
  else if (sixth === '3') upcABody = `${numberSystem}${first}${second}${third}00000${fourth}${fifth}`;
  else if (sixth === '4') upcABody = `${numberSystem}${first}${second}${third}${fourth}00000${fifth}`;
  else upcABody = `${numberSystem}${first}${second}${third}${fourth}${fifth}0000${sixth}`;

  return hasValidGtinCheckDigit(`${upcABody}${checkDigit}`);
};

export const isSupportedBarcode = (value: string) => {
  if (!/^\d+$/.test(value)) return false;
  if (value.length === 13 || value.length === 12) return hasValidGtinCheckDigit(value);
  if (value.length === 8) return hasValidGtinCheckDigit(value) || hasValidUpcECheckDigit(value);
  return false;
};

/** Classifies one submitted value without triggering requests while the user types. */
export const classifyUniversalSearch = (rawValue: string): UniversalSearchInput => {
  const value = rawValue.trim();
  if (!value) return { kind: 'empty' };

  const compactValue = value.replace(/\s+/g, '');
  if (/^\d+$/.test(compactValue)) {
    return isSupportedBarcode(compactValue)
      ? { kind: 'barcode', value: compactValue }
      : { kind: 'invalid-barcode', value: compactValue };
  }

  return { kind: 'text', value };
};

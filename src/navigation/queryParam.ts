/** Expo Router search params are `string | string[]` at runtime. */
export function firstQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

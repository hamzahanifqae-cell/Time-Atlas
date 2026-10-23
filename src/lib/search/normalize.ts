/** Lowercases and strips diacritics so "São Paulo" matches "sao paulo", "Zürich" matches
 *  "zurich", etc. — used for both indexing and querying so comparisons stay consistent. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

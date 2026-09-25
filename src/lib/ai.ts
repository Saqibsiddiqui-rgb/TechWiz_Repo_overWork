/**
 * Campus Coin "AI" categorization assistant.
 * Keyword lists come from the category_keywords table (admins edit them in Admin → Categories),
 * and the student's own corrections (category_corrections table) always win.
 * Suggestions are advisory: the student can always override.
 */
export interface Suggestion { categoryId: string; confidence: number; learned: boolean }

export function suggestCategory(
  description: string,
  type: 'income' | 'expense',
  corrections: Record<string, string>,
  validIds: string[],
  keywords: Record<string, string[]>,
): Suggestion | null {
  const text = description.trim().toLowerCase();
  if (text.length < 3) return null;

  // 1) Learned corrections always win: the student taught us this one.
  const learnedKey = Object.keys(corrections).find((k) => text.includes(k) || k.includes(text));
  if (learnedKey && validIds.includes(corrections[learnedKey])) {
    return { categoryId: corrections[learnedKey], confidence: 0.97, learned: true };
  }

  // 2) Keyword model
  let best: Suggestion | null = null;
  for (const [cat, words] of Object.entries(keywords)) {
    if (!validIds.includes(cat)) continue;
    const hits = words.filter((w) => text.includes(w.toLowerCase())).length;
    if (hits && (!best || hits > best.confidence)) best = { categoryId: cat, confidence: hits, learned: false };
  }
  if (!best) return type === 'income' && validIds.includes('other-income') ? { categoryId: 'other-income', confidence: 0.4, learned: false } : null;
  return { ...best, confidence: Math.min(0.95, 0.72 + best.confidence * 0.1) };
}

/** Normalises a description into a correction key, e.g. "Campus Cafe #2" -> "campus cafe" */
export const correctionKey = (description: string) =>
  description.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 2).join(' ');

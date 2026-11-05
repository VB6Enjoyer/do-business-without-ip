/**
 * Maximum copyright terms used by the timeline. Simplified on purpose:
 * renewal terms are counted as if always renewed, and the interim extensions
 * of 1962–1974 are left out. Source: U.S. Copyright Office, Circular 15A.
 */
export interface TermLaw {
  /** Year the term took effect. */
  year: number;
  /** Key into the UI strings for the law's name and description. */
  key: '1710' | '1790' | '1831' | '1909' | '1978' | '1998';
  /** United States, or the British statute shown for context. */
  jurisdiction: 'GB' | 'US';
  /** Fixed maximum term in years (pre-1978 laws). */
  fixed?: number;
  /** Years after the author's death (individual authors, 1978 onward). */
  postMortem?: number;
  /** Fixed term for works made for hire (1978 onward). */
  forHire?: number;
}

export const LAWS: TermLaw[] = [
  { year: 1710, key: '1710', jurisdiction: 'GB', fixed: 28 },
  { year: 1790, key: '1790', jurisdiction: 'US', fixed: 28 },
  { year: 1831, key: '1831', jurisdiction: 'US', fixed: 42 },
  { year: 1909, key: '1909', jurisdiction: 'US', fixed: 56 },
  { year: 1978, key: '1978', jurisdiction: 'US', postMortem: 50, forHire: 75 },
  { year: 1998, key: '1998', jurisdiction: 'US', postMortem: 70, forHire: 95 },
];

export type WorkKind = 'author' | 'hire';

export interface AuthorAssumption {
  /** Author's age when the work is created. */
  ageAtCreation: number;
  /** Age at which the author dies. */
  ageAtDeath: number;
}

/** Maximum protection, in years from creation, under a given law. */
export function termYears(law: TermLaw, kind: WorkKind, author: AuthorAssumption): number {
  if (law.fixed !== undefined) return law.fixed;
  if (kind === 'hire') return law.forHire!;
  const remainingLife = Math.max(0, author.ageAtDeath - author.ageAtCreation);
  return remainingLife + law.postMortem!;
}

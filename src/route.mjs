// Reference implementation of the MoreTokens decision table.
// The skill makes this decision with the model; this file is the testable spec.
// Tabla de decisión de MoreTokens: la skill la aplica con el modelo; este archivo es la especificación comprobable.

export const DELEGATION_THRESHOLD_WORDS = 3000;

/**
 * @param {object} t
 * @param {number} t.words       total words of material to read
 * @param {boolean} t.fullRead   answer needs the whole material (not just a search)
 * @param {'none'|'some'|'high'} t.judgment  judgment needed while reading
 * @param {boolean} t.decision   task ends in a decision, plan or recommendation
 * @returns {{helper: 'lean'|'mid'|null, decider: 'current'|'deep'}}
 */
export function route({ words, fullRead, judgment = 'none', decision = false }) {
  if (!Number.isFinite(words) || words < 0) throw new RangeError('words must be a non-negative number');
  if (!['none', 'some', 'high'].includes(judgment)) throw new RangeError('judgment must be none|some|high');

  let helper = null;
  if (fullRead && words >= DELEGATION_THRESHOLD_WORDS) {
    helper = judgment === 'none' ? 'lean' : 'mid';
  }
  return { helper, decider: decision ? 'deep' : 'current' };
}

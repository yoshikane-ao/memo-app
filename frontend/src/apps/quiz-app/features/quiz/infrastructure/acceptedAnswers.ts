const STORAGE_KEY = "quiz-accepted-answers";

/**
 * Persist user-accepted answers for the best-answer format.
 *
 * Structure: { [quizId: number]: string[] }
 * Each quiz can have multiple accepted answers (the original correct answer
 * is always accepted implicitly, so only non-standard answers are stored).
 */

type AcceptedAnswersMap = Record<number, string[]>;

const load = (): AcceptedAnswersMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AcceptedAnswersMap) : {};
  } catch {
    return {};
  }
};

const save = (map: AcceptedAnswersMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

/** Add a user-accepted answer for a quiz. Duplicates are ignored. */
export const addAcceptedAnswer = (quizId: number, answer: string): void => {
  const map = load();
  const existing = map[quizId] ?? [];
  if (!existing.includes(answer)) {
    map[quizId] = [...existing, answer];
    save(map);
  }
};

/** Check whether the given answer is accepted for a quiz. */
export const isAcceptedAnswer = (
  quizId: number,
  answer: string,
  standardCorrect: string,
): boolean => {
  if (answer === standardCorrect) return true;
  const map = load();
  return (map[quizId] ?? []).includes(answer);
};

import type { MatchingPair, MultipleCorrectPair, QuizItem } from "../model/quiz.types";

const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const pickRandom = <T>(array: T[], count: number): T[] => {
  const shuffled = shuffle(array);
  return shuffled.slice(0, count);
};

/**
 * Extract the answer-side text from a quiz item based on the effective direction.
 */
const getAnswerText = (
  item: QuizItem,
  direction: "word-to-meaning" | "meaning-to-word",
): string => (direction === "word-to-meaning" ? item.mean : item.word);

/**
 * Generate four shuffled choices for a four-choice question.
 * Returns exactly 4 strings: 1 correct + up to 3 distractors.
 * If the pool is too small, duplicates are avoided and fewer distractors are used.
 */
export const generateFourChoices = (
  correctItem: QuizItem,
  pool: QuizItem[],
  direction: "word-to-meaning" | "meaning-to-word",
): string[] => {
  const correctText = getAnswerText(correctItem, direction);
  const distractorPool = pool.filter(
    (item) => item.id !== correctItem.id && getAnswerText(item, direction) !== correctText,
  );
  const distractors = pickRandom(distractorPool, 3).map((item) =>
    getAnswerText(item, direction),
  );
  return shuffle([correctText, ...distractors]);
};

/**
 * Prepare a true-false question.
 * Randomly decides whether to show the correct or an incorrect answer.
 * Returns the displayed answer text and whether the statement is actually correct.
 */
export const generateTrueFalseStatement = (
  correctItem: QuizItem,
  pool: QuizItem[],
  direction: "word-to-meaning" | "meaning-to-word",
): { shownAnswer: string; isStatementCorrect: boolean } => {
  const correctText = getAnswerText(correctItem, direction);
  const isCorrect = Math.random() < 0.5;

  if (isCorrect) {
    return { shownAnswer: correctText, isStatementCorrect: true };
  }

  const distractorPool = pool.filter(
    (item) => item.id !== correctItem.id && getAnswerText(item, direction) !== correctText,
  );

  if (distractorPool.length === 0) {
    // Not enough distractors; fall back to a correct statement.
    return { shownAnswer: correctText, isStatementCorrect: true };
  }

  const wrongItem = pickRandom(distractorPool, 1)[0];
  return { shownAnswer: getAnswerText(wrongItem, direction), isStatementCorrect: false };
};

const getPromptText = (
  item: QuizItem,
  direction: "word-to-meaning" | "meaning-to-word",
): string => (direction === "word-to-meaning" ? item.word : item.mean);

/**
 * Generate multiple-correct pairs for a batch question.
 * Takes an anchor item + additional items from the pool to create 5 pairs.
 * 2–3 pairs are correctly matched; the rest have swapped answers.
 */
export const generateMultipleCorrectPairs = (
  anchorItem: QuizItem,
  pool: QuizItem[],
  direction: "word-to-meaning" | "meaning-to-word",
): MultipleCorrectPair[] => {
  const others = pool.filter((item) => item.id !== anchorItem.id);
  const batchOthers = pickRandom(others, Math.min(4, others.length));
  const batchItems = [anchorItem, ...batchOthers];

  // Decide which items are correctly paired (2–3 out of batch)
  const correctCount = Math.min(
    batchItems.length,
    Math.max(2, Math.floor(Math.random() * 2) + 2), // 2 or 3
  );
  const shuffledBatch = shuffle(batchItems);
  const correctSet = new Set(shuffledBatch.slice(0, correctCount).map((i) => i.id));

  // Build wrong-answer pool (answers from items NOT in the batch)
  const outsidePool = pool.filter((item) => !batchItems.some((b) => b.id === item.id));

  return shuffle(
    batchItems.map((item) => {
      const isCorrect = correctSet.has(item.id);
      if (isCorrect) {
        return {
          prompt: getPromptText(item, direction),
          answer: getAnswerText(item, direction),
          isCorrect: true,
        };
      }
      // Pick a wrong answer from outside the batch, or from other batch items
      const wrongPool = outsidePool.length > 0 ? outsidePool : others;
      const wrongItem = pickRandom(
        wrongPool.filter((w) => getAnswerText(w, direction) !== getAnswerText(item, direction)),
        1,
      )[0];
      return {
        prompt: getPromptText(item, direction),
        answer: wrongItem
          ? getAnswerText(wrongItem, direction)
          : getAnswerText(item, direction),
        isCorrect: !wrongItem, // fallback to correct if no distractor available
      };
    }),
  );
};

/**
 * Generate matching pairs for a batch question.
 * Returns 4–5 pairs: prompts in order, answers shuffled separately.
 */
export const generateMatchingPairs = (
  anchorItem: QuizItem,
  pool: QuizItem[],
  direction: "word-to-meaning" | "meaning-to-word",
): MatchingPair[] => {
  const others = pool.filter((item) => item.id !== anchorItem.id);
  const batchOthers = pickRandom(others, Math.min(3, others.length));
  const batchItems = shuffle([anchorItem, ...batchOthers]);

  return batchItems.map((item) => ({
    id: String(item.id),
    promptText: getPromptText(item, direction),
    answerText: getAnswerText(item, direction),
  }));
};

/**
 * Generate four shuffled choices for a best-answer question.
 * Identical to four-choice generation — the difference is in how answers are judged.
 */
export const generateBestAnswerChoices = generateFourChoices;

// ── Written format generators ──

/**
 * Create a fill-in-blank display string from the correct answer.
 * Reveals the first character and replaces the rest with blanks.
 * For single-character answers, shows the full character (no blank possible).
 */
export const generateFillInBlank = (correctText: string): string => {
  const chars = [...correctText];
  if (chars.length <= 1) return correctText;
  const revealed = chars[0];
  const blanks = "\uff3f".repeat(chars.length - 1); // fullwidth low line
  return `${revealed}${blanks}`;
};

/**
 * Pick a wrong answer for error-correction format.
 * Returns a distractor text from the pool, or the correct text if no distractor is available.
 */
export const generateErrorCorrectionWrong = (
  correctItem: QuizItem,
  pool: QuizItem[],
  direction: "word-to-meaning" | "meaning-to-word",
): string => {
  const correctText = getAnswerText(correctItem, direction);
  const distractorPool = pool.filter(
    (item) => item.id !== correctItem.id && getAnswerText(item, direction) !== correctText,
  );
  if (distractorPool.length === 0) return correctText;
  return getAnswerText(pickRandom(distractorPool, 1)[0], direction);
};

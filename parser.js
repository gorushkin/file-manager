export const parseInput = (str) => {
  const list = str.trim().split('');
  let isWordOpen = false;
  let isQuoteOpen = false;
  const res = list.reduce(
    (acc, char, i, array) => {
      const prev = array[i - 1];
      const next = array[i + 1];

      if (isWordOpen) {
        if (i === array.length - 1) {
          isWordOpen = false;
          acc.word.push(char);
          acc.words.push(acc.word.join(''));
          acc.word = [];
          return acc;
        }
        if (char === ' ') {
          isWordOpen = false;
          acc.words.push(acc.word.join(''));
          acc.word = [];
          return acc;
        }
        acc.word.push(char);
        return acc;
      }

      if (isQuoteOpen) {
        if (char === '"' && (next === ' ' || next === undefined)) {
          isQuoteOpen = false;
          acc.words.push(acc.word.join(''));
          acc.word = [];
          return acc;
        }
        acc.word.push(char);
        return acc;
      }

      if (!isWordOpen && !isQuoteOpen) {
        if (char === '"') {
          if (prev === ' ' || prev === undefined) isQuoteOpen = true;
          return acc;
        }
        if (char === ' ') {
          if (next === '"') return acc;
          isWordOpen = true;
          return acc;
        }
        isWordOpen = true;
        acc.word.push(char);
        return acc;
      }
    },
    { words: [], word: [] }
  );

  return res.words;
};

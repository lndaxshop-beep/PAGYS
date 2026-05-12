export const computeDiff = (oldText, newText) => {
  if (oldText === newText) return [];
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diff = [];

  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  let i = 0, j = 0;
  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      diff.push({ type: 'same', text: oldWords[i] });
      i++; j++;
    } else {
      const lookAhead = 5;
      let found = false;
      for (let k = 1; k <= lookAhead && j + k < newWords.length; k++) {
        if (oldWords[i] === newWords[j + k]) {
          for (let l = 0; l < k; l++) {
            diff.push({ type: 'add', text: newWords[j + l] });
          }
          j += k;
          found = true;
          break;
        }
      }
      if (!found) {
        for (let k = 1; k <= lookAhead && i + k < oldWords.length; k++) {
          if (oldWords[i + k] === newWords[j]) {
            for (let l = 0; l < k; l++) {
              diff.push({ type: 'remove', text: oldWords[i + l] });
            }
            i += k;
            found = true;
            break;
          }
        }
      }
      if (!found) {
        if (i < oldWords.length && j < newWords.length) {
          diff.push({ type: 'replace', oldText: oldWords[i], newText: newWords[j] });
          i++; j++;
        } else if (i < oldWords.length) {
          diff.push({ type: 'remove', text: oldWords[i] });
          i++;
        } else if (j < newWords.length) {
          diff.push({ type: 'add', text: newWords[j] });
          j++;
        } else break;
      }
    }
  }

  return diff;
};

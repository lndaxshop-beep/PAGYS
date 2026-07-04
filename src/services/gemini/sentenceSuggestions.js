const BANNED_REPLACEMENTS = {
  'furthermore': ['also', 'beyond this', 'in addition'],
  'moreover': ['in addition', 'beyond this'],
  'additionally': ['another key point is that', 'beyond this'],
  'consequently': ['because of this', 'as a result'],
  'thus': ['therefore', 'as such', 'given this'],
  'hence': ['therefore', 'as a result'],
  'in conclusion': ['overall', 'taken together', 'looking broadly'],
  'it is important to note that': ['importantly,', 'notably,', ''],
  'it is worth noting that': ['importantly,', 'notably,', ''],
  'it should be noted that': ['importantly,', 'notably,', ''],
  'this study aims to': ['the goal of this work is to', 'this research seeks to'],
  'this research aims to': ['the goal of this work is to', 'this study seeks to'],
  'the aim of this research': ['this work aims to', 'this research targets'],
  'the purpose of this study': ['this study targets', 'this work investigates'],
  'plays a crucial role in': ['influences', 'shapes', 'underpins'],
  'plays a significant role in': ['influences', 'shapes'],
  'plays a vital role in': ['is central to', 'underpins'],
  'in today\'s rapidly evolving society': ['in the current landscape', 'recently,'],
  'in this contemporary world': ['currently', 'in the present context'],
  'a myriad of': ['many', 'numerous', 'countless'],
  'a plethora of': ['many', 'an abundance of'],
  'delves into': ['examines', 'explores', 'investigates'],
  'this highlights': ['this demonstrates', 'this illustrates'],
  'this underscores': ['this reinforces', 'this confirms'],
  'this emphasizes': ['this highlights', 'this stresses'],
  'in recent years': ['recently', 'over the past several years'],
  'there has been a growing interest in': ['interest has grown in', 'researchers have increasingly focused on'],
  'has become increasingly important': ['has grown in importance', 'matters more than ever'],
  'has gained significant attention': ['has drawn considerable attention', 'has become a focus of'],
  'navigates the complexities of': ['addresses the complexities of', 'works through'],
  'paves the way for': ['enables', 'allows for', 'creates conditions for'],
  'sets the stage for': ['prepares the ground for', 'establishes a basis for'],
};

const FORMAL_OPENING_ALTERNATIVES = {
  'this': ['Notably,', 'Importantly,', 'Specifically,', 'In practice,', 'As observed,'],
  'these': ['Several', 'A range of', 'Multiple', 'Diverse'],
  'that': ['Specifically,', 'In this context,', 'For instance,', 'As noted,'],
  'the': ['A critical', 'An important', 'A notable', 'One key'],
  'however': ['By contrast,', 'Conversely,', 'At the same time,', 'Nevertheless,'],
  'therefore': ['Given this,', 'As such,', 'On this basis,', 'From this perspective,'],
  'thus': ['Consequently,', 'As a result,', 'On these grounds,'],
};

const HEDGING_INSERTIONS = [
  ' it should be noted, ',
  ' arguably, ',
  ' in many cases, ',
  ' to some extent, ',
  ' broadly speaking, ',
];

const CONTRACTION_MAP = [
  ['do not', "don't"],
  ['does not', "doesn't"],
  ['did not', "didn't"],
  ['is not', "isn't"],
  ['are not', "aren't"],
  ['was not', "wasn't"],
  ['were not', "weren't"],
  ['has not', "hasn't"],
  ['have not', "haven't"],
  ['had not', "hadn't"],
  ['will not', "won't"],
  ['would not', "wouldn't"],
  ['cannot', "can't"],
  ['could not', "couldn't"],
  ['should not', "shouldn't"],
  ['might not', "mightn't"],
  ['it is', "it's"],
  ['that is', "that's"],
  ['there is', "there's"],
  ['what is', "what's"],
];

export const generateSuggestions = (sentence, flags, bannedPhrases, openingCategory) => {
  const alternatives = [];

  if (flags.includes('banned_phrase') && bannedPhrases.length > 0) {
    let fix1 = sentence;
    let fix2 = sentence;
    let usedFirst = false;
    let usedSecond = false;
    for (const bp of bannedPhrases) {
      const replacements = BANNED_REPLACEMENTS[bp.toLowerCase()];
      if (!replacements || replacements.length === 0) continue;
      const idx = fix1.toLowerCase().indexOf(bp.toLowerCase());
      if (idx < 0) continue;
      const before = fix1.slice(0, idx);
      const after = fix1.slice(idx + bp.length);
      if (!usedFirst) {
        fix1 = before + replacements[0] + after;
        usedFirst = true;
      } else if (replacements.length > 1 && !usedSecond) {
        fix2 = sentence.replace(new RegExp(bp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), replacements[1]);
        usedSecond = true;
      }
    }
    if (fix1 !== sentence) alternatives.push(fix1);
    if (fix2 !== sentence && fix2 !== fix1) alternatives.push(fix2);
  }

  if (flags.includes('formal_opening')) {
    const trimmed = sentence.trim();
    const words = trimmed.split(/\s+/);
    const firstWord = (words[0] || '').toLowerCase();
    const starters = FORMAL_OPENING_ALTERNATIVES[firstWord];
    if (starters) {
      const rest = words.slice(firstWord === 'this' || firstWord === 'that' || firstWord === 'these' || firstWord === 'the' ? 1 : 1).join(' ');
      for (const starter of starters.slice(0, 2)) {
        const alt = starter + ' ' + rest;
        if (alt !== sentence && !alternatives.includes(alt)) alternatives.push(alt);
      }
    }
  }

  if (flags.includes('low_perplexity') && sentence.length > 40) {
    const insertIdx = Math.floor(sentence.length * 0.35);
    const before = sentence.slice(0, insertIdx);
    const after = sentence.slice(insertIdx);
    const hedge = HEDGING_INSERTIONS[Math.floor(Math.random() * HEDGING_INSERTIONS.length)];
    const hedgeAlt = before + hedge + after;
    if (hedgeAlt !== sentence && !alternatives.includes(hedgeAlt)) alternatives.push(hedgeAlt);

    let contracted = sentence;
    for (const [full, short] of CONTRACTION_MAP) {
      const re = new RegExp(`\\b${full}\\b`, 'gi');
      if (re.test(contracted)) {
        contracted = contracted.replace(re, short);
        break;
      }
    }
    if (contracted !== sentence && !alternatives.includes(contracted)) alternatives.push(contracted);
  }

  if (flags.includes('repetitive_structure') && sentence.length > 30) {
    const splitIdx = Math.floor(sentence.length / 2);
    const firstHalf = sentence.slice(0, splitIdx).trim();
    const secondHalf = sentence.slice(splitIdx).trim();
    if (firstHalf.length > 10 && secondHalf.length > 10) {
      const reorder = secondHalf + ', ' + firstHalf.charAt(0).toLowerCase() + firstHalf.slice(1);
      if (reorder !== sentence && !alternatives.includes(reorder)) alternatives.push(reorder);
    }
  }

  const seen = new Set([sentence]);
  return alternatives.filter(a => {
    const normalized = a.trim().toLowerCase();
    if (seen.has(normalized) || a.trim().length < 10) return false;
    seen.add(normalized);
    return true;
  }).slice(0, 3).map(a => a.trim());
};

export const enrichSentencesWithSuggestions = (sentences) => {
  return sentences.map((s, idx) => {
    if (s.aiProbability > 0.5) {
      const suggestions = generateSuggestions(s.text, s.flags, s.bannedPhrases, s.openingCategory);
      return { ...s, suggestions, index: idx };
    }
    return { ...s, suggestions: [], index: idx };
  });
};

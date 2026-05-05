import { GoogleGenerativeAI } from "@google/generative-ai";

export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const genAI = new GoogleGenerativeAI(API_KEY);
export const MODEL = "gemini-2.5-flash";

export const WORD_COUNT_PRESETS = {
  undergraduate: {
    proposal: { min: 1000, max: 1500 }, chapter1: { min: 1000, max: 1800 },
    chapter2: { min: 2500, max: 4000 }, chapter3: { min: 1500, max: 2500 },
    chapter4: { min: 1500, max: 3000 }, chapter5: { min: 1000, max: 2000 }
  },
  masters: {
    proposal: { min: 1500, max: 2000 }, chapter1: { min: 1500, max: 2500 },
    chapter2: { min: 4000, max: 7000 }, chapter3: { min: 2500, max: 4000 },
    chapter4: { min: 3000, max: 5000 }, chapter5: { min: 2500, max: 4000 }
  },
  phd: {
    proposal: { min: 2000, max: 3000 }, chapter1: { min: 4000, max: 6000 },
    chapter2: { min: 15000, max: 25000 }, chapter3: { min: 8000, max: 12000 },
    chapter4: { min: 10000, max: 20000 }, chapter5: { min: 10000, max: 15000 }
  }
};

export const getWordCountPreset = (level, chapterId) => {
  return WORD_COUNT_PRESETS[level]?.[chapterId] || { min: 1000, max: 2000 };
};

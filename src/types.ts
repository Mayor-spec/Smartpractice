export interface QuizQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export type QuizCategory = 'General Affairs' | 'Governance & OAU History' | 'Sports' | 'Entertainment';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuizSetup {
  category: QuizCategory;
  difficulty: QuizDifficulty;
  count: number;
}

export interface ScoreRecord {
  id: string;
  category: QuizCategory;
  difficulty: QuizDifficulty;
  score: number;
  total: number;
  date: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Topic {
  id: string;
  name: string;
  description: string;
}

export interface TopicCategory {
  category: string;
  color: string;
  topics: Topic[];
}

export interface MCQQuestion {
  id: string;
  type: 'mcq';
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ShortAnswerQuestion {
  id: string;
  type: 'short_answer';
  question: string;
  rubric: string;
}

export type Question = MCQQuestion | ShortAnswerQuestion;

export interface MCQAnswer {
  questionId: string;
  type: 'mcq';
  selectedIndex: number | null;
}

export interface ShortAnswer {
  questionId: string;
  type: 'short_answer';
  text: string;
}

export type Answer = MCQAnswer | ShortAnswer;

export interface QuestionFeedback {
  questionId: string;
  isCorrect: boolean;
  score: number;
  annotation: string;
  strengths: string[];
  weaknesses: string[];
  modelAnswer: string;
}

export interface EvaluationResult {
  feedback: QuestionFeedback[];
  totalScore: number;
  questionsCorrect: number;
  totalQuestions: number;
}

export interface QuizSession {
  id: string;
  topicId: string;
  topic: string;
  difficulty: Difficulty;
  questions: Question[];
  answers: Answer[];
  evaluation: EvaluationResult;
  date: string;
}

export interface HistoryEntry {
  id: string;
  topicId: string;
  topic: string;
  difficulty: Difficulty;
  date: string;
  score: number;
  questionsCorrect: number;
  totalQuestions: number;
}

export interface VideoResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

export interface GeneratedContent {
  text: string;
  quiz?: Question[];
  suggestions?: string[];
  videos?: VideoResult[];
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

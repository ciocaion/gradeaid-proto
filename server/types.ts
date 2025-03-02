export interface VideoResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

export interface GameData {
  type: 'quiz' | 'matching' | 'sorting';
  title: string;
  description: string;
  config: {
    items: Array<{
      id: string;
      value: string;
      matches?: string;
      correctPosition?: number;
    }>;
    instructions: string;
  };
}

export interface GeneratedContent {
  text: string;
  quiz?: Question[];
  suggestions?: string[];
  videos?: VideoResult[];
  game?: GameData;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}
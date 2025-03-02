import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedContent {
  text: string;
  quiz?: Question[];
  suggestions?: string[];
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export async function generateLearningContent(subject: string, style: string, specialNeeds?: string): Promise<GeneratedContent> {
  const prompt = `
    Generate educational content about "${subject}" adapted for a ${style} learning style.
    ${specialNeeds ? `Consider these special needs: ${specialNeeds}` : ''}

    Respond with JSON in this format:
    {
      "text": "main educational content",
      "quiz": [
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": 0
        }
      ],
      "suggestions": ["practical activity 1", "practical activity 2"]
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert educational content creator skilled in Universal Design for Learning principles."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content || '{"text": "Failed to generate content"}';
  return JSON.parse(content) as GeneratedContent;
}

export async function generateFeedback(userResponse: string, subject: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a supportive educational assistant. Provide constructive feedback."
      },
      {
        role: "user",
        content: `Subject: ${subject}\nStudent response: ${userResponse}\nProvide encouraging feedback:`
      }
    ]
  });

  return response.choices[0].message.content || "Thank you for your response.";
}
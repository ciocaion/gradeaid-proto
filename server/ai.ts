import OpenAI from "openai";
import { fetchEducationalShorts } from "./youtube";
import type { GeneratedContent, VideoResult, GameData } from "./types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLearningContent(subject: string, style: string, specialNeeds?: string): Promise<GeneratedContent> {
  try {
    // Fetch relevant YouTube shorts first
    const videos = await fetchEducationalShorts(subject);

    const prompt = `
      Generate educational content about "${subject}" adapted for a ${style} learning style.
      ${specialNeeds ? `Consider these special needs: ${specialNeeds}` : ''}
      Consider that we are providing Danish language YouTube content, so adjust the suggestions and activities to align with Danish cultural context when possible.

      Include an interactive game related to the subject. Choose either a matching game (matching related concepts) or a sorting game (arranging items in correct order).

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
        "suggestions": ["practical activity 1", "practical activity 2"],
        "game": {
          "type": "matching OR sorting",
          "title": "game title",
          "description": "brief game description",
          "config": {
            "instructions": "game instructions",
            "items": [
              {
                "id": "1",
                "value": "item text",
                "matches": "matching item text (for matching game)",
                "correctPosition": 0 //for sorting game
              }
            ]
          }
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator skilled in Universal Design for Learning principles, with knowledge of Danish educational context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content || '{"text": "Failed to generate content"}');

    // Add the videos to the content
    return {
      ...content,
      videos
    };
  } catch (error) {
    console.error('Error generating content:', error);
    return {
      text: "Failed to generate content. Please try again.",
      videos: []
    };
  }
}

export async function generateFeedback(userResponse: string, subject: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a supportive educational assistant with knowledge of Danish educational context. Provide constructive feedback."
      },
      {
        role: "user",
        content: `Subject: ${subject}\nStudent response: ${userResponse}\nProvide encouraging feedback:`
      }
    ]
  });

  return response.choices[0].message.content || "Thank you for your response.";
}
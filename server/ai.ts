import OpenAI from "openai";
import { fetchEducationalShorts } from "./youtube";
import type { GeneratedContent, VideoResult, GameData } from "./types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLearningContent(
  subject: string, 
  style: string, 
  preferences?: { 
    preferredDemonstration?: string, 
    highContrast?: boolean, 
    voiceEnabled?: boolean,
    language?: 'en' | 'da'
  }
): Promise<GeneratedContent> {
  try {
    // Fetch relevant YouTube shorts first
    const videos = await fetchEducationalShorts(subject, preferences?.language === 'da');

    const prompt = `
      Generate educational content about "${subject}" specifically adapted for a ${style} learning style.
      The content should be in ${preferences?.language === 'da' ? 'Danish' : 'English'}.
      The student prefers to demonstrate learning through ${preferences?.preferredDemonstration || 'quizzes'}.
      ${preferences?.highContrast ? 'Content should be optimized for high contrast visibility.' : ''}
      ${preferences?.voiceEnabled ? 'Include audio-friendly content descriptions.' : ''}
      ${preferences?.language === 'da' ? 'Content should use Danish educational terminology and cultural references.' : ''}

      Include an educational Snake game where players collect correct items related to the topic.
      The game should have at least 5 correct items and 3 incorrect items that the snake can collect.

      Based on the learning style (${style}), emphasize:
      ${style === 'visual' ? '- More diagrams and visual explanations\n- Visual metaphors and examples' : ''}
      ${style === 'auditory' ? '- Spoken explanations and discussions\n- Musical or rhythmic memory aids' : ''}
      ${style === 'interactive' ? '- Hands-on activities and experiments\n- Interactive simulations' : ''}
      ${style === 'reading' ? '- Detailed written explanations\n- Text-based examples and case studies' : ''}

      Based on preferred demonstration (${preferences?.preferredDemonstration}), include:
      ${preferences?.preferredDemonstration === 'quiz' ? '- More practice questions\n- Self-assessment opportunities' : ''}
      ${preferences?.preferredDemonstration === 'project' ? '- Project ideas and guidelines\n- Step-by-step creation guides' : ''}
      ${preferences?.preferredDemonstration === 'discussion' ? '- Discussion topics and prompts\n- Debate scenarios' : ''}
      ${preferences?.preferredDemonstration === 'writing' ? '- Writing prompts and outlines\n- Essay structure suggestions' : ''}

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
          "type": "snake",
          "title": "game title",
          "description": "brief game description",
          "config": {
            "instructions": "game instructions",
            "gridSize": 20,
            "speed": 150,
            "items": [
              {
                "id": "1",
                "value": "correct item text",
                "isCorrect": true,
                "points": 10
              },
              {
                "id": "2",
                "value": "incorrect item text",
                "isCorrect": false,
                "points": -5
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

export async function analyzeActivityImage(imageBase64: string, subject: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a supportive and encouraging educational assistant analyzing student work. Provide constructive, positive feedback that acknowledges effort and suggests gentle improvements. Keep feedback friendly and suitable for children."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this student's work related to learning ${subject}. Provide encouraging feedback and gentle suggestions for improvement if needed.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    });

    return response.choices[0].message.content || "Great work! Keep practicing!";
  } catch (error) {
    console.error('Error analyzing image:', error);
    return "I had trouble seeing your work clearly. Could you try uploading a clearer picture?";
  }
}
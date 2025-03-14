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
      Create a bite-sized, engaging learning sequence about "${subject}" for a ${style} learner.
      The content should be in ${preferences?.language === 'da' ? 'Danish' : 'English'}.
      Make it similar to Duolingo's approach: short, focused, and progressive.

      Structure the content in this sequence:
      1. Quick Introduction (2-3 short sentences max)
      2. Key Concept (1 main point with a simple example)
      3. Mini-Quiz (2-3 quick questions)
      4. Practice Activity (interactive element)
      5. Game Challenge (simple snake game)

      Learning style adaptation (${style}):
      ${style === 'visual' ? '- Use emojis and simple diagrams\n- Include visual patterns' : ''}
      ${style === 'auditory' ? '- Include rhythmic patterns\n- Use sound-based examples' : ''}
      ${style === 'interactive' ? '- Add hands-on mini-exercises\n- Include real-world connections' : ''}
      ${style === 'reading' ? '- Short, clear text blocks\n- Simple word associations' : ''}

      The game should be a snake game where players collect correct items and avoid incorrect ones.
      Make the game items directly related to the subject being taught.
      
      Keep ALL text extremely concise and engaging, using emojis where appropriate.
      Make it feel like a game, not a lecture.

      Respond with JSON in this format:
      {
        "text": "Introduction (2-3 sentences) + Key Concept (1 main point)",
        "quiz": [
          {
            "question": "short, engaging question",
            "options": ["option 1", "option 2", "option 3"],
            "correctAnswer": 0,
            "explanation": "brief explanation"
          }
        ],
        "practice": {
          "type": "interactive",
          "description": "brief activity description",
          "steps": ["step 1", "step 2"]
        },
        "game": {
          "type": "snake",
          "title": "Snake Learning Game",
          "description": "Collect the correct items with your snake!",
          "config": {
            "instructions": "Use arrow keys to move. Collect correct items, avoid wrong ones!",
            "gridSize": 20,
            "speed": 150,
            "items": [
              {
                "id": "1",
                "value": "correct item 1",
                "isCorrect": true,
                "points": 10
              },
              {
                "id": "2",
                "value": "incorrect item 1",
                "isCorrect": false,
                "points": -5
              }
            ]
          }
        }
      }"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in creating engaging, bite-sized educational content similar to Duolingo. Keep content concise, fun, and progressive. Create game items that are directly related to the subject matter."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      ...content,
      videos: videos?.slice(0, 2) || [], // Only include 2 most relevant videos
    };
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
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
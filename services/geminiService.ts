
import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const triviaQuestionSchema = {
  type: Type.OBJECT,
  properties: {
    question: {
      type: Type.STRING,
      description: "The trivia question."
    },
    options: {
      type: Type.ARRAY,
      description: "An array of 4 possible answers.",
      items: {
        type: Type.STRING
      }
    },
    correctAnswer: {
      type: Type.STRING,
      description: "The correct answer, which must be one of the strings from the options array."
    }
  },
  required: ['question', 'options', 'correctAnswer']
};

const triviaQuestionArraySchema = {
    type: Type.ARRAY,
    items: triviaQuestionSchema,
};

export async function getTriviaQuestions(locationName: string, count = 3): Promise<TriviaQuestion[] | null> {
  try {
    const countryName = locationName.split(',')[1]?.trim() || locationName.split(',')[0]?.trim();

    const prompt = `You are a trivia game master. Generate an array of ${count} unique, challenging, multiple-choice trivia questions about the history, geography, or culture of ${countryName}. Each question must have exactly 4 possible answers, with only one being correct. Provide your response in the specified JSON format. Ensure the correct answer for each question is one of its provided options. Do not repeat questions.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: triviaQuestionArraySchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Validate the response structure
    if (Array.isArray(parsedJson)) {
        const validQuestions = parsedJson.filter(item => 
            item.question &&
            Array.isArray(item.options) &&
            item.options.length === 4 &&
            item.correctAnswer &&
            item.options.includes(item.correctAnswer)
        );
        return validQuestions as TriviaQuestion[];
    } else {
      console.error("Invalid question format received from API (expected an array):", parsedJson);
      return null;
    }

  } catch (error) {
    console.error("Error fetching trivia questions:", error);
    return null;
  }
}

export async function getMoreInfo(question: string, answer: string): Promise<string | null> {
  try {
    const prompt = `In a concise and engaging way (2-3 sentences), explain why "${answer}" is the correct answer to the following trivia question. Focus on an interesting fact related to the answer. Question: "${question}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching more info:", error);
    return "Sorry, I couldn't fetch more information at the moment.";
  }
}

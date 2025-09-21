// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { PROMPT_TECHNIQUES, PROMPT_CATEGORIES } from '../constants';
import { EnhancedPrompt } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses a JSON string from a Gemini response, attempting to handle
 * common formatting issues like markdown code blocks.
 * @param text The raw text from the Gemini response.
 * @returns The parsed JSON object.
 * @throws {SyntaxError} if the string cannot be parsed as JSON.
 */
const parseGeminiJsonResponse = <T>(text: string): T => {
    let cleanText = text.trim();
    
    // Check for and extract JSON from markdown code blocks
    const markdownMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        cleanText = markdownMatch[1];
    }

    try {
        return JSON.parse(cleanText) as T;
    } catch (error) {
        console.error("Failed to parse JSON response:", cleanText);
        // Re-throw the original error to be caught by the calling function's handler.
        throw error;
    }
};

/**
 * Analyzes an error from the Gemini API and returns a user-friendly, specific error message.
 * @param error The error object caught from the API call.
 * @param context A string describing the context where the error occurred (e.g., 'technique selection').
 * @returns An Error object with a user-friendly message.
 */
const handleGeminiApiError = (error: unknown, context: string): Error => {
    console.error(`Error during ${context}:`, error);

    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
        return new Error('پاسخ دریافت شده از هوش مصنوعی فرمت معتبری نداشت. لطفاً دوباره تلاش کنید.');
    }

    // Check for specific Gemini API error details.
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('safety')) {
            return new Error('درخواست شما به دلیل محدودیت‌های ایمنی مسدود شد. لطفاً پرامت خود را تغییر دهید.');
        }
        if (errorMessage.includes('429') || errorMessage.includes('resource has been exhausted')) {
            return new Error('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کرده و دوباره تلاش کنید.');
        }
        if (errorMessage.includes('api key not valid')) {
            // This is a developer-facing issue, but good to handle gracefully.
            return new Error('کلید API نامعتبر است. لطفاً با پشتیبانی تماس بگیرید.');
        }
    }

    // Generic network/API error for everything else
    return new Error('اشکال در ارتباط با سرویس هوش مصنوعی. لطفاً اتصال اینترنت خود را بررسی کرده و مجدداً تلاش کنید.');
};

/**
 * Executes a given prompt and streams the response back.
 * @param prompt The prompt string to execute.
 * @param onChunk Callback for each piece of text received.
 * @param onError Callback for handling any errors.
 */
export const executePromptStream = async (
    prompt: string,
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void
): Promise<void> => {
    try {
        const model = 'gemini-2.5-flash';
        const responseStream = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: {
                // Disable thinking for faster, more direct responses in execution.
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        for await (const chunk of responseStream) {
            onChunk(chunk.text);
        }
    } catch (error) {
        onError(handleGeminiApiError(error, 'prompt execution'));
    }
};

export const selectTechniques = async (originalPrompt: string, category: string, promptContext?: string): Promise<string[]> => {
    try {
        const model = 'gemini-2.5-flash';
        const allTechniques = Object.keys(PROMPT_TECHNIQUES);
        const techniquesWithDescriptions = allTechniques
            .map(t => `- ${t}: ${PROMPT_TECHNIQUES[t as keyof typeof PROMPT_TECHNIQUES]}`)
            .join('\n');

        const systemInstruction = `You are a world-class expert in Prompt Engineering. Your task is to act as a recommender system. You will be given a user's prompt, its category, an optional explanation of the user's goal, and a list of available prompt engineering techniques with their descriptions.
Your goal is to analyze the user's intent and select the 3 to 5 most effective techniques to enhance their prompt.

Follow these steps:
1.  **Analyze the User Input**: Deconstruct the user's request ("${originalPrompt}") in the context of "${category}". Critically, use the user's optional explanation of their goal to understand the underlying purpose.
2.  **Match Goal to Techniques**: Review the provided list of techniques and their descriptions. Identify which techniques are best suited to achieve the user's goal. For example, if the user needs to solve a math problem, 'PAL (Program-Aided Language Models) Prompting' would be a great choice. If they need a creative story, 'Persona Prompting' might be better. The user's goal explanation is a very important clue.
3.  **Select**: Choose the 3 to 5 best techniques.
4.  **Final Output**: Return ONLY a JSON array of strings, where each string is the exact name of a selected technique. Do not output anything else.`;

        let contents = `User Prompt: "${originalPrompt}"\nCategory: "${category}"`;
        if (promptContext && promptContext.trim()) {
            contents += `\nUser's Goal Explanation: "${promptContext}"`;
        }
        contents += `\n\nAvailable Techniques with Descriptions:\n${techniquesWithDescriptions}\n\nBased on your analysis, select the 3 to 5 most effective techniques for this prompt.`;

        const responseSchema = {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        };

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
                temperature: 0.5,
            }
        });
        
        const result = parseGeminiJsonResponse<string[]>(response.text);

        if (Array.isArray(result) && result.every(item => typeof item === 'string')) {
            const validTechniques = result.filter(technique => allTechniques.includes(technique));
            if (validTechniques.length > 0) {
                 return validTechniques;
            }
        }
        
        console.error("Gemini API returned an unexpected format for technique selection:", result);
        throw new Error('هوش مصنوعی در انتخاب خودکار تکنیک‌ها ناموفق بود.');

    } catch (error) {
        throw handleGeminiApiError(error, 'technique selection');
    }
};

export const suggestCategory = async (promptText: string): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';

        const systemInstruction = `You are a highly intelligent and accurate text classification expert. Your sole purpose is to analyze a user's prompt and assign it to the SINGLE most relevant category from a predefined list.
Task: Read the user's prompt carefully. Identify the main subject or goal. Match this primary intent to the single most fitting category from the provided list. For example, a prompt about "writing a Python script to analyze data" should be classified as "برنامه‌نویسی و توسعه نرم‌افزار", not "تحقیق و تحلیل داده", because the core action is programming.
You MUST choose one of the categories provided in the list. Do not invent new ones.
Your response MUST be a valid JSON object with a single key, "category", and the value must be the chosen category name as a string.`;

        const contents = `Please classify the following user prompt into the most appropriate category.

User Prompt:
---
"${promptText}"
---

Available Categories:
---
- ${PROMPT_CATEGORIES.join('\n- ')}
---

Select the single best category from the list above.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                category: { 
                    type: Type.STRING,
                    enum: PROMPT_CATEGORIES,
                },
            },
            required: ['category'],
        };

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
                temperature: 0.2, // Low temperature for deterministic classification
            }
        });
        
        const result = parseGeminiJsonResponse<{ category: string }>(response.text);

        if (result && typeof result.category === 'string' && PROMPT_CATEGORIES.includes(result.category)) {
             return result.category;
        }
        
        console.error("Gemini API returned an unexpected format or invalid category for category suggestion:", result);
        return ''; // Fail silently

    } catch (error) {
        console.error('Error calling Gemini API for category suggestion:', error);
        return ''; // Fail silently
    }
};


const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        technique: {
          type: Type.STRING,
          description: 'The name of the prompt engineering technique used.',
        },
        prompt: {
          type: Type.STRING,
          description: 'The generated, enhanced prompt.',
        },
        explanation: {
            type: Type.STRING,
            description: 'A brief, one-sentence explanation in Persian of why this technique was chosen and how it improves the prompt.'
        }
      },
      required: ['technique', 'prompt', 'explanation'],
    },
};

export const enhancePrompt = async (originalPrompt: string, category: string, techniques: string[]): Promise<EnhancedPrompt[]> => {
    try {
        const model = 'gemini-2.5-flash';

        const techniquesDescription = techniques.map(t => `- ${t}: ${PROMPT_TECHNIQUES[t as keyof typeof PROMPT_TECHNIQUES]}`).join('\n');

        const systemInstruction = `You are a world-class expert in Prompt Engineering, specializing in generating creative and effective prompts for Large Language Models (LLMs). Your task is to transform a user's basic idea into a set of diverse, high-quality prompts using specific engineering techniques.

You must adhere to the following rules:
1.  **Understand Intent**: Deeply analyze the user's original prompt ("${originalPrompt}") and its category ("${category}") to grasp their core objective.
2.  **Master the Techniques**: For each requested technique, you must apply its core principle to fundamentally transform the original prompt. The provided descriptions are your guide:
${techniquesDescription}
3.  **Generate Exceptional Prompts**:
    *   **Go Beyond Rephrasing**: Do NOT simply reword the original prompt. Create a new, sophisticated prompt that embodies the chosen technique.
    *   **Add Detail and Context**: Enhance the prompt with relevant context, constraints, examples, or a persona to guide the LLM's response. The new prompt should be significantly more detailed and actionable.
    *   **Be Creative**: The goal is to unlock the LLM's potential. Your generated prompts should be imaginative and well-structured.
4.  **Provide Clear Explanations**: For EACH prompt, provide a concise, one-sentence explanation in Persian. This explanation must clarify *why* the technique was suitable and *how* the new prompt is an improvement.
5.  **Preserve Core Intent**: All generated prompts must remain faithful to the user's original goal.
6.  **Strictly JSON Output**: Your entire output MUST be a valid JSON array of objects, matching the provided schema. Each object must contain 'technique', 'prompt', and 'explanation' keys. Do not include any text, notes, or markdown outside of the JSON structure.
7.  **Language**: The final prompts and explanations must be in Persian, unless the original prompt's content implies another language is required.`;

        const contents = `Original Prompt: "${originalPrompt}"\nCategory: "${category}"\nTechniques to use: ${techniques.join(', ')}. Generate the prompts.`;

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
                temperature: 0.8,
            }
        });

        const result = parseGeminiJsonResponse<any[]>(response.text);

        if (Array.isArray(result)) {
            // Ensure the result matches the expected structure.
            return result.filter(
                (item): item is EnhancedPrompt => 
                typeof item === 'object' &&
                item !== null &&
                'technique' in item &&
                'prompt' in item &&
                'explanation' in item &&
                typeof item.technique === 'string' &&
                typeof item.prompt === 'string' &&
                typeof item.explanation === 'string'
            );
        }

        console.error("Gemini API returned an unexpected format:", result);
        throw new Error('Failed to parse prompts from Gemini API.');
    } catch (error) {
        throw handleGeminiApiError(error, 'prompt enhancement');
    }
};
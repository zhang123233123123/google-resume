import { GoogleGenAI, Type } from "@google/genai";
import { ExperienceItem, ResumeData, SupportedLanguage } from "../types";

// DEFAULTS
export const DEFAULT_MODEL = "gemini-2.5-flash";
export const DEFAULT_SYSTEM_PROMPT = `You are an expert Resume Parser Agent. 
Analyze the provided resume content.
Extract the candidate's Profile, Experience, Education, and Skills.

CRITICAL RULES:
1. **DO NOT TRANSLATE.** Output the content in the EXACT same language as the input text.
2. Format dates as "MMM YYYY" or "Present".
3. **STAR METHOD:** When extracting experience highlights, structure them using the STAR method (Situation, Task, Action, Result).
4. Focus on quantifiable achievements (numbers, percentages, scale).
5. If the input is a PDF/Image, carefully transcribe details.`;

// Helper to get AI instance safely with optional Base URL
const getAI = (apiKey: string, baseUrl?: string) => {
  if (!apiKey) throw new Error("API Key is missing. Please configure it in settings.");
  
  // If baseUrl is provided, use it. Otherwise default to Google's official endpoint.
  let clientOptions: any = { apiKey };
  
  if (baseUrl && baseUrl.trim().length > 0) {
    let cleanUrl = baseUrl.trim();
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
    clientOptions.baseUrl = cleanUrl;
  }

  return new GoogleGenAI(clientOptions);
};

// Helper to safely parse JSON that might be wrapped in Markdown
const cleanAndParseJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```(?:json)?([\s\S]*?)```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {}
    }
    console.error("Failed to parse AI response:", text);
    throw new Error("Invalid JSON response from AI");
  }
};

// --- AGENT NODE 1: PARSER ---
export const parseMasterProfile = async (
  text: string, 
  apiKey: string,
  fileData?: { mimeType: string; data: string },
  baseUrl?: string,
  modelName: string = DEFAULT_MODEL,
  systemInstruction: string = DEFAULT_SYSTEM_PROMPT
): Promise<Partial<ResumeData>> => {
  const ai = getAI(apiKey, baseUrl);

  const promptText = `
    ${systemInstruction}
    
    ${text ? `Text to analyze: "${text}"` : ''}
  `;

  const contents = fileData 
    ? [
        { inlineData: { mimeType: fileData.mimeType, data: fileData.data } },
        { text: promptText }
      ]
    : [
        { text: promptText }
      ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { 
              type: Type.STRING, 
              description: "Detect the language code (en, zh, fr, pt, ar)." 
            },
            profile: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                summary: { type: Type.STRING },
              }
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  location: { type: Type.STRING },
                  description: { type: Type.STRING },
                  highlights: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "3-5 STAR method bullet points."
                  },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  school: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.STRING }
                }
              }
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const rawData = cleanAndParseJSON(response.text || "{}");
    
    // Add IDs
    if (rawData.experience) {
      rawData.experience = rawData.experience.map((item: any) => ({
        ...item,
        id: crypto.randomUUID()
      }));
    }
    if (rawData.education) {
      rawData.education = rawData.education.map((item: any) => ({
        ...item,
        id: crypto.randomUUID()
      }));
    }

    return rawData;

  } catch (error) {
    console.error("AI Parse Error:", error);
    throw error;
  }
};

// --- AGENT NODE 2: TAILOR ---
export const tailorResumeToJob = async (
  currentData: ResumeData,
  jobDescription: string,
  targetLanguage: SupportedLanguage,
  apiKey: string,
  baseUrl?: string,
  modelName: string = DEFAULT_MODEL
): Promise<ResumeData> => {
  const ai = getAI(apiKey, baseUrl);

  const prompt = `
    You are a Senior Career Strategy Agent.
    
    INPUT DATA:
    1. Candidate Profile (JSON): ${JSON.stringify(currentData)}
    2. Target Job Description (JD): "${jobDescription}"

    YOUR TASK:
    Analyze the Candidate's *Existing Experience* and the *Job Description*.
    Generate a tailored resume that highlights the most relevant skills and achievements.
    
    CRITICAL RULES:
    1. **LANGUAGE**: Output in the language of the Job Description.
    2. **EXPERIENCE**: 
       - Keep the original Companies and Roles. **Do not hallucinate new jobs.**
       - Select/Rewrite bullet points to match JD keywords.
       - Use the **STAR Method** for all highlights.
    3. **PROFILE**: Rewrite the summary to pitch the candidate specifically for this role.
    4. **SKILLS**: Reorder skills to put JD-relevant skills first.
    
    Output the full JSON structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            profile: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                summary: { type: Type.STRING },
              }
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  location: { type: Type.STRING },
                  description: { type: Type.STRING },
                  highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  school: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.STRING }
                }
              }
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const tailoredData = cleanAndParseJSON(response.text || "{}");
    
    if (tailoredData.experience) {
      tailoredData.experience = tailoredData.experience.map((item: any, index: number) => ({
        ...item,
        id: currentData.experience[index]?.id || crypto.randomUUID()
      }));
    }
    if (tailoredData.education) {
      tailoredData.education = tailoredData.education.map((item: any, index: number) => ({
        ...item,
        id: currentData.education[index]?.id || crypto.randomUUID()
      }));
    }

    return {
      ...currentData,
      ...tailoredData,
      language: tailoredData.language || currentData.language
    };

  } catch (error) {
    console.error("AI Tailor Error:", error);
    throw error;
  }
};

export const optimizeSingleExperience = async (
  item: ExperienceItem,
  apiKey: string,
  baseUrl?: string,
  modelName: string = DEFAULT_MODEL
): Promise<ExperienceItem> => {
  const ai = getAI(apiKey, baseUrl);
   const prompt = `
    Act as a professional resume writer. Rewrite the following experience to be more impactful.
    
    **CRITICAL REQUIREMENT:**
    Apply the **STAR Method** (Situation, Task, Action, Result) to every bullet point.
    - Start with a strong action verb.
    - Include specific numbers, percentages, or scale where possible.
    - Keep the same language as the input.
    
    Role: ${item.role} at ${item.company}
    Current Highlights: ${JSON.stringify(item.highlights)}
    Raw Description: ${item.description}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const result = cleanAndParseJSON(response.text || "{}");
    return {
      ...item,
      highlights: result.highlights || item.highlights,
      description: result.description || item.description
    };
  } catch (e) {
    return item;
  }
};
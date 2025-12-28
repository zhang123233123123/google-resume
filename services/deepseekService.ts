import { ExperienceItem, ResumeData, SupportedLanguage } from "../types";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_TEMPERATURE = 0.2;
const MAX_PARSE_CHARS = 40000;
const MAX_JD_CHARS = 8000;
const MAX_SUMMARY_CHARS = 1200;
const MAX_DESC_CHARS = 1200;
const MAX_TEXT_FIELD_CHARS = 200;
const MAX_HIGHLIGHT_CHARS = 360;
const MAX_HIGHLIGHTS = 6;
const MAX_EXPERIENCE_ITEMS = 12;
const MAX_EDU_ITEMS = 8;
const MAX_SKILLS = 60;

// DEFAULTS
export const DEFAULT_MODEL = "deepseek-chat";
export const DEFAULT_SYSTEM_PROMPT = `You are an expert Resume Parser Agent.
Analyze the provided resume content.
Extract the candidate's Profile, Experience, Education, and Skills.

CRITICAL RULES:
1. **LANGUAGE CONSISTENCY:** Output in the EXACT same language as the input text. Do NOT translate.
2. Format dates as "MMM YYYY" or "Present".
3. **STAR METHOD:** Each experience must include 3-6 STAR bullets (Situation, Task, Action, Result).
4. Focus on quantifiable achievements (numbers, percentages, scale) if they appear in the input.
5. If the input is sparse, you may infer reasonable, generic responsibilities and outcomes based on role/context, but do NOT fabricate specific metrics or companies.
6. Include ALL experiences present in the input. Do not omit roles.
7. Return only valid JSON. Do not wrap in Markdown.`;

const resolveBaseUrl = (baseUrl?: string) => {
  if (!baseUrl) return DEFAULT_BASE_URL;
  let cleanUrl = baseUrl.trim();
  if (!cleanUrl) return DEFAULT_BASE_URL;
  if (cleanUrl.endsWith("/")) cleanUrl = cleanUrl.slice(0, -1);
  if (!cleanUrl.startsWith("http")) cleanUrl = `https://${cleanUrl}`;
  return cleanUrl;
};

const callDeepSeek = async (
  messages: ChatMessage[],
  apiKey: string,
  baseUrl?: string,
  modelName: string = DEFAULT_MODEL
) => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  const url = `${resolveBaseUrl(baseUrl)}/v1/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: DEFAULT_TEMPERATURE,
      stream: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from DeepSeek.");
  }
  return content as string;
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

const clampText = (value: unknown, maxChars: number) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}...`;
};

const splitToList = (value: string) =>
  value
    .split(/[\n,;，、。；！？•·●◦]+/g)
    .map((item) => item.trim())
    .filter(Boolean);

const extractText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = ["text", "content", "value", "highlight", "point", "bullet", "desc", "description", "summary"];
    for (const key of keys) {
      const found = obj[key];
      if (typeof found === "string" && found.trim()) return found.trim();
    }
    for (const candidate of Object.values(obj)) {
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  }
  return "";
};

const coerceStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return splitToList(value);
  }
  if (value && typeof value === "object") {
    const maybeItems = (value as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems
        .map((item) => extractText(item))
        .filter(Boolean);
    }
    const single = extractText(value);
    if (single) return [single];
  }
  return [];
};

const pickHighlights = (item: any) => {
  const candidates = [
    item?.highlights,
    item?.achievements,
    item?.responsibilities,
    item?.tasks,
    item?.bullets,
    item?.details,
    item?.summary,
    item?.description
  ];
  for (const candidate of candidates) {
    const list = coerceStringArray(candidate);
    if (list.length) return list;
  }
  return [];
};

const coerceExperienceArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => ({
    ...item,
    highlights: pickHighlights(item)
  }));
};

const coerceEducationArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => ({ ...item }));
};

const sanitizeResumeForTailor = (data: ResumeData) => {
  const profile = data.profile
    ? {
        ...data.profile,
        avatar: undefined,
        name: clampText(data.profile.name, MAX_TEXT_FIELD_CHARS),
        email: clampText(data.profile.email, MAX_TEXT_FIELD_CHARS),
        phone: clampText(data.profile.phone, MAX_TEXT_FIELD_CHARS),
        location: clampText(data.profile.location, MAX_TEXT_FIELD_CHARS),
        summary: clampText(data.profile.summary, MAX_SUMMARY_CHARS)
      }
    : data.profile;

  const experience = Array.isArray(data.experience)
    ? data.experience.slice(0, MAX_EXPERIENCE_ITEMS).map((item) => ({
        ...item,
        company: clampText(item.company, MAX_TEXT_FIELD_CHARS),
        role: clampText(item.role, MAX_TEXT_FIELD_CHARS),
        startDate: clampText(item.startDate, MAX_TEXT_FIELD_CHARS),
        endDate: clampText(item.endDate, MAX_TEXT_FIELD_CHARS),
        location: clampText(item.location || "", MAX_TEXT_FIELD_CHARS),
        description: clampText(item.description || "", MAX_DESC_CHARS),
        highlights: (item.highlights || [])
          .filter(Boolean)
          .slice(0, MAX_HIGHLIGHTS)
          .map((highlight) => clampText(highlight, MAX_HIGHLIGHT_CHARS))
      }))
    : [];

  const education = Array.isArray(data.education)
    ? data.education.slice(0, MAX_EDU_ITEMS).map((item) => ({
        ...item,
        school: clampText(item.school, MAX_TEXT_FIELD_CHARS),
        degree: clampText(item.degree, MAX_TEXT_FIELD_CHARS),
        year: clampText(item.year, MAX_TEXT_FIELD_CHARS)
      }))
    : [];

  const skills = Array.isArray(data.skills)
    ? data.skills.slice(0, MAX_SKILLS).map((skill) => clampText(skill, MAX_TEXT_FIELD_CHARS))
    : [];

  return {
    ...data,
    profile,
    experience,
    education,
    skills
  };
};

const expandHighlightsForItem = async (
  item: ExperienceItem,
  resumeText: string,
  apiKey: string,
  baseUrl?: string,
  modelName: string = DEFAULT_MODEL
) => {
  const prompt = `
You are a professional resume writer.

Generate 3-6 STAR bullet points for this experience. Use the SAME language as the resume text. Do NOT translate.
If the input is sparse, infer reasonable, generic responsibilities and outcomes based on the role and context, but do NOT invent specific metrics or companies. Avoid numbers unless they appear in the input.
Ensure the bullets collectively cover responsibilities, actions, and outcomes.

Role: ${item.role}
Company: ${item.company}
Location: ${item.location || ""}
Existing Highlights: ${JSON.stringify(item.highlights || [])}
Description: ${item.description || ""}

Relevant Resume Text (optional):
${resumeText.slice(0, 2000)}

Return only JSON with a "highlights" array of strings.
`;

  const content = await callDeepSeek(
    [
      { role: "system", content: "You produce concise STAR bullet points in the input language." },
      { role: "user", content: prompt }
    ],
    apiKey,
    baseUrl,
    modelName
  );

  const result = cleanAndParseJSON(content || "{}");
  const normalized = coerceStringArray(result.highlights);
  return normalized.length ? normalized : item.highlights;
};

const ensureHighlights = async (
  items: ExperienceItem[],
  resumeText: string,
  apiKey: string,
  baseUrl?: string,
  modelName: string = DEFAULT_MODEL
) => {
  const enriched: ExperienceItem[] = [];
  for (const item of items) {
    if (!item.highlights || item.highlights.length < 3) {
      try {
        const expanded = await expandHighlightsForItem(item, resumeText, apiKey, baseUrl, modelName);
        enriched.push({ ...item, highlights: expanded });
      } catch (error) {
        enriched.push(item);
      }
    } else {
      enriched.push(item);
    }
  }
  return enriched;
};

// --- AGENT NODE 1: PARSER ---
export const parseMasterProfile = async (
  text: string,
  apiKey: string,
  baseUrl?: string,
  modelName: string = DEFAULT_MODEL,
  systemInstruction: string = DEFAULT_SYSTEM_PROMPT
): Promise<Partial<ResumeData>> => {
  const safeText = clampText(text, MAX_PARSE_CHARS);
  const messages: ChatMessage[] = [
    { role: "system", content: systemInstruction },
    {
      role: "user",
      content: `Resume text to analyze:\n${safeText}\n\nReturn only JSON.`
    }
  ];

  try {
    const content = await callDeepSeek(messages, apiKey, baseUrl, modelName);
    const rawData = cleanAndParseJSON(content || "{}");

    rawData.skills = coerceStringArray(rawData.skills);
    rawData.experience = coerceExperienceArray(rawData.experience);
    rawData.education = coerceEducationArray(rawData.education);

    if (rawData.experience.length) {
      rawData.experience = rawData.experience.map((item: any) => ({
        ...item,
        id: crypto.randomUUID()
      }));
      rawData.experience = await ensureHighlights(
        rawData.experience,
        text,
        apiKey,
        baseUrl,
        modelName
      );
    }
    if (rawData.education.length) {
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
  const safeData = sanitizeResumeForTailor(currentData);
  const safeJobDescription = clampText(jobDescription, MAX_JD_CHARS);
  const prompt = `
You are a Senior Career Strategy Agent.

INPUT DATA:
1. Candidate Profile (JSON, truncated if needed): ${JSON.stringify(safeData)}
2. Target Job Description (JD, truncated if needed): "${safeJobDescription}"

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

Return only JSON. Do not wrap in Markdown.
`;

  try {
    const content = await callDeepSeek(
      [
        { role: "system", content: "You are a precise resume writing assistant." },
        { role: "user", content: prompt }
      ],
      apiKey,
      baseUrl,
      modelName
    );

    const tailoredData = cleanAndParseJSON(content || "{}");

    tailoredData.skills = coerceStringArray(tailoredData.skills);
    tailoredData.experience = coerceExperienceArray(tailoredData.experience);
    tailoredData.education = coerceEducationArray(tailoredData.education);

    if (tailoredData.experience.length) {
      tailoredData.experience = tailoredData.experience.map((item: any, index: number) => ({
        ...item,
        id: currentData.experience[index]?.id || crypto.randomUUID()
      }));
    }
    if (tailoredData.education.length) {
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

Return only JSON with fields: highlights (array of strings), description (string).
`;

  try {
    const content = await callDeepSeek(
      [
        { role: "system", content: "You are a precise resume writing assistant." },
        { role: "user", content: prompt }
      ],
      apiKey,
      baseUrl,
      modelName
    );

    const result = cleanAndParseJSON(content || "{}");
    const normalizedHighlights = coerceStringArray(result.highlights);
    return {
      ...item,
      highlights: normalizedHighlights.length ? normalizedHighlights : item.highlights,
      description: result.description || item.description
    };
  } catch (e) {
    return item;
  }
};

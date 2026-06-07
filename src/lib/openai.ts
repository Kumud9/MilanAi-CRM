import { Profile } from "./types";

// Safe API key lookup
const getApiKey = () => {
  return process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "";
};

// Fallback compatibility generator for development / when key is not present
function getMockCompatibility(target: Profile, candidate: Profile, score: number) {
  const strengths = [];
  const concerns = [];
  
  if (target.family.religion === candidate.family.religion) {
    strengths.push("Same religious background (" + target.family.religion + ")");
  } else {
    concerns.push("Different religious backgrounds (" + target.family.religion + " & " + candidate.family.religion + ")");
  }
  
  if (target.city === candidate.city) {
    strengths.push("Both are currently located in " + target.city);
  } else {
    if (candidate.preferences.openToRelocate === 'Yes' || candidate.preferences.openToRelocate === 'Open') {
      strengths.push("Candidate is willing to relocate to " + target.city);
    } else {
      concerns.push("Located in different cities (" + target.city + " & " + candidate.city + ")");
    }
  }

  if (target.preferences.wantKids === candidate.preferences.wantKids) {
    strengths.push("Aligned on child preferences (" + target.preferences.wantKids + ")");
  }

  if (strengths.length === 0) {
    strengths.push("Compatible age range and demographic profile");
  }

  let recommendation = "Good Potential Match";
  if (score >= 85) recommendation = "High Potential Match";
  else if (score < 60) recommendation = "Requires Discussion / Secondary Match";

  return {
    score,
    strengths,
    concerns: concerns.length > 0 ? concerns : ["Minor location or lifestyle adjustment needed"],
    recommendation,
    explanation: `${recommendation}. Both individuals exhibit compatible educational qualifications and aligned long-term goals. Their mutual preferences match on ${strengths.length} key attributes, making this a highly suitable recommendation.`
  };
}

// Fallback notes intelligence
function getMockNotesIntelligence(rawNotes: string) {
  const parsed = {
    values: [] as string[],
    religionPreference: "Not mentioned",
    relocationPreference: "Not mentioned",
    smokingPreference: "Not mentioned",
    professionPreference: "Not mentioned"
  };
  
  const notesLower = rawNotes.toLowerCase();
  if (notesLower.includes("family")) parsed.values.push("Family Oriented");
  if (notesLower.includes("independent")) parsed.values.push("Independent");
  if (notesLower.includes("career") || notesLower.includes("ambitious")) parsed.values.push("Career Focused");
  if (notesLower.includes("traditional")) parsed.values.push("Traditional");
  
  if (parsed.values.length === 0) parsed.values.push("Balanced lifestyle");

  if (notesLower.includes("same religion") || notesLower.includes("same caste")) {
    parsed.religionPreference = "Same Religion";
  }
  
  if (notesLower.includes("relocate") || notesLower.includes("india only")) {
    parsed.relocationPreference = "Within India Only";
  } else if (notesLower.includes("abroad") || notesLower.includes("outside india")) {
    parsed.relocationPreference = "Open to Abroad";
  } else if (notesLower.includes("no relocation") || notesLower.includes("same city")) {
    parsed.relocationPreference = "No Relocation";
  }

  if (notesLower.includes("no smoke") || notesLower.includes("non smoker") || notesLower.includes("doesn't smoke")) {
    parsed.smokingPreference = "Non-Smoker";
  } else if (notesLower.includes("smok")) {
    parsed.smokingPreference = "Smoker";
  }

  if (notesLower.includes("tech") || notesLower.includes("software") || notesLower.includes("engineer")) {
    parsed.professionPreference = "Technology Background";
  } else if (notesLower.includes("finance") || notesLower.includes("mba") || notesLower.includes("business")) {
    parsed.professionPreference = "Finance / MBA";
  }

  return parsed;
}

// Core utility to call the Gemini API with exponential backoff
async function callGenAI(systemInstruction: string, userText: string, jsonSchema: object | null = null) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload: { 
    contents: Array<{ parts: Array<{ text: string }> }>; 
    systemInstruction: { parts: Array<{ text: string }> }; 
    generationConfig?: { responseMimeType: string; responseSchema: object } 
  } = {
    contents: [{ parts: [{ text: userText }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  // If a JSON schema is provided, force the AI to return structured JSON
  if (jsonSchema) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: jsonSchema
    };
  }

  const delays = [1000, 2000, 4000, 8000, 16000];
  let lastError;

  for (let i = 0; i < delays.length; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error("Empty response from AI");

      return jsonSchema ? JSON.parse(text) : text;
    } catch (error) {
      lastError = error;
      if (i < delays.length - 1) {
        await new Promise(res => setTimeout(res, delays[i]));
      }
    }
  }
  throw lastError;
}

export async function generateCompatibilityAnalysis(
  target: Profile,
  candidate: Profile,
  algoScore: number,
  algoReasons: string[]
) {
  const key = getApiKey();
  if (!key) {
    console.warn("API key missing. Returning mocked AI compatibility insights.");
    return getMockCompatibility(target, candidate, algoScore);
  }

  try {
    const systemPrompt = "You are an elite, highly intuitive matchmaking AI advisor. Analyze the provided client and candidate profiles. Output a refined compatibility score (out of 100) based on deep values and life vision, a list of specific strengths of the match, potential concerns, and a natural language summary explaining the dynamics of the match.";
    const userPrompt = `Client A: ${JSON.stringify(target)}\nCandidate B: ${JSON.stringify(candidate)}\nAlgorithmic Raw Score: ${algoScore || 'N/A'}\nReasons: ${algoReasons.join(", ")}`;

    const schema = {
      type: "OBJECT",
      properties: {
        refinedScore: { type: "INTEGER", description: "Score out of 100" },
        strengths: { type: "ARRAY", items: { type: "STRING" }, description: "3-4 bullet points on why they match" },
        concerns: { type: "ARRAY", items: { type: "STRING" }, description: "1-2 potential friction points" },
        summary: { type: "STRING", description: "A highly empathetic 2-3 sentence overview." }
      },
      required: ["refinedScore", "strengths", "concerns", "summary"]
    };

    const aiResult = await callGenAI(systemPrompt, userPrompt, schema);
    
    return {
      score: aiResult.refinedScore ?? algoScore,
      strengths: aiResult.strengths || [],
      concerns: aiResult.concerns || [],
      recommendation: (aiResult.refinedScore ?? algoScore) >= 85 ? "High Potential Match" : (aiResult.refinedScore ?? algoScore) >= 65 ? "Good Match" : "Moderate Match",
      explanation: aiResult.summary || ""
    };
  } catch (error) {
    console.error("Error in Gemini compatibility advisor:", error);
    return getMockCompatibility(target, candidate, algoScore);
  }
}

export async function extractNotesInsights(rawNotes: string) {
  const key = getApiKey();
  if (!key) {
    console.warn("API key missing. Returning mocked AI notes insights.");
    return getMockNotesIntelligence(rawNotes);
  }

  try {
    const systemPrompt = "You are a matchmaking CRM assistant. Extract structured data from unstructured call logs or notes provided by a matchmaker. Be precise and identify key traits, core values, religion preferences, relocation openness, and professional expectations.";
    
    const schema = {
      type: "OBJECT",
      properties: {
        keyTraits: { type: "ARRAY", items: { type: "STRING" } },
        values: { type: "ARRAY", items: { type: "STRING" } },
        religionPreference: { type: "STRING", description: "Specific religion or 'Open' or 'Not mentioned'" },
        relocationPreferences: { type: "STRING", description: "E.g., 'Willing to move to US', 'Strictly Mumbai', 'Flexible', 'Not mentioned'" },
        smokingPreference: { type: "STRING", description: "E.g., 'Non-Smoker', 'Smoker', 'Occasionally', 'Not mentioned'" },
        professionPreferences: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["values", "religionPreference", "relocationPreferences", "professionPreferences"]
    };

    const extractedData = await callGenAI(systemPrompt, rawNotes, schema);
    
    return {
      values: extractedData.values || [],
      religionPreference: extractedData.religionPreference || "Not mentioned",
      relocationPreference: extractedData.relocationPreferences || "Not mentioned",
      smokingPreference: extractedData.smokingPreference || "Not mentioned",
      professionPreference: extractedData.professionPreferences?.join(", ") || "Not mentioned"
    };
  } catch (error) {
    console.error("Error in Gemini notes intelligence:", error);
    return getMockNotesIntelligence(rawNotes);
  }
}

export async function generateIntroductionMessage(
  target: Profile,
  candidate: Profile,
  aiExplanation: string
) {
  const key = getApiKey();
  if (!key) {
    console.warn("API key missing. Generating mock introduction letter.");
    return `Hi ${target.firstName},\n\nWe would like to introduce ${candidate.firstName}, a ${candidate.career.designation} at ${candidate.career.company} based in ${candidate.city}.\n\nBoth of you share compatible educational backgrounds, aligned lifestyle preferences, and similar goals. We believe this introduction could lead to a very meaningful connection worth exploring.\n\nWarm Regards,\nMilanAI`;
  }

  try {
    const systemPrompt = "You are a high-end, bespoke Indian matchmaker writing a warm, respectful, and sophisticated introductory email or message draft. Introduce the guest candidate to the host client. Highlight shared values, professional alignment, and why you believe this is a 'Sahi Milan' (perfect match). Keep the tone professional yet deeply empathetic.";
    const userPrompt = `Host Client: ${JSON.stringify(target)}\nGuest Candidate: ${JSON.stringify(candidate)}\nCompatibility Insights: ${aiExplanation || 'N/A'}`;

    const messageDraft = await callGenAI(systemPrompt, userPrompt);
    return messageDraft;
  } catch (error) {
    console.error("Error in Gemini intro generation:", error);
    return `Hi ${target.firstName},\n\nWe would like to introduce ${candidate.firstName}, a ${candidate.career.designation} based in ${candidate.city}. Based on our matchmaking system, you share strong values and aligned interests. We believe this introduction is worth exploring.\n\nWarm Regards,\nMilanAI`;
  }
}

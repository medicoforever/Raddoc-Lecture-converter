
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  FIRST_PROMPT, 
  VIDEO_PROMPT,
  SECOND_PROMPT, 
  THIRD_PROMPT,
  INITIAL_AGENT_PROMPT,
  REFINEMENT_AGENT_PROMPT,
  SYNTHESIZER_AGENT_PROMPT
} from '../constants';
import type { GeminiModel } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const processCitationsAndSources = (text: string, candidate: GenerateContentResponse['candidates'][0]): { content: string, sources: string } => {
    if (!candidate) {
        return { content: text, sources: '' };
    }

    const citationSources: {startIndex: number, endIndex: number, uri: string}[] = candidate?.citationMetadata?.citationSources || [];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    if (citationSources.length === 0 && groundingChunks.length === 0) {
        return { content: text, sources: '' };
    }

    const uniqueSources = new Map<string, { title: string, index: number }>();
    let sourceCounter = 1;

    const webSources = new Map<string, string>();
    groundingChunks.forEach((chunk: { web: { uri: string; title: string; } }) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            webSources.set(chunk.web.uri, chunk.web.title);
        }
    });

    const getSourceIndex = (uri: string) => {
        if (!uniqueSources.has(uri)) {
            const title = webSources.get(uri) || uri;
            uniqueSources.set(uri, { title, index: sourceCounter++ });
        }
        return uniqueSources.get(uri)!.index;
    };
    
    citationSources.forEach(source => getSourceIndex(source.uri));
    groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) getSourceIndex(chunk.web.uri);
    });

    let modifiedText = text;
    if (citationSources.length > 0) {
        const sortedSources = [...citationSources].sort((a, b) => (b.startIndex ?? 0) - (a.startIndex ?? 0));
        
        for (const source of sortedSources) {
            if (source.startIndex !== undefined && source.endIndex !== undefined && source.uri) {
                const index = uniqueSources.get(source.uri)!.index;
                const originalText = modifiedText.substring(source.startIndex, source.endIndex);
                const replacement = `[${originalText}](${source.uri}) [${index}]`;

                modifiedText = 
                    modifiedText.slice(0, source.startIndex) + 
                    replacement +
                    modifiedText.slice(source.endIndex);
            }
        }
    }

    let sourcesMarkdown = '';
    if (uniqueSources.size > 0) {
        sourcesMarkdown = '\n\n---\n\n### Sources:\n';
        const sortedForList = [...uniqueSources.entries()].sort((a, b) => a[1].index - b[1].index);
        sortedForList.forEach(([uri, { title, index }]) => {
            sourcesMarkdown += `${index}. [${title}](${uri})\n`;
        });
    }
    
    return { content: modifiedText, sources: sourcesMarkdown };
};


export const transcribeAudio = async (file: File, model: GeminiModel, part?: number): Promise<string> => {
  try {
    const audioPart = await fileToGenerativePart(file);
    const isVideo = file.type.startsWith('video/');
    let prompt = isVideo ? VIDEO_PROMPT : FIRST_PROMPT;
    if (part) {
      prompt = `This is part ${part} of a split audio file. Please transcribe it. ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [audioPart, { text: prompt }] },
    });
    
    const transcript = response.text;
    const startTag = transcript.indexOf('<start>');
    const endTag = transcript.indexOf('<end>');
    
    if (startTag !== -1 && endTag !== -1) {
      return transcript.substring(startTag + 7, endTag).trim();
    }
    
    return transcript.trim();
  } catch (error) {
    console.error("Error during transcription:", error);
    if (file.type.startsWith('video/')) {
        throw new Error("Failed to process video. The file might be too large or in an unsupported format.");
    }
    if (file.type === 'application/pdf') {
        throw new Error("Failed to process PDF. The file may be too large, corrupted, or in an unsupported format.");
    }
    throw new Error("Failed to transcribe audio. The file might be too large or in an unsupported format.");
  }
};

export const analyzeTranscript = async (transcript: string, model: GeminiModel): Promise<string> => {
  try {
    const fullPrompt = `${SECOND_PROMPT}\n\nHere is the transcript:\n\n${transcript}`;
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error during analysis:", error);
    throw new Error("Failed to analyze transcript. The content may be too complex or the model is unavailable.");
  }
};

export const enhanceAndCorrectContent = async (content: string, model: GeminiModel): Promise<string> => {
  try {
    const fullPrompt = `${THIRD_PROMPT}\n\nHere is the document content:\n\n${content}`;
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const corrections = response.text;
    
    if (corrections.includes('No significant errors or omissions found.')) {
        return '';
    }

    const candidate = response.candidates?.[0];
    const { content: correctionsWithCitations, sources: sourcesMarkdown } = processCitationsAndSources(corrections, candidate);

    const title = '\n\n---\n\n## ERROR CORRECTION AND MISSING THINGS\n\n';
    return `${title}${correctionsWithCitations}${sourcesMarkdown}`;
  } catch (error)
 {
    console.error("Error during content enhancement:", error);
    throw new Error("Failed to enhance and correct content.");
  }
};

export const agenticEnhancement = async (content: string, model: GeminiModel): Promise<string> => {
  try {
    const NUM_AGENTS = 3;

    // STEP 1: Initial Analysis
    const initialAgentPromises = Array(NUM_AGENTS).fill(0).map(() => 
      ai.models.generateContent({
        model: model,
        contents: `${INITIAL_AGENT_PROMPT}\n\nHere is the document content:\n\n${content}`,
        config: { tools: [{googleSearch: {}}] }
      })
    );
    const initialResponses = await Promise.all(initialAgentPromises);
    const initialAnalyses = initialResponses.map(res => res.text);

    // STEP 2: Refinement
    const refinementAgentPromises = initialAnalyses.map((initialAnalysis, index) => {
      const otherAnalyses = initialAnalyses.filter((_, i) => i !== index);
      const otherAnalysesText = otherAnalyses.map((analysis, i) => `Analysis from other agent ${i + 1}:\n"${analysis}"`).join('\n\n');
      const refinementContext = `My initial analysis was: "${initialAnalysis}".\n\nThe other agents' analyses were:\n${otherAnalysesText}\n\nBased on all this, critically re-evaluate and provide a new, improved, and consolidated list of issues.`;
      
      const fullPrompt = `${REFINEMENT_AGENT_PROMPT}\n\nOriginal Document:\n${content}\n\n---INTERNAL CONTEXT---\n${refinementContext}`;

      return ai.models.generateContent({
        model: model,
        contents: fullPrompt,
        config: { tools: [{googleSearch: {}}] }
      });
    });
    const refinedResponses = await Promise.all(refinementAgentPromises);
    const refinedAnalyses = refinedResponses.map(res => res.text);

    // STEP 3: Synthesis
    const synthesizerContext = `Here are the ${NUM_AGENTS} refined analyses of the document. Your task is to synthesize them into the best single, final set of corrections and additions.\n\n${refinedAnalyses.map((analysis, i) => `Refined Analysis ${i + 1}:\n"${analysis}"`).join('\n\n')}`;
    const synthesizerPrompt = `${SYNTHESIZER_AGENT_PROMPT}\n\nOriginal Document Content:\n\n${content}\n\n---INTERNAL CONTEXT---\n${synthesizerContext}`;

    const synthesizerResponse = await ai.models.generateContent({
      model: model,
      contents: synthesizerPrompt,
      config: { tools: [{googleSearch: {}}] }
    });

    const corrections = synthesizerResponse.text;
    
    if (corrections.includes('No significant errors or omissions found.')) {
        return '';
    }
    
    const candidate = synthesizerResponse.candidates?.[0];
    const { content: correctionsWithCitations, sources: sourcesMarkdown } = processCitationsAndSources(corrections, candidate);

    const title = '\n\n---\n\n## ENHANCED ERROR CORRECTION AND MISSING THINGS\n\n';
    return `${title}${correctionsWithCitations}${sourcesMarkdown}`;
  } catch (error) {
    console.error("Error during agentic enhancement:", error);
    throw new Error("Failed during enhanced fact-checking process.");
  }
};

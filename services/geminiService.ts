import { GoogleGenAI, Modality, Type } from '@google/genai';
import { UploadedFile, Stage1ExtractionResult, ValidationCheckpoint } from '../types';

// Per guidelines, initialize with apiKey from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = (file: UploadedFile) => {
    return {
        inlineData: {
            data: file.base64,
            mimeType: file.type,
        },
    };
};

export const performStage1Analysis = async (drawing: UploadedFile): Promise<{ extraction: Stage1ExtractionResult, checkpoint: ValidationCheckpoint }> => {
    // STEP 1: Comprehensive Data Extraction
    const extractionSystemInstruction = "You are an expert AI system, 'IEDAS', specializing in the analysis of complex engineering drawings. Your task is to meticulously dissect an uploaded document and extract all technical specifications into the structured JSON format provided. You must analyze ALL views, dimensions, components, assembly relationships, and infer manufacturing processes as specified in the schema. Be precise and comprehensive.";
    const extractionUserPrompt = "Analyze the provided engineering drawing(s) and populate the entire JSON schema with all extracted information. Pay extreme attention to detail, units, and engineering standards for dimensions, tolerances, GD&T, materials, and assembly connections.";

    const DimensionSchema = {
        type: Type.OBJECT,
        properties: {
            nominal: { type: Type.NUMBER },
            tolerance: { type: Type.STRING },
            unit: { type: Type.STRING },
        },
    };

    const ExtractionSchema = {
        type: Type.OBJECT,
        properties: {
            documentClassification: {
                type: Type.OBJECT,
                properties: {
                    document_type: { type: Type.STRING },
                    drawing_standard: { type: Type.STRING },
                    projection_method: { type: Type.STRING },
                    scale: { type: Type.STRING },
                    units: { type: Type.STRING },
                    sheet_count: { type: Type.INTEGER },
                    revision: { type: Type.STRING },
                    date: { type: Type.STRING },
                },
            },
            componentInventory: {
                type: Type.OBJECT,
                properties: {
                    components: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                material: { type: Type.STRING },
                                finish: { type: Type.STRING },
                                quantity: { type: Type.INTEGER },
                                critical_dimensions: { type: Type.OBJECT, properties: {}, additionalProperties: DimensionSchema },
                                features: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING },
                                            specification: { type: Type.STRING },
                                            depth: { type: Type.NUMBER },
                                            quantity: { type: Type.INTEGER },
                                            position: { type: Type.STRING },
                                            width: { type: Type.NUMBER },
                                            location: { type: Type.STRING },
                                        },
                                    },
                                },
                                gdt_callouts: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            feature: { type: Type.STRING },
                                            symbol: { type: Type.STRING },
                                            tolerance: { type: Type.NUMBER },
                                            datum: { type: Type.STRING },
                                            description: { type: Type.STRING },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            assemblyStructure: {
                type: Type.OBJECT,
                properties: {
                    root: { type: Type.STRING },
                    hierarchy: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                parent: { type: Type.STRING },
                                child: { type: Type.STRING },
                                connection_type: { type: Type.STRING },
                                weld_spec: { type: Type.STRING },
                                location: { type: Type.STRING },
                                thread_spec: { type: Type.STRING },
                                torque_spec: { type: Type.STRING },
                            },
                        },
                    },
                    critical_gaps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                between: { type: Type.ARRAY, items: { type: Type.STRING } },
                                clearance: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER }, max: { type: Type.NUMBER }, unit: { type: Type.STRING } } },
                                reason: { type: Type.STRING },
                            },
                        },
                    },
                },
            },
            manufacturingProcessInference: {
                type: Type.OBJECT,
                description: "Keys are component names.",
                properties: {},
                additionalProperties: {
                    type: Type.OBJECT,
                    properties: {
                        primary_process: { type: Type.STRING },
                        secondary_operations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        special_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                        inspection_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                },
            },
        },
    };

    const extractionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [fileToGenerativePart(drawing), { text: extractionUserPrompt }] },
        config: {
            systemInstruction: extractionSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: ExtractionSchema,
        },
    });

    const extraction = JSON.parse(extractionResponse.text) as Stage1ExtractionResult;

    // STEP 2: Validation Checkpoint Generation
    const checkpointSystemInstruction = "You are a Quality Assurance AI. Your task is to analyze the provided JSON data (extracted from an engineering drawing) and create a validation checkpoint report. Generate a summary table assessing the completeness of the extraction, assign a confidence percentage, and list any flags or ambiguities. Also, explicitly list any critical missing information. Adhere to the provided JSON schema for the output.";
    const checkpointUserPrompt = `Based on the following extracted data, create the validation checkpoint summary.
    
    Extracted Data:
    ${JSON.stringify(extraction, null, 2)}`;
    
    const CheckpointSchema = {
        type: Type.OBJECT,
        properties: {
            summaryTable: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        extractedItems: { type: Type.INTEGER },
                        confidence: { type: Type.STRING },
                        flags: { type: Type.STRING },
                    },
                    required: ["category", "extractedItems", "confidence", "flags"],
                },
            },
            missingInfo: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
    };

    const checkpointResponse = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: { parts: [{ text: checkpointUserPrompt }] },
        config: {
            systemInstruction: checkpointSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: CheckpointSchema,
        },
    });

    const checkpoint = JSON.parse(checkpointResponse.text) as ValidationCheckpoint;

    return { extraction, checkpoint };
};


// --- Legacy Functions (can be removed or kept for other modules) ---
export const generateImage = async (prompt: string): Promise<string> => {
    // Per guidelines, use imagen for high-quality image generation.
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png', // Use png for better quality
            aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error('Image generation failed or returned no images.');
};

export const editImage = async (prompt: string, image: UploadedFile): Promise<string> => {
    // Per guidelines, use gemini-2.5-flash-image for editing.
    const imagePart = fileToGenerativePart(image);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [imagePart, textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error('Image editing failed or returned no image.');
};

export const analyzeImage = async (image: UploadedFile, prompt: string): Promise<string> => {
    // Per guidelines, use gemini-2.5-pro for complex tasks like analysis.
    const imagePart = fileToGenerativePart(image);
    const textPart = { text: prompt || 'Describe this image in detail.' };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
    });
    
    // Per guidelines, access text directly.
    return response.text;
};

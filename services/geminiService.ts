import { GoogleGenAI, Modality, Type } from '@google/genai';
import { UploadedFile, Stage1ExtractionResult, ValidationCheckpoint, ComprehensiveReport, ManufacturingArtifacts } from '../types';

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

export const generateComprehensiveReport = async (
    stage1Data: Stage1ExtractionResult,
    sourceFileName: string,
    userDecision: 'assumptions' | 'current_data'
): Promise<ComprehensiveReport> => {
    
    const systemInstruction = `You are an AI Engineering Assistant responsible for creating the final, comprehensive data package for a component.
    You will receive a raw data extraction and must enrich it into a complete report.
    
    CRITICAL RULES:
    1.  **Enrich Data**: Populate 'project_metadata' and 'coordinate_system' based on the input data and common engineering practices.
    2.  **Generate Bill of Materials (BOM)**: Analyze the 'componentInventory' to create a complete 'billOfMaterials'. Each item must have a number, part number (can be inferred from name), description, quantity, and material.
    3.  **Identify Standards**: Analyze all extracted data (notes, callouts, materials) to identify relevant industry standards (e.g., ASME Y14.5, API 6A, ANSI B16.5). Populate these into the 'standardsComplianceNotes' array.
    4.  **Infer Assembly**: Analyze the components and their connections to generate a logical 'assembly_sequence'. Be practical and clear.
    5.  **Define Drawing Parameters**: Set default 'drawing_generation_parameters'.
    6.  **Handle Ambiguity**: Adhere to the user's decision. If proceeding with 'assumptions', explicitly state them in the relevant component descriptions or assembly notes. For example: "Assumed M6 bolt based on 6mm clearance hole". The guiding principle is: "When in doubt, document the doubt."
    7.  **Quality Assurance**: Before outputting, internally verify that the BOM correctly reflects the component list and that all major standards mentioned in the source drawing are noted.
    8.  **Metadata**: The project name should be inferred from the main component. The part number can be the project name plus a suffix. Designer should reference the source document. Date should be the current UTC ISO string.`;
        
    const userPrompt = `Generate the comprehensive report based on the following Stage 1 data extraction.
    
    User Decision: The user has chosen to proceed by using '${userDecision}'.
    Source Document: ${sourceFileName}

    Stage 1 Data:
    ${JSON.stringify(stage1Data, null, 2)}`;

    const ReportSchema = {
        type: Type.OBJECT,
        properties: {
            project_metadata: {
                type: Type.OBJECT,
                properties: {
                    project_name: { type: Type.STRING },
                    part_number: { type: Type.STRING },
                    revision: { type: Type.STRING },
                    designer: { type: Type.STRING },
                    date_extracted: { type: Type.STRING },
                    source_documents: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
            },
            coordinate_system: {
                type: Type.OBJECT,
                properties: {
                    origin: { type: Type.STRING },
                    axes: { type: Type.OBJECT, properties: { X: { type: Type.STRING }, Y: { type: Type.STRING }, Z: { type: Type.STRING } } },
                    units: { type: Type.STRING },
                },
            },
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
                        critical_dimensions: { type: Type.OBJECT, properties: {}, additionalProperties: {
                            type: Type.OBJECT,
                            properties: {
                                nominal: { type: Type.NUMBER },
                                tolerance: { type: Type.STRING },
                                unit: { type: Type.STRING },
                            },
                        }},
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
            assembly_sequence: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        step: { type: Type.INTEGER },
                        action: { type: Type.STRING },
                        components_involved: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tools_required: { type: Type.ARRAY, items: { type: Type.STRING } },
                        verification: { type: Type.STRING },
                        safety_notes: { type: Type.STRING },
                    },
                },
            },
            drawing_generation_parameters: {
                type: Type.OBJECT,
                properties: {
                    "2d_views_required": { type: Type.ARRAY, items: { type: Type.STRING } },
                    "3d_model_type": { type: Type.STRING },
                    export_formats: { type: Type.ARRAY, items: { type: Type.STRING } },
                    annotation_density: { type: Type.STRING },
                },
            },
            billOfMaterials: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        itemNumber: { type: Type.INTEGER },
                        partNumber: { type: Type.STRING },
                        description: { type: Type.STRING },
                        quantity: { type: Type.INTEGER },
                        material: { type: Type.STRING },
                        notes: { type: Type.STRING },
                    },
                    required: ["itemNumber", "partNumber", "description", "quantity", "material"],
                }
            },
            standardsComplianceNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: userPrompt }] },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: ReportSchema,
        },
    });

    return JSON.parse(response.text) as ComprehensiveReport;
};

export const generateManufacturingDrawings = async (
    report: ComprehensiveReport,
    onProgress: (message: string) => void
): Promise<Omit<ManufacturingArtifacts, 'interactiveModelHtml'>> => {
    onProgress('Initializing artifact generation...');

    const systemInstruction = `You are a world-class AI Manufacturing Engineer. Your task is to take a comprehensive JSON data package and generate a set of manufacturing artifacts. You must follow all specifications for each artifact precisely. You will NOT generate the 3D model HTML.

    **Artifact 1: 2D SVG Drawing**
    - MUST conform to ASME Y14.5-2018 standards.
    - Generate an SVG string with width="1100" and height="850".
    - **Line Weights and Styles**:
        - You MUST include the following CSS block inside a \`<defs><style>\` tag.
        - You MUST then apply these classes to all SVG elements (paths, lines, circles, text) according to their function.
        - **Visible Lines**: Use class="visible" for all visible object edges. These should be thick and solid.
        - **Hidden Lines**: Use class="hidden" for edges that are not visible in a view. These should be thinner and dashed.
        - **Center Lines**: Use class="centerline" for the axes of symmetrical parts or features. These should be thin with a long-dash/short-dash pattern.
        - **Dimension & Extension Lines**: Use class="dimension" for all lines related to dimensioning. These should be the thinnest lines.
        - **Text**: Use class="dim-text" for dimension values and ".title-block-text" for title block content.
        - **BOM Text**: Use class="bom-text" for the bill of materials table.
    - **CSS Block to Include**:
      \`\`\`css
      <defs>
        <style>
          .visible { stroke: #E5E7EB; stroke-width: 0.7; }
          .hidden { stroke: #9CA3AF; stroke-width: 0.35; stroke-dasharray: 4 2; }
          .centerline { stroke: #F87171; stroke-width: 0.35; stroke-dasharray: 8 2 2 2; }
          .dimension, .leader, .extension { stroke: #60A5FA; stroke-width: 0.25; }
          .dim-text { font-family: monospace; font-size: 12px; fill: #60A5FA; dominant-baseline: middle; text-anchor: middle; }
          .title-block-text { font-family: sans-serif; font-size: 10px; fill: #E5E7EB; }
          .bom-text { font-family: sans-serif; font-size: 10px; fill: #E5E7EB; }
          .table-header { font-weight: bold; }
        </style>
      </defs>
      \`\`\`
    - Create a title block in the bottom right.
    - **Bill of Materials (BOM)**:
        - Render the 'billOfMaterials' data as a table in the top-right corner of the drawing.
        - The table should have columns: ITEM, PART NUMBER, DESCRIPTION, QTY, MATERIAL.
        - Use SVG \`<text>\` elements for the table content, applying the 'bom-text' class. Use 'table-header' for the header row.
    - **Standards Notes**:
        - Display the 'standardsComplianceNotes' as a list in the bottom-left corner of the drawing, near the title block.
    - **View Layout and Structure**:
        - Each individual view (e.g., Front, Top, Right, Isometric, Detail A) MUST be wrapped in its own \`<g>\` element with a unique \`id\` (e.g., \`<g id="front-view">...\</g>\`).
        - Use the \`transform="translate(x y) scale(s)"\` attribute on each view's group to position and scale it appropriately on the drawing sheet (width="1100" height="850").
        - Arrange the primary orthographic views according to a standard third-angle projection.
        - Ensure there is clear spacing between all views to avoid overlap.
    - **Dimension Formatting Rules**:
        - For linear dimensions with a simple tolerance string (e.g., "±0.5"), format the text as 'value±tolerance', for example: \`<text>200±0.5</text>\`.
        - For diameter dimensions, ALWAYS use the Unicode diameter symbol '⌀' (U+2300).
        - For complex or asymmetric tolerances (e.g., "+0.05/-0.00"), you MUST use \`<tspan>\` elements with \`baseline-shift="super"\` and \`baseline-shift="sub"\` to correctly render the upper and lower limits. See this exact example: \`<text><tspan>⌀</tspan><tspan>50.00</tspan><tspan baseline-shift="super" font-size="8">+0.05</tspan><tspan baseline-shift="sub" font-size="8">−0.00</tspan></text>\`.
        - Ensure all dimension text is readable and placed according to ASME standards.

    **Artifact 2: CAD Recreation Guide (Markdown)**
    - Generate a clear, step-by-step guide in Markdown format.
    - The guide should have two main sections: Component Modeling and Assembly Sequence.
    - **Component Modeling**: Instruct a human user on how to model the individual components in professional CAD software (like FreeCAD, SolidWorks). Be specific with operations (e.g., "Sketch circle Ø22.23mm on XY plane", "Extrude 203.2mm", "Shell operation").
    - **Assembly Sequence**:
        - Use the 'assembly_sequence' from the JSON report to create step-by-step assembly instructions.
        - For EACH assembly step, you MUST include a simple ASCII art diagram inside a Markdown code block.
        - This diagram should provide a basic visual representation of the components involved in that step and how they connect.

    **Artifact 3: Manufacturing Readiness Checklist (Markdown)**
    - Generate a checklist in Markdown format based on the provided template.
    - The checklist should cover Critical Dimensions, Manufacturability, Documentation, and Quality Control.
    `;
    
    onProgress('Constructing generation prompt...');
    const userPrompt = `Based on the following comprehensive report, generate the SVG drawing and markdown guides as a single JSON object.

    ${JSON.stringify(report, null, 2)}
    `;

    const ArtifactsSchema = {
        type: Type.OBJECT,
        properties: {
            svgDrawing: { 
                type: Type.STRING,
                description: "A complete, well-structured SVG string for the 2D engineering drawing."
            },
            cadRecreationGuideMd: {
                type: Type.STRING,
                description: "A step-by-step guide in Markdown for recreating the model in CAD software."
            },
            readinessChecklistMd: {
                type: Type.STRING,
                description: "A manufacturing readiness checklist in Markdown format."
            },
        },
        required: ["svgDrawing", "cadRecreationGuideMd", "readinessChecklistMd"],
    };
    
    onProgress('Generating 2D Views and Documentation...');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: userPrompt }] },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: ArtifactsSchema,
        },
    });

    onProgress('Finalizing artifacts...');
    return JSON.parse(response.text) as Omit<ManufacturingArtifacts, 'interactiveModelHtml'>;
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
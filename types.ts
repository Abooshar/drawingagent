export interface UploadedFile {
    name: string;
    type: string;
    size: number;
    base64: string;
}

// STAGE 1: EXTRACTION TYPES

export interface DocumentClassification {
    document_type?: string;
    drawing_standard?: string;
    projection_method?: string;
    scale?: string;
    units?: string;
    sheet_count?: number;
    revision?: string;
    date?: string;
}

export interface Dimension {
    nominal?: number;
    tolerance?: string;
    unit?: string;
}

export interface Feature {
    type?: string;
    specification?: string;
    depth?: number;
    quantity?: number;
    position?: string;
    width?: number;
    location?: string;
}

export interface GdtCallout {
    feature?: string;
    symbol?: string;
    tolerance?: number;
    datum?: string;
    description?: string;
}

export interface Component {
    id?: number;
    name?: string;
    description?: string;
    material?: string;
    finish?: string;
    quantity?: number;
    critical_dimensions?: { [key: string]: Dimension };
    features?: Feature[];
    gdt_callouts?: GdtCallout[];
}

export interface AssemblyHierarchyNode {
    parent?: string;
    child?: string;
    connection_type?: string;
    weld_spec?: string;
    location?: string;
    thread_spec?: string;
    torque_spec?: string;
}

export interface CriticalGap {
    between?: string[];
    clearance?: { min?: number; max?: number; unit?: string };
    reason?: string;
}

export interface AssemblyStructure {
    root?: string;
    hierarchy?: AssemblyHierarchyNode[];
    critical_gaps?: CriticalGap[];
}

export interface ManufacturingProcess {
    primary_process?: string;
    secondary_operations?: string[];
    special_requirements?: string[];
    inspection_requirements?: string[];
}

export interface Stage1ExtractionResult {
    documentClassification: DocumentClassification;
    componentInventory: {
        components: Component[];
    };
    assemblyStructure: AssemblyStructure;
    manufacturingProcessInference: {
        [componentName: string]: ManufacturingProcess;
    };
}


// STAGE 1: VALIDATION CHECKPOINT TYPES

export interface CheckpointItem {
    category: string;
    extractedItems: number;
    confidence: string;
    flags: string;
}

export interface ValidationCheckpoint {
    summaryTable: CheckpointItem[];
    missingInfo: string[];
}

// STAGE 2: COMPREHENSIVE REPORT TYPES

export interface ProjectMetadata {
    project_name?: string;
    part_number?: string;
    revision?: string;
    designer?: string;
    date_extracted?: string;
    source_documents?: string[];
}

export interface CoordinateSystem {
    origin?: string;
    axes?: { X?: string; Y?: string; Z?: string; };
    units?: string;
}

export interface AssemblyStep {
    step?: number;
    action?: string;
    components_involved?: string[];
    tools_required?: string[];
    verification?: string;
    safety_notes?: string;
}

export interface DrawingGenerationParameters {
    "2d_views_required"?: string[];
    "3d_model_type"?: string;
    export_formats?: string[];
    annotation_density?: string;
}

export interface BillOfMaterialsItem {
    itemNumber: number;
    partNumber: string;
    description: string;
    quantity: number;
    material: string;
    notes?: string;
}

export interface ComprehensiveReport {
    project_metadata: ProjectMetadata;
    coordinate_system: CoordinateSystem;
    components: Component[];
    assembly_sequence: AssemblyStep[];
    drawing_generation_parameters: DrawingGenerationParameters;
    billOfMaterials: BillOfMaterialsItem[];
    standardsComplianceNotes: string[];
}

// STAGE 3: MANUFACTURING ARTIFACTS

export interface ManufacturingArtifacts {
    svgDrawing: string;
    interactiveModelHtml: string;
    cadRecreationGuideMd: string;
    readinessChecklistMd: string;
}
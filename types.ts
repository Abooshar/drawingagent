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

// OLD TYPES (potentially for other features)
export interface BoundingBox {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
}

export interface DrawingComponent {
    componentId: string;
    name?: string;
    quantity?: number;
    boundingBox?: BoundingBox;
    material?: string;
    materialId?: string; 
}

export interface DrawingView {
    viewId?: number;
    viewType?: string;
    description?: string;
    scale?: string;
    boundingBox?: BoundingBox;
}

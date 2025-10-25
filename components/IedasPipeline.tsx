import React, { useState } from 'react';
import { UploadedFile, Stage1ExtractionResult, ValidationCheckpoint, ComprehensiveReport, ManufacturingArtifacts } from '../types';
import * as geminiService from '../services/geminiService';
import { generateModelHtml } from '../services/threeJsGenerator';
import { FileUpload } from './common/FileUpload';
import { Loader } from './common/Loader';
import { ValidationCheckpointViewer } from './common/ValidationCheckpointViewer';
import { JsonViewer } from './common/JsonViewer';
import { ManufacturingOutputViewer } from './common/ManufacturingOutputViewer';

type PipelineStatus = 'idle' | 'analyzing' | 'validation_checkpoint' | 'structuring_data' | 'report_ready' | 'generating_drawings' | 'drawings_ready' | 'error';

export const IedasPipeline: React.FC = () => {
    const [drawingFile, setDrawingFile] = useState<UploadedFile | null>(null);
    const [status, setStatus] = useState<PipelineStatus>('idle');
    const [stage1Data, setStage1Data] = useState<Stage1ExtractionResult | null>(null);
    const [checkpointData, setCheckpointData] = useState<ValidationCheckpoint | null>(null);
    const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveReport | null>(null);
    const [manufacturingArtifacts, setManufacturingArtifacts] = useState<ManufacturingArtifacts | null>(null);
    const [generationProgressText, setGenerationProgressText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (files: UploadedFile[]) => {
        if (files.length > 0) {
            setDrawingFile(files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!drawingFile) {
            setError('Please upload an engineering drawing first.');
            setStatus('error');
            return;
        }
        setStatus('analyzing');
        setError(null);

        try {
            const { extraction, checkpoint } = await geminiService.performStage1Analysis(drawingFile);
            setStage1Data(extraction);
            setCheckpointData(checkpoint);
            setStatus('validation_checkpoint');
        } catch (err: any) {
            setError(err.message || `Failed to analyze the drawing.`);
            setStatus('error');
        }
    };

    const handleProceedToReport = async (decision: 'assumptions' | 'current_data') => {
        if (!stage1Data || !drawingFile) {
            setError('Missing data to proceed.');
            setStatus('error');
            return;
        }
        setStatus('structuring_data');
        try {
            const report = await geminiService.generateComprehensiveReport(stage1Data, drawingFile.name, decision);
            setComprehensiveReport(report);
            setStatus('report_ready');
        } catch (err: any) {
             setError(err.message || `Failed to generate the comprehensive report.`);
             setStatus('error');
        }
    };

    const handleGenerateDrawings = async () => {
        if (!comprehensiveReport) {
            setError('Comprehensive report not available.');
            setStatus('error');
            return;
        }
        setStatus('generating_drawings');
        try {
            const llmArtifacts = await geminiService.generateManufacturingDrawings(
                comprehensiveReport, 
                (message) => setGenerationProgressText(message)
            );

            setGenerationProgressText('Generating interactive 3D model...');
            
            // Generate the HTML for the 3D model on the client side for reliability
            const modelHtml = generateModelHtml(comprehensiveReport);

            // Combine AI-generated artifacts with client-generated model
            const finalArtifacts: ManufacturingArtifacts = {
                ...llmArtifacts,
                interactiveModelHtml: modelHtml,
            };

            setManufacturingArtifacts(finalArtifacts);
            setStatus('drawings_ready');
        } catch(err: any) {
            setError(err.message || `Failed to generate manufacturing drawings.`);
            setStatus('error');
        }
    };


    const handleReset = () => {
        setDrawingFile(null);
        setStage1Data(null);
        setCheckpointData(null);
        setComprehensiveReport(null);
        setManufacturingArtifacts(null);
        setGenerationProgressText('');
        setError(null);
        setStatus('idle');
    };

    const renderContent = () => {
        switch (status) {
            case 'analyzing':
                return <Loader text="Performing Stage 1 Analysis with Gemini 2.5 Pro..." />;

            case 'validation_checkpoint':
                return checkpointData ? (
                    <ValidationCheckpointViewer 
                        checkpoint={checkpointData}
                        onProceed={handleProceedToReport}
                    />
                ) : <Loader text="Preparing validation checkpoint..." />;

            case 'structuring_data':
                return <Loader text="Generating Comprehensive Report..." />;

            case 'report_ready':
                return (
                    <div className="w-full max-w-4xl text-center">
                        <h3 className="text-xl font-bold text-green-400 mb-4">Comprehensive Report Generated</h3>
                        <p className="text-gray-300 mb-6">The final structured JSON is ready for Stage 3.</p>
                        {comprehensiveReport && <JsonViewer data={JSON.stringify(comprehensiveReport)} />}
                        <button onClick={handleGenerateDrawings} className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg">
                            Generate Manufacturing Drawings
                        </button>
                    </div>
                );
            
            case 'generating_drawings':
                return <Loader text={generationProgressText || 'Generating Manufacturing Drawings...'} />;

            case 'drawings_ready':
                return manufacturingArtifacts ? (
                    <div className="w-full">
                        <ManufacturingOutputViewer artifacts={manufacturingArtifacts} />
                        <div className="text-center mt-8">
                            <button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                Start New Project
                            </button>
                        </div>
                    </div>
                ) : <Loader text="Loading artifacts..." />;


            case 'error':
                return (
                    <div className="text-center">
                        <p className="text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</p>
                        <button onClick={handleReset} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Start Over
                        </button>
                    </div>
                );

            case 'idle':
            default:
                return (
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Stage 1: Upload & Analyze</h3>
                                <p className="text-sm text-gray-400 mb-2">Upload a PDF, PNG, or JPG of the drawing you want to analyze.</p>
                                <FileUpload onFilesSelect={handleFileSelect} accept="image/*,application/pdf" />
                            </div>
                            <button onClick={handleAnalyze} disabled={!drawingFile} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed">
                                Begin Stage 1 Analysis
                            </button>
                        </div>
                        <div className="text-center p-4 bg-gray-900 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Uploaded Drawing Preview</h3>
                            {drawingFile ? (
                                drawingFile.type.startsWith('image/') ? (
                                    <img src={`data:${drawingFile.type};base64,${drawingFile.base64}`} alt="Engineering Drawing" className="rounded-lg w-full max-h-96 object-contain" />
                                ) : (
                                    <div className="h-96 flex flex-col items-center justify-center bg-gray-700 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <p className="mt-2 text-gray-300">{drawingFile.name}</p>
                                        <p className="text-sm text-gray-500">PDF Preview not available</p>
                                    </div>
                                )
                            ) : (
                                <div className="h-96 flex items-center justify-center bg-gray-700 rounded-lg text-gray-400">
                                    Your drawing will be shown here.
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    const getStageTitle = () => {
        if(status === 'idle' || status === 'analyzing' || status === 'validation_checkpoint' || status === 'structuring_data') {
            return "Stage 1 & 2: Visual Analysis & Data Structuring";
        }
        if(status === 'report_ready' || status === 'generating_drawings') {
            return "Stage 3: Manufacturing Drawing Generation";
        }
         if(status === 'drawings_ready') {
            return "Stage 3: Final Output Package";
        }
        if (status === 'error') {
            return "An Error Occurred";
        }
        return "IEDAS Pipeline";
    }

    return (
        <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-6">{getStageTitle()}</h2>
            <div className="min-h-[400px] flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
    );
};
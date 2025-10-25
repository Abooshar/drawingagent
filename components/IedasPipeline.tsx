import React, { useState } from 'react';
import { UploadedFile, Stage1ExtractionResult, ValidationCheckpoint } from '../types';
import * as geminiService from '../services/geminiService';
import { FileUpload } from './common/FileUpload';
import { Loader } from './common/Loader';
import { ValidationCheckpointViewer } from './common/ValidationCheckpointViewer';

type PipelineStatus = 'idle' | 'analyzing' | 'validation_checkpoint' | 'cad_generation' | 'error';

export const IedasPipeline: React.FC = () => {
    const [drawingFile, setDrawingFile] = useState<UploadedFile | null>(null);
    const [status, setStatus] = useState<PipelineStatus>('idle');
    const [stage1Data, setStage1Data] = useState<Stage1ExtractionResult | null>(null);
    const [checkpointData, setCheckpointData] = useState<ValidationCheckpoint | null>(null);
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

    const handleProceed = (decision: 'assumptions' | 'current_data') => {
        console.log(`Proceeding with decision: ${decision}`);
        // Placeholder for next stage
        setStatus('cad_generation'); 
    };

    const handleReset = () => {
        setDrawingFile(null);
        setStage1Data(null);
        setCheckpointData(null);
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
                        onProceed={handleProceed}
                    />
                ) : <Loader text="Preparing validation checkpoint..." />;

            case 'cad_generation':
                 return (
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-green-400 mb-4">Stage 1 Approved!</h3>
                        <p className="text-gray-300 mb-6">Next step: CAD Generation based on the validated data.</p>
                        <button onClick={handleReset} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Start New Project
                        </button>
                    </div>
                );

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

    return (
        <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-6">IEDAS: Stage 1 - Visual Analysis</h2>
            <div className="min-h-[400px] flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
    );
};

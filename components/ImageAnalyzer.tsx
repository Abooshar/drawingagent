
import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { UploadedFile } from '../types';
import { Loader } from './common/Loader';
import { FileUpload } from './common/FileUpload';

export const ImageAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [image, setImage] = useState<UploadedFile | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) {
            setError('Please upload an image to analyze.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await geminiService.analyzeImage(image, prompt);
            setAnalysis(result);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze image.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-6">AI Image Analyzer</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                     <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold mb-2">1. Upload Image</h3>
                        <FileUpload onFilesSelect={(files) => setImage(files[0])} />
                        <h3 className="text-lg font-semibold mb-2 mt-4">2. (Optional) Ask a question</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., What kind of material is this part made of? or leave blank for a general description."
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !image}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Image'}
                        </button>
                    </form>
                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                </div>
                
                <div className="space-y-4">
                     <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Your Image</h3>
                        {image ? <img src={`data:${image.type};base64,${image.base64}`} alt="Uploaded for analysis" className="rounded-lg w-full" /> : <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">Upload an image to see it here</div>}
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                        <div className="aspect-square bg-gray-900 rounded-lg p-4 text-left overflow-y-auto">
                            {isLoading ? <div className="flex items-center justify-center h-full"><Loader text="Analyzing..."/></div> : 
                             analysis ? <p className="whitespace-pre-wrap">{analysis}</p> : <div className="flex items-center justify-center h-full text-gray-400">Analysis will appear here</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

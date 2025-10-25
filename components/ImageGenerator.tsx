
import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Loader } from './common/Loader';

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const url = await geminiService.generateImage(prompt);
            setImageUrl(url);
        } catch (err: any) {
            setError(err.message || 'Failed to generate image.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-6">AI Image Generation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photorealistic image of a robot holding a red skateboard in a futuristic city"
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
            </form>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            
            <div className="mt-8">
                {isLoading && <Loader text="Generating image with Imagen..." />}
                {imageUrl && (
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <img src={imageUrl} alt="Generated" className="rounded-md mx-auto max-w-full h-auto" />
                    </div>
                )}
            </div>
        </div>
    );
};

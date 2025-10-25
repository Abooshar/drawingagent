
import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { UploadedFile } from '../types';
import { Loader } from './common/Loader';
import { FileUpload } from './common/FileUpload';

export const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [image, setImage] = useState<UploadedFile | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt || !image) {
            setError('Please upload an image and provide an edit prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImageUrl(null);
        try {
            const url = await geminiService.editImage(prompt, image);
            setEditedImageUrl(url);
        } catch (err: any) {
            setError(err.message || 'Failed to edit image.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-6">AI Image Editor</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2">1. Upload Image</h3>
                    <FileUpload onFilesSelect={(files) => setImage(files[0])} />
                    <h3 className="text-lg font-semibold mb-2 mt-6">2. Describe Your Edit</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Add a retro filter, or remove the person in the background"
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !image}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Editing...' : 'Apply Edit'}
                        </button>
                    </form>
                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                </div>
                
                <div className="space-y-4">
                     <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Original</h3>
                        {image ? <img src={`data:${image.type};base64,${image.base64}`} alt="Original" className="rounded-lg w-full" /> : <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">Upload an image to see it here</div>}
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Edited</h3>
                        {isLoading ? <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center"><Loader text="Applying edit..."/></div> : 
                         editedImageUrl ? <img src={editedImageUrl} alt="Edited" className="rounded-lg w-full" /> : <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">Your edited image will appear here</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

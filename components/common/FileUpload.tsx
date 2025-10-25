
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { UploadedFile } from '../../types';

interface FileUploadProps {
    onFilesSelect: (files: UploadedFile[]) => void;
    multiple?: boolean;
    accept?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, multiple = false, accept = 'image/*' }) => {
    const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    
    const handleFiles = useCallback(async (files: FileList | null) => {
        if (files && files.length > 0) {
            const filesArray = multiple ? Array.from(files) : [files[0]];
            setSelectedFileNames(filesArray.map(f => f.name));
            const uploadedFiles: UploadedFile[] = await Promise.all(
                filesArray.map(async file => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    base64: await fileToBase64(file),
                }))
            );
            onFilesSelect(uploadedFiles);
        }
    }, [onFilesSelect, multiple]);

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };
    
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
            ${isDragActive ? 'border-blue-500 bg-gray-700' : 'border-gray-600 hover:border-blue-500'}`}
        >
            <input id="file-input" type="file" className="hidden" multiple={multiple} accept={accept} onChange={handleChange} />
            <div className="flex flex-col items-center justify-center text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag & drop file here, or click to select</p>
                }
                {selectedFileNames.length > 0 && <p className="mt-2 text-sm text-gray-300">Selected: {selectedFileNames.join(', ')}</p>}
            </div>
        </div>
    );
};

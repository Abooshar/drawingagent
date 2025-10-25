import React from 'react';
import { GeneratedView } from './ViewResultViewer';

interface FinalOutputProps {
    htmlContent: string;
    generatedViews: GeneratedView[];
}

export const FinalOutput: React.FC<FinalOutputProps> = ({ htmlContent, generatedViews }) => {
    
    const handlePrint = () => {
        const iframe = document.getElementById('report-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
    };
    
    const downloadFile = (dataUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        const componentName = 'component'; // This could be derived from data later
        generatedViews.forEach(view => {
            const baseFilename = `${componentName}-${view.viewType.replace(/\s+/g, '-')}`;
            // Download PNG
            downloadFile(view.imageUrl, `${baseFilename}.png`);
            // Download SVG
            downloadFile(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(view.svgCode)}`, `${baseFilename}.svg`);
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="bg-gray-700 p-3 rounded-t-lg flex items-center justify-center gap-4">
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Print to PDF
                </button>
                <button onClick={handleDownloadAll} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                    Download All Files
                </button>
            </div>
            <div className="bg-white rounded-b-lg overflow-hidden">
                <iframe
                    id="report-iframe"
                    srcDoc={htmlContent}
                    title="Final Engineering Report"
                    className="w-full h-[70vh] border-0"
                />
            </div>
        </div>
    );
};
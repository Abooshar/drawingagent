import React, { useState } from 'react';
import { ManufacturingArtifacts } from '../../types';
import { MarkdownViewer } from './MarkdownViewer';

// Since jsPDF is loaded from a CDN, declare it to TypeScript
declare const jspdf: any;

interface ManufacturingOutputViewerProps {
    artifacts: ManufacturingArtifacts;
}

export const ManufacturingOutputViewer: React.FC<ManufacturingOutputViewerProps> = ({ artifacts }) => {
    const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'cad_guide' | 'checklist'>('2d');

    const handleDownloadSvg = () => {
        const blob = new Blob([artifacts.svgDrawing], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'engineering_drawing.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1100, 850] // Match SVG dimensions
        });

        const canvas = document.createElement('canvas');
        canvas.width = 1100 * 2; // Render at 2x resolution for quality
        canvas.height = 850 * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1100, 850);
            pdf.save('engineering_drawing.pdf');
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(artifacts.svgDrawing);
    };

    const renderContent = () => {
        switch (activeTab) {
            case '2d':
                return (
                    <div>
                        <div className="flex justify-center gap-4 mb-4">
                            <button onClick={handleDownloadSvg} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Download SVG</button>
                            <button onClick={handleDownloadPdf} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Download PDF</button>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-600">
                             <div dangerouslySetInnerHTML={{ __html: artifacts.svgDrawing }} />
                        </div>
                    </div>
                );
            case '3d':
                 return (
                    <div className="aspect-video bg-gray-900 border border-gray-600 rounded-lg overflow-hidden">
                        <iframe
                            srcDoc={artifacts.interactiveModelHtml}
                            title="Interactive 3D Model"
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                        />
                    </div>
                );
            case 'cad_guide':
                return <MarkdownViewer markdown={artifacts.cadRecreationGuideMd} />;
            case 'checklist':
                return <MarkdownViewer markdown={artifacts.readinessChecklistMd} />;
            default:
                return null;
        }
    };
    
    const TabButton: React.FC<{ tabId: '2d' | '3d' | 'cad_guide' | 'checklist'; label: string; }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-200 ${
                activeTab === tabId
                    ? 'text-blue-400 border-blue-400'
                    : 'text-gray-400 border-transparent hover:text-white'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex border-b border-gray-600 mb-4 justify-center">
                <TabButton tabId="2d" label="2D Drawing" />
                <TabButton tabId="3d" label="Interactive 3D Model" />
                <TabButton tabId="cad_guide" label="CAD Guide" />
                <TabButton tabId="checklist" label="Readiness Checklist" />
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};
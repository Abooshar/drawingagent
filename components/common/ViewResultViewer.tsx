import React, { useState } from 'react';

export interface GeneratedView {
    viewType: string;
    imageUrl: string;
    svgCode: string;
}

interface ViewResultViewerProps {
    views: GeneratedView[];
}

const DownloadButton: React.FC<{ onDownload: () => void, format: string }> = ({ onDownload, format }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        className="absolute top-2 right-2 bg-gray-700 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors duration-200 z-20"
    >
        Download {format}
    </button>
);

const ZoomModal: React.FC<{ src: string, alt: string, onClose: () => void }> = ({ src, alt, onClose }) => (
    <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
    >
        <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
        />
    </div>
);


export const ViewResultViewer: React.FC<ViewResultViewerProps> = ({ views }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [zoomedAlt, setZoomedAlt] = useState('');

    const handleDownload = (dataUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!views || views.length === 0) {
        return <p className="text-gray-400 text-center">No views were generated.</p>;
    }

    const activeView = views[activeTab];
    const componentName = 'component'; // This could be passed down as a prop later

    const handleZoom = (src: string, alt: string) => {
        setZoomedImage(src);
        setZoomedAlt(alt);
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-gray-900 border border-gray-700 p-4 rounded-lg">
             {zoomedImage && <ZoomModal src={zoomedImage} alt={zoomedAlt} onClose={() => setZoomedImage(null)} />}
            <div className="flex border-b border-gray-600 mb-4">
                {views.map((view, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2 -mb-px font-semibold border-b-2 transition-colors duration-200 ${
                            activeTab === index
                                ? 'text-blue-400 border-blue-400'
                                : 'text-gray-400 border-transparent hover:text-white'
                        }`}
                    >
                        {view.viewType}
                    </button>
                ))}
            </div>

            {activeView && (
                <div className="grid md:grid-cols-2 gap-4">
                    {/* PNG View */}
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <h4 className="font-bold text-center mb-2">Raster View (PNG)</h4>
                        <div onClick={() => handleZoom(activeView.imageUrl, `${activeView.viewType} - PNG`)} className="relative aspect-square bg-white rounded flex items-center justify-center p-2 cursor-zoom-in">
                             <img
                                src={activeView.imageUrl}
                                alt={`${activeView.viewType} - PNG`}
                                className="max-w-full max-h-full object-contain"
                            />
                            <DownloadButton
                                onDownload={() => handleDownload(activeView.imageUrl, `${componentName}-${activeView.viewType.replace(/\s+/g, '-')}.png`)}
                                format="PNG"
                            />
                        </div>
                    </div>

                    {/* SVG View */}
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <h4 className="font-bold text-center mb-2">Vector View (SVG)</h4>
                        <div onClick={() => handleZoom(`data:image/svg+xml;base64,${btoa(activeView.svgCode)}`, `${activeView.viewType} - SVG`)} className="relative aspect-square bg-white rounded flex items-center justify-center p-2 overflow-hidden cursor-zoom-in">
                             <img
                                src={`data:image/svg+xml;base64,${btoa(activeView.svgCode)}`}
                                alt={`${activeView.viewType} - SVG`}
                                className="max-w-full max-h-full object-contain"
                            />
                             <DownloadButton
                                onDownload={() => handleDownload(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(activeView.svgCode)}`, `${componentName}-${activeView.viewType.replace(/\s+/g, '-')}.svg`)}
                                format="SVG"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
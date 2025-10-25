import React from 'react';

interface MarkdownViewerProps {
    markdown: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdown }) => {
    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4 border border-gray-700 max-h-[70vh] overflow-y-auto">
            <pre className="p-4 text-left whitespace-pre-wrap text-sm text-gray-300 font-mono">
                {markdown}
            </pre>
        </div>
    );
};
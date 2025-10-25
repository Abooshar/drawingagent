
import React from 'react';

interface JsonViewerProps {
    data: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
    let formattedJson = '';
    try {
        const parsed = JSON.parse(data);
        formattedJson = JSON.stringify(parsed, null, 2);
    } catch (error) {
        formattedJson = "Error: Invalid JSON format.";
    }

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4 border border-gray-700">
            <div className="bg-gray-700 text-gray-300 px-4 py-2 font-mono text-sm">
                JSON Output
            </div>
            <pre className="p-4 text-left overflow-x-auto text-sm text-green-300">
                {formattedJson}
            </pre>
        </div>
    );
};

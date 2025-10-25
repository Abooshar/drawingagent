import React from 'react';
import { ValidationCheckpoint } from '../../types';
import { FlagIcon, CheckCircleIcon } from '../icons';

interface ValidationCheckpointViewerProps {
    checkpoint: ValidationCheckpoint;
    onProceed: (decision: 'assumptions' | 'current_data') => void;
}

export const ValidationCheckpointViewer: React.FC<ValidationCheckpointViewerProps> = ({ checkpoint, onProceed }) => {
    const { summaryTable, missingInfo } = checkpoint;

    const getConfidenceColor = (confidence: string) => {
        const value = parseInt(confidence);
        if (value >= 90) return 'text-green-400';
        if (value >= 75) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-bold text-center mb-4 text-blue-300">Stage 1: Validation Checkpoint</h3>
            
            <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-200">Extraction Summary</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Extracted Items</th>
                                <th scope="col" className="px-6 py-3">Confidence</th>
                                <th scope="col" className="px-6 py-3">Flags / Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryTable.map((item, index) => (
                                <tr key={index} className="bg-gray-800 border-b border-gray-700">
                                    <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap">{item.category}</th>
                                    <td className="px-6 py-4">{item.extractedItems}</td>
                                    <td className={`px-6 py-4 font-bold ${getConfidenceColor(item.confidence)}`}>{item.confidence}</td>
                                    <td className="px-6 py-4">{item.flags}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {missingInfo && missingInfo.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                    <h4 className="text-lg font-semibold text-yellow-300 flex items-center"><FlagIcon /> <span className="ml-2">Missing Information</span></h4>
                    <ul className="list-disc list-inside mt-2 text-yellow-200">
                        {missingInfo.map((info, index) => <li key={index}>{info}</li>)}
                    </ul>
                </div>
            )}

            <div className="mt-8 p-4 bg-gray-800 border border-gray-600 rounded-lg text-center">
                <p className="text-gray-300 mb-4">"I have extracted the above information from your drawing. Please review the flagged items and confirm how you'd like to proceed."</p>
                <div className="flex justify-center gap-4 flex-wrap">
                    <button onClick={() => onProceed('assumptions')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg flex items-center gap-2">
                        <CheckCircleIcon /> Proceed with Assumptions
                    </button>
                     <button onClick={() => onProceed('current_data')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg">
                        Generate with Current Data
                    </button>
                    <button disabled className="bg-gray-600 text-gray-400 font-bold py-2 px-5 rounded-lg cursor-not-allowed">
                        Request Clarification (soon)
                    </button>
                </div>
            </div>
        </div>
    );
};

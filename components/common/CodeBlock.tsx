
import React from 'react';

interface CodeBlockProps {
    code: string;
    language: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4 border border-gray-700">
            <div className="bg-gray-700 text-gray-300 px-4 py-2 font-mono text-sm">
                {language}
            </div>
            <pre className="p-4 text-left overflow-x-auto">
                <code className={`language-${language} text-sm`}>
                    {code}
                </code>
            </pre>
        </div>
    );
};

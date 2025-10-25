
import React, { useState } from 'react';
import { IedasPipeline } from './components/IedasPipeline';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { EngineerIcon, ImageIcon, EditIcon, AnalyzeIcon } from './components/icons';

type Feature = 'IEDAS' | 'GENERATE' | 'EDIT' | 'ANALYZE';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('IEDAS');

  const renderFeature = () => {
    switch (activeFeature) {
      case 'IEDAS':
        return <IedasPipeline />;
      case 'GENERATE':
        return <ImageGenerator />;
      case 'EDIT':
        return <ImageEditor />;
      case 'ANALYZE':
        return <ImageAnalyzer />;
      default:
        return <IedasPipeline />;
    }
  };
  
  const NavButton: React.FC<{
    feature: Feature;
    label: string;
    icon: React.ReactNode;
  }> = ({ feature, label, icon }) => (
    <button
      onClick={() => setActiveFeature(feature)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        activeFeature === feature
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mb-6 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Intelligent Engineering Drawing Automation System
        </h1>
        <p className="text-lg text-gray-400 mt-2">Powered by Gemini</p>
      </header>
      
      <nav className="w-full max-w-4xl bg-gray-800 p-2 rounded-xl shadow-md mb-8 flex flex-wrap justify-center gap-2 sm:gap-4">
        <NavButton feature="IEDAS" label="IEDAS Pipeline" icon={<EngineerIcon />} />
        <NavButton feature="GENERATE" label="Image Generation" icon={<ImageIcon />} />
        <NavButton feature="EDIT" label="Image Editor" icon={<EditIcon />} />
        <NavButton feature="ANALYZE" label="Image Analyzer" icon={<AnalyzeIcon />} />
      </nav>

      <main className="w-full max-w-7xl">
        {renderFeature()}
      </main>
    </div>
  );
};

export default App;

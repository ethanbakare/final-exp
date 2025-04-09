import React, { useState } from 'react';
import Header from '@/projects/receipt-scanner/components/layout/Header';
import Card from '@/projects/receipt-scanner/components/layout/Card';
import TextCard from '@/projects/receipt-scanner/components/layout/TextCard';

const LayoutComponentsShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'speak'>('speak');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState<string>('');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    console.log(`Selected file: ${file.name} (${file.type})`);
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    console.log(`Text input: ${text}`);
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8F6F0' }}>
      <h1 className="text-3xl font-bold mb-8 text-gray-700">Layout Components</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Header</h2>
        <div className="bg-white p-6 rounded-lg shadow-md" style={{ maxWidth: '600px' }}>
          <Header 
            initialActiveTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              console.log(`Switched to ${tab === 'scan' ? 'Scan Receipt' : 'Speak or Type'} tab`);
            }} 
          />
          
          <div className="mt-8">
            <p className="text-lg text-gray-700">
              Currently active: <span className="font-semibold">{activeTab === 'scan' ? 'Scan receipt' : 'Speak or Type'}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click on a tab to toggle between them. The header component manages its own state but also accepts an initial active tab and provides a callback when tabs are changed.
            </p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Card</h2>
        <div className="flex flex-col items-center">
          <Card onFileSelect={handleFileSelect} />
          
          {selectedFile && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
              <p className="text-gray-700">
                Selected file: <span className="font-medium">{selectedFile.name}</span> 
                <span className="text-gray-500 ml-2">({Math.round(selectedFile.size / 1024)} KB)</span>
              </p>
            </div>
          )}
          
          <div className="mt-6 max-w-lg text-center">
            <p className="text-sm text-gray-500">
              This card component allows users to upload receipt images by clicking or dragging and dropping files.
              It accepts JPG, JPEG, PNG, and BMP formats as specified in the design.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Text Card</h2>
        <div className="flex flex-col items-center">
          <TextCard onTextChange={handleTextChange} />
          
          {inputText && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
              <p className="text-gray-700">
                Current text: <span className="font-medium">{inputText.length > 50 ? `${inputText.substring(0, 50)}...` : inputText}</span> 
                <span className="text-gray-500 ml-2">({inputText.length} characters)</span>
              </p>
            </div>
          )}
          
          <div className="mt-6 max-w-lg text-center">
            <p className="text-sm text-gray-500">
              This text card component allows users to type directly inside it. 
              The border becomes thicker and darker when focused, and the placeholder text is centered
              until the user begins typing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LayoutComponentsShowcase;

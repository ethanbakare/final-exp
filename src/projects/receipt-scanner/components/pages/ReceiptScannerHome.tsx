import React from 'react';
import Link from 'next/link';

const ReceiptScannerHome: React.FC = () => {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8F6F0' }}>
      <h1 className="text-3xl font-bold mb-8 text-gray-700">Receipt Scanner</h1>
      
      <div className="mt-6 max-w-lg">
        <p className="text-gray-600 mb-4">
          The Receipt Scanner project allows users to scan receipts and extract structured data.
        </p>
        
        <div className="flex gap-4 mt-8">
          <Link 
            href="/receipt-scanner/showcase/layout" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View Layout Components
          </Link>
          
          <Link 
            href="/receipt-scanner/showcase/ui" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View UI Components
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScannerHome; 
import React from 'react';
import { ClipMasterScreen } from '@/projects/clipperstream/components/ui/ClipMasterScreen';

const ClipperStream: React.FC = () => {
  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
        }
      `}</style>
      <style jsx>{`
        .page {
          min-height: 100vh;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div className="page">
        <ClipMasterScreen />
      </div>
    </>
  );
};

export default ClipperStream;

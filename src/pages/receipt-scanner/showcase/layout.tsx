import React from 'react';
import Header from '@/projects/receipt-scanner/components/layout/Header';
import ReceiptCard from '@/projects/receipt-scanner/components/layout/ReceiptCard';
import TextCard from '@/projects/receipt-scanner/components/layout/TextCard';
import ReceiptNavbar from '@/projects/receipt-scanner/components/layout/ReceiptNavbar';
import SpeakNavbar from '@/projects/receipt-scanner/components/layout/SpeakNavbar';
import FilePreview from '@/projects/receipt-scanner/components/ui/FilePreview';
import FilePreviewLoad from '@/projects/receipt-scanner/components/ui/FilePreviewLoad';
import FilePreviewError from '@/projects/receipt-scanner/components/ui/FilePreviewError';

const LayoutComponentsShowcase: React.FC = () => {
  return (
    <div className="showcase-container">
      <h1 className="showcase-title">Layout Components</h1>
      
      <section className="showcase-section">
        <h2 className="section-title">Header</h2>
        <Header initialActiveTab="speak" />
      </section>
      
      <section className="showcase-section">
        <h2 className="section-title">Receipt Card with Navbar</h2>
        <div className="component-container">
          <div className="card-container">
            <ReceiptCard/>
          </div>
          
          <div className="component-description">
            <p className="description-text">
              This receipt card component allows users to upload receipt images by clicking or dragging and dropping files.
              It accepts JPG, JPEG, PNG, and BMP formats as specified in the design.
            </p>
            <p className="description-text">
              The navbar below the card changes state based on the current workflow stage. 
              The navbar component manages its own state transitions internally.
            </p>
          </div>
        </div>
      </section>

      <section className="showcase-section">
        <h2 className="section-title">Text Card</h2>
        <div className="text-card-container">
          <TextCard showPreview={true} />
          <div className="component-description">
            <p className="description-text">
              This text card component allows users to type directly inside it. 
              The border becomes thicker and darker when focused, and the placeholder text is centered
              until the user begins typing.
            </p>
          </div>
        </div>
      </section>
      
      <section className="showcase-section">
        <h2 className="section-title">File Preview Component</h2>
        <div className="component-container">
          <FilePreview />
          
          <div className="component-description">
            <p className="description-text">
              The FilePreview component displays an uploaded file with its name and size.
              It includes a close button that triggers the onClose callback when clicked.
              This component is useful for showing file thumbnails after upload.
            </p>
          </div>
        </div>
      </section>
      
      <section className="showcase-section">
        <h2 className="section-title">File Preview Load Component</h2>
        <div className="component-container">
          <FilePreviewLoad />
          
          <div className="component-description">
            <p className="description-text">
              The FilePreviewLoad component displays an animated loading spinner and percentage counter
              that simulates file upload progress. It features a circular progress indicator that fills
              as the percentage increases, and changes text to show the file size when finished.
            </p>
          </div>
        </div>
      </section>
      
      <section className="showcase-section">
        <h2 className="section-title">File Preview Error Component</h2>
        <div className="component-container">
          <FilePreviewError />
          
          <div className="component-description">
            <p className="description-text">
              The FilePreviewError component displays an error state for failed file uploads.
              It features a document with an X icon on a red background to clearly indicate an error state.
              This component uses the same structure as FilePreview but with error-specific styling.
            </p>
          </div>
        </div>
      </section>
      
      <section className="showcase-section navbar-section">
        <h2 className="section-title">Receipt Navbar States Showcase</h2>
        <div className="component-container">
          <div className="navbar-container">
            <ReceiptNavbar/>
          </div>
          
          <div className="component-description">
            <p className="description-text">
              The receipt navbar manages its own internal state and transitions between four different states.
              Click the buttons to see how it changes states and updates its UI accordingly.
            </p>
          </div>
        </div>
      </section>

      <section className="showcase-section navbar-section">
        <h2 className="section-title">Speak Navbar Showcase</h2>
        <div className="component-container">
          <div className="navbar-container">
            <SpeakNavbar/>
          </div>
          
          <div className="component-description">
            <p className="description-text">
              The speak navbar provides a simple interface for recording audio inputs.
              It features a disabled download button and a primary Record button.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .showcase-container {
          padding: 2rem 10px;
          min-height: 100vh;
          background-color: #F8F6F0;
        }

        .showcase-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #374151;
        }

        .showcase-section {
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .navbar-section {
          width: 100%;
        }

        .navbar-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .navbar-container :global(.flex) {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .navbar-container :global(.w-full) {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #374151;
          align-self: flex-start;
        }

        .component-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .text-card-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .text-card-container :global(.flex) {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .component-description {
          margin-top: 1.5rem;
          max-width: 32rem;
          text-align: center;
        }

        .description-text {
          font-size: 0.875rem;
          color: #6B7280;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .card-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default LayoutComponentsShowcase;

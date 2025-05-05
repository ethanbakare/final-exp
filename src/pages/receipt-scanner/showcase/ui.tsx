import React, { useState } from 'react';
import Toast from '@/projects/receipt-scanner/components/ui/Toast';
import Button from '@/projects/receipt-scanner/components/ui/Button';
import ListItem from '@/projects/receipt-scanner/components/ui/ListItem';

const UIComponentsShowcase: React.FC = () => {
  const [showDebugLogs, setShowDebugLogs] = useState(true);

  return (
    <>
      <style jsx>{`
        /* Layout & Container Styles */
        .showcase-container {
          padding: 1rem;
          min-height: 100vh;
          background-color: #F8F6F0;
        }
        
        .section {
          margin-bottom: 3rem;
        }
        
        .component-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .component-item {
          /* No fixed width to preserve original button widths */
        }
        
        /* Typography Styles */
        .page-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #4B5563;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #4B5563;
        }
        
        .component-title {
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #6B7280;
        }
        
        /* Card Section Styles */
        .card-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .card-description {
          margin-top: 1.5rem;
          max-width: 32rem;
          text-align: center;
        }
        
        .description-text {
          font-size: 0.875rem;
          color: #6B7280;
        }
        
        /* Toast Section Styles */
        .toast-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Debug section */
        .debug-controls {
          margin-top: 1rem;
          display: flex;
          justify-content: center;
        }
      `}</style>
      
      <div className="showcase-container">
        <h1 className="page-title">UI Components</h1>
        
        <section className="section">
          <h2 className="section-title">Icon Buttons</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Primary Icon Button</h3>
              <Button 
                variant="primary" 
                type="icon"
                onClick={() => console.log('Primary icon button clicked')} 
              />
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Secondary Icon Button</h3>
              <Button 
                variant="secondary" 
                type="icon"
                onClick={() => console.log('Secondary icon button clicked')} 
              />
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Tertiary Icon Button</h3>
              <Button 
                variant="tertiary" 
                type="icon"
                onClick={() => console.log('Tertiary icon button clicked')} 
              />
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Disabled Icon Button</h3>
              <Button 
                variant="disabled" 
                type="icon"
                onClick={() => console.log('This should not log')} 
              />
            </div>
          </div>
          
          <h3 className="component-title">Custom Icon Button</h3>
          <Button 
            variant="primary" 
            type="icon"
            onClick={() => console.log('Custom icon button clicked')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 0C4.03 0 0 4.03 0 9C0 13.97 4.03 18 9 18C13.97 18 18 13.97 18 9C18 4.03 13.97 0 9 0ZM13.5 9.9H9.9V13.5H8.1V9.9H4.5V8.1H8.1V4.5H9.9V8.1H13.5V9.9Z" fill="currentColor"/>
              </svg>
            }
          />
        </section>
        
        <section className="section">
          <h2 className="section-title">Text Buttons</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Primary Text Button</h3>
              <Button 
                variant="primary" 
                type="text"
                onClick={() => console.log('Primary text button clicked')} 
              >
                Primary
              </Button>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Secondary Text Button</h3>
              <Button 
                variant="secondary" 
                type="text"
                onClick={() => console.log('Secondary text button clicked')} 
              >
                Secondary
              </Button>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Tertiary Text Button</h3>
              <Button 
                variant="tertiary" 
                type="text"
                onClick={() => console.log('Tertiary text button clicked')} 
              >
                Tertiary
              </Button>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Disabled Text Button</h3>
              <Button 
                variant="disabled" 
                type="text"
                onClick={() => console.log('This should not log')} 
              >
                Disabled
              </Button>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Receipt Card</h2>
          <div className="card-container">
            <ListItem />
            
            <div className="card-description">
              <p className="description-text">
                This card component displays receipt information with an editable header, 
                interactive date picker, and currency selector. Values in the card will 
                update based on the selected currency.
              </p>
            </div>

            <div className="debug-controls">
              <Button 
                variant="secondary" 
                type="text"
                onClick={() => setShowDebugLogs(!showDebugLogs)} 
              >
                {showDebugLogs ? 'Hide Debug Logs' : 'Show Debug Logs'}
              </Button>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Toast</h2>
          <div className="toast-container">
            <Toast 
              type="success" 
              title="Validation complete" 
              message="All values match" 
            />
            
            <Toast 
              type="warning" 
              title="Validation warning" 
              message="Sum of item discounts (£4.00) don't match total savings (£0.30)"
              action={{
                text: "Review and edit",
                onClick: () => console.log('Review and edit clicked')
              }}
            />
            
            <Toast 
              type="error" 
              title="Receipt error" 
              message="Receipt total ($164.89) doesn't match calculated sum ($85.89)"
              action={{
                text: "Edit receipt values",
                onClick: () => console.log('Edit receipt values clicked')
              }}
            />
            
            <Toast 
              type="file"
              title="" 
              message=""
              fileInfo={{
                name: "Screenshot_VeryLongExp_A2.png",
                type: "PNG"
              }}
              onClose={() => console.log('File removed')}
            />
            
            {/* Example with a long filename to demonstrate text truncation */}
            <Toast 
              type="file"
              title="" 
              message=""
              fileInfo={{
                name: "Very_Long_Filename_That_Should_Be_Truncated_With_Ellipsis_2023_04_15.jpg",
                type: "JPG"
              }}
              onClose={() => console.log('File removed')}
            />
          </div>
        </section>
      </div>

      {/* Global style to toggle debug logs visibility */}
      <style jsx global>{`
        .debug-logs {
          display: ${showDebugLogs ? 'block' : 'none'} !important;
        }
      `}</style>
    </>
  );
};

export default UIComponentsShowcase;

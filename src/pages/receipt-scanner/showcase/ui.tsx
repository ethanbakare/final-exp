import React from 'react';
import Toast from '@/projects/receipt-scanner/components/ui/Toast';
import Button from '@/projects/receipt-scanner/components/ui/Button';
import ListItem from '@/projects/receipt-scanner/components/ui/ListItem';

const UIComponentsShowcase: React.FC = () => {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#F8F6F0' }}>
      <h1 className="text-3xl font-bold mb-8 text-gray-700">UI Components</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Icon Buttons</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Primary Icon Button</h3>
            <Button 
              variant="primary" 
              type="icon"
              onClick={() => console.log('Primary icon button clicked')} 
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Secondary Icon Button</h3>
            <Button 
              variant="secondary" 
              type="icon"
              onClick={() => console.log('Secondary icon button clicked')} 
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Tertiary Icon Button</h3>
            <Button 
              variant="tertiary" 
              type="icon"
              onClick={() => console.log('Tertiary icon button clicked')} 
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Disabled Icon Button</h3>
            <Button 
              variant="disabled" 
              type="icon"
              onClick={() => console.log('This should not log')} 
            />
          </div>
        </div>
        
        <h3 className="text-lg font-medium mb-2 text-gray-600">Custom Icon Button</h3>
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
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Text Buttons</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Primary Text Button</h3>
            <Button 
              variant="primary" 
              type="text"
              onClick={() => console.log('Primary text button clicked')} 
            >
              Primary
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Secondary Text Button</h3>
            <Button 
              variant="secondary" 
              type="text"
              onClick={() => console.log('Secondary text button clicked')} 
            >
              Secondary
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Tertiary Text Button</h3>
            <Button 
              variant="tertiary" 
              type="text"
              onClick={() => console.log('Tertiary text button clicked')} 
            >
              Tertiary
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-600">Disabled Text Button</h3>
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
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Receipt Card</h2>
        <div className="flex flex-col items-center">
          <ListItem />
          
          <div className="mt-6 max-w-lg text-center">
            <p className="text-sm text-gray-500">
              This card component displays receipt information with an editable header, 
              interactive date picker, and currency selector. Values in the card will 
              update based on the selected currency.
            </p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Toast</h2>
        <div className="space-y-4">
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
  );
};

export default UIComponentsShowcase;

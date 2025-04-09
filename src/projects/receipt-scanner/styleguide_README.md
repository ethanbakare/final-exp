# Receipt Scanner Component Library Styleguide

This document explains the component architecture of the Receipt Scanner project, detailing how the components are organized, displayed, and tested.

## Component Architecture

The Receipt Scanner uses a component-driven development approach, where UI elements are broken down into reusable, independent components that can be developed, tested, and maintained separately.

### Component Categories

Components are organized into three main categories:

1. **UI Components**: Basic, atomic UI elements that can be used across the application
   - Button
   - ListItem
   - Toast

2. **Layout Components**: Structural components that define the layout of the application
   - Header
   - Card
   - Navbar

3. **Composite Components**: More complex components composed of multiple UI and layout components
   - ImageUploadCard
   - TextInputCard
   - ReceiptListCard

## Directory Structure

```
final-exp/
└── src/
    ├── projects/
    │   └── receipt-scanner/
    │       ├── components/
    │       │   ├── ui/
    │       │   │   ├── Button.tsx        # Button component with states
    │       │   │   ├── ListItem.tsx      # List item component
    │       │   │   ├── Toast.tsx         # Toast notifications
    │       │   │
    │       │   ├── layout/
    │       │   │   ├── Header.tsx        # Top navigation tabs
    │       │   │   ├── Card.tsx          # Card with variants
    │       │   │   ├── Navbar.tsx        # Bottom navigation
    │       │   │
    │       │   ├── composite/
    │       │   │   ├── ImageUploadCard.tsx  # Complete image upload view
    │       │   │   ├── TextInputCard.tsx    # Complete text input view
    │       │   │   ├── ReceiptListCard.tsx  # Card with receipt items
    │       │
    │       ├── styles/
    │       │   ├── components.css        # Font and color variables
    │       │
    │       ├── hooks/
    │       ├── types/
    │
    ├── pages/
        ├── receipt-scanner/
        │   ├── index.tsx                 # Main application page
        │   ├── components/
        │   │   ├── index.tsx             # Component showcase main page
        │   │   ├── layout.tsx            # Layout components showcase
        │   │   ├── ui.tsx                # UI components showcase
```

## Viewing Components

Each component category has a dedicated showcase page where you can view and test the components:

1. **UI Components Showcase**: `/receipt-scanner/components/ui`
   - File: `src/pages/receipt-scanner/components/ui.tsx`
   - Displays Button, ListItem, and Toast components

2. **Layout Components Showcase**: `/receipt-scanner/components/layout`
   - File: `src/pages/receipt-scanner/components/layout.tsx`
   - Displays Header, Card, and Navbar components

3. **Main Component Showcase**: `/receipt-scanner/components`
   - File: `src/pages/receipt-scanner/components/index.tsx`
   - Provides links to UI and Layout showcases
   - Displays Composite components

4. **Complete Application**: `/receipt-scanner`
   - File: `src/pages/receipt-scanner/index.tsx`
   - Shows all components working together in the actual application

## Styling Approach

Styling for components is managed through:

1. **components.css**: Contains font and color variables
   - Located at: `src/projects/receipt-scanner/styles/components.css`
   - Defines custom font sizes, weights, colors, etc.
   - Variables are referenced in component styles for consistency

2. **Tailwind CSS**: Used for component-specific styling
   - Classes are applied directly to components
   - Provides responsive design utilities

## Minimal Component Setup

Each component should at minimum contain:

```tsx
import React from 'react';

interface ComponentProps {
  // Define props here
}

const Component: React.FC<ComponentProps> = (props) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default Component;
```

## Development Workflow

### Creating a New Component

1. Create a new file in the appropriate directory (ui, layout, or composite)
2. Import React and define the component interface
3. Implement the component with appropriate styling
4. Export the component
5. Import and use the component in the relevant showcase page

### Testing Components

Components can be tested visually by:

1. Running the development server: `npm run dev`
2. Navigating to the appropriate showcase page
3. Verifying the component's appearance and behavior

## File Support

The Receipt Scanner supports the following file types for uploading receipts:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)

## Component Documentation Guidelines

Each component should include:
- A clear interface definition (TypeScript props)
- JSDoc comments explaining the component's purpose
- Props documentation including defaults and required props
- Usage examples where appropriate 
import React from 'react';
import { Inter, Frank_Ruhl_Libre } from 'next/font/google';
import styles from '@/projects/home/styles/HomePage.module.css';
import { LoadingProvider } from '@/contexts/LoadingContext';

import RefactoredNavBar from '@/projects/tests/components/RefactoredNavBar';

// ----------------------------------------
// FONT CONFIGURATIONS
// ----------------------------------------
// Load Inter font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Load Frank Ruhl Libre from Google Fonts
const frankRuhlLibre = Frank_Ruhl_Libre({ 
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-frank-ruhl-libre',
  display: 'swap',
});

const NavbarTestPage: React.FC = () => {
  return (
    <LoadingProvider>
      <div className={`${inter.variable} ${frankRuhlLibre.variable} full-page ${styles.container}`}>
        {/* Back to home link */}
        {/*<div className="back-link">
          <Link href="/">← Back to Home</Link>
        </div>*/}
        
        {/* Refactored Navbar */}
        <RefactoredNavBar />
        
        {/* Test sections for navbar navigation */}
        <div id="home" className="test-section">
          <h2>Home Section</h2>
          <p>This is the home section that navbar will link to</p>
          <div className="explanation">
            <p className="explanation-title">1. Component Structure</p>
            <ul>
              <li>Now uses forwardRef pattern for MenuItem like original</li>
              <li>Removed extra container div that was unnecessary</li>
              <li>Maintains original DOM structure exactly</li>
            </ul>
          </div>
          <button onClick={() => window.scrollTo({top: document.getElementById('projects')?.offsetTop || 0, behavior: 'smooth'})}>
            Scroll to Projects
          </button>
        </div>
        
        <div id="projects" className="test-section">
          <h2>Projects Section</h2>
          <p>This is the projects section that navbar will link to</p>
          <div className="explanation">
            <p className="explanation-title">2. Styling Implementation</p>
            <ul>
              <li>Uses identical inline styles via React.CSSProperties</li>
              <li>Maintains exact 4px gap between items</li>
              <li>Preserves all sizing, colors, and positioning</li>
              <li>Implements hover with React state just like original</li>
            </ul>
          </div>
          <button onClick={() => window.scrollTo({top: document.getElementById('completed-projects')?.offsetTop || 0, behavior: 'smooth'})}>
            Scroll to Rules
          </button>
        </div>
        
        <div id="completed-projects" className="test-section">
          <h2>Rules Section</h2>
          <p>This is the rules section that navbar will link to</p>
          <div className="explanation">
            <p className="explanation-title">3. Active Section Tracking</p>
            <ul>
              <li>Highlights current section in navbar as you scroll</li>
              <li>Uses identical implementation to original</li>
              <li>Active highlight uses inline style with same opacity value</li>
            </ul>
          </div>
          <button onClick={() => window.scrollTo({top: document.getElementById('how-it-works')?.offsetTop || 0, behavior: 'smooth'})}>
            Scroll to About
          </button>
        </div>
        
        <div id="how-it-works" className="test-section">
          <h2>About Section</h2>
          <p>This is the about section that navbar will link to</p>
          <div className="explanation">
            <p className="explanation-title">4. Responsive Behavior</p>
            <ul>
              <li>Switches to wrapped layout under 768px width</li>
              <li>Uses separate style objects for different screen sizes</li>
              <li>Maintains all responsive behaviors from original</li>
            </ul>
          </div>
          <button onClick={() => window.scrollTo({top: document.getElementById('about')?.offsetTop || 0, behavior: 'smooth'})}>
            Scroll to More
          </button>
        </div>
        
        <div id="about" className="test-section">
          <h2>Additional Section</h2>
          <p>This is an additional section for testing</p>
          <div className="explanation">
            <p className="explanation-title">5. Better Code Organization</p>
            <ul>
              <li>Maintains identical functionality and appearance</li>
              <li>Uses clear section comments for easier maintenance</li>
              <li>Logically groups related functionality</li>
            </ul>
          </div>
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            Back to Top
          </button>
        </div>
        
        {/* Styles for the test page */}
        <style jsx>{`
          .full-page {
            min-height: 100vh;
            background-color: var(--DarkPrimary);
            color: white;
            padding: 2rem;
          }
          
          .back-link {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1001;
            background: rgba(0, 0, 0, 0.5);
            padding: 0.5rem 1rem;
            border-radius: 4px;
          }
          
          .back-link a {
            color: white;
            text-decoration: none;
          }
          
          .test-section {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 2rem;
          }
          
          .test-section h2 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          
          .test-section p {
            font-size: 1.25rem;
            opacity: 0.8;
            margin-bottom: 2rem;
          }
          
          .explanation {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0 2rem;
            max-width: 600px;
            width: 100%;
          }
          
          .explanation-title {
            font-weight: bold;
            margin-bottom: 1rem;
            color: var(--AccentGreen);
          }
          
          .explanation ul {
            margin: 0;
            padding-left: 1.5rem;
          }
          
          .explanation li {
            margin-bottom: 0.5rem;
            opacity: 0.8;
          }
          
          button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          button:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>
        
        {/* Global styles */}
        <style jsx global>{`
          body, html {
            margin: 0;
            padding: 0;
            background-color: var(--DarkPrimary);
          }
          
          :root {
            --DarkPrimary: #1a1a1a;
            --DarkSecondary: #1f1f1f;
            --WhiteOpacity: #ffffff;
            --WhiteOpacity80: rgba(255, 255, 255, 0.8);
            --WhiteOpacity70: rgba(255, 255, 255, 0.7);
            --WhiteOpacity50: rgba(255, 255, 255, 0.5);
            --WhiteOpacity10: rgba(255, 255, 255, 0.1);
            --WhiteOpacity05: rgba(255, 255, 255, 0.05);
            --AccentGreen: #22D817;
          }
        `}</style>
      </div>
    </LoadingProvider>
  );
};

export default NavbarTestPage; 
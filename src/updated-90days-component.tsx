import React, { useState } from 'react';
import { Clock, ArrowRight, Calendar, Zap, Mic, FileText, MessageCircle, Search, AlertCircle, Menu } from 'lucide-react';

const LittleEXP = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'milestones'
  
  // Projects data
  const projects = [
    {
      id: 1,
      title: "Expense Tracker",
      subtitle: "AI-Powered Receipt & Voice Logging",
      description: "Users can scan receipts, use voice input, or manually enter expenses into an organized, visually appealing format. Key financial details are extracted and structured.",
      techConsiderations: [
        "OCR API (e.g., Tesseract, Vision API) for receipt scanning",
        "Speech-to-Text API for voice input",
        "Data Structuring: AI organizes expenses dynamically",
        "Live Editing: Users can say commands like \"remove apples\", and the table updates instantly"
      ],
      goals: [
        "Simplifies expense tracking by integrating multiple input methods",
        "Provides a structured, real-time AI-powered financial overview"
      ],
      days: 12,
      votes: 28,
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 2,
      title: "Tongue Twister Speed Test",
      subtitle: "Real-Time Speech Latency Test",
      description: "A game where users read a rapid speech challenge, and AI must highlight words in real time as they speak. Tests how fast AI can keep up with spoken input.",
      techConsiderations: [
        "Latency Benchmarking: Measures time delay between spoken words and AI highlights",
        "Speech Processing: AI tracks and matches each spoken word to text dynamically"
      ],
      goals: [
        "Tests AI's real-time speech recognition limits",
        "Explores UX issues in live dictation workflows"
      ],
      days: 7,
      votes: 19,
      icon: <Mic className="h-6 w-6" />
    },
    {
      id: 3,
      title: "Autocorrect on Steroids",
      subtitle: "AI-Powered Typing Correction",
      description: "Users type as fast and messily as possible, and AI infers corrections contextually rather than just by dictionary lookup. Users can compare traditional vs. AI autocorrect.",
      techConsiderations: [
        "Real-Time AI: Processes jumbled input and swaps words instantly",
        "Hover Interaction: Shows original text and alternative corrections",
        "Comparison Mode: Traditional spellcheck vs. AI-enhanced correction"
      ],
      goals: [
        "Demonstrates AI's ability to infer intent from messy input",
        "Improves fast typing without requiring constant manual corrections"
      ],
      days: 9,
      votes: 31,
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 4,
      title: "Bubble-Based Chat Summarization",
      subtitle: "Interactive Message Insights",
      description: "Users can hover over long chat bubbles to see a condensed summary instead of reading full transcripts. Selecting multiple chat bubbles generates a context-aware summary.",
      techConsiderations: [
        "Summarization API (GPT-based) to extract key insights from long chat messages",
        "Interactive UI: Users hover over or select multiple messages for instant summaries"
      ],
      goals: [
        "Makes chat transcripts more scannable",
        "Allows quick retrieval of key information without re-reading everything"
      ],
      days: 10,
      votes: 24,
      icon: <MessageCircle className="h-6 w-6" />
    },
    {
      id: 5,
      title: "AI-Powered Voice Mimicry",
      subtitle: "Personalized TTS",
      description: "Users record 10-30 seconds of their voice, and AI generates text-to-speech responses in their tone. Emphasized words are italicized in text and reflected in voice modulation.",
      techConsiderations: [
        "Voice Model (e.g., Tacotron, FastSpeech)",
        "UI for Text Input + Voice Output",
        "Emphasis Handling: AI detects key words for emphasis"
      ],
      goals: [
        "Personalizes AI-generated speech",
        "Reduces manual speaking while preserving personal tone"
      ],
      days: 14,
      votes: 37,
      icon: <Mic className="h-6 w-6" />
    },
    {
      id: 6,
      title: "Triple Dot Menu for Chat Actions",
      subtitle: "Context-Aware Chat Management",
      description: "Clicking the triple-dot menu next to a chat provides options like \"Branch Chat,\" \"Use as Context,\" and \"Export as PDF.\"",
      techConsiderations: [
        "UI Component: Dropdown menu for actions",
        "Summarization Model: Extracts key context when transferring chats",
        "Backend Support: Chat history storage and retrieval"
      ],
      goals: [
        "Streamlines chat management without manual copy-pasting",
        "Provides an intuitive way to organize and reference past chats"
      ],
      days: 8,
      votes: 16,
      icon: <Menu className="h-6 w-6" />
    },
    {
      id: 7,
      title: "Drag-and-Drop Chat Context Transfer",
      subtitle: "Seamless Conversation Continuity",
      description: "Users drag a past chat into a new chat to use it as context. The chat appears as an attachment.",
      techConsiderations: [
        "Frontend UI: Drag-and-drop functionality",
        "Summarization API: Extracts key details for context",
        "Context Embedding: Avoids token overflow while preserving meaning"
      ],
      goals: [
        "Reduces friction in continuing conversations across different sessions",
        "Helps maintain coherence in long-term AI interactions"
      ],
      days: 11,
      votes: 22,
      icon: <MessageCircle className="h-6 w-6" />
    },
    {
      id: 8,
      title: "Voice & Text Information Retrieval",
      subtitle: "Treasure Hunting in Your Own Vault",
      description: "AI restructures and resurfaces forgotten information stored in voice notes, Apple Notes, or bookmarks, making it text or voice searchable.",
      techConsiderations: [
        "Semantic Search API for recognizing meaning instead of exact keywords",
        "Data Indexing to store and organize old notes/memos",
        "Context Awareness: AI suggests resurfaced memories based on user queries"
      ],
      goals: [
        "Makes stored content useful again",
        "Helps users find valuable past information that would otherwise be lost"
      ],
      days: 13,
      votes: 29,
      icon: <Search className="h-6 w-6" />
    },
    {
      id: 9,
      title: "AI Confidence Highlighting",
      subtitle: "Speech-to-Text Accuracy Enhancement",
      description: "AI assigns a confidence score to each transcribed word and highlights words it's uncertain about, allowing users to focus on likely errors.",
      techConsiderations: [
        "Speech Processing API with word confidence metrics",
        "UI Highlights: Color-coded or underlined words based on certainty",
        "Inline Editing: Users tap on uncertain words to see suggested alternatives"
      ],
      goals: [
        "Improves speech-to-text accuracy and user trust in AI-generated transcripts",
        "Allows faster error correction by focusing only on uncertain words"
      ],
      days: 10,
      votes: 26,
      icon: <AlertCircle className="h-6 w-6" />
    }
  ];

  // Current project data
  const currentProject = {
    title: "Expense Tracker",
    subtitle: "AI-Powered Receipt & Voice Logging",
    description: "Users can scan receipts, use voice input, or manually enter expenses into an organized, visually appealing format. Key financial details are extracted and structured.",
    progress: 35,
    days: {
      total: 12,
      elapsed: 5,
      remaining: 8
    },
    tasks: [
      { id: 1, title: "Design expense dashboard UI", completed: true },
      { id: 2, title: "Implement OCR for receipt scanning", completed: true },
      { id: 3, title: "Build speech-to-text expense entry", completed: false },
      { id: 4, title: "Create data categorization system", completed: false },
      { id: 5, title: "Develop export and reporting features", completed: false }
    ],
    update: "Successfully integrated the OCR component that can extract merchant name, date, and amount from receipt photos. Currently working on the voice input system that will parse natural language expense descriptions. Next up: implementing the AI categorization system that will automatically organize expenses.",
    updateTime: "2 hours ago",
    icon: <FileText className="h-6 w-6" />
  };

  // Milestones data
  const milestones = {
    thirtyDay: {
      withinControl: [
        "4-5 projects completed",
        "Daily creation habit"
      ],
      partialControl: [
        "10+ AI connections",
        "Community growth"
      ],
      outsideControl: [
        "First interview",
        "External recognition"
      ]
    },
    sixtyDay: {
      withinControl: [
        "8-10 projects completed",
        "Daily creation habit"
      ],
      partialControl: [
        "3+ collaborations",
        "Community growth"
      ],
      outsideControl: [
        "Paid opportunity",
        "External recognition"
      ]
    },
    ninetyDay: {
      withinControl: [
        "All projects finished",
        "Daily creation habit"
      ],
      partialControl: [
        "Regular opportunities",
        "Community growth"
      ],
      outsideControl: [
        "Job offers",
        "External recognition"
      ]
    }
  };

  // Sort projects by votes (descending)
  const sortedProjects = [...projects].sort((a, b) => b.votes - a.votes);
  
  // Milestone section component
  const MilestoneSection = () => {
    return (
      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-6">90-Day Transformation Milestones</h3>
        
        {/* 30-Day Goals */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-white mb-4">30-Day Goals</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-green-500 font-medium mb-2">Within Control</h5>
              <ul className="space-y-2">
                {milestones.thirtyDay.withinControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-yellow-500 font-medium mb-2">Partial Control</h5>
              <ul className="space-y-2">
                {milestones.thirtyDay.partialControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-red-500 font-medium mb-2">Outside Control</h5>
              <ul className="space-y-2">
                {milestones.thirtyDay.outsideControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* 60-Day Goals */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-white mb-4">60-Day Goals</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-green-500 font-medium mb-2">Within Control</h5>
              <ul className="space-y-2">
                {milestones.sixtyDay.withinControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-yellow-500 font-medium mb-2">Partial Control</h5>
              <ul className="space-y-2">
                {milestones.sixtyDay.partialControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-red-500 font-medium mb-2">Outside Control</h5>
              <ul className="space-y-2">
                {milestones.sixtyDay.outsideControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* 90-Day Goals */}
        <div>
          <h4 className="text-xl font-bold text-white mb-4">90-Day Goals</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-green-500 font-medium mb-2">Within Control</h5>
              <ul className="space-y-2">
                {milestones.ninetyDay.withinControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-yellow-500 font-medium mb-2">Partial Control</h5>
              <ul className="space-y-2">
                {milestones.ninetyDay.partialControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-red-500 font-medium mb-2">Outside Control</h5>
              <ul className="space-y-2">
                {milestones.ninetyDay.outsideControl.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-black min-h-screen font-sans text-gray-100">
      {/* Hero Section */}
      <div className="py-16 px-4 md:px-8 border-b border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">90 Days to AI Design</h1>
          <div className="inline-block bg-green-600 text-white px-4 py-1 rounded mb-6">
            <p className="text-sm">£1,000 penalty per missed deadline (to charity)</p>
          </div>
          <p className="text-xl text-gray-400 mb-8">10 projects. Public builds. Real stakes.</p>
          
          <div className="flex justify-center gap-4 mt-6">
            <button className="border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-2 rounded-md transition">
              How it works
            </button>
            <button className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-md transition">
              View Projects
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'projects' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'milestones' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('milestones')}
          >
            Milestones
          </button>
        </div>
        
        {activeTab === 'projects' ? (
          <>
            {/* Current Work Section */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Current Work
              </h2>
              
              <div className="border border-gray-800 rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-800 p-3 rounded-lg">
                      {currentProject.icon}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white">{currentProject.title}</h3>
                      <p className="text-gray-400">{currentProject.subtitle}</p>
                      
                      <div className="flex items-center mt-3">
                        <div className="flex items-center text-sm text-gray-400 mr-4">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{currentProject.days.remaining} days left</span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-white">Day {currentProject.days.elapsed}</span>
                          <span className="text-gray-400"> of 90</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-medium">{currentProject.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-white h-full rounded-full" 
                      style={{width: `${currentProject.progress}%`}}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Current Tasks</h4>
                    <div className="space-y-3">
                      {currentProject.tasks.map(task => (
                        <div key={task.id} className="flex items-center">
                          <div className={`h-4 w-4 rounded-full mr-3 flex items-center justify-center ${task.completed ? 'bg-white' : 'border border-gray-700'}`}>
                            {task.completed && (
                              <svg className="h-2.5 w-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                          <span className={task.completed ? 'text-gray-500' : 'text-white'}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3">Today's Updates</h4>
                    <div className="border border-gray-800 rounded-lg p-4 text-gray-300">
                      <p>{currentProject.update}</p>
                      <p className="text-sm text-gray-500 mt-2">Updated {currentProject.updateTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* All Projects Section */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                All Projects
              </h2>
              
              {selectedProject ? (
                <div className="border border-gray-800 rounded-lg p-6">
                  <button 
                    className="text-gray-400 hover:text-white flex items-center text-sm mb-6"
                    onClick={() => setSelectedProject(null)}
                  >
                    <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                    Back to all projects
                  </button>
                  
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-gray-800 p-3 rounded-lg">
                      {selectedProject.icon}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedProject.title}</h3>
                      <p className="text-gray-400">{selectedProject.subtitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 mb-6 text-sm">
                    <div className="flex items-center text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{selectedProject.days} days</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-white font-bold mr-1">{selectedProject.votes}</span>
                      <span className="text-gray-400">votes</span>
                    </div>
                    
                    <button className="border border-gray-700 hover:border-gray-500 hover:bg-gray-800 px-3 py-1 rounded text-sm">
                      Vote for this project
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Description</h4>
                      <p className="text-gray-300">{selectedProject.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Technical Considerations</h4>
                      <ul className="space-y-2 text-gray-300">
                        {selectedProject.techConsiderations.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500 mt-2 mr-2"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Goals</h4>
                      <ul className="space-y-2 text-gray-300">
                        {selectedProject.goals.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500 mt-2 mr-2"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400 mb-6">Vote on which projects you'd like to see built next.</p>
                  
                  {sortedProjects.map(project => (
                    <div 
                      key={project.id} 
                      className="border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-gray-800 p-3 rounded-lg">
                          {project.icon}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg">{project.title}</h3>
                          <p className="text-gray-400 text-sm">{project.subtitle}</p>
                          
                          <div className="mt-3 flex items-center gap-6">
                            <div className="flex items-center text-sm text-gray-400">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{project.days} days</span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-white font-bold mr-1">{project.votes}</span>
                              <span className="text-gray-400 text-sm">votes</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          className="border border-gray-700 hover:border-gray-500 hover:bg-gray-800 px-3 py-1.5 rounded text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Voting logic would go here
                          }}
                        >
                          Vote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          // Milestones Tab Content
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Transformation Milestones
            </h2>
            
            <MilestoneSection />
          </section>
        )}
      </div>
    </div>
  );
};

export default LittleEXP;
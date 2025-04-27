import { useState, useEffect, useRef } from 'react'

// Color mappings for focus badges
export const FOCUS_BADGE_COLORS = {
  green: {
    text: '#4ADE80',
    background: 'rgba(34, 197, 94, 0.1)',
    iconBackground: 'rgba(74, 222, 128, 0.75)',
    description: 'Focuses on ways AI can reduce friction in existing interfaces.'
  },
  orange: {
    text: '#FBBF24',
    background: 'rgba(245, 158, 11, 0.1)',
    iconBackground: 'rgba(251, 191, 36, 0.75)',
    description: 'Explores the boundaries of what AI can do in different contexts.'
  },
  blue: {
    text: '#3B82F6',
    background: 'rgba(37, 99, 235, 0.1)',
    iconBackground: 'rgba(59, 130, 246, 0.75)',
    description: 'Creates more transparent interactions between users and AI systems.'
  },
  purple: {
    text: '#AA94FF',
    background: 'rgba(139, 92, 246, 0.1)',
    iconBackground: 'rgba(170, 148, 255, 0.75)',
    description: 'Adds moments of delight and surprise in AI-powered experiences.'
  }
}

// Types for our data
interface CurrentProject {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  duration?: number;
  daysLeft?: number;
  dateRange?: string; // Date range formatted as "Month Day-Day"
  projectProgressId?: string; // ID of the associated ProjectProgress
  focusBadge?: {
    _id: string;
    title: string;
    color?: string;
    tooltipText?: string;
  };
}

interface ProjectItem {
  _id: string;
  id: string;
  title: string;
  description?: string;
  days?: number;
  votes: number;
  focusBadge?: {
    _id: string;
    title: string;
    color?: string;
    tooltipText?: string;
  };
  timestamp?: string;
  createdAt?: string;
}

// Daily vote limit configuration
const DAILY_VOTE_LIMIT = 20;

// Function to check if user has reached daily vote limit
function hasReachedDailyLimit(): boolean {
  // Skip limit check on server-side
  if (typeof window === 'undefined') return false;
  
  const today = new Date().toLocaleDateString();
  const voteHistory = JSON.parse(localStorage.getItem('voteHistory') || '{}');
  
  // Initialize today's count if needed
  if (!voteHistory[today]) {
    return false;
  }
  
  return voteHistory[today] >= DAILY_VOTE_LIMIT;
}

// Function to track a new vote
function trackVote(): void {
  // Skip on server-side
  if (typeof window === 'undefined') return;
  
  const today = new Date().toLocaleDateString();
  const voteHistory = JSON.parse(localStorage.getItem('voteHistory') || '{}');
  
  // Initialize today's count if needed
  if (!voteHistory[today]) {
    voteHistory[today] = 0;
  }
  
  // Increment count
  voteHistory[today]++;
  
  // Save back to localStorage
  localStorage.setItem('voteHistory', JSON.stringify(voteHistory));
}

// Function to get remaining votes for today
function getRemainingVotes(): number {
  // Skip on server-side
  if (typeof window === 'undefined') return DAILY_VOTE_LIMIT;
  
  const today = new Date().toLocaleDateString();
  const voteHistory = JSON.parse(localStorage.getItem('voteHistory') || '{}');
  
  // Initialize today's count if needed
  if (!voteHistory[today]) {
    return DAILY_VOTE_LIMIT;
  }
  
  return Math.max(0, DAILY_VOTE_LIMIT - voteHistory[today]);
}

export function useCurrentProject() {
  const [currentProject, setCurrentProject] = useState<CurrentProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch('/api/projects/current')
        
        if (!response.ok) {
          throw new Error('Failed to fetch current project')
        }
        
        const data = await response.json()
        setCurrentProject(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching current project:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  return { currentProject, loading, error }
}

export function useProjectItems() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [remainingVotes, setRemainingVotes] = useState(DAILY_VOTE_LIMIT)
  
  // Track pending votes to debounce API calls
  const pendingVotes = useRef<Record<string, number>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const isSorting = useRef<boolean>(false)
  
  async function fetchProjects() {
    try {
      setLoading(true)
      const response = await fetch('/api/projects/items')
      
      if (!response.ok) {
        throw new Error('Failed to fetch project items')
      }
      
      const data = await response.json()
      setProjects(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching project items:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  // Update remaining votes count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateRemainingVotes = () => {
        setRemainingVotes(getRemainingVotes());
      };
      
      // Initial count
      updateRemainingVotes();
      
      // Set up interval to check periodically (in case day changes)
      const interval = setInterval(updateRemainingVotes, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, []);
  
  useEffect(() => {
    fetchProjects()
  }, [])
  
  // Process a single vote API call
  const processVote = async (id: string, count: number = 1) => {
    try {
      // Make API call for the accumulated votes
      const response = await fetch('/api/projects/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, count })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update vote')
      }
      
      // Track this vote in localStorage
      for (let i = 0; i < count; i++) {
        trackVote();
      }
      
      // Update remaining votes
      setRemainingVotes(getRemainingVotes());
      
      // Only update UI with sorting after all pending votes are processed
      if (!isSorting.current) {
        isSorting.current = true;
        
        // Get fresh data from server
        const updatedItems = await response.json();
        setProjects(updatedItems);
        
        // Reset sorting flag after a small delay to prevent rapid re-renders
        setTimeout(() => {
          isSorting.current = false;
        }, 300);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error updating vote:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Revert optimistic update only if there's an error
      fetchProjects();
    }
  };
  
  const handleVote = (id: string) => {
    // Check if user has reached daily vote limit
    if (hasReachedDailyLimit()) {
      return;
    }
    
    // Optimistically update UI - but don't reorder yet
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(project => 
        project.id === id 
          ? { ...project, votes: project.votes + 1 } 
          : project
      );
      
      // Keep visual ordering stable during rapid clicks - only change count
      return updatedProjects;
    });
    
    // Track pending votes for this project
    pendingVotes.current[id] = (pendingVotes.current[id] || 0) + 1;
    
    // Clear existing timer if any
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }
    
    // Set new timer to batch process all pending votes
    debounceTimers.current[id] = setTimeout(() => {
      // Process all accumulated votes at once
      const voteCount = pendingVotes.current[id] || 0;
      if (voteCount > 0) {
        processVote(id, voteCount);
        pendingVotes.current[id] = 0;
      }
    }, 800); // Wait 800ms after last click before processing
  };
  
  return { 
    projects, 
    loading, 
    error, 
    handleVote, 
    remainingVotes,
    hasReachedVoteLimit: hasReachedDailyLimit
  }
} 
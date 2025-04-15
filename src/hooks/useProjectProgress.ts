import { useState, useEffect, useCallback } from 'react'
import { ProjectProgress, ProjectProgressWithStats } from '@/types/projectProgress'

export function useProjectProgress() {
  const [data, setData] = useState<ProjectProgressWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Calculate derived values
  const processData = (rawData: ProjectProgress): ProjectProgressWithStats => {
    let totalCompleted = 0
    let totalSubtasks = 0
    
    const tasksWithStatus = rawData.tasks.map(task => {
      const completedCount = task.subtasks.filter(subtask => subtask.completed).length
      const totalCount = task.subtasks.length
      
      totalCompleted += completedCount
      totalSubtasks += totalCount
      
      let status: 'completed' | 'inProgress' | 'notStarted'
      
      if (completedCount === 0) {
        status = 'notStarted'
      } else if (completedCount === totalCount) {
        status = 'completed'
      } else {
        status = 'inProgress'
      }
      
      return {
        ...task,
        status,
        completedCount,
        totalCount
      }
    })
    
    const progressPercentage = totalSubtasks > 0 
      ? Math.round((totalCompleted / totalSubtasks) * 100) 
      : 0
    
    return {
      ...rawData,
      tasks: tasksWithStatus,
      progressPercentage,
      completedTaskCount: totalCompleted,
      totalTaskCount: totalSubtasks
    }
  }
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/project-progress')
      
      if (!response.ok) {
        throw new Error('Failed to fetch project progress')
      }
      
      const rawData = await response.json()
      setData(processData(rawData))
      setError(null)
    } catch (err) {
      console.error('Error fetching project progress:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, loading, error }
} 
import { NextResponse } from 'next/server'
import { readOnlyClient } from '@/sanity/lib/client'
import { currentProjectQuery } from '@/sanity/lib/queries'
import { calculateDaysLeft, formatDateRange } from '@/lib/dateUtils'

export async function GET() {
  try {
    const project = await readOnlyClient.fetch(currentProjectQuery)
    
    if (!project) {
      return NextResponse.json(
        { error: 'Current project not found' },
        { status: 404 }
      )
    }

    // Calculate days left based on start date and duration
    const daysLeft = project.startDate && project.duration 
      ? calculateDaysLeft(project.startDate, project.duration)
      : null
    
    // Format the date range for display
    const dateRange = project.startDate && project.duration
      ? formatDateRange(project.startDate, project.duration)
      : null
    
    return NextResponse.json({
      ...project,
      daysLeft,
      dateRange
    })
  } catch (error) {
    console.error('Error fetching current project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current project' },
      { status: 500 }
    )
  }
} 
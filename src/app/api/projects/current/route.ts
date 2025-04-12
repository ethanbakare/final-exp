import { NextResponse } from 'next/server'
import { readOnlyClient } from '@/sanity/lib/client'
import { currentProjectQuery } from '@/sanity/lib/queries'
import { calculateDaysLeft } from '@/lib/dateUtils'

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
    
    return NextResponse.json({
      ...project,
      daysLeft
    })
  } catch (error) {
    console.error('Error fetching current project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current project' },
      { status: 500 }
    )
  }
} 
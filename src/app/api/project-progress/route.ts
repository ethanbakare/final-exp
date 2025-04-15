import { NextResponse } from 'next/server'
import { readOnlyClient } from '@/sanity/lib/client'
import { projectProgressQuery } from '@/sanity/lib/queries'

export async function GET() {
  try {
    const data = await readOnlyClient.fetch(projectProgressQuery)
    
    if (!data) {
      return NextResponse.json(
        { error: 'Project progress data not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching project progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project progress' },
      { status: 500 }
    )
  }
} 
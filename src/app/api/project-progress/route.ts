import { NextResponse } from 'next/server'
import { readOnlyClient } from '@/sanity/lib/client'
import { projectProgressQuery, projectProgressByIdQuery } from '@/sanity/lib/queries'

export async function GET(request: Request) {
  try {
    // Check if an ID was provided in the URL query parameters
    const { searchParams } = new URL(request.url)
    const projectProgressId = searchParams.get('id')
    
    let data;
    
    if (projectProgressId) {
      // If ID provided, fetch the specific project progress
      data = await readOnlyClient.fetch(projectProgressByIdQuery, { id: projectProgressId })
    } else {
      // For backward compatibility, fetch the default project progress
      data = await readOnlyClient.fetch(projectProgressQuery)
    }
    
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
import { NextResponse } from 'next/server'
import { projectItemsQuery } from '@/sanity/lib/queries'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

export async function GET() {
  try {
    // Create a non-cached client to get fresh data
    const nonCachedClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false // Disable CDN to get fresh data
    })
    
    // Fetch items with fresh data
    const items = await nonCachedClient.fetch(projectItemsQuery)
    
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching project items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project items' },
      { status: 500 }
    )
  }
} 
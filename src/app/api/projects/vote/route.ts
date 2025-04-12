import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { projectItemByIdQuery, projectItemsQuery } from '@/sanity/lib/queries'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

export async function POST(request: Request) {
  try {
    const { id, count = 1 } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing project ID' },
        { status: 400 }
      )
    }
    
    // Ensure count is a valid number
    const voteCount = Math.max(1, typeof count === 'number' ? count : 1);
    
    // Create a non-cached client to get fresh data
    const nonCachedClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false // Disable CDN to get fresh data
    })
    
    // Get current item with fresh (non-cached) data
    const item = await nonCachedClient.fetch(projectItemByIdQuery, { id })
    
    if (!item) {
      return NextResponse.json(
        { error: 'Project item not found' },
        { status: 404 }
      )
    }
    
    // Update vote count using atomic increment operation with the specified count
    await client
      .patch(item._id)
      .inc({ votes: voteCount }) // Use count parameter for multiple votes
      .set({ timestamp: new Date().toISOString() })
      .commit()
    
    // Fetch ALL items again with fresh data
    const allItems = await nonCachedClient.fetch(projectItemsQuery)
    
    return NextResponse.json(allItems)
  } catch (error) {
    console.error('Error updating vote:', error)
    return NextResponse.json(
      { error: 'Failed to update vote' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // 1. First, update all other currentProjects to not be live
    await client
      .patch({
        query: `*[_type == "currentProject" && _id != $id && isLive == true]`,
        params: { id }
      })
      .set({ isLive: false })
      .commit()

    // 2. Then set the specified project to be live
    await client
      .patch(id)
      .set({ isLive: true })
      .commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting project as live:', error)
    return NextResponse.json(
      { error: 'Failed to set project as live' },
      { status: 500 }
    )
  }
} 
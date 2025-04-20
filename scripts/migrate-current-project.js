/**
 * Migration script to update existing CurrentProject and ProjectProgress documents
 * 
 * This script:
 * 1. Gets the existing CurrentProject document
 * 2. Gets the existing ProjectProgress document
 * 3. Updates the CurrentProject to set isLive=true and add a reference to the ProjectProgress
 * 
 * Usage:
 * 1. Create a .env file with these variables:
 *    SANITY_PROJECT_ID=your_project_id
 *    SANITY_DATASET=your_dataset
 *    SANITY_TOKEN=your_token  (needs write access)
 * 
 * 2. Run with: node scripts/migrate-current-project.js
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Create Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN, // needs write access
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
  useCdn: false
})

async function migrate() {
  try {
    console.log('Starting migration...')
    
    // 1. Get the current project
    const currentProject = await client.fetch(`*[_type == "currentProject"][0]`)
    
    if (!currentProject) {
      console.log('No current project found')
      return
    }
    
    console.log(`Found current project: ${currentProject.title} (ID: ${currentProject._id})`)
    
    // 2. Get the project progress
    const projectProgress = await client.fetch(`*[_type == "projectProgress"][0]`)
    
    if (!projectProgress) {
      console.log('No project progress found')
      return
    }
    
    console.log(`Found project progress: ${projectProgress.title} (ID: ${projectProgress._id})`)
    
    // 3. Update the current project with live flag and reference
    const result = await client
      .patch(currentProject._id)
      .set({
        isLive: true,
        projectProgress: {
          _type: 'reference',
          _ref: projectProgress._id
        }
      })
      .commit()
    
    console.log(`Migration completed successfully: ${result.title} is now live and linked to ${projectProgress.title}`)
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Run migration
migrate() 
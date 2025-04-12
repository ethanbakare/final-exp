import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId, useCdn } from '../env'

// Client with write access for mutating data (votes, etc.)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
  token: process.env.SANITY_API_TOKEN, // Required for authenticated requests
})

// Read-only client for public data fetching
export const readOnlyClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
}) 
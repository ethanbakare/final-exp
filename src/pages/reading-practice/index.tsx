import { NextPage } from 'next'
import React from 'react'
import { ReadingDisplay } from '@reading-practice/components/ReadingDisplay'

const testPassage = {
  title: "Test Reading",
  text: ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog."]
}

const ReadingPracticePage: NextPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reading Practice</h1>
      <ReadingDisplay passage={testPassage} />
    </div>
  )
}

export default ReadingPracticePage 
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'projectProgress',
  title: 'Project Progress',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Modal Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'modalImage',
      title: 'Modal Background Image',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'tasks',
      title: 'Tasks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Task Title',
              type: 'string',
              validation: Rule => Rule.required()
            },
            {
              name: 'subtasks',
              title: 'Subtasks',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'title',
                      title: 'Subtask Title',
                      type: 'string',
                      validation: Rule => Rule.required()
                    },
                    {
                      name: 'completed',
                      title: 'Completed',
                      type: 'boolean',
                      initialValue: false
                    }
                  ],
                  preview: {
                    select: {
                      title: 'title',
                      completed: 'completed'
                    },
                    prepare({ title, completed }) {
                      return {
                        title,
                        subtitle: completed ? '✓ Completed' : '○ Not completed'
                      }
                    }
                  }
                }
              ],
              validation: Rule => Rule.min(1)
            }
          ],
          preview: {
            select: {
              title: 'title',
              subtasks: 'subtasks'
            },
            prepare({ title, subtasks = [] }) {
              const completed = subtasks.filter((st: {completed: boolean}) => st.completed).length;
              return {
                title,
                subtitle: `${completed}/${subtasks.length} completed`
              }
            }
          }
        }
      ]
    })
  ]
}) 
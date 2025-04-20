import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'currentProject',
  title: 'Current Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (B)',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle (C)',
      type: 'string'
    }),
    defineField({
      name: 'description',
      title: 'Description/Question (D)',
      type: 'text'
    }),
    defineField({
      name: 'startDate',
      title: 'Project Start Date',
      type: 'date',
      description: 'The date from which days will count down'
    }),
    defineField({
      name: 'duration',
      title: 'Project Duration (Days)',
      type: 'number',
      description: 'Total days for countdown (A)'
    }),
    defineField({
      name: 'focusBadge',
      title: 'Focus Badge (E)',
      type: 'reference',
      to: [{type: 'focusBadge'}]
    }),
    defineField({
      name: 'isLive',
      title: 'Is Live',
      type: 'boolean',
      description: 'Only one project can be live at a time. Only the live project appears on the site.',
      initialValue: false
    }),
    defineField({
      name: 'projectProgress',
      title: 'Project Progress',
      type: 'reference',
      to: [{type: 'projectProgress'}],
      description: 'The associated progress details for this project'
    })
  ],
  preview: {
    select: {
      title: 'title',
      isLive: 'isLive'
    },
    prepare({ title, isLive }) {
      return {
        title,
        subtitle: isLive ? '🟢 LIVE' : '⚪ NOT LIVE'
      }
    }
  }
}) 
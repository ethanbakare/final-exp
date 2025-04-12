import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'projectItem',
  title: 'Project Item',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'title',
      title: 'Title (F)',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description (G)',
      type: 'text'
    }),
    defineField({
      name: 'days',
      title: 'Days (H/N)',
      type: 'number'
    }),
    defineField({
      name: 'votes',
      title: 'Votes (J)',
      type: 'number',
      initialValue: 0
    }),
    defineField({
      name: 'focusBadge',
      title: 'Focus Badge (I/O)',
      type: 'reference',
      to: [{type: 'focusBadge'}]
    }),
    defineField({
      name: 'timestamp',
      title: 'Last Vote Timestamp',
      type: 'datetime'
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString()
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'votes'
    },
    prepare({title, subtitle}) {
      return {
        title,
        subtitle: `Votes: ${subtitle || 0}`
      }
    }
  }
}) 
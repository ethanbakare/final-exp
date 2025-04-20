import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'focusBadge',
  title: 'Focus Badge',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Badge Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tooltipText',
      title: 'Tooltip Text',
      description: 'Text displayed when hovering over the badge',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'color',
      title: 'Badge Color',
      type: 'string',
      options: {
        list: [
          {title: 'Green', value: 'green'},
          {title: 'Blue', value: 'blue'},
          {title: 'Purple', value: 'purple'},
          {title: 'Orange', value: 'orange'}
        ]
      }
    })
  ]
}) 
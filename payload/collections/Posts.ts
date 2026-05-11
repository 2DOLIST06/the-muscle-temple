import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedAt', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      label: 'Titre',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Brouillon',
          value: 'draft',
        },
        {
          label: 'Publié',
          value: 'published',
        },
      ],
    },
    {
      name: 'category',
      label: 'Catégorie',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'featuredImage',
      label: 'Image principale',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'excerpt',
      label: 'Résumé',
      type: 'textarea',
    },
    {
      name: 'content',
      label: 'Contenu',
      type: 'richText',
      required: true,
    },
    {
      name: 'metaTitle',
      label: 'Meta title',
      type: 'text',
    },
    {
      name: 'metaDescription',
      label: 'Meta description',
      type: 'textarea',
    },
    {
      name: 'canonical',
      label: 'Canonical',
      type: 'text',
    },
    {
      name: 'robots',
      label: 'Robots',
      type: 'select',
      defaultValue: 'index,follow',
      options: [
        {
          label: 'index,follow',
          value: 'index,follow',
        },
        {
          label: 'noindex,follow',
          value: 'noindex,follow',
        },
        {
          label: 'noindex,nofollow',
          value: 'noindex,nofollow',
        },
      ],
    },
    {
      name: 'publishedAt',
      label: 'Date de publication',
      type: 'date',
    },
  ],
}

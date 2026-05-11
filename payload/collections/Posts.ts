import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'publishedAt', 'updatedAt'],
    group: 'Contenu',
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contenu',
          fields: [
            {
              name: 'title',
              label: 'Titre H1',
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
              admin: {
                description: 'Exemple : guide-musculation-debutant',
              },
            },
            {
              name: 'excerpt',
              label: 'Chapo / résumé court',
              type: 'textarea',
            },
            {
              name: 'featuredImage',
              label: 'Image principale',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              label: 'Contenu de l’article',
              type: 'richText',
              required: true,
            },
          ],
        },
        {
          label: 'Organisation',
          fields: [
            {
              name: 'author',
              label: 'Auteur',
              type: 'relationship',
              relationTo: 'authors',
            },
            {
              name: 'category',
              label: 'Catégorie',
              type: 'relationship',
              relationTo: 'categories',
            },
            {
              name: 'tags',
              label: 'Tags',
              type: 'array',
              fields: [
                {
                  name: 'tag',
                  label: 'Tag',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'relatedPosts',
              label: 'Articles liés',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
            },
            {
              name: 'publishedAt',
              label: 'Date de publication',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              label: 'Meta title',
              type: 'text',
              admin: {
                description: 'Titre SEO affiché dans Google. Laisser vide pour reprendre le titre de l’article.',
              },
            },
            {
              name: 'metaDescription',
              label: 'Meta description',
              type: 'textarea',
            },
            {
              name: 'canonical',
              label: 'URL canonique',
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
              name: 'ogTitle',
              label: 'Open Graph title',
              type: 'text',
            },
            {
              name: 'ogDescription',
              label: 'Open Graph description',
              type: 'textarea',
            },
            {
              name: 'ogImage',
              label: 'Image Open Graph',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'FAQ',
          fields: [
            {
              name: 'faq',
              label: 'FAQ',
              type: 'array',
              fields: [
                {
                  name: 'question',
                  label: 'Question',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'answer',
                  label: 'Réponse',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

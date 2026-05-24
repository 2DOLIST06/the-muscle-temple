import type { CollectionConfig } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'

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
    description: 'Créez et organisez vos articles avec une structure éditoriale claire.',
  },
  access: {
    read: () => true,
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
              admin: {
                description: 'Titre principal de l’article affiché en haut de page.',
              },
            },
            {
              name: 'content',
              label: 'Contenu de l’article',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
              admin: {
                description:
                  'Éditeur Payload complet activé (toolbars complètes, titres H1-H6, médias, liens, formatage avancé).',
              },
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
              admin: {
                description: 'Résumé court utilisé dans les listes d’articles et aperçus SEO.',
              },
            },
            {
              name: 'featuredImage',
              label: 'Image principale',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Visuel principal de l’article (bannière / miniature).',
              },
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
              admin: {
                description: 'Auteur principal de l’article.',
              },
            },
            {
              name: 'category',
              label: 'Catégorie',
              type: 'relationship',
              relationTo: 'categories',
              admin: {
                description: 'Catégorie éditoriale principale.',
              },
            },
            {
              name: 'tags',
              label: 'Tags',
              type: 'array',
              labels: {
                singular: 'Tag',
                plural: 'Tags',
              },
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
              name: 'publishedAt',
              label: 'Date de publication',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: 'Date et heure de publication prévues.',
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
                description: 'Titre SEO affiché dans Google. Laisser vide pour reprendre le Titre H1.',
              },
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
                { label: 'index,follow', value: 'index,follow' },
                { label: 'noindex,follow', value: 'noindex,follow' },
                { label: 'noindex,nofollow', value: 'noindex,nofollow' },
              ],
            },
            {
              name: 'ogTitle',
              label: 'OG title',
              type: 'text',
            },
            {
              name: 'ogDescription',
              label: 'OG description',
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
              labels: {
                singular: 'Question FAQ',
                plural: 'FAQ',
              },
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

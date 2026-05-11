import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { Users } from './payload/collections/Users'
import { Authors } from './payload/collections/Authors'
import { Posts } from './payload/collections/Posts'
import { Categories } from './payload/collections/Categories'
import { Media } from './payload/collections/Media'

export default buildConfig({
  routes: {
    admin: '/cms',
  },
  admin: {
    user: Users.slug,
  },
  editor: lexicalEditor(),
  collections: [
    Users,
    Authors,
    Posts,
    Categories,
    Media,
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
})

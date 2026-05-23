import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Users } from './payload/collections/Users'
import { Authors } from './payload/collections/Authors'
import { Posts } from './payload/collections/Posts'
import { Categories } from './payload/collections/Categories'
import { Media } from './payload/collections/Media'

const databaseUrl = process.env.DATABASE_URL
const payloadSecret = process.env.PAYLOAD_SECRET

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing')
}

if (!payloadSecret) {
  throw new Error('PAYLOAD_SECRET is missing')
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  routes: {
    admin: '/cms',
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: dirname,
    },
  },
  editor: lexicalEditor(),
  collections: [
    Users,
    Authors,
    Posts,
    Categories,
    Media,
  ],
  secret: payloadSecret,
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }),
})

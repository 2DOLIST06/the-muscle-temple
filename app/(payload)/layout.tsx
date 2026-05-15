import configPromise from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './cms/importMap'

import './custom.scss'

type Args = {
  children: React.ReactNode
}

export default function Layout({ children }: Args) {
  return RootLayout({
    config: configPromise,
    importMap,
    children,
  })
}

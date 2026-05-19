import type { ServerFunctionClient } from 'payload'

import configPromise from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'

import { importMap } from './cms/importMap'

type Props = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'

  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  })
}

export default function Layout({ children }: Props) {
  return RootLayout({
    children,
    config: configPromise,
    importMap,
    serverFunction,
  })
}

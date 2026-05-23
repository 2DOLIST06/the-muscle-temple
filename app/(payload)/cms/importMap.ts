import type { ImportMap } from 'payload'

import {
  LexicalDiffComponent,
  RscEntryLexicalCell,
  RscEntryLexicalField,
} from '@payloadcms/richtext-lexical/rsc'

export const importMap: ImportMap = {
  '@payloadcms/richtext-lexical/rsc#LexicalDiffComponent': LexicalDiffComponent,
  '@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell': RscEntryLexicalCell,
  '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField': RscEntryLexicalField,
}

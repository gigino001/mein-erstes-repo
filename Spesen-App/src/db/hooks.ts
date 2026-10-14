import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_SETTINGS, type Settings } from '../domain/types'
import { db } from './db'

export function useSettings(): Settings {
  const row = useLiveQuery(() => db.settings.get('main'))
  return row ?? DEFAULT_SETTINGS
}

import { useSyncExternalStore } from 'react'
import { storage } from './storage'

const KEY = 'xb_auth_data'
const listeners = new Set<() => void>()

export const auth = {
  get: () => storage.get(KEY),
  set(token: string | null) {
    storage.set(KEY, token)
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useAuthToken() {
  return useSyncExternalStore(auth.subscribe, auth.get)
}

import { useQuery } from '@tanstack/react-query'
import { api } from './endpoints'

export const keys = {
  info: ['user', 'info'] as const,
  subscribe: ['user', 'subscribe'] as const,
  stat: ['user', 'stat'] as const,
  orders: ['user', 'orders'] as const,
}

export const useGuestConfig = () => useQuery({ queryKey: ['guest', 'config'], queryFn: api.guestConfig, staleTime: 5 * 60_000 })
export const useUserConfig = () => useQuery({ queryKey: ['user', 'config'], queryFn: api.userConfig, staleTime: 5 * 60_000 })
export const useUserInfo = () => useQuery({ queryKey: keys.info, queryFn: api.info })
export const useSubscribe = () => useQuery({ queryKey: keys.subscribe, queryFn: api.subscribe })
export const useStat = () => useQuery({ queryKey: keys.stat, queryFn: api.stat })

/** 金額符號，取自後台貨幣設定 */
export function useCurrency() {
  return useUserConfig().data?.currency_symbol ?? '¥'
}

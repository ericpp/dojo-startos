import { randomBytes } from 'crypto'

const ALPHANUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateKey(len: number): string {
  const bytes = randomBytes(len)
  return Array.from(bytes, (b) => ALPHANUM[b % ALPHANUM.length]).join('')
}

export const uiPort = 9000
export const backendPort = 8080
export const sorobanPort = 4242
export const dbPort = 3306

export const btcMountpoint = '/mnt/bitcoin'
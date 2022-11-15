import { customAlphabet } from 'nanoid';

export function formatRupiah(amount: number, isShort?: boolean): string {
  let res = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

  if (isShort) {
    if (amount >= 1000000) {
      res = `Rp ${amount / 1000000}M`;
    } else if (amount >= 1000) {
      res = `Rp ${amount / 1000}K`;
    } else {
      res = 'Rp ' + amount;
    }
  }

  return res;
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
);

// 1000 to 1k
export function formatNumber(amount: number): string {
  return amount.toString().replace(/000$/, 'k');
}

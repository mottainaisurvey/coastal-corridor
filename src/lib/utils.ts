import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an amount in kobo as a Naira string.
 * ALWAYS display money from the BigInt kobo representation to avoid float errors.
 */
export function formatKobo(
  kobo: number | bigint,
  options: { compact?: boolean; showCurrency?: boolean } = {}
): string {
  const { compact = true, showCurrency = true } = options;
  const naira = Number(kobo) / 100;

  if (compact && naira >= 1_000_000_000) {
    return `${showCurrency ? '₦' : ''}${(naira / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`;
  }
  if (compact && naira >= 1_000_000) {
    return `${showCurrency ? '₦' : ''}${(naira / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (compact && naira >= 1_000) {
    return `${showCurrency ? '₦' : ''}${(naira / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return `${showCurrency ? '₦' : ''}${naira.toLocaleString('en-NG')}`;
}

export function formatArea(sqm: number): string {
  if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)} ha`;
  return `${sqm.toLocaleString('en-NG')} m²`;
}

export function formatCorridorKm(km: number): string {
  if (km === 0) return '0 km';
  return `${km.toLocaleString('en-NG', { maximumFractionDigits: 1 })} km`;
}

export function formatRelativeDate(daysAgo: number): string {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;
  return `${Math.floor(daysAgo / 365)} years ago`;
}

export const destinationTypeLabels: Record<string, string> = {
  INFRASTRUCTURE: 'Infrastructure',
  REAL_ESTATE: 'Real Estate',
  MIXED_USE: 'Mixed Use',
  TOURISM: 'Tourism'
};

export const destinationTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
  INFRASTRUCTURE: { bg: 'bg-ocean/15', text: 'text-ocean-2', dot: 'bg-ocean-2' },
  REAL_ESTATE: { bg: 'bg-laterite/15', text: 'text-laterite-2', dot: 'bg-laterite-2' },
  MIXED_USE: { bg: 'bg-ochre/15', text: 'text-ochre-2', dot: 'bg-ochre' },
  TOURISM: { bg: 'bg-sage/15', text: 'text-sage', dot: 'bg-sage' }
};

export const propertyTypeLabels: Record<string, string> = {
  LAND_ONLY: 'Land',
  HOUSE: 'House',
  APARTMENT: 'Apartment',
  COMMERCIAL: 'Commercial',
  MIXED_USE: 'Mixed Use',
  HOSPITALITY: 'Hospitality'
};

export const titleStatusLabels: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: 'Title verified', color: 'text-success' },
  PENDING: { label: 'Verification in progress', color: 'text-ochre' },
  DISPUTED: { label: 'Title disputed', color: 'text-alert' },
  REJECTED: { label: 'Title rejected', color: 'text-alert' }
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

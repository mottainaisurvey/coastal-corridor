// Core domain types for the Coastal Corridor platform
// These mirror the Prisma schema but are simplified for client-side use

export type DestinationType = 'INFRASTRUCTURE' | 'REAL_ESTATE' | 'MIXED_USE' | 'TOURISM';

export type TitleStatus = 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'REJECTED';

export type PlotStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'DISPUTED' | 'UNDER_VERIFICATION';

export type PropertyType = 'LAND_ONLY' | 'HOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'MIXED_USE' | 'HOSPITALITY';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'UNDER_OFFER' | 'SOLD' | 'WITHDRAWN' | 'EXPIRED';

export interface Destination {
  id: string;
  slug: string;
  name: string;
  state: string;
  type: DestinationType;
  latitude: number;
  longitude: number;
  corridorKm: number;
  heroImage: string;
  tagline: string;
  description: string;
  stats: { label: string; value: string; unit: string }[];
  features: string[];
}

export interface Plot {
  id: string;
  plotId: string;
  destinationId: string;
  destinationName?: string;
  status: PlotStatus;
  latitude: number;
  longitude: number;
  areaSqm: number;
  pricePerSqmKobo: number;
  totalPriceKobo: number;
  currency: string;
  titleStatus: TitleStatus;
  titleType?: string;
  titleNumber?: string;
  floodRiskScore?: number;
  erosionRiskScore?: number;
  disputeRiskScore?: number;
  accessibilityScore?: number;
  createdAt: string;
}

export interface Property {
  id: string;
  plotId: string;
  slug: string;
  type: PropertyType;
  title: string;
  description: string;
  destinationId: string;
  destinationName: string;
  state: string;
  latitude: number;
  longitude: number;
  areaSqm: number;
  floorArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  amenities: string[];
  heroImage: string;
  images: string[];
  virtualTourUrl?: string;
  priceKobo: number;
  pricePerSqmKobo: number;
  currency: string;
  titleStatus: TitleStatus;
  titleType?: string;
  listingStatus: ListingStatus;
  agentName?: string;
  agentVerified?: boolean;
  developerName?: string;
  featured?: boolean;
  yoy?: number; // year-over-year appreciation
  floodRiskScore?: number;
  disputeRiskScore?: number;
  daysListed?: number;
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  agencyName: string;
  licenseNumber: string;
  licenseVerified: boolean;
  yearsActive: number;
  regionsCovered: string[];
  specialties: string[];
  rating: number;
  reviewCount: number;
  listingCount: number;
  bio: string;
}

export interface Developer {
  id: string;
  slug: string;
  name: string;
  logo: string;
  cacNumber: string;
  verified: boolean;
  yearFounded: number;
  projectCount: number;
  description: string;
  activeProjects: number;
  completedProjects: number;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  developerId: string;
  developerName: string;
  destinationId: string;
  destinationName: string;
  description: string;
  heroImage: string;
  masterplanImage?: string;
  totalUnits: number;
  availableUnits: number;
  priceFromKobo: number;
  priceToKobo: number;
  status: 'planning' | 'active' | 'sold_out' | 'complete';
  completionDate?: string;
  amenities: string[];
}

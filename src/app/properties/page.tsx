'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, Grid3x3, List, MapPin, X } from 'lucide-react';
import { properties } from '@/lib/mock/properties';
import { destinations } from '@/lib/mock/destinations';
import { PropertyCard } from '@/components/property-card';
import { propertyTypeLabels, destinationTypeColors } from '@/lib/utils';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'yoy';

export default function PropertiesPage() {
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100_000_000_000); // 1B naira
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState<SortKey>('featured');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...properties];
    if (selectedDestination !== 'all') list = list.filter((p) => p.destinationId === selectedDestination);
    if (selectedType !== 'all') list = list.filter((p) => p.type === selectedType);
    if (onlyVerified) list = list.filter((p) => p.titleStatus === 'VERIFIED');
    list = list.filter((p) => p.priceKobo >= minPrice && p.priceKobo <= maxPrice);

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.priceKobo - b.priceKobo);
        break;
      case 'price-desc':
        list.sort((a, b) => b.priceKobo - a.priceKobo);
        break;
      case 'newest':
        list.sort((a, b) => (a.daysListed || 0) - (b.daysListed || 0));
        break;
      case 'yoy':
        list.sort((a, b) => (b.yoy || 0) - (a.yoy || 0));
        break;
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  }, [selectedDestination, selectedType, minPrice, maxPrice, onlyVerified, sort]);

  const activeFilterCount =
    (selectedDestination !== 'all' ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (onlyVerified ? 1 : 0) +
    (minPrice > 0 || maxPrice < 100_000_000_000 ? 1 : 0);

  return (
    <div className="container-x py-10 md:py-14">
      {/* ===== HEADER ===== */}
      <div className="mb-8">
        <div className="eyebrow mb-3">Marketplace · {filtered.length} listings</div>
        <h1 className="font-serif text-[36px] md:text-[48px] leading-tight tracking-tightest font-light">
          Verified properties along the corridor
        </h1>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="sticky top-16 z-30 bg-paper/95 backdrop-blur py-4 -mx-5 px-5 sm:-mx-8 sm:px-8 border-b border-ink/8 mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="btn-secondary !py-2 !px-4 !text-[12px]"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-laterite text-paper rounded-full h-4 min-w-4 px-1 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="hidden md:block bg-white border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none"
            >
              <option value="all">All destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="hidden md:block bg-white border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none"
            >
              <option value="all">All property types</option>
              {Object.entries(propertyTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-white border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="newest">Newest first</option>
              <option value="yoy">Highest appreciation</option>
            </select>
            <div className="hidden sm:flex border border-ink/15 rounded-sm">
              <button
                onClick={() => setView('grid')}
                className={`p-2 ${view === 'grid' ? 'bg-ink text-paper' : 'text-ink/60'}`}
                aria-label="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 ${view === 'list' ? 'bg-ink text-paper' : 'text-ink/60'}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Link href="/map" className="btn-dark !py-2 !px-4 !text-[12px]">
              <MapPin className="h-3.5 w-3.5" />
              Map view
            </Link>
          </div>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="mt-4 pt-4 border-t border-ink/10 grid md:grid-cols-4 gap-5">
            <div className="md:hidden">
              <label className="stat-label mb-2 block">Destination</label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none"
              >
                <option value="all">All destinations</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:hidden">
              <label className="stat-label mb-2 block">Property type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none"
              >
                <option value="all">All types</option>
                {Object.entries(propertyTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="stat-label mb-2 block">Min price (₦)</label>
              <input
                type="number"
                value={minPrice / 100 || ''}
                onChange={(e) => setMinPrice(Number(e.target.value) * 100)}
                placeholder="0"
                className="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none"
              />
            </div>
            <div>
              <label className="stat-label mb-2 block">Max price (₦)</label>
              <input
                type="number"
                value={maxPrice / 100 === 1_000_000_000 ? '' : maxPrice / 100}
                onChange={(e) => setMaxPrice(Number(e.target.value) * 100 || 100_000_000_000)}
                placeholder="Any"
                className="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="h-4 w-4 accent-laterite"
                />
                <span className="text-[13px]">Verified titles only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ===== DESTINATION PILLS ===== */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-5 px-5 sm:-mx-8 sm:px-8">
        <button
          onClick={() => setSelectedDestination('all')}
          className={`chip whitespace-nowrap ${
            selectedDestination === 'all'
              ? 'bg-ink text-paper'
              : 'bg-white border border-ink/15 text-ink/70 hover:border-ink/40'
          }`}
        >
          All destinations
        </button>
        {destinations.map((d) => {
          const colors = destinationTypeColors[d.type];
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDestination(d.id)}
              className={`chip whitespace-nowrap ${
                selectedDestination === d.id
                  ? 'bg-ink text-paper'
                  : `${colors.bg} ${colors.text} hover:opacity-80`
              }`}
            >
              {d.name}
            </button>
          );
        })}
      </div>

      {/* ===== RESULTS ===== */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="font-serif text-[24px] text-ink/60 mb-2">No listings match your filters</div>
          <button
            onClick={() => {
              setSelectedDestination('all');
              setSelectedType('all');
              setMinPrice(0);
              setMaxPrice(100_000_000_000);
              setOnlyVerified(false);
            }}
            className="text-[13px] text-laterite hover:underline"
          >
            <X className="h-3 w-3 inline mr-1" />
            Clear all filters
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}

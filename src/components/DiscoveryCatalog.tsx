import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { HERO_IMAGE_URL } from '../data/seedCatalog';
import {
  GenderPolicy,
  HostelListing,
  LOCALITIES,
  Locality,
  RoomType,
} from '../types/hostelease';
import { ResilientImage } from './ResilientImage';

interface DiscoveryCatalogProps {
  listings: HostelListing[];
  loading: boolean;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectListing: (listing: HostelListing) => void;
  onOpenCompareView: () => void;
  onOpenServicesView: () => void;
}

export function DiscoveryCatalog({
  listings,
  loading,
  compareIds,
  onToggleCompare,
  onSelectListing,
  onOpenCompareView,
  onOpenServicesView,
}: DiscoveryCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocality, setSelectedLocality] = useState<'All' | Locality>('All');
  const [selectedGender, setSelectedGender] = useState<'All' | GenderPolicy>('All');
  const [selectedRoomType, setSelectedRoomType] = useState<'All' | RoomType>('All');
  const [maxRent, setMaxRent] = useState<number>(15000);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((item) => {
      if (selectedLocality !== 'All' && item.locality !== selectedLocality) return false;
      if (selectedGender !== 'All' && item.gender !== selectedGender) return false;
      if (selectedRoomType !== 'All' && item.roomType !== selectedRoomType) return false;
      if (item.monthlyRent > maxRent) return false;
      if (verifiedOnly && item.verificationStatus !== 'Verified') return false;
      if (q) {
        const hay = `${item.name} ${item.locality} ${item.nearCampus} ${item.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [listings, searchQuery, selectedLocality, selectedGender, selectedRoomType, maxRent, verifiedOnly]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLocality('All');
    setSelectedGender('All');
    setSelectedRoomType('All');
    setMaxRent(15000);
    setVerifiedOnly(false);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section: Balanced 2-Column Split */}
      <section aria-labelledby="hero-heading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-2 lg:py-6">
            <p className="text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-400 mb-3">
              Dehradun Student Housing · Zero Brokerage
            </p>
            <h1
              id="hero-heading"
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] text-balance mb-4"
            >
              Find and compare verified PGs and hostels near your campus.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-7">
              Built for students moving to Dehradun. Inspect transparent rent, safety checklists, distance to university gates, and verified student reviews before you visit.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#verified-listings"
                className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Explore Verified PGs
              </a>
              <button
                type="button"
                onClick={onOpenServicesView}
                className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Tiffin & Campus Services
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <ResilientImage
                src={HERO_IMAGE_URL}
                alt="Sunlit student hostel study lounge in Dehradun overlooking Himalayan foothills"
                className="w-full h-full object-cover"
                fallbackTitle="HostelEase Dehradun Student Lounge"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-5">
                <p className="text-xs font-medium text-slate-200">
                  Clement Town · Dalanwala · Bidholi · Prem Nagar · Patel Nagar · Rajpur Road
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Summary Strip Below Hero Split */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-slate-200 dark:border-slate-800 py-5">
          <div>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              6 Hubs
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Covered around DGU, Graphic Era, UPES, DBUU & SGRRU
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              ₹0 Fee
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Free student discovery, comparison & visit scheduling
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              100%
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Standardized rent, deposit, curfew & safety disclosures
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              4 Services
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Homestyle tiffin, laundry, room cleaning & repairs
            </p>
          </div>
        </div>
      </section>

      {/* Filter & Search Section */}
      <section id="verified-listings" aria-labelledby="catalog-heading" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 id="catalog-heading" className="text-2xl font-bold text-slate-900 dark:text-white">
              Dehradun PG & Hostel Directory
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Select up to 3 listings to compare rent, distance, safety, and facilities side-by-side.
            </p>
          </div>

          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={onOpenCompareView}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Compare Selected ({compareIds.length}/3)</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by PG name, college (e.g. DGU, Graphic Era, UPES)..."
                aria-label="Search listings by name or university"
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg" role="group" aria-label="Gender filter">
                {(['All', 'Boys', 'Girls', 'Co-ed'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGender(g)}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      selectedGender === g
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value as 'All' | RoomType)}
                aria-label="Filter by room type"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="All">All Room Types</option>
                <option value="Single Studio">Single Studio</option>
                <option value="Twin Sharing">Twin Sharing</option>
                <option value="Triple Sharing">Triple Sharing</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-teal-700 focus:ring-teal-600"
                />
                <span>Verified Only</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Locality Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedLocality('All')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedLocality === 'All'
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Dehradun
              </button>
              {LOCALITIES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLocality(loc)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedLocality === loc
                      ? 'bg-teal-700 text-white dark:bg-teal-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Max Rent Slider */}
            <div className="flex items-center gap-3 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="max-rent-range" className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Max Rent: <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">₹{maxRent.toLocaleString('en-IN')}</span>
              </label>
              <input
                id="max-rent-range"
                type="range"
                min={5000}
                max={15000}
                step={500}
                value={maxRent}
                onChange={(e) => setMaxRent(Number(e.target.value))}
                className="w-28 sm:w-32 accent-teal-700 dark:accent-teal-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
              />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No PGs or hostels match your current filters
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Try raising your monthly budget slider or clearing locality filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              const isCompared = compareIds.includes(listing.id);
              return (
                <article
                  key={listing.id}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    <ResilientImage
                      src={listing.imageUrl}
                      alt={`${listing.name} in ${listing.locality}, Dehradun`}
                      className="w-full h-full object-cover"
                      fallbackTitle={listing.name}
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="truncate">
                          {listing.locality} · {listing.gender} · {listing.roomType}
                        </span>
                        {listing.verificationStatus === 'Verified' ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 font-semibold shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium shrink-0">
                            Pending Audit
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {listing.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {listing.distanceKm} km from {listing.nearCampus}
                        </span>
                      </p>

                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                            ₹{listing.monthlyRent.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400"> / month</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                          <span className="text-slate-600 dark:text-slate-300">
                            Safety {listing.safetyScore}/10
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {listing.reviewCount > 0 ? listing.avgRating.toFixed(1) : 'New'}
                            {listing.reviewCount > 0 && (
                              <span className="text-slate-400 font-normal">({listing.reviewCount})</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleCompare(listing.id)}
                          className={`h-10 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                            isCompared
                              ? 'border-teal-700 dark:border-teal-400 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                              : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isCompared ? <Check className="w-3.5 h-3.5" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
                          <span>{isCompared ? 'Compared' : 'Compare'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectListing(listing)}
                          className="h-10 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          View & Book
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

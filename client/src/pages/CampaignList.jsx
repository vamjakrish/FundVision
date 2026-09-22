import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Loader, ChevronDown } from 'lucide-react';
import { campaignAPI } from '../services/api';
import CampaignCard from '../components/campaigns/CampaignCard';

const CATEGORIES = ['Medical', 'Education', 'Emergency', 'Environment', 'Animal Welfare', 'Startup Funding', 'Social Causes'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'deadline', label: 'Ending Soon' },
  { value: '-raisedAmount', label: 'Most Funded' },
  { value: '-donorCount', label: 'Most Donors' },
];

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-video w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-2 w-full rounded mt-2" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CampaignList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('-createdAt');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [location, setLocation] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['campaigns', debouncedSearch, category, sort, verifiedOnly, urgentOnly, trendingOnly, location],
    queryFn: ({ pageParam = 1 }) =>
      campaignAPI.getAll({
        page: pageParam, limit: 12, search: debouncedSearch, category, sort, status: 'active',
        verified: verifiedOnly || undefined,
        urgent: urgentOnly || undefined,
        trending: trendingOnly || undefined,
        location: location || undefined,
      }).then(r => r.data),
    getNextPageParam: (last) => last.pagination?.page < last.pagination?.pages ? last.pagination.page + 1 : undefined,
  });

  const campaigns = data?.pages.flatMap(p => p.data) || [];
  const total = data?.pages[0]?.pagination?.total || 0;
  const activeFilterCount = [category, verifiedOnly, urgentOnly, trendingOnly, location].filter(Boolean).length;
  const clearFilter = () => {
    setCategory(''); setSearch(''); setDebouncedSearch('');
    setVerifiedOnly(false); setUrgentOnly(false); setTrendingOnly(false); setLocation('');
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8 sm:py-12">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1">Explore Campaigns</h1>
            <p className="text-slate-500 text-sm sm:text-base">Discover verified campaigns that need your support</p>
          </motion.div>

          {/* Search */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-2xl">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="input-field pl-9 sm:pl-12 py-2.5 sm:py-3 text-sm w-full" />
              {search && (
                <button onClick={() => { setSearch(''); setDebouncedSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => setFiltersOpen(p => !p)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl border-2 font-medium text-sm transition-all shrink-0 ${filtersOpen ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600 hover:border-primary/50'}`}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && <span className="w-2 h-2 bg-primary rounded-full" />}
            </button>
          </div>

          {/* Category chips - scrollable */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setCategory('')}
              className={`badge px-3 py-1.5 text-xs cursor-pointer whitespace-nowrap shrink-0 transition-all ${!category ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              All
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(category === cat ? '' : cat)}
                className={`badge px-3 py-1.5 text-xs cursor-pointer whitespace-nowrap shrink-0 transition-all ${category === cat ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-container py-6 sm:py-8">
        {/* Inline filters panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6">
              <div className="card p-4 sm:p-5">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCategory(category === cat ? '' : cat)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${category === cat ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/50'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sort By</p>
                    <div className="flex flex-wrap gap-2">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => setSort(opt.value)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${sort === opt.value ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/50'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Smart Filters</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'verified', label: '✓ Verified NGO', active: verifiedOnly, toggle: () => setVerifiedOnly(p => !p) },
                        { key: 'urgent', label: '🚨 Urgent', active: urgentOnly, toggle: () => setUrgentOnly(p => !p) },
                        { key: 'trending', label: '🔥 Trending', active: trendingOnly, toggle: () => setTrendingOnly(p => !p) },
                      ].map(f => (
                        <button key={f.key} onClick={f.toggle}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${f.active ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/50'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</p>
                    <input value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="City or state…"
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary/50 w-full" />
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilter} className="text-xs text-red-500 hover:underline self-end">Clear all</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && (
          <p className="text-sm text-slate-500 mb-4 sm:mb-6">
            <span className="font-semibold text-slate-700">{total}</span> campaigns
            {category && <span> in <span className="text-primary font-semibold">{category}</span></span>}
            {debouncedSearch && <span> matching "<span className="text-primary font-semibold">{debouncedSearch}</span>"</span>}
          </p>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : campaigns.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {campaigns.map(c => <CampaignCard key={c._id} campaign={c} />)}
            </div>
            {hasNextPage && (
              <div className="text-center mt-8 sm:mt-10">
                <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                  className="btn-secondary px-6 sm:px-8 flex items-center gap-2 mx-auto text-sm">
                  {isFetchingNextPage ? <><Loader className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 sm:py-20">
            <div className="text-5xl sm:text-6xl mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No campaigns found</h3>
            <p className="text-slate-500 text-sm mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilter} className="btn-primary text-sm">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

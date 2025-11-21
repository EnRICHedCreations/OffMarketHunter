'use client';

import { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import ExportButton from '@/components/ExportButton';

interface Property {
  id: number;
  property_id: string;
  full_street_line: string;
  city: string;
  state: string;
  zip_code: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  current_status: string;
  current_list_price?: number | null;
  primary_photo?: string | null;
  motivation_score?: number | null;
  raw_data?: any;
  watchlist_name?: string;
}

interface Watchlist {
  id: number;
  name: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [watchlistFilter, setWatchlistFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [bedsMin, setBedsMin] = useState<string>('');
  const [bathsMin, setBathsMin] = useState<string>('');
  const [scoreMin, setScoreMin] = useState<string>('');
  const [scoreMax, setScoreMax] = useState<string>('');

  // Sort states
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('DESC');

  // Comparison states
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

  // Fetch watchlists for filter dropdown
  useEffect(() => {
    async function fetchWatchlists() {
      try {
        const response = await fetch('/api/watchlists');
        const data = await response.json();
        if (data.success) {
          setWatchlists(data.watchlists);
        }
      } catch (error) {
        console.error('Error fetching watchlists:', error);
      }
    }
    fetchWatchlists();
  }, []);

  // Fetch properties with filters
  useEffect(() => {
    async function fetchProperties() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (watchlistFilter) params.append('watchlist_id', watchlistFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (priceMin) params.append('price_min', priceMin);
        if (priceMax) params.append('price_max', priceMax);
        if (bedsMin) params.append('beds_min', bedsMin);
        if (bathsMin) params.append('baths_min', bathsMin);
        if (scoreMin) params.append('score_min', scoreMin);
        if (scoreMax) params.append('score_max', scoreMax);
        params.append('sort_by', sortBy);
        params.append('sort_order', sortOrder);

        const response = await fetch(`/api/properties?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setProperties(data.properties);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperties();
  }, [watchlistFilter, statusFilter, priceMin, priceMax, bedsMin, bathsMin, scoreMin, scoreMax, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setWatchlistFilter('');
    setStatusFilter('');
    setPriceMin('');
    setPriceMax('');
    setBedsMin('');
    setBathsMin('');
    setScoreMin('');
    setScoreMax('');
    setSortBy('created_at');
    setSortOrder('DESC');
  };

  const toggleCompareSelection = (propertyId: number) => {
    setSelectedForCompare(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else if (prev.length < 3) {
        return [...prev, propertyId];
      } else {
        alert('Maximum 3 properties can be compared');
        return prev;
      }
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length < 2) {
      alert('Please select at least 2 properties to compare');
      return;
    }
    window.location.href = `/compare?ids=${selectedForCompare.join(',')}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-2">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton watchlistId={watchlistFilter ? parseInt(watchlistFilter) : undefined} />
          {selectedForCompare.length >= 2 && (
            <button
              onClick={handleCompare}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Compare ({selectedForCompare.length})
            </button>
          )}
        </div>
      </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters & Sort</h2>
            <button
              onClick={handleResetFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Watchlist Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Watchlist
              </label>
              <select
                value={watchlistFilter}
                onChange={(e) => setWatchlistFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Watchlists</option>
                {watchlists.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="off_market">Off Market</option>
                <option value="for_sale">For Sale</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Price Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Price Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Beds Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Beds
              </label>
              <select
                value={bedsMin}
                onChange={(e) => setBedsMin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Baths Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Baths
              </label>
              <select
                value={bathsMin}
                onChange={(e) => setBathsMin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            {/* Motivation Score Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Motivation Score
              </label>
              <input
                type="number"
                value={scoreMin}
                onChange={(e) => setScoreMin(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Motivation Score Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Motivation Score
              </label>
              <input
                type="number"
                value={scoreMax}
                onChange={(e) => setScoreMax(e.target.value)}
                placeholder="100"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="created_at">Date Added</option>
                <option value="current_list_price">Price</option>
                <option value="motivation_score">Motivation Score</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="DESC">High to Low</option>
                <option value="ASC">Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <>
            {/* Properties Grid */}
            {properties.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No properties found
                </h3>
                <p className="mt-2 text-gray-600">
                  Try adjusting your filters or scan your watchlists to find properties
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="relative">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(property.id)}
                      onChange={() => toggleCompareSelection(property.id)}
                      className="absolute top-4 left-4 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded z-10 cursor-pointer"
                      title="Select for comparison"
                    />
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}

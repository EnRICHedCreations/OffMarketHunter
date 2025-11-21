'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const watchlistSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  price_min: z.string().optional(),
  price_max: z.string().optional(),
  beds_min: z.string().optional(),
  beds_max: z.string().optional(),
  baths_min: z.string().optional(),
  baths_max: z.string().optional(),
  sqft_min: z.string().optional(),
  sqft_max: z.string().optional(),
  lot_sqft_min: z.string().optional(),
  lot_sqft_max: z.string().optional(),
  year_built_min: z.string().optional(),
  year_built_max: z.string().optional(),
  property_types: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  track_off_market: z.boolean(),
  track_price_reductions: z.boolean(),
  track_expired: z.boolean(),
  alert_threshold: z.string(),
});

type WatchlistFormData = z.infer<typeof watchlistSchema>;

const propertyTypeOptions = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
];

const tagOptions = [
  { value: 'fixer_upper', label: 'Fixer Upper' },
  { value: 'foreclosure', label: 'Foreclosure' },
  { value: 'short_sale', label: 'Short Sale' },
  { value: 'cash_only', label: 'Cash Only' },
  { value: 'seller_financing', label: 'Seller Financing' },
  { value: 'needs_work', label: 'Needs Work' },
  { value: 'turnkey', label: 'Turnkey' },
  { value: 'investment', label: 'Investment Property' },
];

export default function NewWatchlistPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WatchlistFormData>({
    resolver: zodResolver(watchlistSchema),
    defaultValues: {
      track_off_market: true,
      track_price_reductions: true,
      track_expired: true,
      alert_threshold: '80',
    },
  });

  const handleTypeToggle = (value: string) => {
    setSelectedTypes(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handleTagToggle = (value: string) => {
    setSelectedTags(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const onSubmit = async (data: WatchlistFormData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...data,
        price_min: data.price_min ? parseInt(data.price_min) : null,
        price_max: data.price_max ? parseInt(data.price_max) : null,
        beds_min: data.beds_min ? parseInt(data.beds_min) : null,
        beds_max: data.beds_max ? parseInt(data.beds_max) : null,
        baths_min: data.baths_min ? parseFloat(data.baths_min) : null,
        baths_max: data.baths_max ? parseFloat(data.baths_max) : null,
        sqft_min: data.sqft_min ? parseInt(data.sqft_min) : null,
        sqft_max: data.sqft_max ? parseInt(data.sqft_max) : null,
        lot_sqft_min: data.lot_sqft_min ? parseInt(data.lot_sqft_min) : null,
        lot_sqft_max: data.lot_sqft_max ? parseInt(data.lot_sqft_max) : null,
        year_built_min: data.year_built_min ? parseInt(data.year_built_min) : null,
        year_built_max: data.year_built_max ? parseInt(data.year_built_max) : null,
        property_types: selectedTypes.length > 0 ? selectedTypes : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        alert_threshold: parseInt(data.alert_threshold),
      };

      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create watchlist');
        setLoading(false);
        return;
      }

      router.push('/watchlists');
      router.refresh();
    } catch (err) {
      setError('Failed to create watchlist. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Watchlist</h1>
        <p className="mt-2 text-gray-600">
          Set up a new watchlist to track properties in your target area
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Watchlist Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Phoenix Distressed Properties"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                {...register('location')}
                type="text"
                id="location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Phoenix, AZ"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="price_min" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Price
              </label>
              <input
                {...register('price_min')}
                type="number"
                id="price_min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="100000"
              />
            </div>

            <div>
              <label htmlFor="price_max" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Price
              </label>
              <input
                {...register('price_max')}
                type="number"
                id="price_max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="500000"
              />
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="beds_min" className="block text-sm font-medium text-gray-700 mb-2">
                Min Beds
              </label>
              <input
                {...register('beds_min')}
                type="number"
                id="beds_min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="2"
              />
            </div>

            <div>
              <label htmlFor="beds_max" className="block text-sm font-medium text-gray-700 mb-2">
                Max Beds
              </label>
              <input
                {...register('beds_max')}
                type="number"
                id="beds_max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="5"
              />
            </div>

            <div>
              <label htmlFor="baths_min" className="block text-sm font-medium text-gray-700 mb-2">
                Min Baths
              </label>
              <input
                {...register('baths_min')}
                type="number"
                step="0.5"
                id="baths_min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1.5"
              />
            </div>

            <div>
              <label htmlFor="baths_max" className="block text-sm font-medium text-gray-700 mb-2">
                Max Baths
              </label>
              <input
                {...register('baths_max')}
                type="number"
                step="0.5"
                id="baths_max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="3.5"
              />
            </div>

            <div>
              <label htmlFor="sqft_min" className="block text-sm font-medium text-gray-700 mb-2">
                Min Sqft
              </label>
              <input
                {...register('sqft_min')}
                type="number"
                id="sqft_min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1000"
              />
            </div>

            <div>
              <label htmlFor="sqft_max" className="block text-sm font-medium text-gray-700 mb-2">
                Max Sqft
              </label>
              <input
                {...register('sqft_max')}
                type="number"
                id="sqft_max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="3000"
              />
            </div>

            <div>
              <label htmlFor="lot_sqft_min" className="block text-sm font-medium text-gray-700 mb-2">
                Min Lot Sqft
              </label>
              <input
                {...register('lot_sqft_min')}
                type="number"
                id="lot_sqft_min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="5000"
              />
            </div>

            <div>
              <label htmlFor="lot_sqft_max" className="block text-sm font-medium text-gray-700 mb-2">
                Max Lot Sqft
              </label>
              <input
                {...register('lot_sqft_max')}
                type="number"
                id="lot_sqft_max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="20000"
              />
            </div>

            <div>
              <label htmlFor="year_built_min" className="block text-sm font-medium text-gray-700 mb-2">
                Min Year Built
              </label>
              <input
                {...register('year_built_min')}
                type="number"
                id="year_built_min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1980"
              />
            </div>

            <div>
              <label htmlFor="year_built_max" className="block text-sm font-medium text-gray-700 mb-2">
                Max Year Built
              </label>
              <input
                {...register('year_built_max')}
                type="number"
                id="year_built_max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="2020"
              />
            </div>
          </div>
        </div>

        {/* Property Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Types</h3>
          <div className="flex flex-wrap gap-3">
            {propertyTypeOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeToggle(type.value)}
                className={`px-4 py-2 rounded-lg border-2 transition ${
                  selectedTypes.includes(type.value)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Tags/Keywords */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Tags/Keywords</h3>
          <p className="text-sm text-gray-600 mb-3">Filter properties by specific tags or characteristics</p>
          <div className="flex flex-wrap gap-3">
            {tagOptions.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => handleTagToggle(tag.value)}
                className={`px-4 py-2 rounded-lg border-2 transition ${
                  selectedTags.includes(tag.value)
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monitoring Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Options</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                {...register('track_off_market')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">Track off-market properties</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('track_price_reductions')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">Track price reductions</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('track_expired')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">Track expired listings</span>
            </label>
          </div>
        </div>

        {/* Alert Threshold */}
        <div>
          <label htmlFor="alert_threshold" className="block text-sm font-medium text-gray-700 mb-2">
            Alert Threshold (Motivation Score)
          </label>
          <input
            {...register('alert_threshold')}
            type="number"
            id="alert_threshold"
            min="50"
            max="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Get alerts when properties score above this threshold (50-100)
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Watchlist'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/watchlists')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

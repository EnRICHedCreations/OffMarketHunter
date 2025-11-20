'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WatchlistCardProps {
  watchlist: {
    id: number;
    name: string;
    location: string;
    price_min: number | null;
    price_max: number | null;
    beds_min: number | null;
    beds_max: number | null;
    is_active: boolean;
    property_count?: number;
    track_off_market: boolean;
    track_price_reductions: boolean;
    track_expired: boolean;
  };
}

export default function WatchlistCard({ watchlist }: WatchlistCardProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(watchlist.is_active);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleToggleActive = async () => {
    try {
      const response = await fetch(`/api/watchlists/${watchlist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        setIsActive(!isActive);
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/watchlists/${watchlist.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      setIsDeleting(false);
    }
  };

  const handleScanNow = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      // Step 1: Call Python API to scrape properties
      const scrapeResponse = await fetch(`/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'off_market',
          criteria: {
            location: watchlist.location,
            price_min: watchlist.price_min,
            price_max: watchlist.price_max,
            beds_min: watchlist.beds_min,
            beds_max: watchlist.beds_max,
          },
        }),
      });

      const scrapeResult = await scrapeResponse.json();

      if (!scrapeResponse.ok || !scrapeResult.success) {
        setScanMessage(scrapeResult.error || 'Failed to scan');
        return;
      }

      // Step 2: Save scraped properties to database
      if (scrapeResult.properties && scrapeResult.properties.length > 0) {
        const storeResponse = await fetch('/api/properties/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            watchlist_id: watchlist.id,
            properties: scrapeResult.properties,
          }),
        });

        const storeResult = await storeResponse.json();

        if (storeResponse.ok && storeResult.success) {
          setScanMessage(
            `Saved ${storeResult.new_count} new, updated ${storeResult.updated_count} existing properties`
          );
        } else {
          setScanMessage(
            `Found ${scrapeResult.count} properties but failed to save: ${storeResult.error}`
          );
        }
      } else {
        setScanMessage('No properties found');
      }

      // Refresh after 3 seconds
      setTimeout(() => {
        router.refresh();
        setScanMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error scanning watchlist:', error);
      setScanMessage('Failed to scan properties');
    } finally {
      setIsScanning(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border-2 ${isActive ? 'border-transparent' : 'border-gray-300'} hover:shadow-md transition`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {watchlist.name}
                </h3>
                {!isActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {watchlist.location}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {(watchlist.price_min || watchlist.price_max) && (
              <div className="text-sm">
                <span className="text-gray-500">Price:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {watchlist.price_min ? formatPrice(watchlist.price_min) : 'Any'} - {watchlist.price_max ? formatPrice(watchlist.price_max) : 'Any'}
                </span>
              </div>
            )}

            {(watchlist.beds_min || watchlist.beds_max) && (
              <div className="text-sm">
                <span className="text-gray-500">Beds:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {watchlist.beds_min || 'Any'} - {watchlist.beds_max || 'Any'}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {watchlist.track_off_market && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Off-Market
                </span>
              )}
              {watchlist.track_price_reductions && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Price Cuts
                </span>
              )}
              {watchlist.track_expired && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Expired
                </span>
              )}
            </div>
          </div>

          {scanMessage && (
            <div className={`mt-4 px-3 py-2 rounded text-sm ${
              scanMessage.includes('Failed') || scanMessage.includes('error')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}>
              {scanMessage}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{watchlist.property_count || 0}</span> properties
              </div>
              <button
                onClick={handleScanNow}
                disabled={isScanning || !isActive}
                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleActive}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  isActive
                    ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                }`}
              >
                {isActive ? 'Pause' : 'Activate'}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Watchlist?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{watchlist.name}"? This will also delete all associated properties and alerts. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

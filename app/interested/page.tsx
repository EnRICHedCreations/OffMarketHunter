'use client';

import { useEffect, useState } from 'react';
import PropertyCard from '@/components/PropertyCard';
import ExportButton from '@/components/ExportButton';
import Link from 'next/link';

interface Property {
  id: number;
  property_id: string;
  full_street_line: string;
  city: string;
  state: string;
  zip_code: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  current_status: string;
  current_list_price: number | null;
  primary_photo: string | null;
  motivation_score: number | null;
  watchlist_name: string;
  marked_at: string;
}

export default function InterestedPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterestedProperties();
  }, []);

  const fetchInterestedProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/interested');
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties);
      } else {
        setError(data.error || 'Failed to load interested properties');
      }
    } catch (err) {
      console.error('Error fetching interested properties:', err);
      setError('Failed to load interested properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveInterest = async (propertyId: number) => {
    try {
      const response = await fetch('/api/properties/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          interested: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        fetchInterestedProperties();
      } else {
        alert(data.error || 'Failed to remove interest');
      }
    } catch (err) {
      console.error('Error removing interest:', err);
      alert('Failed to remove interest');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interested Properties</h1>
          <p className="text-gray-600 mt-2">
            Properties you've marked as interested
          </p>
        </div>
        <ExportButton interested={true} />
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Interested Properties</h3>
            <p className="text-gray-600 mb-6">
              You haven't marked any properties as interested yet.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            Showing {properties.length} interested {properties.length === 1 ? 'property' : 'properties'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="relative">
                <PropertyCard property={property} />
                <button
                  onClick={() => handleRemoveInterest(property.id)}
                  className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition z-10"
                  title="Remove from interested"
                >
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

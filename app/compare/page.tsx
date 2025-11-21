'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: number;
  full_street_line: string;
  city: string;
  state: string;
  zip_code: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_sqft: number | null;
  year_built: number | null;
  property_type: string | null;
  current_status: string;
  current_list_price: number | null;
  original_list_price: number | null;
  price_reduction_count: number;
  total_price_reduction_amount: number | null;
  total_days_on_market: number | null;
  motivation_score: number | null;
  motivation_score_dom: number | null;
  motivation_score_reductions: number | null;
  motivation_score_off_market: number | null;
  motivation_score_status: number | null;
  motivation_score_market: number | null;
  primary_photo: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  watchlist_name: string;
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      fetchProperties(ids);
    } else {
      setIsLoading(false);
      setError('No properties selected for comparison');
    }
  }, [searchParams]);

  const fetchProperties = async (ids: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/compare?ids=${ids}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties);
      } else {
        setError(data.error || 'Failed to load properties');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const getMotivationBadgeColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-red-100 text-red-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Properties
        </Link>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-gray-600 mb-4">No properties to compare</p>
        <Link
          href="/properties"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Comparison</h1>
          <p className="text-gray-600 mt-2">
            Comparing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to Properties
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Feature
              </th>
              {properties.map((property) => (
                <th key={property.id} className="px-6 py-3 text-center min-w-[250px]">
                  <Link
                    href={`/properties/${property.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {property.full_street_line}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Photos */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Photo
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4">
                  {property.primary_photo ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={property.primary_photo}
                        alt={property.full_street_line}
                        fill
                        className="object-cover rounded-lg"
                        sizes="300px"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No photo</span>
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Location */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                Location
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.city}, {property.state} {property.zip_code}
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Current Price
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-lg font-bold text-indigo-600 text-center">
                  {formatPrice(property.current_list_price)}
                </td>
              ))}
            </tr>

            {/* Motivation Score */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                Motivation Score
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMotivationBadgeColor(property.motivation_score)}`}>
                    {property.motivation_score ? Math.round(property.motivation_score) : 'N/A'}
                  </span>
                </td>
              ))}
            </tr>

            {/* Status */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Status
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.current_status}
                </td>
              ))}
            </tr>

            {/* Beds */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                Bedrooms
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.beds || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Baths */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Bathrooms
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.baths || 'N/A'}
                </td>
              ))}
            </tr>

            {/* SqFt */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                Square Feet
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {formatNumber(property.sqft)}
                </td>
              ))}
            </tr>

            {/* Lot Size */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Lot Size
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {formatNumber(property.lot_sqft)} sqft
                </td>
              ))}
            </tr>

            {/* Year Built */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                Year Built
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.year_built || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Property Type */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Property Type
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.property_type || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Price Reductions */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                Price Reductions
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.price_reduction_count > 0 ? (
                    <div>
                      <div className="font-medium">{property.price_reduction_count} times</div>
                      <div className="text-xs text-gray-500">
                        {formatPrice(property.total_price_reduction_amount)} total
                      </div>
                    </div>
                  ) : (
                    'None'
                  )}
                </td>
              ))}
            </tr>

            {/* Days on Market */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Days on Market
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.total_days_on_market || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Agent */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                Agent
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.agent_name ? (
                    <div>
                      <div>{property.agent_name}</div>
                      {property.agent_phone && (
                        <a href={`tel:${property.agent_phone}`} className="text-indigo-600 hover:text-indigo-800 text-xs">
                          {property.agent_phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
              ))}
            </tr>

            {/* Watchlist */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                Watchlist
              </td>
              {properties.map((property) => (
                <td key={property.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                  {property.watchlist_name}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}

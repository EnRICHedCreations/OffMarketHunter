'use client';

import Link from 'next/link';
import Image from 'next/image';

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
  raw_data?: {
    days_on_market?: number;
  };
}

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('off') || statusLower.includes('withdrawn')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (statusLower.includes('expired')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (statusLower.includes('pending')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (statusLower.includes('sale')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getMotivationBadgeColor = (score: number | null | undefined) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-red-100 text-red-800';
    if (score >= 80) return 'bg-orange-100 text-orange-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 60) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const daysOnMarket = property.raw_data?.days_on_market;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
      {/* Property Photo */}
      <div className="relative h-48 bg-gray-200">
        {property.primary_photo ? (
          <Image
            src={property.primary_photo}
            alt={property.full_street_line}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(property.current_status)}`}>
            {property.current_status}
          </span>
        </div>

        {/* Motivation Score Badge (placeholder for Phase 6) */}
        {property.motivation_score && (
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getMotivationBadgeColor(property.motivation_score)}`}>
              Score: {property.motivation_score}
            </span>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Address */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {property.full_street_line}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {property.city}, {property.state} {property.zip_code}
        </p>

        {/* Price */}
        <div className="mb-3">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(property.current_list_price)}
          </span>
        </div>

        {/* Property Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {property.beds !== null && property.beds !== undefined && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {property.beds} bd
            </div>
          )}
          {property.baths !== null && property.baths !== undefined && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {property.baths} ba
            </div>
          )}
          {property.sqft !== null && property.sqft !== undefined && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {property.sqft.toLocaleString()} sqft
            </div>
          )}
        </div>

        {/* Days on Market */}
        {daysOnMarket !== null && daysOnMarket !== undefined && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-medium">Days on Market:</span> {daysOnMarket}
          </div>
        )}

        {/* View Details Button */}
        <Link
          href={`/properties/${property.id}`}
          className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

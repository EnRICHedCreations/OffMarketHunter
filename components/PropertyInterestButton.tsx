'use client';

import { useState, useEffect } from 'react';

interface PropertyInterestButtonProps {
  propertyId: number;
}

export default function PropertyInterestButton({ propertyId }: PropertyInterestButtonProps) {
  const [interested, setInterested] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkInterest();
  }, [propertyId]);

  const checkInterest = async () => {
    try {
      const response = await fetch(`/api/properties/interest?property_id=${propertyId}`);
      const data = await response.json();

      if (data.success) {
        setInterested(data.interested);
      }
    } catch (error) {
      console.error('Error checking interest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/properties/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          interested: !interested,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInterested(data.interested);
      } else {
        alert(data.error || 'Failed to update interest');
      }
    } catch (error) {
      console.error('Error updating interest:', error);
      alert('Failed to update interest');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleInterest}
      disabled={isSaving}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
        interested
          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      } disabled:opacity-50`}
    >
      {interested ? (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          {isSaving ? 'Removing...' : 'Remove Interest'}
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {isSaving ? 'Saving...' : 'Mark as Interested'}
        </>
      )}
    </button>
  );
}

'use client';

import { StarRating } from './StarRating';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string | null;
  };
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onEdit?: (review: Review) => void;
}

export function ReviewCard({ review, currentUserId, onEdit }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isEdited = review.updatedAt && review.updatedAt !== review.createdAt;
  const isOwner = currentUserId && currentUserId === review.user.id;

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {review.user.name || 'Anonymous'}
            </span>
            {review.isVerified && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
            {isEdited && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}
          </div>
        </div>
        {isOwner && onEdit && (
          <button
            onClick={() => onEdit(review)}
            className="text-sm font-medium px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            Edit Review
          </button>
        )}
      </div>
      {review.title && (
        <h4 className="font-medium text-gray-900 mt-3">{review.title}</h4>
      )}
      <p className="mt-2 text-gray-600">{review.content}</p>
    </div>
  );
}

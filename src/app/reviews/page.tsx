'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/store/language';
import Link from 'next/link';
import Image from 'next/image';
import { StarRating } from '@/components/StarRating';

interface UserReview {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isVerified: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
  };
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useLanguage((state) => state.t);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/me/reviews?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const locale = useLanguage.getState().language === "ar" ? "ar-SA" : "en-US";
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("review.myReviews")}</h1>
        <Link
          href="/profile"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("review.backToProfile")}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t("review.noReviews")}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t("review.writeFirst")}</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
          >
            {t("review.browseProducts")}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t("product.results")}: {total}
          </p>
          
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex gap-6">
                  <Link href={`/product/${review.product.id}`} className="flex-shrink-0">
                    <Image
                      src={failedImages.has(review.product.id) ? "https://via.placeholder.com/120x120?text=N/A" : review.product.image}
                      alt={review.product.name}
                      width={120}
                      height={120}
                      className="rounded-xl object-cover hover:opacity-80 transition-opacity"
                      onError={() => {
                        setFailedImages((prev) => new Set(prev).add(review.product.id));
                      }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={`/product/${review.product.id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                          {review.product.name}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ${review.product.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <StarRating rating={review.rating} size="md" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                          {review.isVerified && (
                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 rounded-full">
                              {t("review.verifiedPurchase")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/product/${review.product.id}`}
                        className="flex-shrink-0 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
                      >
                        {t("review.viewProduct")}
                      </Link>
                    </div>
                    {review.title && (
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-4">{review.title}</h3>
                    )}
                    <p className="text-gray-600 dark:text-gray-300 mt-2">{review.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("pagination.previous")}
              </button>
              <span className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("pagination.next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

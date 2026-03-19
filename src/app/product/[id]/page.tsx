"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { Product } from "@/types";
import Link from "next/link";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string | null;
  user: { id: string; name: string | null };
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export default function ProductPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const addToCart = useCartStore((state) => state.addToCart);

  const currentUserId = (session?.user as { id?: string })?.id;

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const productRes = await fetch(`/api/products/${params.id}`);
        if (!productRes.ok)
          throw new Error(
            `Failed to fetch product: ${productRes.status} ${productRes.statusText}`,
          );
        const productData = await productRes.json();

        const [reviewsRes, relatedRes] = await Promise.all([
          fetch(`/api/products/${params.id}/reviews`),
          productData.category
            ? fetch(`/api/products?category=${encodeURIComponent(productData.category)}&limit=20`)
            : Promise.resolve(null),
        ]);

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
          setReviewSummary(reviewsData.summary);
        }

        let related: Product[] = [];
        if (relatedRes?.ok) {
          const productsData = await relatedRes.json();
          related = (productsData.products || [])
            .filter(
              (p: Product) =>
                p.category === productData.category &&
                p.id !== productData.id,
            )
            .slice(0, 4);
        }

        setProduct(productData);
        setRelatedProducts(related);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const handleAddToCart = (p: Product) => {
    addToCart(p);
  };

  const handleReviewSubmit = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    fetch(`/api/products/${params.id}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setReviewSummary(data.summary);
      });
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link href="/" className="text-indigo-600 hover:underline mt-4 inline-block">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Back to products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/600x600?text=No+Image";
            }}
          />
        </div>

        <div>
          <span className="text-sm text-indigo-600 font-medium uppercase">
            {product.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {product.name}
          </h1>
          
          {reviewSummary && reviewSummary.totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={reviewSummary.averageRating} />
              <span className="text-sm text-gray-600">
                {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews} reviews)
              </span>
            </div>
          )}

          <p className="text-3xl font-bold text-gray-900 mt-4">
            {product && typeof product.price === "number" && !isNaN(product.price)
              ? `$${product.price.toFixed(2)}`
              : "—"}
          </p>
          <p className="text-gray-600 mt-6 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6">
            {product.stock > 0 ? (
              <p className="text-green-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {product.stock} in stock
              </p>
            ) : (
              <p className="text-red-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Out of stock
              </p>
            )}
          </div>

          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.stock <= 0}
            className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>

      <div className="border-t pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Reviews ({reviewSummary?.totalReviews || 0})
          </h2>
          {session && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Write a Review
            </button>
          )}
        </div>

        {reviewSummary && reviewSummary.totalReviews > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {reviewSummary.averageRating.toFixed(1)}
                </p>
                <StarRating rating={reviewSummary.averageRating} size="lg" />
                <p className="text-sm text-gray-600 mt-1">
                  {reviewSummary.totalReviews} reviews
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewSummary.distribution[star] || 0;
                  const percentage = reviewSummary.totalReviews > 0 
                    ? (count / reviewSummary.totalReviews) * 100 
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm w-8">{star} star</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-10">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showReviewForm && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingReview ? 'Edit Your Review' : 'Write Your Review'}
            </h3>
            <ReviewForm 
              productId={product.id} 
              editingReview={editingReview}
              onSubmit={handleReviewSubmit}
              onCancel={() => {
                setShowReviewForm(false);
                setEditingReview(null);
              }}
            />
          </div>
        )}

        {reviews.length === 0 && !showReviewForm ? (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. {session ? 'Be the first to review!' : <Link href="/login" className="text-indigo-600">Login to write a review</Link>}
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review}
                currentUserId={currentUserId}
                onEdit={handleEditReview}
              />
            ))}
          </div>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((related) => (
              <Link
                key={related.id}
                href={`/product/${related.id}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Image
                    src={related.image}
                    alt={related.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/400x400?text=No+Image";
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {related.name}
                  </h3>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {typeof related.price === "number" && !isNaN(related.price)
                      ? `$${related.price.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

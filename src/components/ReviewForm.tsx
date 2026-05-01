"use client";

import { useState, useEffect } from "react";
import { StarRating } from "./StarRating";
import { useTranslations } from "next-intl";

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

interface ReviewFormProps {
  productId: string;
  editingReview?: Review | null;
  onSubmit: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  productId,
  editingReview,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const t = useTranslations();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setTitle(editingReview.title || "");
      setContent(editingReview.content);
    } else {
      setRating(0);
      setTitle("");
      setContent("");
    }
  }, [editingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError(t("review.selectRating"));
      return;
    }

    if (content.trim().length < 10) {
      setError(t("review.minLength"));
      return;
    }

    setLoading(true);
    try {
      const url = `/api/products/${productId}/reviews`;
      const method = editingReview ? "PUT" : "POST";
      const body = editingReview
        ? { reviewId: editingReview.id, rating, title, content }
        : { rating, title, content };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("review.failedToSubmit"));
      }

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("review.failedToSubmit"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="review-rating"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {t("review.yourRating")}
        </label>
        <StarRating
          id="review-rating"
          rating={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
      </div>

      <div>
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {t("review.reviewTitleOptional")}
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder={t("review.summarizeExperience")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {t("review.yourReview")}
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t("review.shareExperience")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t("review.characters", { count: content.trim().length })}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading
            ? t("review.saving")
            : editingReview
              ? t("review.saveChanges")
              : t("review.submitReview")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}

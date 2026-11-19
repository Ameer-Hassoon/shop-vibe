"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import { useTranslations } from "next-intl";
import { Button, Field, Input, Textarea } from "@/components/ui";

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
  const [rating, setRating] = useState(editingReview?.rating ?? 0);
  const [title, setTitle] = useState(editingReview?.title ?? "");
  const [content, setContent] = useState(editingReview?.content ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset the fields while rendering when a different review is being edited
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [shownReview, setShownReview] = useState(editingReview);
  if (shownReview !== editingReview) {
    setShownReview(editingReview);
    setRating(editingReview?.rating ?? 0);
    setTitle(editingReview?.title ?? "");
    setContent(editingReview?.content ?? "");
  }

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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-rating" className="text-sm font-medium">
          {t("review.yourRating")}
        </label>
        <StarRating id="review-rating" rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <Field label={t("review.reviewTitleOptional")}>
        {(props) => (
          <Input
            {...props}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder={t("review.summarizeExperience")}
          />
        )}
      </Field>

      <Field label={t("review.yourReview")} hint={t("review.characters", { count: content.trim().length })}>
        {(props) => (
          <Textarea
            {...props}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={t("review.shareExperience")}
          />
        )}
      </Field>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={loading}>
          {loading ? t("review.saving") : editingReview ? t("review.saveChanges") : t("review.submitReview")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}

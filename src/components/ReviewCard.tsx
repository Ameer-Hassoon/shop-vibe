'use client';

import { useLocale, useTranslations } from "next-intl";
import { StarRating } from './StarRating';
import { Badge, Button } from '@/components/ui';
import { formatDate } from '@/lib/format';

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
  const t = useTranslations();
  const locale = useLocale();

  const isEdited = review.updatedAt && review.updatedAt !== review.createdAt;
  const isOwner = currentUserId && currentUserId === review.user.id;
  const name = review.user.name || t("review.anonymous");

  return (
    <article className="py-6 first:pt-0">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{name}</span>
            {review.isVerified && <Badge tone="success">{t("review.verifiedPurchase")}</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm text-muted">{formatDate(review.createdAt, locale)}</span>
            {isEdited && <span className="text-xs italic text-subtle">{t("review.edited")}</span>}
          </div>
        </div>
        {isOwner && onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(review)}>
            {t("review.editReview")}
          </Button>
        )}
      </div>
      {review.title && <h4 className="mt-3 font-semibold">{review.title}</h4>}
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">{review.content}</p>
    </article>
  );
}

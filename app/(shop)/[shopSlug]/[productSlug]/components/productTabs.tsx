// app/(shop)/[shopSlug]/[productSlug]/components/productTabs.tsx
"use client";

import { useState } from "react";
import {
  Star,
  StarHalf,
  User,
  ShieldCheck,
  MessageSquare,
  X,
} from "lucide-react";
import { useAuth } from "@/context/authcontext";
import { useToast } from "@/context/toastContext";
import Button from "@/app/components/ui/button";

interface Review {
  review_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_owner_reply: boolean;
  replies: Omit<Review, "replies">[];
}

interface Props {
  attributes: Record<string, any>;
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
  secondaryColor: string;
  productId: number;
  shopSlug: string;
  productSlug: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const StarRating = ({
  rating,
  size = 16,
  color = "#000",
  interactive = false,
  onRatingChange,
}: {
  rating: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  if (!interactive) {
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={size} fill={color} stroke={color} />
        ))}
        {hasHalf && <StarHalf size={size} fill={color} stroke={color} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={size} stroke={color} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange?.(star)}
          className="focus:outline-none"
        >
          <Star
            size={size}
            fill={star <= rating ? color : "none"}
            stroke={color}
            className={star <= rating ? "fill-current" : ""}
          />
        </button>
      ))}
    </div>
  );
};

const RatingDistribution = ({
  reviews,
  secondaryColor,
}: {
  reviews: Review[];
  secondaryColor: string;
}) => {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((rev) => {
    if (rev.rating >= 1 && rev.rating <= 5) counts[rev.rating - 1]++;
  });
  const total = reviews.length;

  return (
    <div className="space-y-2 mt-4">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = counts[stars - 1];
        const percent = total ? (count / total) * 100 : 0;
        return (
          <div key={stars} className="flex items-center gap-2 text-sm">
            <div className="w-8 text-gray-600">{stars} ★</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percent}%`,
                  backgroundColor: secondaryColor,
                }}
              />
            </div>
            <div className="w-8 text-gray-500 text-right">{count}</div>
          </div>
        );
      })}
    </div>
  );
};

// ReviewModal moved outside ProductTabs
const ReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  rating,
  setRating,
  comment,
  setComment,
  submitting,
  secondaryColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  submitting: boolean;
  secondaryColor: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <StarRating
              rating={rating}
              size={28}
              color={secondaryColor}
              interactive
              onRatingChange={setRating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              rows={4}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition"
              placeholder="What did you think about this product?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProductTabs({
  attributes,
  reviews,
  avgRating,
  totalReviews,
  secondaryColor,
  productId,
  shopSlug,
  productSlug,
}: Props) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"additional" | "reviews">(
    "reviews"
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyComment, setReplyComment] = useState("");
  const [replying, setReplying] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Please log in to leave a review", "error");
      return;
    }
    if (!newReviewRating) {
      showToast("Please select a rating", "error");
      return;
    }
    if (!newReviewComment.trim()) {
      showToast("Please enter a comment", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/shops/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "addReview",
          productId,
          rating: newReviewRating,
          comment: newReviewComment.trim(),
          shopSlug,
          productSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Review submitted!", "success");
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || "Error submitting review", "error");
    } finally {
      setSubmitting(false);
      setNewReviewRating(0);
      setNewReviewComment("");
      setShowReviewModal(false);
    }
  };

  const handleReply = async (parentReviewId: number) => {
    if (!replyComment.trim()) {
      showToast("Please enter a reply", "error");
      return;
    }

    setReplying(true);
    try {
      const res = await fetch("/api/shops/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "replyToReview",
          productId,
          parentReviewId,
          comment: replyComment.trim(),
          shopSlug,
          productSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Reply posted", "success");
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || "Error replying", "error");
    } finally {
      setReplying(false);
      setReplyingTo(null);
      setReplyComment("");
    }
  };

  return (
    <div className="mt-10">
      {/* Tabs */}
      <div className="flex gap-8 border-b mb-8">
        {["reviews", "additional"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "border-b-2 text-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
            style={
              activeTab === tab ? { borderBottomColor: secondaryColor } : {}
            }
          >
            {tab === "reviews"
              ? `Reviews (${totalReviews})`
              : "Additional Information"}
          </button>
        ))}
      </div>

      {/* REVIEWS SECTION */}
      {activeTab === "reviews" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Summary Header */}
          <div className="p-6 border-b bg-gray-50/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Left: Average + Stars */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center mt-1">
                    <StarRating
                      rating={avgRating}
                      size={16}
                      color={secondaryColor}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {totalReviews} reviews
                  </div>
                </div>

                {/* Rating Distribution Bars */}
                <div className="flex-1 md:min-w-[20vw] space-y-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(
                      (r) => r.rating === stars
                    ).length;
                    const percent = totalReviews
                      ? (count / totalReviews) * 100
                      : 0;
                    return (
                      <div
                        key={stars}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-5 text-black">{stars}</span>
                        <div className="flex-1 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: secondaryColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Button */}
              <div>
                {isAuthenticated ? (
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full md:w-auto"
                  >
                    Write a Review
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      (window.location.href = `/auth/login?redirect=/${shopSlug}/${productSlug}`)
                    }
                    className="w-full md:w-auto"
                  >
                    Sign in to Review
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="divide-y">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.review_id}
                  className="p-6 hover:bg-gray-50/20 transition"
                >
                  {/* Main Review */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User size={16} className="text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">
                          {review.user_name}
                        </span>
                        {review.is_owner_reply && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck size={10} /> Owner
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      <div className="mt-1">
                        <StarRating
                          rating={review.rating}
                          size={12}
                          color={secondaryColor}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Reply button */}
                      {isAuthenticated && !review.is_owner_reply && (
                        <button
                          onClick={() => setReplyingTo(review.review_id)}
                          className="mt-2 text-xs font-medium hover:underline"
                          style={{ color: secondaryColor }}
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === review.review_id && (
                    <div className="mt-4 ml-14">
                      <textarea
                        rows={2}
                        className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ borderColor: secondaryColor }}
                        placeholder="Write your reply..."
                        value={replyComment}
                        onChange={(e) => setReplyComment(e.target.value)}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyComment("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={replying}
                          onClick={() => handleReply(review.review_id)}
                        >
                          {replying ? "Posting..." : "Post Reply"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {review.replies.length > 0 && (
                    <div className="mt-4 ml-14 space-y-3">
                      {review.replies.map((reply) => (
                        <div key={reply.review_id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User size={12} className="text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-xs">
                                {reply.user_name}
                              </span>
                              {reply.is_owner_reply && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <ShieldCheck size={10} /> Owner
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {reply.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500 text-sm">
                No reviews yet. Be the first to share your experience.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADDITIONAL INFO */}
      {activeTab === "additional" && (
        <div className="border rounded-2xl p-6 bg-white shadow-sm">
          {attributes && Object.keys(attributes).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(attributes).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <span className="text-gray-500 capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium text-gray-900">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No additional information available.
            </p>
          )}
        </div>
      )}

      {/* Review Modal - using the moved component */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        rating={newReviewRating}
        setRating={setNewReviewRating}
        comment={newReviewComment}
        setComment={setNewReviewComment}
        submitting={submitting}
        secondaryColor={secondaryColor}
      />
    </div>
  );
}
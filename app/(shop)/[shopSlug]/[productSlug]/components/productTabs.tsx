'use client';

import { useState } from 'react';
import { Star, StarHalf, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/authcontext';
import { useToast } from '@/context/toastContext';
import Button from '@/app/components/ui/button';

interface Review {
  review_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_owner_reply: boolean;
  replies: Omit<Review, 'replies'>[];
}

interface Props {
  attributes: Record<string, any>;
  reviews: Review[];
  secondaryColor: string;
  productId: number;
  shopSlug: string;
  productSlug: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const StarRating = ({
  rating,
  size = 16,
  color = '#000',
}: {
  rating: number;
  size?: number;
  color?: string;
}) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

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
};

export default function ProductTabs({
  attributes,
  reviews,
  secondaryColor,
  productId,
  shopSlug,
  productSlug,
}: Props) {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'additional' | 'reviews'>('reviews');
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const [replying, setReplying] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please log in to leave a review', 'error');
      return;
    }

    if (!newReviewRating) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (!newReviewComment.trim()) {
      showToast('Please enter a comment', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/shops/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'addReview',
          productId,
          rating: newReviewRating,
          comment: newReviewComment.trim(),
          shopSlug,
          productSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Review submitted!', 'success');
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || 'Error submitting review', 'error');
    } finally {
      setSubmitting(false);
      setNewReviewRating(0);
      setNewReviewComment('');
    }
  };

  const handleReply = async (parentReviewId: number) => {
    if (!replyComment.trim()) {
      showToast('Please enter a reply', 'error');
      return;
    }

    setReplying(true);

    try {
      const res = await fetch('/api/shops/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'replyToReview',
          productId,
          parentReviewId,
          comment: replyComment.trim(),
          shopSlug,
          productSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Reply posted', 'success');
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || 'Error replying', 'error');
    } finally {
      setReplying(false);
      setReplyingTo(null);
      setReplyComment('');
    }
  };

  return (
    <div className=" mx-auto px-4">
      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6">
        {['reviews', 'additional'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'border-b-2 text-black'
                : 'text-gray-500 hover:text-black'
            }`}
            style={
              activeTab === tab ? { borderBottomColor: secondaryColor } : {}
            }
          >
            {tab === 'reviews'
              ? `Reviews (${reviews.length})`
              : 'Additional Info'}
          </button>
        ))}
      </div>

      {/* REVIEWS */}
      {activeTab === 'reviews' && (
        <>
          {/* Review Form */}
          {isAuthenticated ? (
            <div className="bg-white border rounded-2xl p-6 shadow-sm mb-10">
              <h3 className="font-semibold text-lg mb-4">Write a Review</h3>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setNewReviewRating(star)}>
                      <Star
                        size={26}
                        fill={star <= newReviewRating ? secondaryColor : 'none'}
                        stroke={secondaryColor}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2"
                  placeholder="Share your experience..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                />

                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-2xl p-6 text-center mb-10">
              <p className="text-gray-600 mb-3">
                Please log in to leave a review.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = `/auth/login?redirect=/${shopSlug}/${productSlug}`)
                }
              >
                Sign In
              </Button>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 ? (
            <ul className="space-y-6">
              {reviews.map((review) => (
                <li
                  key={review.review_id}
                  className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>

                    <div>
                      <p className="font-medium">{review.user_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(review.created_at)}
                      </p>
                    </div>

                    {review.is_owner_reply && (
                      <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck size={12} /> Admin
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <StarRating rating={review.rating} color={secondaryColor} />
                  </div>

                  <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Reply */}
                  {isAuthenticated && (
                    <div className="mt-4">
                      {replyingTo === review.review_id ? (
                        <div className="bg-gray-50 p-3 rounded-xl border">
                          <textarea
                            rows={2}
                            className="w-full border rounded-lg p-2 text-sm mb-2"
                            placeholder="Write reply..."
                            value={replyComment}
                            onChange={(e) => setReplyComment(e.target.value)}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyComment('');
                              }}
                            >
                              Cancel
                            </Button>

                            <Button
                              disabled={replying}
                              onClick={() => handleReply(review.review_id)}
                            >
                              {replying ? 'Posting...' : 'Reply'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.review_id)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: secondaryColor }}
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  )}

                  {/* Replies */}
                  {review.replies.length > 0 && (
                    <div className="mt-5 pl-4 border-l space-y-3">
                      {review.replies.map((reply) => (
                        <div
                          key={reply.review_id}
                          className="bg-gray-50 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <User size={12} className="text-gray-400" />
                            <span className="font-medium">
                              {reply.user_name}
                            </span>

                            {reply.is_owner_reply && (
                              <span className="text-xs bg-white border px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck size={10} /> Admin
                              </span>
                            )}

                            <span className="text-xs text-gray-500">
                              {formatDate(reply.created_at)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mt-1">
                            {reply.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No reviews yet. Be the first to review.
            </p>
          )}
        </>
      )}

      {/* ADDITIONAL INFO */}
      {activeTab === 'additional' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          {attributes && Object.keys(attributes).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(attributes).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium text-gray-900">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              No additional information available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
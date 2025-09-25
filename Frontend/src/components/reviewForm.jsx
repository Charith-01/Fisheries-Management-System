import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { addOrUpdateReview } from "../api/reviews";

export default function ReviewForm({
  productId,
  orderId,                // NEW: required to tie review to order
  onReviewSaved,
  maxLength = 1000,
  initialRating = 5,
  initialComment = "",
  initialAnonymous = false,
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isAnonymous, setIsAnonymous] = useState(initialAnonymous);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!localStorage.getItem("token");
  const charsLeft = useMemo(
    () => Math.max(0, maxLength - (comment?.length || 0)),
    [comment, maxLength]
  );
  const canSubmit =
    isLoggedIn &&
    !loading &&
    rating >= 1 &&
    rating <= 5 &&
    comment.length <= maxLength &&
    !!orderId; // ensure orderId present

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please log in to write a review.");
      return;
    }
    if (!orderId) {
      toast.error("Missing order reference. Please start from 'Make review' in My Orders.");
      return;
    }
    try {
      setLoading(true);
      await addOrUpdateReview({ productId, orderId, rating, comment, isAnonymous });
      toast.success("Review saved");
      setComment("");
      onReviewSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Your rating:</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={`p-1 rounded transition ${
                n <= rating ? "text-yellow-500" : "text-slate-300"
              } ${loading ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.05]"}`}
              aria-label={`Rate ${n}`}
              title={`Rate ${n}`}
              disabled={loading}
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.801 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.719c-.783-.57-.38-1.81.588-1.81H6.93a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">({rating}/5)</span>
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          disabled={loading}
          className="h-4 w-4 rounded border-slate-300"
        />
        Post anonymously
      </label>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full min-h-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={isLoggedIn ? "Share your experience..." : "Log in to write a review"}
          disabled={!isLoggedIn || loading}
          maxLength={maxLength}
          aria-label="Your review"
        />
        <div className="mt-1 text-xs text-slate-500 text-right">
          {charsLeft} characters left
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Submit Review"}
        </button>
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-slate-500">You must be logged in to post a review.</p>
      )}
    </form>
  );
}

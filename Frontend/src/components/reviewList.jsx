import ReviewStars from "./reviewStars";

export default function ReviewList({ reviews = [], loading = false }) {
  if (loading) {
    return <div className="text-slate-500 text-sm">Loading reviews…</div>;
  }

  if (!reviews || reviews.length === 0) {
    return <div className="text-slate-500 text-sm">No reviews yet. Be the first to review!</div>;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => {
        // Prefer backend-provided displayName; otherwise derive from user or fallback
        const derivedName =
          [r?.user?.firstName, r?.user?.lastName].filter(Boolean).join(" ").trim() ||
          (r?.user?.email ? String(r.user.email).split("@")[0] : "") ||
          (r?.isAnonymous ? "Anonymous" : "Customer");

        const displayName = r?.displayName || derivedName || "Customer";

        return (
          <li key={r._id} className="p-4 rounded-xl ring-1 ring-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-900">{displayName}</div>
              <div className="text-xs text-slate-500">
                {r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
              </div>
            </div>
            <div className="mt-1">
              <ReviewStars value={r?.rating || 0} />
            </div>
            {r?.comment && (
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{r.comment}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

import { useState } from "react";

export default function ProductFilters({
  query, setQuery,
  category, setCategory,
  status, setStatus,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice
}) {
  const CATEGORIES = ["all", "fish", "crab", "shellfish", "prawn", "lobster", "squid", "other"];
  const STATUS = ["all", "active", "inactive"];

  const CategoryButton = ({ c }) => (
    <button
      type="button"
      onClick={() => setCategory(c)}
      className={`block w-full text-left px-4 py-2.5 rounded-xl text-base font-medium transition
        ${category === c
          ? "bg-blue-600 text-white"
          : "text-slate-700 hover:bg-slate-100"}`}
    >
      {c === "all" ? "All Categories" : c}
    </button>
  );

  return (
    <div className="space-y-7 p-4 bg-white rounded-2xl shadow-md border border-slate-200 ml-1">
      <div>
        <label className="block text-base font-semibold text-slate-800 mb-2.5">Search</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <h4 className="text-base font-semibold text-slate-800 mb-2.5">Categories</h4>
        <div className="space-y-1.5">
          {CATEGORIES.map((c) => (
            <CategoryButton key={c} c={c} />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-base font-semibold text-slate-800 mb-2.5">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="text-base font-semibold text-slate-800 mb-2.5">Price Range</h4>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-1/2 rounded-xl border border-slate-300 px-3.5 py-2.5 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-slate-500 text-base">-</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-1/2 rounded-xl border border-slate-300 px-3.5 py-2.5 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

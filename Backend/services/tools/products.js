import Product from "../../models/product.js";
import FishStock from "../../models/fishStock.js";

function norm(s = "") { return String(s).trim().toLowerCase(); }

/** Search products and attach total stock (kg) per product (via FishStock.product ref). */
export async function searchProducts({ query = "", minPrice, maxPrice, limit = 10, page = 1 } = {}) {
  const find = {};
  if (query) {
    const q = new RegExp(query.trim(), "i");
    find.$or = [{ name: q }, { altNames: q }, { description: q }];
  }
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    find.price = {};
    if (Number.isFinite(minPrice)) find.price.$gte = Number(minPrice);
    if (Number.isFinite(maxPrice)) find.price.$lte = Number(maxPrice);
  }

  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const products = await Product.find(find).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const ids = products.map(p => p._id);

  // aggregate stock by linked product
  const stockAgg = await FishStock.aggregate([
    { $match: { product: { $in: ids } } },
    { $group: { _id: "$product", totalWeight: { $sum: "$weight" } } }
  ]);
  const stockMap = Object.fromEntries(stockAgg.map(r => [String(r._id), r.totalWeight]));

  return {
    items: products.map(p => ({
      productId: p.productId,
      name: p.name,
      price: p.price,
      labeledPrice: p.labeledPrice,
      image: p.images?.[0],
      description: p.description,
      isActive: p.isActive,
      inStockKg: Number(stockMap[String(p._id)] || 0),
      rating: p.averageRating || 0,
      reviews: p.reviewCount || 0
    })),
    total: products.length,
    page,
    limit
  };
}

/** One product by productId + total stock. */
export async function getProductDetails({ productId }) {
  if (!productId) throw new Error("productId is required");
  const p = await Product.findOne({ productId }).lean();
  if (!p) return null;

  const stockAgg = await FishStock.aggregate([
    { $match: { product: p._id } },
    { $group: { _id: null, totalWeight: { $sum: "$weight" } } }
  ]);
  const kg = stockAgg?.[0]?.totalWeight || 0;

  return {
    productId: p.productId,
    name: p.name,
    price: p.price,
    labeledPrice: p.labeledPrice,
    images: p.images || [],
    description: p.description,
    isActive: p.isActive,
    inStockKg: Number(kg),
    rating: p.averageRating || 0,
    reviews: p.reviewCount || 0
  };
}

/** Stock by species/common name (fallback for unlinked rows). */
export async function checkStock({ species }) {
  if (!species) throw new Error("species is required");
  const name = norm(species);
  const agg = await FishStock.aggregate([
    { $group: { _id: { name: { $toLower: "$name" } }, totalWeight: { $sum: "$weight" } } },
    { $match: { "_id.name": name } }
  ]);
  return { species, inStockKg: Number(agg?.[0]?.totalWeight || 0) };
}

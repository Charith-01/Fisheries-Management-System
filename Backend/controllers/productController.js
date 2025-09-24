import Product from "../models/product.js";
import FishStock from "../models/fishStock.js";

export async function createProduct(req, res){
  if(req.user == null){
    res.status(403).json({ message : "You need to log in to continue" });
    return;
  }
  if(req.user.role != "admin"){
    res.status(403).json({ message : "You do not have permission to perform this action" });
    return;
  }

  try{
    const lastProducts = await Product.find().sort({ createdAt: -1 }).limit(1);
    let newProductId = "";
    if(lastProducts.length === 0){
      newProductId = "PRD0001";
    } else {
      const lastProduct = lastProducts[0];
      const lastId = lastProduct.productId; // e.g., PRD0001
      const lastNumber = lastId.replace("PRD", ""); // "0001"
      const lastInt = parseInt(lastNumber); // 1
      const newInt = lastInt + 1; // 2
      const newStr = newInt.toString().padStart(4, "0"); // "0002"
      newProductId = "PRD" + newStr; // PRD0002
    }

    const product = new Product({
      productId : newProductId,
      name : req.body.name,
      altNames : req.body.altNames,
      price : req.body.price,
      labeledPrice : req.body.labeledPrice,
      description : req.body.description,
      images : req.body.images,
      isActive : req.body.isActive
    });
    
    await product.save();
    res.json({ message : "Product created successfully" });
  } catch(err){
    res.status(500).json({ message : "Product not created" });
  }
}

function normName(s = "") {
  return String(s).trim().toLowerCase();
}

export async function getProducts(req, res){
  try{
    const products = await Product.find().lean();
    if (!products || products.length === 0) {
      res.json({ message : "Products fetched successfully", data : [] });
      return;
    }

    // Build product id arrays/maps
    const productIdMap = {};
    const productIds = [];
    for (const p of products) {
      productIdMap[String(p._id)] = p;
      productIds.push(p._id);
    }

    // Reference-based aggregations (preferred)
    const byUnitAggRef = await FishStock.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: { product: "$product", unit: "$unit" },
          totalWeight: { $sum: "$weight" }
        }
      }
    ]);

    const byTypeAggRef = await FishStock.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: { product: "$product", type: "$type" },
          count: { $sum: 1 },
          totalWeight: { $sum: "$weight" }
        }
      }
    ]);

    const unitMapByProduct = {};
    for (const row of byUnitAggRef) {
      const pid = String(row._id?.product || "");
      const u = row._id?.unit || "";
      const w = row.totalWeight || 0;
      if (!unitMapByProduct[pid]) unitMapByProduct[pid] = {};
      unitMapByProduct[pid][u] = (unitMapByProduct[pid][u] || 0) + w;
    }

    const bestUnitByProduct = {};
    for (const [pid, mp] of Object.entries(unitMapByProduct)) {
      let bestU = undefined;
      let bestW = -1;
      for (const [u, w] of Object.entries(mp)) {
        if (w > bestW) {
          bestW = w;
          bestU = u;
        }
      }
      bestUnitByProduct[pid] = bestU;
    }

    const typeStatsByProduct = {};
    for (const row of byTypeAggRef) {
      const pid = String(row._id?.product || "");
      const t = row._id?.type || "";
      const c = row.count || 0;
      const tw = row.totalWeight || 0;
      if (!typeStatsByProduct[pid]) typeStatsByProduct[pid] = [];
      typeStatsByProduct[pid].push({ type: t, count: c, totalWeight: tw });
    }

    const bestTypeByProduct = {};
    for (const [pid, arr] of Object.entries(typeStatsByProduct)) {
      arr.sort((a, b) => (b.count - a.count) || (b.totalWeight - a.totalWeight));
      bestTypeByProduct[pid] = arr[0]?.type;
    }

    // (Optional) keep your legacy name-based as fallback for rows without ref
    const names = Array.from(new Set(products.map(p => normName(p.name)).filter(Boolean)));
    const byUnitAggName = await FishStock.aggregate([
      {
        $group: {
          _id: { name: { $toLower: "$name" }, unit: "$unit" },
          totalWeight: { $sum: "$weight" }
        }
      },
      { $match: { "_id.name": { $in: names } } }
    ]);
    const byTypeAggName = await FishStock.aggregate([
      {
        $group: {
          _id: { name: { $toLower: "$name" }, type: "$type" },
          count: { $sum: 1 },
          totalWeight: { $sum: "$weight" }
        }
      },
      { $match: { "_id.name": { $in: names } } }
    ]);
    const unitMapByName = {}; 
    for (const row of byUnitAggName) {
      const n = row._id?.name || "";
      const u = row._id?.unit || "";
      const w = row.totalWeight || 0;
      if (!unitMapByName[n]) unitMapByName[n] = {};
      unitMapByName[n][u] = (unitMapByName[n][u] || 0) + w;
    }
    const bestUnitByName = {}; 
    for (const [n, mp] of Object.entries(unitMapByName)) {
      let bestU = undefined;
      let bestW = -1;
      for (const [u, w] of Object.entries(mp)) {
        if (w > bestW) {
          bestW = w;
          bestU = u;
        }
      }
      bestUnitByName[n] = bestU;
    }
    const typeStatsByName = {}; 
    for (const row of byTypeAggName) {
      const n = row._id?.name || "";
      const t = row._id?.type || "";
      const c = row.count || 0;
      const tw = row.totalWeight || 0;
      if (!typeStatsByName[n]) typeStatsByName[n] = [];
      typeStatsByName[n].push({ type: t, count: c, totalWeight: tw });
    }
    const bestTypeByName = {}; 
    for (const [n, arr] of Object.entries(typeStatsByName)) {
      arr.sort((a, b) => (b.count - a.count) || (b.totalWeight - a.totalWeight));
      bestTypeByName[n] = arr[0]?.type;
    }

    // Hydrate products; prefer reference-based, fallback to name-based
    const hydrated = products.map(p => {
      const n = normName(p.name);
      const pid = String(p._id);

      const perUnitRef = unitMapByProduct[pid];
      const perUnitName = unitMapByName[n];
      const perUnit = perUnitRef || perUnitName || {};

      const preferredUnit = "kg";
      let stockWeight = perUnit[preferredUnit];

      if (typeof stockWeight !== "number") {
        stockWeight = Object.values(perUnit).reduce((a, b) => a + (b || 0), 0);
      }

      const stockUnit =
        bestUnitByProduct[pid] ||
        bestUnitByName[n] ||
        "kg";

      const stockType =
        bestTypeByProduct[pid] ||
        bestTypeByName[n] ||
        "fish";

      return {
        ...p,
        stockWeight: Number(stockWeight || 0),
        stockUnit,
        stockType,
      };
    });

    res.json({ message : "Products fetched successfully", data : hydrated });
  } catch(err){
    res.status(500).json({ message: "Products not fetched" });
  }
}

export async function getProductById(req, res){
  const { productId } = req.params; 
  const product = await Product.findOne({productId : productId});

  if(!product){
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json({ message: "Product fetched successfully", product });
}

export async function deleteProduct(req, res){
  if(req.user == null){
    res.status(403).json({ message : "You need to log in to continue" });
    return;
  }
  if(req.user.role != "admin"){
    res.status(403).json({ message: "You do not have permission to perform this action" });
    return;
  }

  try{
    await Product.findOneAndDelete({ productId : req.params.productId });
    res.json({ message: "Product deleted successfull" });
  } catch(err){
    res.status(500).json({ message: "Product not deleted" });
  }
}

export async function updateProduct(req, res){
  if(req.user == null){
    res.status(403).json({ message: "You need to log in to continue" });
    return;
  }
  if(req.user.role != "admin"){
    res.status(403).json({ message: "You do not have permission to perform this action" });
    return;
  }

  try{
    const allowed = {
      name: req.body.name,
      altNames: req.body.altNames,
      price: req.body.price,
      labeledPrice: req.body.labeledPrice,
      description: req.body.description,
      images: req.body.images,
      isActive: req.body.isActive
    };

    await Product.findOneAndUpdate(
      { productId : req.params.productId },
      allowed
    );

    res.json({ message: "Product updated successfully" });
  } catch(err){
    res.status(500).json({ message: "Product not updated" });
  }
}

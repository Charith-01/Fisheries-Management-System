import { Link } from "react-router-dom";

export default function ProductCard(props) {
  const product = props.product;

  const hasDiscount =
    typeof product.labeledPrice === "number" &&
    typeof product.price === "number" &&
    product.labeledPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.labeledPrice - product.price) / product.labeledPrice) * 100)
    : 0;

  return (
    <Link
      to={`/overview/${product.productId}`}
      className="w-[250px] h-[340px] m-4 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 group bg-white flex flex-col"
    >
      {/* Product image */}
      <div className="relative h-[180px] w-full overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.src =
              "https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage.png";
          }}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Product details */}
      <div className="flex-1 w-full p-3 flex flex-col justify-between">
        <div className="text-center">
          {/* Category (centered only) */}
          <span className="block text-xs font-medium text-blue-600 mb-1">
            {product.category}
          </span>

          {/* Product name */}
          <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition text-lg">
            {product.name}
          </h4>

          {/* Product ID */}
          <p className="text-[13px] text-slate-400 font-mono mt-0.5">
            #{product.productId}
          </p>

          {product.altNames?.length > 0 && (
            <p className="text-[15px] text-slate-500 line-clamp-1">
               {product.altNames.slice(0, 2).join(", ")}
              {product.altNames.length > 2 ? "…" : ""}
            </p>
          )}
        </div>

        {/* Price only */}
        <div className="mt-3">
          <div className="flex items-center justify-center gap-3">
            <p className="text-lg font-bold text-blue-600">
              Rs.
              {product.price?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-medium text-slate-500">
                /{product.unit}
              </span>
            </p>
            {hasDiscount && (
              <p className="text-sm line-through text-slate-400">
                Rs.
                {product.labeledPrice?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

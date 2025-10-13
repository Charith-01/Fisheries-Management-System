import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import ProductCard from "../../components/productCard"
import ProductFilters from "../../components/productFilters"

export default function ProductsPage() {

  const [productList, setProductList] = useState([])
  const [productsLoaded, setProductsLoaded] = useState(false)

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")

  useEffect(() => {
    if (!productsLoaded) {
      axios.get(import.meta.env.VITE_BACKEND_URL + "/api/product/all").then((res) => {
        setProductList(res.data.data)
        setProductsLoaded(true)
      })
    }
  }, [productsLoaded])

  const filteredList = useMemo(() => {
    let list = productList
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        [p?.name, (p?.altNames || []).join(" "), p?.category, p?.productId]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    }
    if (category !== "all") list = list.filter((p) => p.category === category)
    if (status !== "all") {
      const want = status === "active"
      list = list.filter((p) => Boolean(p?.isActive) === want)
    }
    return list
  }, [productList, query, category, status])

  return (
    <div className="h-full w-full flex">
      <div className="w-80 hidden md:block p-4">
        <ProductFilters
          query={query} setQuery={setQuery}
          category={category} setCategory={setCategory}
          status={status} setStatus={setStatus}
        />
      </div>

      <div className="flex-1">
        {
          productsLoaded ? (
            <div className="w-full h-full flex flex-wrap justify-start">
              {filteredList.map((product, index) => (
                <ProductCard product={product} key={index} />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-wrap justify-start" aria-busy="true" aria-live="polite">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[250px] h-[340px] m-4 rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white animate-pulse"
                >
                  <div className="h-[180px] w-full bg-slate-200" />
                  <div className="p-3 space-y-3">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="h-6 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

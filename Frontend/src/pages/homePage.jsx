import { Route, Routes } from "react-router-dom";
import Header from "../components/header";
import ProductsPage from "./client/productsPage";
import ProductOverview from "./client/productOverview";
import CartPage from "./client/cart";
import Checkout from "./client/checkout";

export default function HomePage(){
    return(

        <div className="w-full h-screen">
            <Header/>
            <div className="w-full h-[calc(100vh-75px)] min-h-[calc(100vh-75px)]">
                <Routes path="/*">
                    <Route path="/" element={<h1>Home page</h1>}/>
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/overview/:id" element={<ProductOverview />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/contact" element={<h1>Contact page</h1>} />
                    <Route path="/reviews" element={<h1>Reviews page</h1>} />
                    <Route path="/*" element={<h1>404 not found</h1>}/>
                </Routes>
            </div>
        </div>
    )
}
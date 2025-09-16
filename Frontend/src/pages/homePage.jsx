import { Route, Routes } from "react-router-dom";
import Header from "../components/header";
import ProductsPage from "./client/productsPage";

export default function HomePage(){
    return(

        <div className="w-full h-screen">
            <Header/>
            <div className="w-full h-[calc(100vh-75px)] min-h-[calc(100vh-75px)]">
                <Routes path="/*">
                    <Route path="/" element={<h1>Home page</h1>}/>
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/overview/:id" element={<h1>Product overview</h1>}/>
                    <Route path="/contact" element={<h1>Contact page</h1>} />
                    <Route path="/reviews" element={<h1>Reviews page</h1>} />
                    <Route path="/*" element={<h1>404 not found</h1>}/>
                </Routes>
            </div>
        </div>
    )
}
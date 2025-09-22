import AdminDashboard from "./pages/adminDashboard";
import LoginPage from "./pages/loginPage";
import { Toaster } from 'react-hot-toast'
import RegistrationPage from "./pages/client/registrationPage";




import FishStockList from "./pages/FishStockList";
import CreateFishStock from "./pages/CreateFishStock";
import UpdateFishStock from "./pages/UpdateFishStock";

import NotificationDashboard from "./pages/admin/NotificationDashboard";
import FishermanDashboard from "./pages/fishermanDashboard";
import PaymentPage from "./pages/client/PaymentPage";
import SuccessPage from "./pages/client/SuccessPage";
import HomePage from "./pages/homePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFoundPage from "./pages/client/notFoundPage";


function App() {

  return (
    <BrowserRouter>
    <Toaster position="top-right"/>
        <Routes path="/*">
          <Route path="/admin/*" element={<AdminDashboard/>}/>
          <Route path="/fisherman/*" element={<FishermanDashboard/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/register" element={<RegistrationPage/>}/>
          <Route path="/*" element={<HomePage />} />        
          <Route path="/fishstock" element={<FishStockList />} />
          <Route path="/fishstock/create" element={<CreateFishStock />} />
          <Route path="/fishstock/edit/:id" element={<UpdateFishStock />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/checkout/success" element={<SuccessPage />} />
          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App

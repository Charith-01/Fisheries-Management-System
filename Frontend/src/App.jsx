import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/adminDashboard";
import LoginPage from "./pages/loginPage";
import { Toaster } from 'react-hot-toast'
import RegistrationPage from "./pages/client/registrationPage";
import NotificationDashboard from "./pages/admin/NotificationDashboard";
import FishermanDashboard from "./pages/fishermanDashboard";
import HomePage from "./pages/homePage";
import NotFoundPage from "./pages/client/notFoundPage";

function App() {

  return (
    <BrowserRouter>
    <Toaster position="top-right"/>
        <Routes>
           <Route path="/admin/*" element={<AdminDashboard />} />
           <Route path="/fisherman/*" element={<FishermanDashboard />} />
           <Route path="/login" element={<LoginPage />} />
           <Route path="/register" element={<RegistrationPage />} />
           <Route path="/*" element={<HomePage />} />
           <Route path="/*" element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App

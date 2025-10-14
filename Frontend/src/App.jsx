import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "./contexts/AuthContext";
import { RouteGuard } from "./components/RouteGuard";
import AdminDashboard from "./pages/adminDashboard";
import LoginPage from "./pages/loginPage";
import RegistrationPage from "./pages/client/registrationPage";
import FishStockList from "./pages/FishStockList";
import CreateFishStock from "./pages/CreateFishStock";
import UpdateFishStock from "./pages/UpdateFishStock";
import NotificationDashboard from "./pages/admin/NotificationDashboard";
import FishermanDashboard from "./pages/fishermanDashboard";
import PaymentPage from "./pages/client/PaymentPage";
import SuccessPage from "./pages/client/SuccessPage";
import HomePage from "./pages/homePage";
import NotFoundPage from "./pages/client/notFoundPage";
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right"/>
        <Routes path="/*">
          {/* Auth routes - only for unauthenticated users */}
          <Route path="/login" element={
            <RouteGuard allowUnauthenticated>
              <LoginPage/>
            </RouteGuard>
          }/>
          <Route path="/register" element={
            <RouteGuard allowUnauthenticated>
              <RegistrationPage/>
            </RouteGuard>
          }/>
          
          {/* Role-protected dashboard routes - THESE ARE SEPARATE FROM HOMEPAGE */}
          <Route path="/admin/*" element={
            <RouteGuard requiredRole="admin">
              <AdminDashboard/>
            </RouteGuard>
          }/>
          <Route path="/fisherman/*" element={
            <RouteGuard requiredRole="fisherman">
              <FishermanDashboard/>
            </RouteGuard>
          }/>
          
          {/* Special routes that should be at app level */}
          <Route path="/payment" element={
            <RouteGuard allowAuthenticated>
              <PaymentPage />
            </RouteGuard>
          } />
          <Route path="/checkout/success" element={
            <RouteGuard allowAuthenticated>
              <SuccessPage />
            </RouteGuard>
          } />
          
          {/* Fish stock routes */}
          <Route path="/fishstock" element={
            <RouteGuard requiredRole="admin">
              <FishStockList />
            </RouteGuard>
          } />
          <Route path="/fishstock/create" element={
            <RouteGuard requiredRole="admin">
              <CreateFishStock />
            </RouteGuard>
          } />
          <Route path="/fishstock/edit/:id" element={
            <RouteGuard requiredRole="admin">
              <UpdateFishStock />
            </RouteGuard>
          } />
          
          {/* Notification dashboard (admin only) */}
          <Route path="/notifications" element={
            <RouteGuard requiredRole="admin">
              <NotificationDashboard />
            </RouteGuard>
          } />
          
          {/* ALL CUSTOMER/CLIENT ROUTES GO THROUGH HOMEPAGE */}
          <Route path="/*" element={<HomePage />} />
        </Routes>

        <ChatbotWidget/>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
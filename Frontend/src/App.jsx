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
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import NotFoundPage from "./pages/client/notFoundPage";
import ChatbotWidget from "./components/ChatbotWidget";

// Import route guards
import { 
  AdminGuard, 
  FishermanGuard, 
  CustomerGuard, 
  PublicOnlyGuard 
} from "./components/AuthGuards";

function ChatbotGate() {
  const { pathname } = useLocation();
  const isRestricted = pathname.startsWith("/admin") || pathname.startsWith("/fisherman");
  if (isRestricted) return null;
  return <ChatbotWidget />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes path="/*">
        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        } />
        
        {/* Protected Fisherman Routes */}
        <Route path="/fisherman/*" element={
          <FishermanGuard>
            <FishermanDashboard />
          </FishermanGuard>
        } />
        
        {/* Public Only Routes (Login/Register) */}
        <Route path="/login" element={
          <PublicOnlyGuard>
            <LoginPage />
          </PublicOnlyGuard>
        } />
        <Route path="/register" element={
          <PublicOnlyGuard>
            <RegistrationPage />
          </PublicOnlyGuard>
        } />
        
        {/* Main App */}
        <Route path="/*" element={<HomePage />} />
        
        {/* Protected Customer Routes */}
        <Route path="/payment" element={
          <CustomerGuard>
            <PaymentPage />
          </CustomerGuard>
        } />
        <Route path="/checkout/success" element={
          <CustomerGuard>
            <SuccessPage />
          </CustomerGuard>
        } />
        
        {/* Public Fish Stock Routes */}
        <Route path="/fishstock" element={<FishStockList />} />
        <Route path="/fishstock/create" element={<CreateFishStock />} />
        <Route path="/fishstock/edit/:id" element={<UpdateFishStock />} />
        
      </Routes>

      <ChatbotGate />
    </BrowserRouter>
  );
}

export default App;
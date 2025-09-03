import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/adminDashboard";
import LoginPage from "./pages/loginPage";
import { Toaster } from 'react-hot-toast'
import RegistrationPage from "./pages/client/registrationPage";
import NotificationDashboard from "./pages/admin/NotificationDashboard";

function App() {

  return (
    <BrowserRouter>
    <Toaster position="top-right"/>
        <Routes>
           <Route path="/admin/*" element={<AdminDashboard />} />
          

          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/register" element={<RegistrationPage/>}/>
          <Route path="/" element={<h1>Home Page</h1>}/>
          <Route path="/*" element={<h1>404 Not Found</h1>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default App

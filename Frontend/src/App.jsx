import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/adminDashboard";
import LoginPage from "./pages/loginPage";
import { Toaster } from 'react-hot-toast'
import RegistrationPage from "./pages/client/registrationPage";
// Add these imports
import FishStockList from "./pages/FishStockList";
import CreateFishStock from "./pages/CreateFishStock";
import UpdateFishStock from "./pages/UpdateFishStock";

function App() {

  return (
    <BrowserRouter>
    <Toaster position="top-right"/>
        <Routes path="/*">
          <Route path="/admin/*" element={<AdminDashboard/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/register" element={<RegistrationPage/>}/>
          <Route path="/" element={<h1>Home Page</h1>}/>
          <Route path="/*" element={<h1>404 Not Found</h1>}/>


          {/*Add these routes inside your Router*/}
          <Route path="/fishstock" element={<FishStockList />} />
          <Route path="/fishstock/create" element={<CreateFishStock />} />
          <Route path="/fishstock/edit/:id" element={<UpdateFishStock />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App

import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import LoginImageSlider from "../components/loginImageSlider";

export default function LoginPage() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    function handleLogin() {
        setLoading(true);

        axios.post(
            (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000") + "/api/auth/login",
            {
                email: email,
                password: password
            }
        ).then((response) => {
            toast.success("Login successful");

            // Expecting { token, user: { role, ... } }
            const { token, user } = response.data || {};
            if (token) localStorage.setItem("token", token);
            if (user) localStorage.setItem("user", JSON.stringify(user));

            // inline redirect by role (auto-detected by backend)
            const r = user?.role;
            if (r === "admin") {
                window.location.href = "/admin/dashboard";
            } else if (r === "fisherman") {
                window.location.href = "/fisherman/home";
            } else {
                window.location.href = "/customer/home";
            }

        }).catch((error) => {
            toast.error(error?.response?.data?.message || "Login failed");
        }).finally(() => {
            setLoading(false);
        });
    }

    return(
        <div className="w-full h-screen flex">
            <div className="w-[40%] h-full bg-white flex justify-center items-center"> 
                <div className="w-[450px] h-[700px] flex justify-center items-center flex-col">
                    <div className="w-[210px] h-[70px] bg-[url(/logo.jpg)] bg-cover bg-center bg-no-repeat mb-10"></div>
                    <h1 className="font-semibold text-gray-700 text-xl">Welcome Back!</h1>
                    <label className="text-gray-700">Log in with your Email</label>
                    <input onChange={
                        (e)=>{
                            setEmail(e.target.value)
                        }
                    } className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]" type="email" placeholder="Email address*"/>
                    <input onChange={
                        (e)=>{
                            setPassword(e.target.value)
                        }
                    } className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]" type="password" placeholder="Password*"/>

                    <button onClick={handleLogin} className="w-[400px] h-[50px] bg-blue-500 rounded-lg text-white cursor-pointer m-[15px] hover:bg-blue-600" disabled={loading}>
                        {
                            loading?"Loading...":"Login"
                        }
                    </button>
                    <p className="text-gray-700 m-[5px]">
                        Don't have an account?
                        &nbsp;
                        <span className="text-blue-500 cursor-pointer hover:text-blue-700 font-medium">
                            <Link to={"/register"}>Register Now</Link>
                        </span>
                    </p>
                </div>

            </div>
            <LoginImageSlider/>
        </div>
    )
}

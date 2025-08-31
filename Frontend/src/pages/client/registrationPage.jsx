import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import LoginImageSlider from "../../components/loginImageSlider";

export default function RegistrationPage(){

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleRegister(){
        if(password != confirmPassword){
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try{
            await axios.post(import.meta.env.VITE_BACKEND_URL + "/api/customer/register", {
                firstName,
                lastName,
                email,
                phone,
                address,
                password,
            });

            toast.success("Registration successful");
            navigate("/login");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="w-full min-h-screen md:h-screen flex flex-col md:flex-row">
            <div className="w-full md:w-[40%] h-auto md:h-full bg-white flex justify-center items-center">
                <div className="w-[450px] h-[700px] flex justify-center items-center flex-col">
                    <div className="w-[150px] h-[50px] bg-[url(/logo.jpg)] bg-cover bg-center bg-no-repeat mb-5"></div>
                    <h1 className="font-semibold text-gray-700 text-xl">Create Your Account</h1>
                    <label className="text-gray-700 mb-3 text-center">Register with your details</label>

                    <input
                        onChange={(e) => setFirstName(e.target.value)}
                        type="text"
                        placeholder="First Name*"
                        className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
                    />
                    <input
                        onChange={(e) => setLastName(e.target.value)}
                        type="text"
                        placeholder="Last Name*"
                        className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
                    />
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email address*"
                        className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
                    />
                    <input
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        placeholder="Phone number*"
                        className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
                    />
                    <input
                        onChange={(e) => setAddress(e.target.value)}
                        type="text"
                        placeholder="Address*"
                        className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
                    />
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Password*"
                        className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
                    />
                    <input
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        placeholder="Confirm Password*"
                        className="w-[400px] h-[50px] border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none transition-all text-center m-[10px]"
                    />
                    <button
                        onClick={handleRegister}
                        className="w-[400px] h-[50px] bg-blue-500 rounded-lg text-white cursor-pointer m-[15px] hover:bg-blue-600"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                    <p className="text-gray-700 m-[5px]">
                        Already have an account?&nbsp;
                        <span className="text-blue-500 cursor-pointer hover:text-blue-700 font-medium">
                            <Link to="/login">Login</Link>
                        </span>
                    </p>
                </div>
            </div>

            <LoginImageSlider />
        </div>
    )
}
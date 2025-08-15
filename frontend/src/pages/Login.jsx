import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  // State for toggling between Login and Sign Up form
  const [state, setState] = useState("Login");

  // State for form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Get necessary context and hooks
  const navigate = useNavigate();
  const { backendUrl, token, setToken } = useContext(AppContext);

  /**
   * Handles the form submission for both login and registration.
   */
  const onSubmitHandler = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Determine the API URL based on the current state (Login or Sign Up)
    const url =
      state === "Login"
        ? `${backendUrl}/api/user/login`
        : `${backendUrl}/api/user/register`;

    const payload =
      state === "Login" ? { email, password } : { name, email, password };

    try {
      const { data } = await axios.post(url, payload);

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token); // Store token in local storage
        navigate("/"); // Navigate to homepage on successful login/signup
      } else {
        toast.error(data.message); // Show error message from backend
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Login/Signup Error:", error);
    }
  };

  /**
   * This effect protects the login page. If a user with a valid token
   * tries to access this page, they are automatically redirected to the homepage.
   */
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token]);

  return (
    <form
      onSubmit={onSubmitHandler}
      className="min-h-[80vh] flex items-center justify-center"
    >
      <div className="flex flex-col gap-4 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg bg-white">
        <p className="text-2xl font-semibold text-gray-800 self-center">
          {state}
        </p>
        <p className="self-center text-center">
          {state === "Login"
            ? "Please log in to continue"
            : "Create an account to get started"}
        </p>

        {/* Full Name input (only shown on Sign Up) */}
        {state === "Sign Up" && (
          <div className="w-full">
            <p className="font-medium">Full Name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="border border-[#DADADA] rounded w-full p-2 mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
              type="text"
              required
            />
          </div>
        )}

        {/* Email input */}
        <div className="w-full">
          <p className="font-medium">Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="border border-[#DADADA] rounded w-full p-2 mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
            type="email"
            required
          />
        </div>

        {/* Password input */}
        <div className="w-full">
          <p className="font-medium">Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className="border border-[#DADADA] rounded w-full p-2 mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
            type="password"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-white w-full py-2.5 my-2 rounded-md text-base hover:bg-primary/90 transition-all"
        >
          {state}
        </button>

        {/* Toggle between Login and Sign Up */}
        {state === "Sign Up" ? (
          <p>
            Already have an account?{" "}
            <span
              onClick={() => setState("Login")}
              className="text-primary underline cursor-pointer font-semibold"
            >
              Login here
            </span>
          </p>
        ) : (
          <p>
            Create a new account?{" "}
            <span
              onClick={() => setState("Sign Up")}
              className="text-primary underline cursor-pointer font-semibold"
            >
              Click here
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;

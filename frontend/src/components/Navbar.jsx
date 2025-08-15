import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const { token, setToken, userData } = useContext(AppContext);

  // Handler for logging out the user
  const logout = () => {
    console.log("Logout function called.");
    localStorage.removeItem("token");
    setToken(false);
    navigate("/login"); // Navigate to login after logout
  };

  // Handler for the "Create account" button to aid in debugging
  const handleCreateAccountClick = () => {
    console.log(
      "Navbar 'Create account' button clicked! Navigating to /login..."
    );
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]">
      <img
        onClick={() => navigate("/")}
        className="w-44 cursor-pointer"
        src={assets.logo}
        alt="Prescripto Logo"
      />

      {/* Desktop Navigation Links */}
      <ul className="md:flex items-start gap-5 font-medium hidden">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "text-primary" : "")}
        >
          <li className="py-1">HOME</li>
        </NavLink>
        <NavLink
          to="/doctors"
          className={({ isActive }) => (isActive ? "text-primary" : "")}
        >
          <li className="py-1">ALL DOCTORS</li>
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => (isActive ? "text-primary" : "")}
        >
          <li className="py-1">ABOUT</li>
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) => (isActive ? "text-primary" : "")}
        >
          <li className="py-1">CONTACT</li>
        </NavLink>
      </ul>

      <div className="flex items-center gap-4">
        {token && userData ? (
          // Dropdown for logged-in user
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <img
              className="w-8 h-8 rounded-full object-cover"
              src={userData.image}
              alt="User Profile"
            />
            <img className="w-2.5" src={assets.dropdown_icon} alt="Dropdown" />
            <div className="absolute top-full right-0 mt-2 text-base font-medium text-gray-600 z-20 hidden group-hover:block">
              <div className="min-w-48 bg-gray-50 rounded-lg shadow-lg flex flex-col gap-1 p-4">
                <p
                  onClick={() => navigate("/my-profile")}
                  className="hover:text-black cursor-pointer p-2 rounded hover:bg-gray-200"
                >
                  My Profile
                </p>
                <p
                  onClick={() => navigate("/my-appointments")}
                  className="hover:text-black cursor-pointer p-2 rounded hover:bg-gray-200"
                >
                  My Appointments
                </p>
                <hr className="my-1" />
                <p
                  onClick={logout}
                  className="hover:text-black cursor-pointer p-2 rounded hover:bg-gray-200"
                >
                  Logout
                </p>
              </div>
            </div>
          </div>
        ) : (
          // "Create account" button for logged-out user
          <button
            onClick={handleCreateAccountClick}
            className="bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block hover:bg-primary/90 transition-all"
          >
            Create account
          </button>
        )}

        {/* Mobile menu icon */}
        <img
          onClick={() => setShowMenu(true)}
          className="w-6 md:hidden cursor-pointer"
          src={assets.menu_icon}
          alt="Menu"
        />

        {/* Mobile Menu Panel */}
        <div
          className={`md:hidden ${
            showMenu ? "fixed w-full" : "w-0"
          } right-0 top-0 bottom-0 z-30 overflow-hidden bg-white transition-all duration-300`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <img src={assets.logo} className="w-36" alt="Prescripto Logo" />
            <img
              onClick={() => setShowMenu(false)}
              src={assets.cross_icon}
              className="w-7 cursor-pointer"
              alt="Close menu"
            />
          </div>
          <ul className="flex flex-col items-center gap-4 mt-5 px-5 text-lg font-medium">
            <NavLink onClick={() => setShowMenu(false)} to="/">
              <p className="px-4 py-2 rounded-full inline-block">HOME</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/doctors">
              <p className="px-4 py-2 rounded-full inline-block">ALL DOCTORS</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/about">
              <p className="px-4 py-2 rounded-full inline-block">ABOUT</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/contact">
              <p className="px-4 py-2 rounded-full inline-block">CONTACT</p>
            </NavLink>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

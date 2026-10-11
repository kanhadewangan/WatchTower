import axios from "axios";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout, { AuthLink, PasswordToggle, Spinner } from "../components/AuthLayout";
import { authInputClasses } from "../utils/authStyles";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${import.meta.env.VITE_URL}/api/v1/users/login`, {
        email: formData.email,
        password: formData.password,
      });
      const token = response.data?.token;

      if (typeof token !== "string" || !token.trim()) {
        setError(response.data?.message || "Login failed. Please check your credentials.");
        return;
      }

      localStorage.setItem("token", token);
      navigate("/dashboard", {
        replace: true,
        state: { message: "Login successful!", type: "success" },
      });
    } catch (err) {
      console.error("Login failed:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see how your sites are doing."
      footer={
        <>
          Don't have an account? <AuthLink to="/signup">Sign up for free</AuthLink>
        </>
      }
    >
      <AnimatePresence>
        {(successMessage || error) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            role={error ? "alert" : "status"}
          >
            <div
              className={`mb-6 p-4 rounded-xl text-sm BodyFont border ${
                error
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-green-500/10 border-green-500/20 text-green-400"
              }`}
            >
              {error || successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-300 BodyFont">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={authInputClasses(false)}
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-300 BodyFont">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`${authInputClasses(false)} pr-12`}
              placeholder="••••••••"
            />
            <PasswordToggle shown={showPassword} onClick={() => setShowPassword(!showPassword)} />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(245, 158, 11, 0.35)" }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl HeadingFont flex items-center justify-center disabled:opacity-60"
        >
          {isLoading ? <Spinner /> : "Sign in"}
        </motion.button>
      </form>
    </AuthLayout>
  );
};

export default Login;

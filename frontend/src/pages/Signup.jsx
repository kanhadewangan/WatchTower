import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout, { AuthLink, PasswordToggle, Spinner } from "../components/AuthLayout";
import { authInputClasses } from "../utils/authStyles";

const FieldError = ({ msg }) => (msg ? <p className="text-xs text-red-400 BodyFont">{msg}</p> : null);

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_URL}/api/v1/users/register`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }
      );
      navigate("/login", {
        state: {
          message: "Registration successful! Please sign in.",
          type: "success",
        },
      });
    } catch (error) {
      setErrors({
        api: error.response?.data?.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const strength = Math.min(
    4,
    (formData.password.length >= 8) +
      /[A-Z]/.test(formData.password) +
      /[0-9]/.test(formData.password) +
      /[^A-Za-z0-9]/.test(formData.password)
  );
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["bg-white/10", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-green-500"][strength];

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start watching your sites in under a minute."
      footer={
        <>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AnimatePresence>
          {errors.api && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm BodyFont"
            >
              {errors.api}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-300 BodyFont">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className={authInputClasses(errors.name)}
            placeholder="Ada Lovelace"
          />
          <FieldError msg={errors.name} />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-300 BodyFont">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={authInputClasses(errors.email)}
            placeholder="you@company.com"
          />
          <FieldError msg={errors.email} />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-300 BodyFont">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className={`${authInputClasses(errors.password)} pr-12`}
              placeholder="At least 8 characters"
            />
            <PasswordToggle shown={showPassword} onClick={() => setShowPassword(!showPassword)} />
          </div>
          {formData.password && (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : "bg-white/10"}`} />
                ))}
              </div>
              <span className="text-xs text-gray-500 BodyFont w-12 text-right">{strengthLabel}</span>
            </div>
          )}
          <FieldError msg={errors.password} />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300 BodyFont">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={authInputClasses(errors.confirmPassword)}
            placeholder="Repeat your password"
          />
          <FieldError msg={errors.confirmPassword} />
        </div>

        <div className="space-y-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-[#0a0a0f] accent-amber-500"
            />
            <span className="text-sm text-gray-400 BodyFont">
              I agree to the{" "}
              <Link to="/terms" className="text-amber-500 hover:text-amber-400">Terms</Link> and{" "}
              <Link to="/privacy" className="text-amber-500 hover:text-amber-400">Privacy Policy</Link>
            </span>
          </label>
          <FieldError msg={errors.agreeToTerms} />
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(245, 158, 11, 0.35)" }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl HeadingFont flex items-center justify-center disabled:opacity-60"
        >
          {isLoading ? <Spinner /> : "Create account"}
        </motion.button>
      </form>
    </AuthLayout>
  );
};

export default Signup;

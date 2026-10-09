"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Image from "next/image";

const BRAND = "#4B0082";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

export default function RegisterPage() {
  const router = useRouter();
  const { themeClass, isDarkMode } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    const render = () => {
      const btnContainer = document.getElementById("google-register-btn-hidden");
      if (!window.google || !btnContainer) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          prompt: "consent",
          auto_select: false,
        });
        window.google.accounts.id.renderButton(btnContainer, {
          type: "standard",
          size: "large",
          width: 400,
          text: "signup_with",
          theme: "outline",
        });
        setGoogleReady(true);
        return true;
      } catch (err) {
        console.error("Google render error:", err);
        return false;
      }
    };

    if (render()) return;

    const interval = setInterval(() => {
      if (render()) clearInterval(interval);
    }, 100);

    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const navigateWithFade = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      router.push(path);
    }, 450);
  };

  const handleGoogleCredential = async (response) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.data));
        toast.success("Account created with Google!", { position: "top-center" });
        navigateWithFade("/dashboard");
      } else {
        toast.error(data.message || "Google registration failed", { position: "top-center" });
      }
    } catch {
      toast.error("Google registration failed. Please try again.", { position: "top-center" });
    }
  };

  const handleGoogleRegister = () => {
    if (!googleReady) {
      toast.error("Google is still loading. Please wait a moment and try again.");
      return;
    }
    const btn = document.querySelector("#google-register-btn-hidden div[role=button]");
    if (btn) btn.click();
    else toast.error("Google login not ready. Please refresh.", { position: "top-center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errors = {};
      (result.error?.issues ?? []).forEach((i) => {
        if (i.path[0]) errors[i.path[0]] = i.message;
      });
      setFieldErrors(errors);
      setFormError("Incorrect or missing field — please check and try again.");
      toast.error("Please fill in all fields correctly", { position: "top-center" });
      return;
    }
    setFieldErrors({});
    setFormError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account created! Redirecting to login...", { position: "top-center" });
        setTimeout(() => navigateWithFade("/login"), 2000);
      } else {
        toast.error(data.message || "Registration failed", { position: "top-center" });
        setFormError(data.message);
      }
    } catch {
      toast.error("Registration failed. Please try again.", { position: "top-center" });
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field) => {
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: null }));
    if (formError) setFormError("");
  };

  const inputBase = "w-full pl-11 py-2.5 rounded-xl border focus:outline-none transition-all duration-200 text-base sm:text-[15.5px] ";

  const inputClass = (field, withEye = false) =>
    inputBase +
    (withEye ? "pr-11 " : "pr-4 ") +
    (fieldErrors[field]
      ? "border-red-500 "
      : themeClass("border-gray-700 focus:border-[#4B0082]", "border-gray-200 focus:border-[#4B0082]")) +
    themeClass("bg-[#2a2a2d] text-white placeholder-gray-500", "bg-gray-50 text-gray-900 placeholder-gray-500");

  return (
    <div className={"min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 " + themeClass("bg-[#111111]", "bg-gray-50")}>
      <div
        className="w-full max-w-md transition-all duration-700"
        style={{
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: isVisible && !isExiting ? 1 : 0,
          transform: isVisible && !isExiting ? "translateY(0) scale(1)" : "translateY(20px) scale(0.985)",
          filter: isVisible && !isExiting ? "blur(0)" : "blur(4px)",
        }}
      >
        <div className={"p-5 sm:p-7 rounded-2xl border shadow-xl " + themeClass("bg-[#1c1c1e] border-gray-800", "bg-white border-gray-200")}>
          <div className="flex justify-center mb-5">
            <div className="rounded-xl overflow-hidden shadow-sm">
              <Image
                src="/collabi.png"
                alt="Collabi"
                width={140}
                height={42}
                className="object-contain w-auto h-9 sm:h-10"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-4">
            <h1 className={`text-lg sm:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Join Collabi
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Start your journey with us
            </p>
          </div>

          {formError && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formError}
            </div>
          )}

          <div id="google-register-btn-hidden" style={{ position: "absolute", opacity: 0, pointerEvents: "none", left: "-9999px" }} />

          <button
            onClick={handleGoogleRegister}
            className={
              "w-full flex items-center justify-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 text-sm " +
              themeClass(
                "border-gray-700 bg-[#2a2a2d] text-white hover:bg-[#333]",
                "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              )
            }
          >
            <svg className="w-[19px] h-[19px] shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" className="fill-[#4285F4]" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" className="fill-[#34A853]" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" className="fill-[#FBBC05]" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" className="fill-[#EA4335]" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center my-4">
            <div className={"grow h-px " + themeClass("bg-gray-800", "bg-gray-200")} />
            <span className={"px-3 text-xs " + themeClass("text-gray-500", "text-gray-400")}>or</span>
            <div className={"grow h-px " + themeClass("bg-gray-800", "bg-gray-200")} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div>
              <div className="relative">
                <User className={"absolute left-3 top-1/2 -translate-y-1/2 w-[19px] h-[19px] " + themeClass("text-gray-500", "text-gray-400")} />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError("name");
                  }}
                  className={inputClass("name")}
                />
              </div>
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <div className="relative">
                <Mail className={"absolute left-3 top-1/2 -translate-y-1/2 w-[19px] h-[19px] " + themeClass("text-gray-500", "text-gray-400")} />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  className={inputClass("email")}
                />
              </div>
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className={"absolute left-3 top-1/2 -translate-y-1/2 w-[19px] h-[19px] " + themeClass("text-gray-500", "text-gray-400")} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  className={inputClass("password", true)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className={
                    "absolute right-3 top-1/2 -translate-y-1/2 " +
                    themeClass("text-gray-500 hover:text-gray-300", "text-gray-400 hover:text-gray-600")
                  }
                >
                  {showPassword ? <EyeOff className="w-[19px] h-[19px]" /> : <Eye className="w-[19px] h-[19px]" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 text-base sm:text-[15.5px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: BRAND }}
            >
              {isLoading ? (
                <div className="w-[19px] h-[19px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {" "}
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className={"text-xs mt-5 text-center " + themeClass("text-gray-400", "text-gray-600")}>
            Already have an account?{" "}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigateWithFade("/login");
              }}
              className="font-medium hover:underline"
              style={{ color: BRAND }}
            >
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
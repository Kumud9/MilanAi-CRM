"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { User, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { DarkVeil } from "@/components/DarkVeil";

// Zod schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [redirectProgress, setRedirectProgress] = useState(0);

  // Login Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });

  // SignUp Form
  const {
    register: signUpRegister,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
    reset: resetSignUpForm,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  // Check session on load
  useEffect(() => {
    const session = localStorage.getItem("matchmaker-session");
    if (session === "active") {
      router.replace("/dashboard");
    }
  }, [router]);

  // Canvas particle background effect


  // Redirect progress simulation
  useEffect(() => {
    if (!showSuccessScreen) return;
    let current = 0;
    const interval = setInterval(() => {
      current += 2.5;
      setRedirectProgress(Math.min(current, 100));
      if (current >= 100) {
        clearInterval(interval);
        router.push("/dashboard");
      }
    }, 30);
    return () => clearInterval(interval);
  }, [showSuccessScreen, router]);

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("matchmaker-session", "active");
        localStorage.setItem("matchmaker-user", JSON.stringify(result));
        document.cookie = "matchmaker-username=" + result.username + "; path=/; max-age=31536000";
        toast("Login Successful", `Welcome back, ${result.name}!`, "success");
        setShowSuccessScreen(true);
      } else {
        toast("Login Failed", result.error || "Invalid username or password.", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Error", "Could not connect to authentication API.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      // Derive username from email prefix
      const username = data.email.split('@')[0];
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        username: username
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("matchmaker-session", "active");
        localStorage.setItem("matchmaker-user", JSON.stringify(result));
        document.cookie = "matchmaker-username=" + result.username + "; path=/; max-age=31536000";
        toast("Account Created", `Welcome, ${result.name}! Your account has been registered.`, "success");
        setShowSuccessScreen(true);
      } else {
        toast("Sign Up Failed", result.error || "Could not register account.", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Error", "Could not connect to registration API.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <style>{`
        .login-page-container {
          --dark: #15080D;
          --dark2: #1E0F15;
          --dark3: #2A1520;
          --dark4: #331820;
          --rose: #E05470;
          --rose2: #C4566A;
          --rose-dim: rgba(224,84,112,0.15);
          --rose-glow: rgba(224,84,112,0.08);
          --gold: #C9A84C;
          --gold-dim: rgba(201,168,76,0.18);
          --text: #F5EEF0;
          --text-muted: rgba(245,238,240,0.52);
          --text-dim: rgba(245,238,240,0.22);
          --border: rgba(224,84,112,0.18);
          --border2: rgba(201,168,76,0.18);

          width: 100vw;
          height: 100vh;
          background: var(--dark);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .page-layout {
          display: flex;
          width: 100vw;
          height: 100vh;
          position: relative;
          z-index: 1;
        }

        /* LEFT PANEL */
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 5vh 6vw 5vh 10vw;
          position: relative;
          overflow: hidden;
          border-right: 1px solid var(--border);
          background: transparent;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4vh;
          animation: fadeUp 0.6s ease both;
        }

        .brand-icon-tile {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-left: -10px;
        }

        .brand-title-text {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          color: #ffffff;
          letter-spacing: 0.5px;
          line-height: 1;
          text-shadow: 0 0 25px rgba(255, 255, 255, 0.35);
        }

        .brand-title-text span {
          color: var(--gold);
          font-style: italic;
          text-shadow: 0 0 25px rgba(201, 168, 76, 0.5);
        }

        .brand-subtitle-text {
          font-size: 0.85rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(245,238,240,0.7);
          font-weight: 500;
          margin-top: 8px;
        }

        .headline-section {
          animation: fadeUp 0.7s 0.08s ease both;
        }

        .headline-section h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3.2rem, 5vw, 4.5rem);
          line-height: 1.15;
          font-weight: 600;
          margin-bottom: 2.5vh;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        .headline-section h1 em {
          color: var(--rose);
          font-style: italic;
          display: block;
        }

        .headline-section p {
          font-size: clamp(1.1rem, 1.4vw, 1.3rem);
          color: var(--text-muted);
          line-height: 1.8;
          font-weight: 300;
          max-width: 540px;
        }

        .ornament-decor {
          margin-top: 4vh;
          font-size: 0.85rem;
          letter-spacing: 8px;
          color: rgba(224,84,112,0.4);
          animation: fadeUp 0.7s 0.3s ease both;
        }

        /* RIGHT PANEL */
        .right-panel {
          width: min(520px, 48vw);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 5vh 4.5vw;
          background: var(--dark2);
          position: relative;
          overflow: hidden;
        }

        .right-panel::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224,84,112,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .form-header-block {
          margin-bottom: 2.5vh;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .form-header-block h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .form-header-block p {
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 300;
        }

        .tab-switcher {
          display: flex;
          background: var(--dark3);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 2.5vh;
          animation: fadeUp 0.6s 0.15s ease both;
        }

        .tab-btn {
          flex: 1;
          padding: 0.55rem;
          text-align: center;
          font-size: 0.83rem;
          font-weight: 500;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 9px;
          transition: all 0.25s;
          font-family: 'DM Sans', sans-serif;
        }

        .tab-btn.active {
          background: var(--rose);
          color: #fff;
        }

        .field-group {
          margin-bottom: 1.8vh;
          animation: fadeUp 0.6s ease both;
        }

        .field-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 8px;
          letter-spacing: 0.3px;
          display: block;
        }

        .field-wrap {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dim);
          pointer-events: none;
          z-index: 1;
        }

        .field-input {
          width: 100%;
          background: var(--dark3);
          border: 1px solid var(--border);
          border-radius: 11px;
          padding: 0.9rem 1rem 0.9rem 3.2rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .field-input::placeholder {
          color: var(--text-dim);
        }

        .field-input:focus {
          border-color: var(--rose);
          background: rgba(224,84,112,0.05);
        }

        .eye-toggle-btn {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-dim);
          transition: color 0.2s;
          padding: 4px;
        }

        .eye-toggle-btn:hover {
          color: var(--text-muted);
        }

        .forgot-link {
          display: block;
          text-align: right;
          font-size: 0.85rem;
          color: var(--rose);
          text-decoration: none;
          margin-top: -0.6vh;
          margin-bottom: 2vh;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: var(--gold);
        }

        .submit-btn-custom {
          width: 100%;
          padding: 1rem;
          background: var(--rose);
          border: none;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1.05rem;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: all 0.2s;
          margin-bottom: 1.2vh;
          position: relative;
          overflow: hidden;
          animation: fadeUp 0.6s 0.35s ease both;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submit-btn-custom:hover {
          background: #c4455e;
          transform: translateY(-1px);
        }

        .submit-btn-custom:active {
          transform: scale(0.99);
        }

        .submit-btn-custom.loading {
          pointer-events: none;
          background: #7a2d3e;
        }

        .shimmer-anim {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .switch-prompt {
          text-align: center;
          font-size: 0.82rem;
          color: var(--text-muted);
          animation: fadeUp 0.6s 0.5s ease both;
        }

        .switch-prompt a {
          color: var(--rose);
          text-decoration: none;
          font-weight: 500;
        }

        .switch-prompt a:hover {
          color: var(--gold);
        }

        /* SUCCESS SCREEN */
        .success-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.2rem;
          text-align: center;
          padding: 2rem;
          height: 100%;
          width: 100%;
        }

        .success-ring {
          width: 74px;
          height: 74px;
          border-radius: 50%;
          border: 2px solid var(--rose);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-ring::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid var(--rose);
          animation: pulseRing 1.3s ease-out infinite;
        }

        .success-check {
          font-size: 2rem;
          color: var(--text);
          animation: tickIn 0.5s 0.2s ease both;
        }

        .success-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .success-subtitle {
          font-size: 0.86rem;
          color: var(--text-muted);
          font-weight: 300;
          line-height: 1.6;
        }

        .progress-bar-wrapper {
          width: 100%;
          height: 3px;
          background: var(--dark3);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar-inner {
          height: 100%;
          background: var(--rose);
          border-radius: 2px;
          transition: width 0.08s linear;
        }

        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        @keyframes tickIn {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="page-layout">
        {/* LEFT PANEL */}
        <div className="left-panel">
          {/* VEIL BACKGROUND CANVASES (Scoped to Left Panel) */}
          <div style={{ position: 'absolute', inset: 0, zIndex: -1, width: '100%', height: '100%' }}>
            <DarkVeil speed={1.2} warpAmount={0.3} />
          </div>

          <div className="brand-section">
            <div className="brand-icon-tile">
              <img src="/logo.png" alt="MilanAI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="brand-title-text">Milan<span>AI</span></div>
              <div className="brand-subtitle-text">AI-Powered Matchmaking CRM</div>
            </div>
          </div>

          <div className="headline-section">
            <h1>Where Every<br />Rishta Finds Its<em>Sahi Milan</em></h1>
            <p>India&apos;s most intelligent matchmaking platform — trusted by families across every community, every faith, every city.</p>
          </div>

          <div className="ornament-decor">— ✦ —</div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {!showSuccessScreen ? (
            <div id="formView" className="w-full">
              <div className="form-header-block">
                <h2>{activeTab === "login" ? "Welcome back" : "Create account"}</h2>
                <p>{activeTab === "login" ? "Sign in to your MilanAI account" : "Join families on MilanAI"}</p>
              </div>

              <div className="tab-switcher">
                <button 
                  type="button" 
                  className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
                  onClick={() => { setActiveTab("login"); resetSignUpForm(); }}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  className={`tab-btn ${activeTab === "signup" ? "active" : ""}`}
                  onClick={() => { setActiveTab("login"); setActiveTab("signup"); resetLoginForm(); }}
                >
                  Register
                </button>
              </div>

              {/* LOG IN FORM */}
              {activeTab === "login" && (
                <form onSubmit={handleLoginSubmit(onLogin)} className="w-full">
                  <div className="field-group" style={{ animationDelay: ".2s" }}>
                    <label className="field-label">Username</label>
                    <div className="field-wrap">
                      <User className="field-icon h-4.5 w-4.5" />
                      <input 
                        className="field-input" 
                        type="text" 
                        placeholder="Enter username" 
                        disabled={isLoading}
                        {...loginRegister("username")}
                      />
                    </div>
                    {loginErrors.username && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{loginErrors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="field-group" style={{ animationDelay: ".25s" }}>
                    <label className="field-label">Password</label>
                    <div className="field-wrap">
                      <Lock className="field-icon h-4.5 w-4.5" />
                      <input 
                        className="field-input" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your password" 
                        disabled={isLoading}
                        {...loginRegister("password")}
                      />
                      <button 
                        type="button"
                        className="eye-toggle-btn" 
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{loginErrors.password.message}</p>
                    )}
                  </div>

                  <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                  
                  <button 
                    type="submit" 
                    className={`submit-btn-custom ${isLoading ? "loading" : ""}`}
                    disabled={isLoading}
                  >
                    <span>{isLoading ? "Signing in..." : "Sign In to MilanAI"}</span>
                    {isLoading && <span className="shimmer-anim"></span>}
                  </button>
                </form>
              )}

              {/* REGISTER FORM */}
              {activeTab === "signup" && (
                <form onSubmit={handleSignUpSubmit(onSignUp)} className="w-full">
                  <div className="field-group" style={{ animationDelay: ".15s" }}>
                    <label className="field-label">Full name</label>
                    <div className="field-wrap">
                      <User className="field-icon h-4.5 w-4.5" />
                      <input 
                        className="field-input" 
                        type="text" 
                        placeholder="Your full name" 
                        disabled={isLoading}
                        {...signUpRegister("name")}
                      />
                    </div>
                    {signUpErrors.name && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{signUpErrors.name.message}</p>
                    )}
                  </div>

                  <div className="field-group" style={{ animationDelay: ".2s" }}>
                    <label className="field-label">Email address</label>
                    <div className="field-wrap">
                      <Mail className="field-icon h-4.5 w-4.5" />
                      <input 
                        className="field-input" 
                        type="email" 
                        placeholder="you@example.com" 
                        disabled={isLoading}
                        {...signUpRegister("email")}
                      />
                    </div>
                    {signUpErrors.email && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{signUpErrors.email.message}</p>
                    )}
                  </div>

                  <div className="field-group" style={{ animationDelay: ".25s" }}>
                    <label className="field-label">Create password</label>
                    <div className="field-wrap">
                      <Lock className="field-icon h-4.5 w-4.5" />
                      <input 
                        className="field-input" 
                        type={showRegPassword ? "text" : "password"} 
                        placeholder="Min. 6 characters" 
                        disabled={isLoading}
                        {...signUpRegister("password")}
                      />
                      <button 
                        type="button"
                        className="eye-toggle-btn" 
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showRegPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {signUpErrors.password && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{signUpErrors.password.message}</p>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className={`submit-btn-custom ${isLoading ? "loading" : ""}`}
                    disabled={isLoading}
                  >
                    <span>{isLoading ? "Creating Account..." : "Create My Account"}</span>
                    {isLoading && <span className="shimmer-anim"></span>}
                  </button>
                </form>
              )}

              <p className="switch-prompt" style={{ marginTop: "1.5vh" }}>
                {activeTab === "login" ? (
                  <>Don&apos;t have an account? <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("signup"); }}>Register free</a></>
                ) : (
                  <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("login"); }}>Sign in</a></>
                )}
              </p>
            </div>
          ) : (
            <div className="success-overlay">
              <div className="success-ring"><span className="success-check">✓</span></div>
              <div className="success-title">Welcome back!</div>
              <div className="success-subtitle">Redirecting to your<br />MilanAI Workstation…</div>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-inner" style={{ width: `${redirectProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

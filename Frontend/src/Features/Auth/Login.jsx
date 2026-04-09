import React from "react";
import { githubLogin } from "../Api/auth.api";
const Login = () => {
  return (
    <>
      <div className="min-h-screen bg-[#050816] flex items-center justify-center px-6">
        <div className="form-container w-[800px] h-[400px] flex rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <div className="left w-1/2 relative bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-center px-14">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent"></div>

            <div className="relative z-10">
              <h1 className="text-4xl font-medium text-emerald-400">Devnex</h1>
              <p className="text-gray-400 mt-6 text-lg leading-8">
                Browser IDE with AI assistant, bug scanner, CI/CD monitor and PR
                review — all in one place.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <span className="px-4 py-2 rounded-full bg-white/10 text-gray-300 text-sm">
                  AI Co-pilot
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10 text-gray-300 text-sm">
                  Bug Scanner
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10 text-gray-300 text-sm">
                  PR Review
                </span>
              </div>
            </div>
          </div>

          <div className="right w-1/2 flex items-center justify-center bg-[#0a0f1f]">
            <div className="w-[80%] max-w-md text-center flex flex-col ">
              <div className=" title">
                <h1 className="text-4xl font-bold text-white leading-tight">
                  Code smarter.
                </h1>
                <span className="text-green-400 text-3xl font-bold ">
                  Ship faster.
                </span>
              </div>
              <div className="mb-5 mt-10">
                <h2 className="text-1xl font-bold text-white">
                  Continue with GitHub
                </h2>
                <p className="text-gray-400 mt-1 text-sm">
                  Secure login with your GitHub account
                </p>
              </div>

              <button
                onClick={githubLogin}
                className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 transition-all duration-300 text-white font-semibold text-lg shadow-lg shadow-green-500/30"
              >
                Continue with GitHub
              </button>

              <p className="text-gray-600 text-sm mt-6">
                Needs permissions: repo • workflow • read:user
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

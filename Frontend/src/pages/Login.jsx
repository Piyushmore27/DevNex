import { loginWithGitHub } from "../utils/api";
import {
  Github,
  Zap,
  Shield,
  GitPullRequest,
  Terminal,
  Bot,
} from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center relative overflow-hidden font-poppins">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#30363d 1px,transparent 1px),linear-gradient(90deg,#30363d 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(63,185,80,0.07) 0%,transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(88,166,255,0.05) 0%,transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center max-w-lg px-6 animate-fade-in">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#238636,#1a7f37)",
              boxShadow: "0 0 24px rgba(63,185,80,0.4)",
            }}
          >
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          <div className="text-left">
            <div className="text-xl font-bold tracking-tight text-fg-default">
              DevFlow AI
            </div>
            <div className="text-xs text-fg-muted -mt-0.5">
              Online Code Editor
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold leading-tight mb-4 tracking-tight">
          Code smarter.
          <br />
          <span className="text-green">Ship faster.</span>
        </h1>
        <p className="text-fg-muted text-base leading-relaxed mb-10">
          Browser IDE with AI assistant, bug scanner,
          <br />
          CI/CD monitor and PR review — all in one place.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: <Bot size={12} />, label: "AI Co-pilot" },
            { icon: <Shield size={12} />, label: "Bug Scanner" },
            { icon: <Terminal size={12} />, label: "CI/CD Monitor" },
            { icon: <GitPullRequest size={12} />, label: "PR Review" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-subtle border border-border text-fg-muted"
            >
              <span className="text-green">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={loginWithGitHub}
          className="btn-green w-full justify-center py-3 text-base mb-4"
        >
          <Github size={18} />
          Continue with GitHub
        </button>
        <p className="text-xs text-fg-subtle leading-relaxed">
          Needs permissions:{" "}
          <code className="bg-subtle px-1.5 py-0.5 rounded text-[11px]">
            repo
          </code>{" "}
          <code className="bg-subtle px-1.5 py-0.5 rounded text-[11px]">
            workflow
          </code>{" "}
          <code className="bg-subtle px-1.5 py-0.5 rounded text-[11px]">
            read:user
          </code>
        </p>
      </div>
    </div>
  );
}

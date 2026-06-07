"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "./ui/toast";
import { Button } from "./ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { 
  Users, 
  Send, 
  Calendar,
  PhoneCall, 
  Settings, 
  LogOut, 
  TrendingUp,
  Sparkles,
  ChevronRight,
  Loader2
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Dialog state for AI Insight
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Read view query param
  const activeView = searchParams.get("view") || "directory";

  const handleLogout = () => {
    localStorage.removeItem("matchmaker-session");
    localStorage.removeItem("matchmaker-user");
    document.cookie = "matchmaker-username=; path=/; max-age=0";
    toast("Logged Out", "You have been securely logged out.", "info");
    router.push("/login");
  };

  const handleOpenAiInsight = () => {
    setIsAiModalOpen(true);
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500); // Dynamic feel
  };

  const menuItems = [
    {
      name: "Workspace Directory",
      view: "directory",
      href: "/dashboard?view=directory",
      icon: Users,
      active: (pathname === "/dashboard" && activeView === "directory") || pathname.startsWith("/customer"),
    },
    {
      name: "Customer Journey",
      view: "journey",
      href: "/dashboard?view=journey",
      icon: TrendingUp,
      active: pathname === "/dashboard" && activeView === "journey",
    },
    {
      name: "Sent Suggestions",
      view: "matches",
      href: "/dashboard?view=matches",
      icon: Send,
      active: pathname === "/dashboard" && activeView === "matches",
    },
    {
      name: "Scheduled Meetings",
      view: "meetings",
      href: "/dashboard?view=meetings",
      icon: Calendar,
      active: pathname === "/dashboard" && activeView === "meetings",
    },
    {
      name: "Consultation Logs",
      view: "logs",
      href: "/dashboard?view=logs",
      icon: PhoneCall,
      active: pathname === "/dashboard" && activeView === "logs",
    },
    {
      name: "CRM Settings",
      view: "settings",
      href: "/dashboard?view=settings",
      icon: Settings,
      active: pathname === "/dashboard" && activeView === "settings",
    }
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen bg-[#120A2B] text-[#EBE5F7] border-r border-[#2b1e52]/40 shrink-0 sticky top-0 z-30">
        {/* Branding Header Block */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-[#2b1e52]/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white overflow-hidden p-0 border border-[#2b1e52]/40 shrink-0 select-none">
            <img src="/logo.png" alt="MilanAI Logo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-none bg-gradient-to-r from-[#FF4500] to-[#E91E63] bg-clip-text text-transparent">
              MilanAI
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b8b99] mt-0.5">
              Matchmaking CRM
            </span>
          </div>
        </div>

        {/* Nav Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer group border-l-3 border-transparent",
                  item.active 
                    ? "bg-[rgba(255,69,0,0.15)] text-[#FF4500] border-l-[#FF4500] rounded-l-none" 
                    : "text-[#EBE5F7]/70 hover:bg-white/5 hover:text-[#EBE5F7]"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  item.active ? "text-[#FF4500]" : "text-[#EBE5F7]/50 group-hover:text-[#EBE5F7]"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Generate AI Insight button container */}
        <div className="px-4 py-4 border-t border-[#2b1e52]/40 space-y-3">
          <Button
            onClick={handleOpenAiInsight}
            className="w-full font-bold uppercase tracking-wider text-[10px] h-10 bg-[#FF4500] hover:bg-[#E63E00] text-white flex items-center justify-center gap-1.5 rounded-lg cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="h-3.5 w-3.5 fill-current animate-pulse" />
            Generate AI Insight
          </Button>

          {/* Footer / Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-[#EBE5F7]/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Exit CRM
          </button>
        </div>
      </aside>

      {/* AI Insight Dialog Modal */}
      <Dialog isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 font-serif font-bold text-primary uppercase tracking-wider text-sm">
            <Sparkles className="h-4 w-4 fill-current text-primary" />
            ✨ MilanAI Executive CRM Insights
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            AI compiled diagnostics of active client pipelines and recommendations.
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="my-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-text-secondary font-medium animate-pulse">Running neural pipeline analysis...</span>
          </div>
        ) : (
          <div className="my-4 space-y-4 text-xs text-foreground">
            {/* Main summary card */}
            <div className="bg-primary-light border border-primary/20 p-4 rounded-xl space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">AI Summary Diagnostics</span>
              <p className="leading-relaxed font-serif italic text-sm text-text-secondary">
                &quot;Pairing velocity is up 12% this month. Recommended candidates with high Values Alignment show a 68.4% acceptance rating when sent with personalized AI introduction logs.&quot;
              </p>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border-custom p-3 rounded-xl bg-surface space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase block">Search Concentrator</span>
                <span className="text-xs font-bold text-primary">Mumbai & Bangalore</span>
                <p className="text-[9px] text-text-muted leading-normal mt-0.5">75% of active pipelines reside in tier-1 tech hubs.</p>
              </div>
              <div className="border border-border-custom p-3 rounded-xl bg-surface space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase block">Friction Concentrator</span>
                <span className="text-xs font-bold text-red-500">Horoscope & Location</span>
                <p className="text-[9px] text-text-muted leading-normal mt-0.5">38% of candidate pairing drop-offs cite Manglik or relocation mismatch.</p>
              </div>
            </div>

            {/* Actionable recommendations */}
            <div className="space-y-2 border-t border-border-custom pt-3">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">CRM Optimization Tips</span>
              <ul className="space-y-1.5 text-[11px] text-text-secondary">
                <li className="flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 shrink-0 text-primary mt-0.5" />
                  <span>Recommend client leads upload annual income to increase potential match suggestions by 18%.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 shrink-0 text-primary mt-0.5" />
                  <span>Prioritize &quot;Meeting Scheduled&quot; status follow-ups; conversion to &quot;Engaged&quot; is highest on 4-day intervals.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            size="sm"
            onClick={() => setIsAiModalOpen(false)}
            className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs cursor-pointer px-4 h-9"
          >
            Done
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

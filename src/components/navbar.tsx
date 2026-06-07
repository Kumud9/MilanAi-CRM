"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { LogOut, Heart, User, Sparkles, Trophy, Bell, BellRing, Trash2, Shield, Calendar, PlusCircle, Check, Info } from "lucide-react";
import { useToast } from "./ui/toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Notification } from "@/lib/types";

export function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState("Matchmaker Admin");
  const [userEmail, setUserEmail] = useState("admin@milanai.com");
  const [matchesCount, setMatchesCount] = useState(0);

  // Profile modal states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpenNotifications, setIsOpenNotifications] = useState(false);

  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return Calendar;
      case 'new_entry':
        return PlusCircle;
      case 'security':
        return Shield;
      case 'status_change':
        return Heart;
      default:
        return Info;
    }
  };

  const handleMarkAsRead = (id: string) => {
    const stored = JSON.parse(localStorage.getItem("tdc-notifications") || "[]");
    const updated = stored.map((n: Notification) => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem("tdc-notifications", JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event("tdc-notifications-updated"));
  };

  const handleMarkAllRead = () => {
    const stored = JSON.parse(localStorage.getItem("tdc-notifications") || "[]");
    const updated = stored.map((n: Notification) => ({ ...n, read: true }));
    localStorage.setItem("tdc-notifications", JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event("tdc-notifications-updated"));
    toast("Notifications Read", "All alerts marked as read.", "success");
  };

  const handleClearAll = () => {
    localStorage.setItem("tdc-notifications", JSON.stringify([]));
    setNotifications([]);
    window.dispatchEvent(new Event("tdc-notifications-updated"));
    toast("Notifications Cleared", "Notification queue cleared.", "info");
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setIsOpenNotifications(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  useEffect(() => {
    // Load logged in user name and email
    const storedUser = localStorage.getItem("matchmaker-user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed) {
          if (parsed.name) {
            setUserName(parsed.name);
            setEditName(parsed.name);
          }
          if (parsed.email) {
            setUserEmail(parsed.email);
            setEditEmail(parsed.email);
          }
        }
      } catch (err) {
        console.error("Failed to parse user session:", err);
      }
    }

    // Load matches count
    const history = JSON.parse(localStorage.getItem("tdc-match-history") || "[]");
    setMatchesCount(history.length);

    // Initialize and load notifications
    let storedNotifications = JSON.parse(localStorage.getItem("tdc-notifications") || "[]");
    if (storedNotifications.length === 0) {
      const defaultNotifications = [
        {
          id: "n_seed1",
          title: "Meeting Scheduled",
          message: "Amit Choudhury (M001) & Priya Patel (F001) are set for a safety-cleared public match at Taj Mahal Palace, Mumbai.",
          type: "reminder",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
          read: false,
          link: "/dashboard?view=meetings"
        },
        {
          id: "n_seed2",
          title: "New Registration",
          message: "High-tier premium member Rohit Das (M002) is verified and added to Mumbai active search list.",
          type: "new_entry",
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3h ago
          read: false,
          link: "/customer/M002"
        },
        {
          id: "n_seed3",
          title: "Security Verified",
          message: "Security Clearance Level: Elite. Assigned Senior Officer Vikram Singh to Taj Mahal Palace meeting.",
          type: "security",
          timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6h ago
          read: true,
          link: "/dashboard?view=meetings"
        }
      ];
      localStorage.setItem("tdc-notifications", JSON.stringify(defaultNotifications));
      storedNotifications = defaultNotifications;
    }
    setNotifications(storedNotifications);

    const handleUpdateNotifications = () => {
      const stored = JSON.parse(localStorage.getItem("tdc-notifications") || "[]");
      setNotifications(stored);
    };

    window.addEventListener("tdc-notifications-updated", handleUpdateNotifications);
    return () => {
      window.removeEventListener("tdc-notifications-updated", handleUpdateNotifications);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("matchmaker-session");
    localStorage.removeItem("matchmaker-user");
    toast("Logged Out", "You have been securely logged out.", "info");
    router.push("/login");
  };

  const handleOpenProfile = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    // Refresh matches count in case matches were sent
    const history = JSON.parse(localStorage.getItem("tdc-match-history") || "[]");
    setMatchesCount(history.length);
    setIsProfileOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) return;

    const storedUser = localStorage.getItem("matchmaker-user");
    let updatedUser = {};
    if (storedUser) {
      try {
        updatedUser = JSON.parse(storedUser);
      } catch (err) {
        console.error(err);
      }
    }

    const newUserObj = {
      ...updatedUser,
      name: editName,
      email: editEmail
    };

    localStorage.setItem("matchmaker-user", JSON.stringify(newUserObj));
    setUserName(editName);
    setUserEmail(editEmail);
    setIsProfileOpen(false);
    toast("Profile Updated", "Matchmaker account profile updated successfully.", "success");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border-custom bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Branding Logo - Playfair Display font */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white overflow-hidden p-0 border border-border-custom shadow-xs shrink-0 select-none">
              <img src="/logo.png" alt="MilanAI Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MilanAI
              </span>
              <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
                AI-Powered Matchmaking CRM
              </span>
            </div>
          </Link>

          {/* Action Controls */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpenNotifications(!isOpenNotifications)}
                className="text-text-secondary hover:text-primary relative cursor-pointer"
                title="Notification Hub"
              >
                {notifications.some(n => !n.read) ? (
                  <>
                    <BellRing className="h-5 w-5 text-primary animate-bounce" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
                  </>
                ) : (
                  <Bell className="h-5 w-5" />
                )}
              </Button>

              {/* Click outside overlay */}
              {isOpenNotifications && (
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsOpenNotifications(false)} 
                />
              )}

              {/* Popover Dropdown Panel */}
              {isOpenNotifications && (
                <div className="absolute right-[-60px] md:right-0 mt-3 w-80 sm:w-96 rounded-xl border border-border-custom bg-surface p-4 shadow-xl z-50 animate-fade-in text-foreground">
                  <div className="flex items-center justify-between border-b border-border-custom pb-2.5 mb-3 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-primary" />
                      Notification Hub
                    </h3>
                    <div className="flex gap-2">
                      {notifications.some(n => !n.read) && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-[10px] font-bold text-text-muted hover:text-red-500 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin select-none">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-text-muted italic">
                        No active notifications.
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "flex gap-3 p-2.5 rounded-lg border transition-all cursor-pointer",
                              notification.read
                                ? "bg-surface border-border-custom/35 opacity-75 hover:opacity-100"
                                : "bg-primary-light/50 border-primary/20 hover:bg-primary-light/75"
                            )}
                          >
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white",
                              notification.type === 'reminder' && "bg-amber-500",
                              notification.type === 'new_entry' && "bg-emerald-500",
                              notification.type === 'security' && "bg-blue-500",
                              notification.type === 'status_change' && "bg-purple-500",
                              notification.type === 'info' && "bg-gray-500"
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5 text-left">
                              <div className="flex justify-between items-start gap-1">
                                <span className={cn(
                                  "text-xs font-bold truncate block",
                                  notification.read ? "text-text-primary" : "text-primary"
                                )}>
                                  {notification.title}
                                </span>
                                <span className="text-[9px] text-text-muted whitespace-nowrap pt-0.5">
                                  {getRelativeTime(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-normal line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {/* Mark read button inside unread notifications */}
                              {!notification.read && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="text-[9px] font-bold text-accent hover:underline mt-1 flex items-center gap-0.5"
                                >
                                  <Check className="h-3 w-3" />
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-border-custom" />

            {/* User Info Profile - Clickable to open user profile modal */}
            <div 
              onClick={handleOpenProfile}
              className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity bg-surface-secondary p-1.5 rounded-full md:pr-4"
              title="View your Profile"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">{userName}</p>
                <p className="text-[10px] text-text-muted leading-none mt-0.5">Matchmaker Admin</p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-text-secondary hover:text-red-650 cursor-pointer"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <Dialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}>
        <form onSubmit={handleSaveProfile}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 font-serif font-bold text-primary uppercase tracking-wider text-sm">
              <Sparkles className="h-4 w-4 fill-current text-primary" />
              Matchmaker Account Workstation
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              View diagnostics and edit personal credentials for this secure MilanAI session.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4 text-xs">
            {/* Stats block */}
            <div className="grid grid-cols-3 gap-3 border border-border-custom p-3.5 rounded-xl bg-gradient-to-b from-surface to-background text-foreground">
              <div className="text-center space-y-0.5">
                <span className="text-[9px] font-bold text-text-muted uppercase block">Assigned Clients</span>
                <span className="text-base font-bold text-primary">200</span>
              </div>
              <div className="text-center space-y-0.5 border-x border-border-custom">
                <span className="text-[9px] font-bold text-text-muted uppercase block">Matches Logged</span>
                <span className="text-base font-bold text-primary">{matchesCount}</span>
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-[9px] font-bold text-text-muted uppercase block">Target Success</span>
                <span className="text-base font-bold text-primary">68.4%</span>
              </div>
            </div>

            {/* Input fields */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="profile-name">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  placeholder="Matchmaker Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="profile-email">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  placeholder="matchmaker@milanai.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  CRM Role
                </label>
                <div className="w-full rounded-lg border border-border-custom bg-surface-secondary py-2 px-3 text-sm text-text-secondary flex items-center gap-1.5 select-none font-semibold">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  Lead Matrimonial Administrator
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(false)}
                className="h-9 text-xs cursor-pointer px-4 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs bg-primary hover:bg-primary-hover text-white cursor-pointer px-4 font-semibold"
              >
                Save Profile
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}

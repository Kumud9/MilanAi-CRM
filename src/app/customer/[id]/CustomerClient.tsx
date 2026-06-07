"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Profile, Note, MatchHistory, CompatibilityAdvisorResult } from "@/lib/types";
import { findMatches, MatchResult } from "@/lib/matcher";
import { calculateProfileCompletion, formatCurrency, formatHeight, cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { jsPDF } from "jspdf";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Heart, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  History,
  Trash2,
  Plus,
  Edit2,
  Star,
  Copy,
  RefreshCw,
  Send,
  Loader2,
  FileDown,
  Info
} from "lucide-react";

interface CustomerClientProps {
  targetProfile: Profile;
  allProfiles: Profile[];
}

export default function CustomerClient({ targetProfile, allProfiles }: CustomerClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Active Profile Details tabs
  const [activeTab, setActiveTab] = useState<'personal' | 'career' | 'lifestyle' | 'notes' | 'history'>('personal');

  // Favorites & Recents state
  const [isFavorite, setIsFavorite] = useState(false);
  const [journeyStatus, setJourneyStatus] = useState<Profile['journeyStatus']>(targetProfile.journeyStatus);

  // Notes CRM Module states
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [isProcessingNoteAi, setIsProcessingNoteAi] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Matching states
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [compatibilityCache, setCompatibilityCache] = useState<Record<string, CompatibilityAdvisorResult & { loading: boolean }>>({});
  
  // Send Match dialog states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Profile | null>(null);
  const [selectedScore, setSelectedScore] = useState<number>(0);
  const [introLetter, setIntroLetter] = useState("");
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);

  // Calculate profile completion
  const completionPercentage = useMemo(() => calculateProfileCompletion({
    ...targetProfile,
    journeyStatus,
  }), [targetProfile, journeyStatus]);

  // Compute Algorithmic matches
  useEffect(() => {
    const suggestions = findMatches(targetProfile, allProfiles);
    setMatches(suggestions);
  }, [targetProfile, allProfiles]);

  // Read / write local logs (favorites, notes, view count)
  useEffect(() => {
    // 1. Favorites toggle check
    const favs: string[] = JSON.parse(localStorage.getItem("tdc-favorites") || "[]");
    setIsFavorite(favs.includes(targetProfile.id));

    // 2. Load custom notes
    const storedNotes = JSON.parse(localStorage.getItem(`tdc-notes-${targetProfile.id}`) || "[]");
    setNotes(storedNotes);

    // 3. Load sent match history (both sent and received suggestions)
    const allHistory: MatchHistory[] = JSON.parse(localStorage.getItem("tdc-match-history") || "[]");
    const clientHistory = allHistory.filter((h) => h.customerId === targetProfile.id || h.matchId === targetProfile.id);
    setMatchHistory(clientHistory);

    // 4. Load overridden status from localStorage
    const localStatusOverrides = JSON.parse(localStorage.getItem("tdc-profile-statuses") || "{}");
    if (localStatusOverrides[targetProfile.id]) {
      setJourneyStatus(localStatusOverrides[targetProfile.id]);
    }

    // 5. Save to recently viewed list
    const recents: string[] = JSON.parse(localStorage.getItem("tdc-recent-profiles") || "[]");
    const updatedRecents = [targetProfile.id, ...recents.filter((id) => id !== targetProfile.id)].slice(0, 5);
    localStorage.setItem("tdc-recent-profiles", JSON.stringify(updatedRecents));
  }, [targetProfile.id]);

  const toggleFavorite = () => {
    const favs: string[] = JSON.parse(localStorage.getItem("tdc-favorites") || "[]");
    let updated: string[];
    if (isFavorite) {
      updated = favs.filter((id) => id !== targetProfile.id);
      toast("Removed from Favorites", `${targetProfile.firstName} removed from favorites list.`, "info");
    } else {
      updated = [...favs, targetProfile.id];
      toast("Added to Favorites", `${targetProfile.firstName} added to favorites list.`, "success");
    }
    localStorage.setItem("tdc-favorites", JSON.stringify(updated));
    setIsFavorite(!isFavorite);
  };

  const handleUpdateStatus = (newStatus: Profile['journeyStatus']) => {
    setJourneyStatus(newStatus);
    // Write back status updates to profiles.json (mimic in UI/localStorage database index overrides)
    const localStatusOverrides = JSON.parse(localStorage.getItem("tdc-profile-statuses") || "{}");
    localStatusOverrides[targetProfile.id] = newStatus;
    localStorage.setItem("tdc-profile-statuses", JSON.stringify(localStatusOverrides));
    toast("Pipeline Stage Updated", `Customer journey status set to ${newStatus}.`, "success");
  };

  const handleUpdateMatchStatus = (historyId: string, newStatus: MatchHistory['status']) => {
    const allHistory: MatchHistory[] = JSON.parse(localStorage.getItem("tdc-match-history") || "[]");
    const updatedHistory = allHistory.map((h) => {
      if (h.id === historyId) {
        return { ...h, status: newStatus };
      }
      return h;
    });
    localStorage.setItem("tdc-match-history", JSON.stringify(updatedHistory));
    
    // Refresh local match history state
    setMatchHistory(updatedHistory.filter((h) => h.customerId === targetProfile.id || h.matchId === targetProfile.id));

    toast("Match Status Updated", `Recommendation status set to ${newStatus}.`, "success");
  };

  // Notes CRM CRUD
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    setIsProcessingNoteAi(true);
    let aiInsights: Note['aiInsights'] = undefined;

    try {
      const response = await fetch("/api/notes-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawNotes: noteInput }),
      });
      if (response.ok) {
        aiInsights = await response.json();
      }
    } catch (err) {
      console.error("AI notes extraction error:", err);
    }

    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9),
      customerId: targetProfile.id,
      content: noteInput,
      createdAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      aiInsights
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(`tdc-notes-${targetProfile.id}`, JSON.stringify(updated));
    setNoteInput("");
    setIsProcessingNoteAi(false);
    toast("Note Added Successfully", aiInsights ? "AI structured insights parsed." : "Note saved without AI analysis.", "success");
  };

  const handleStartEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEditNote = async (id: string) => {
    if (!editingContent.trim()) return;
    
    setIsProcessingNoteAi(true);
    let aiInsights: Note['aiInsights'] = undefined;

    try {
      const response = await fetch("/api/notes-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawNotes: editingContent }),
      });
      if (response.ok) {
        aiInsights = await response.json();
      }
    } catch (err) {
      console.error("AI notes re-extraction error:", err);
    }

    const updated = notes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          content: editingContent,
          createdAt: `${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (edited)`,
          aiInsights
        };
      }
      return n;
    });

    setNotes(updated);
    localStorage.setItem(`tdc-notes-${targetProfile.id}`, JSON.stringify(updated));
    setEditingNoteId(null);
    setEditingContent("");
    setIsProcessingNoteAi(false);
    toast("Note Updated", "Modifications saved with updated AI structured insights.", "success");
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem(`tdc-notes-${targetProfile.id}`, JSON.stringify(updated));
    toast("Note Deleted", "Note removed from customer records.", "info");
  };

  // AI compatibility calculator check
  const requestCompatibilityAnalysis = async (candidateId: string, algoScore: number, reasons: string[]) => {
    // Check cache
    if (compatibilityCache[candidateId]) return;

    setCompatibilityCache((prev) => ({
      ...prev,
      [candidateId]: { score: algoScore, strengths: [], concerns: [], recommendation: "Analyzing...", explanation: "Analyzing compatibility...", loading: true }
    }));

    try {
      const response = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetProfile.id,
          candidateId,
          score: algoScore,
          reasons,
        }),
      });

      if (response.ok) {
        const analysis: CompatibilityAdvisorResult = await response.json();
        setCompatibilityCache((prev) => ({
          ...prev,
          [candidateId]: { ...analysis, loading: false }
        }));
        toast("Compatibility Advisor Ready", "AI match compatibility evaluation completed.", "success");
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error("Compatibility advisor error:", err);
      // Remove loading state on failure
      setCompatibilityCache((prev) => {
        const copy = { ...prev };
        delete copy[candidateId];
        return copy;
      });
      toast("Analysis Failed", "Could not complete OpenAI evaluation. Try again.", "error");
    }
  };

  // AI Introduction generator flow
  const handleOpenSendModal = async (candidate: Profile, score: number) => {
    setSelectedCandidate(candidate);
    setSelectedScore(score);
    setIsSendModalOpen(true);
    setIsGeneratingIntro(true);

    // Get matching compatibility explanation from cache if available, else use a general explanation
    const cache = compatibilityCache[candidate.id];
    const explanation = cache ? cache.explanation : "";

    try {
      const response = await fetch("/api/intro-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetProfile.id,
          candidateId: candidate.id,
          aiExplanation: explanation
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIntroLetter(result.intro);
      } else {
        throw new Error("Failed to load intro letter");
      }
    } catch (err) {
      console.error("Intro generation error:", err);
      setIntroLetter(`Hi ${targetProfile.firstName},\n\nWe would like to introduce ${candidate.firstName}, a ${candidate.career.designation} based in ${candidate.city}. Based on our review, you share strong alignment. We believe this is worth exploring.\n\nWarm Regards,\nMilanAI`);
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  const handleRegenerateIntro = async () => {
    if (!selectedCandidate) return;
    setIsGeneratingIntro(true);
    const cache = compatibilityCache[selectedCandidate.id];
    const explanation = cache ? cache.explanation : "";

    try {
      const response = await fetch("/api/intro-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetProfile.id,
          candidateId: selectedCandidate.id,
          aiExplanation: explanation + " Please phrase it differently this time."
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setIntroLetter(result.intro);
        toast("Message Regenerated", "A new personalized introduction has been written by AI.", "success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  const handleCopyIntro = () => {
    navigator.clipboard.writeText(introLetter);
    toast("Copied to Clipboard", "Introduction message copied to clipboard.", "success");
  };

  const handleConfirmSendMatch = () => {
    if (!selectedCandidate) return;

    // Add match record to localStorage
    const newLog: MatchHistory = {
      id: Math.random().toString(36).substring(2, 9),
      customerId: targetProfile.id,
      matchId: selectedCandidate.id,
      matchName: `${selectedCandidate.firstName} ${selectedCandidate.lastName}`,
      matchGender: selectedCandidate.gender,
      date: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      score: selectedScore,
      status: 'Sent',
      journeyStatus: selectedCandidate.journeyStatus,
      introMessage: introLetter
    };

    const allHistory: MatchHistory[] = JSON.parse(localStorage.getItem("tdc-match-history") || "[]");
    const updatedHistory = [newLog, ...allHistory];
    localStorage.setItem("tdc-match-history", JSON.stringify(updatedHistory));
    
    // Filter history for this client
    setMatchHistory(updatedHistory.filter((h) => h.customerId === targetProfile.id));

    // Update journey status of client to "Matched" automatically!
    handleUpdateStatus("Matched");

    setIsSendModalOpen(false);
    setSelectedCandidate(null);
    setIntroLetter("");

    toast("Match Sent Successfully", `Introduction message logged in history. Client journey updated to Matched.`, "success");
  };

  // PDF Export utility
  const exportProfilePDF = () => {
    try {
      const doc = new jsPDF();
      const p = targetProfile;

      // Color scheme
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, 210, 35, 'F');

      // Title header
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("MILANAI", 15, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("CONFIDENTIAL MATRIMONIAL PROFILE", 15, 25);
      doc.text(`ID: ${p.id}  |  STATUS: ${journeyStatus.toUpperCase()}`, 130, 25);

      // Section divider
      doc.setTextColor(30, 41, 59);
      
      let y = 50;

      const addHeader = (title: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, 15, y);
        doc.setDrawColor(226, 232, 240); // zinc-200
        doc.line(15, y + 2, 195, y + 2);
        y += 10;
      };

      const addRow = (label1: string, val1: string, label2: string, val2: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(label1 + ":", 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(val1, 45, y);

        doc.setFont("helvetica", "bold");
        doc.text(label2 + ":", 110, y);
        doc.setFont("helvetica", "normal");
        doc.text(val2, 140, y);
        
        y += 7;
      };

      // 1. Personal Details
      addHeader("1. PERSONAL DETAILS");
      addRow("Full Name", `${p.firstName} ${p.lastName}`, "Gender", p.gender.toUpperCase());
      addRow("DOB (Age)", `${p.dob} (${p.age} Yrs)`, "Height", formatHeight(p.height));
      addRow("Mother Tongue", p.motherTongue, "Manglik Status", p.manglik);
      addRow("Location", `${p.city}, ${p.country}`, "Email ID", p.email);
      addRow("Phone Number", p.phone, "Hobbies", p.hobbies.slice(0, 3).join(", "));
      
      y += 5;

      // 2. Education & Career
      addHeader("2. EDUCATION & PROFESSIONAL DETAILS");
      addRow("Degree", p.education.degree, "College / University", p.education.college);
      addRow("Designation", p.career.designation, "Company Name", p.career.company);
      addRow("Annual Income", formatCurrency(p.career.income), "Career Status", "Active Professional");

      y += 5;

      // 3. Family & Lifestyle
      addHeader("3. FAMILY & LIFESTYLE INFORMATION");
      addRow("Religion", p.family.religion, "Caste / Sect", p.family.caste);
      addRow("Family Type", p.family.familyType, "Siblings Count", String(p.family.siblings));
      addRow("Dietary Habits", p.lifestyle.diet, "Smoking Hab", p.lifestyle.smoking);
      addRow("Drinking Hab", p.lifestyle.drinking, "", "");

      y += 5;

      // 4. Partner Preferences
      addHeader("4. DESIRED PARTNER PREFERENCES");
      addRow("Age Range", `${p.preferences.preferredAgeRange.min} - ${p.preferences.preferredAgeRange.max} Yrs`, "Education Prefer", p.preferences.educationPreference);
      addRow("Preferred Cities", p.preferences.preferredLocation.join(", "), "Relocation Pref", p.preferences.openToRelocate);
      addRow("Want Children", p.preferences.wantKids, "Open to Pets", p.preferences.openToPets);

      // Save PDF
      doc.save(`TDC_Profile_${p.firstName}_${p.lastName}.pdf`);
      toast("PDF Exported", "Confidential customer report downloaded successfully.", "success");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast("Export Failed", "Could not generate PDF file.", "error");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Suspense fallback={<div className="hidden md:block w-64 bg-[#120A2B]" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Subtle geometric mandala watermark */}
        <div className="absolute inset-0 opacity-[0.015] select-none pointer-events-none flex items-center justify-center">
          <svg className="w-[60%] h-[60%] text-primary" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" fill="none" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              return (
                <line 
                  key={i} 
                  x1="50" 
                  y1="50" 
                  x2={50 + 45 * Math.cos((angle * Math.PI) / 180)} 
                  y2={50 + 45 * Math.sin((angle * Math.PI) / 180)} 
                  stroke="currentColor" 
                  strokeWidth="0.3" 
                />
              );
            })}
          </svg>
        </div>

        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10 w-full">
        {/* Navigation Back */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportProfilePDF}
              className="gap-2 cursor-pointer"
            >
              <FileDown className="h-4 w-4 text-text-secondary" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFavorite}
              className={cn("gap-1.5 cursor-pointer", {
                "text-accent hover:text-accent bg-accent/10 border-accent/20": isFavorite
              })}
            >
              <Star className={cn("h-4 w-4", { "fill-current": isFavorite })} />
              {isFavorite ? "Favorited" : "Favorite"}
            </Button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Brief Summary card */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="shadow-xs overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-primary" />
              <CardHeader className="items-center text-center pb-4 pt-8">
                <img 
                  src={targetProfile.avatar} 
                  alt={`${targetProfile.firstName} ${targetProfile.lastName}`}
                  className="h-28 w-28 rounded-full border-2 border-border-custom bg-surface-secondary p-1 mb-4 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${targetProfile.firstName} ${targetProfile.lastName}`;
                  }}
                />
                <Badge status={journeyStatus} className="mb-2 text-xs font-semibold">{journeyStatus}</Badge>
                <CardTitle className="text-xl font-bold flex items-center justify-center gap-1.5 text-text-primary">
                  {targetProfile.firstName} {targetProfile.lastName}
                </CardTitle>
                <CardDescription className="text-text-secondary text-xs">
                  ID: {targetProfile.id} • Registered Customer
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 border-t border-border-custom pt-6">
                {/* Profile Completion percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                    <span>Profile Completeness</span>
                    <strong className="text-primary font-bold">{completionPercentage}%</strong>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>

                {/* Info List */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-text-secondary">
                    <User className="h-4.5 w-4.5 text-text-muted" />
                    <span>{targetProfile.age} Yrs old • {formatHeight(targetProfile.height)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <MapPin className="h-4.5 w-4.5 text-text-muted" />
                    <span>{targetProfile.city}, India</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <GraduationCap className="h-4.5 w-4.5 text-text-muted" />
                    <span className="truncate">{targetProfile.education.degree}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Briefcase className="h-4.5 w-4.5 text-text-muted" />
                    <span className="truncate">{targetProfile.career.designation} at {targetProfile.career.company}</span>
                  </div>
                </div>

                {/* CRM Stage Controls */}
                <div className="space-y-2 border-t border-border-custom pt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">
                    Relationship Pipeline Stage
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Verified", "Searching", "Matched", "Meeting Scheduled", "Engaged", "Married", "Inactive"].map((stage) => (
                      <Button
                        key={stage}
                        variant={journeyStatus === stage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateStatus(stage as Profile['journeyStatus'])}
                        className={cn("h-8 text-[11px] font-semibold justify-center cursor-pointer", {
                          "border-border-custom text-text-secondary hover:bg-surface-secondary": journeyStatus !== stage
                        })}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Compatibility Metrics Panel */}
            <Card className="shadow-xs overflow-hidden relative">
              <CardHeader className="pb-3 pt-6 border-b border-border-custom">
                <CardTitle className="text-xs font-serif font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  ✨ AI Compatibility Metrics
                </CardTitle>
                <CardDescription className="text-[10px] text-text-muted">
                  Algorithmic alignment with active candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Family Values</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} indicatorClassName="bg-gradient-to-r from-primary to-accent" className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Lifestyle</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} indicatorClassName="bg-gradient-to-r from-primary to-accent" className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Career Alignment</span>
                    <span>89%</span>
                  </div>
                  <Progress value={89} indicatorClassName="bg-gradient-to-r from-primary to-accent" className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Location Fit</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} indicatorClassName="bg-gradient-to-r from-primary to-accent" className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-text-secondary">
                    <span>Children Preference</span>
                    <span>100%</span>
                  </div>
                  <Progress value={100} indicatorClassName="bg-gradient-to-r from-primary to-accent" className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle/Right Columns: Detailed Tabs and Suggestions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Nav Tabs */}
            <div className="flex border-b border-border-custom overflow-x-auto p-0.5 scrollbar-thin">
              {[
                { id: 'personal', label: 'Personal & Family', icon: User },
                { id: 'career', label: 'Education & Career', icon: Briefcase },
                { id: 'lifestyle', label: 'Lifestyle & Partner', icon: Heart },
                { id: 'notes', label: 'CRM Call Notes', icon: FileText },
                { id: 'history', label: 'Match History', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'personal' | 'career' | 'lifestyle' | 'notes' | 'history')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 border-transparent transition-colors text-text-secondary hover:text-text-primary cursor-pointer whitespace-nowrap",
                      isSelected && "border-primary text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <Card className="shadow-xs border-border-custom">
              <CardContent className="pt-6">
                {/* 1. Personal Info */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">First Name</span>
                        <span className="font-semibold text-text-primary">{targetProfile.firstName}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Last Name</span>
                        <span className="font-semibold text-text-primary">{targetProfile.lastName}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Gender</span>
                        <span className="font-semibold text-text-primary capitalize">{targetProfile.gender}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Date of Birth (Age)</span>
                        <span className="font-semibold text-text-primary">{targetProfile.dob} ({targetProfile.age} Years)</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Height</span>
                        <span className="font-semibold text-text-primary">{formatHeight(targetProfile.height)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Mother Tongue</span>
                        <span className="font-semibold text-text-primary">{targetProfile.motherTongue}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Email Address</span>
                        <span className="font-semibold text-text-primary">{targetProfile.email}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Phone Number</span>
                        <span className="font-semibold text-text-primary">{targetProfile.phone}</span>
                      </div>
                    </div>

                    <div className="border-t border-border-custom/50 pt-4 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Family Background</h3>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Religion</span>
                          <span className="font-semibold text-text-primary">{targetProfile.family.religion}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Caste / Sub-Caste</span>
                          <span className="font-semibold text-text-primary">{targetProfile.family.caste}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Manglik Status</span>
                          <span className="font-semibold text-text-primary">{targetProfile.manglik}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Family Structure</span>
                          <span className="font-semibold text-text-primary">{targetProfile.family.familyType} Family</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Siblings Count</span>
                          <span className="font-semibold text-text-primary">{targetProfile.family.siblings} Siblings</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Education & Career */}
                {activeTab === 'career' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Educational Qualification</span>
                        <span className="font-semibold text-text-primary">{targetProfile.education.degree}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">College / University</span>
                        <span className="font-semibold text-text-primary">{targetProfile.education.college}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Employer / Company</span>
                        <span className="font-semibold text-text-primary">{targetProfile.career.company}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Professional Designation</span>
                        <span className="font-semibold text-text-primary">{targetProfile.career.designation}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Annual Income</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(targetProfile.career.income)} / Year</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Employment Status</span>
                        <span className="font-semibold text-text-primary">Full Time Employee</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Lifestyle & Preferences */}
                {activeTab === 'lifestyle' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Dietary Habits</span>
                        <span className="font-semibold text-text-primary">{targetProfile.lifestyle.diet}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Smoking Habits</span>
                        <span className="font-semibold text-text-primary">{targetProfile.lifestyle.smoking}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Drinking Habits</span>
                        <span className="font-semibold text-text-primary">{targetProfile.lifestyle.drinking}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-text-muted block font-medium">Hobbies & Interests</span>
                        <span className="font-semibold text-text-primary truncate">{targetProfile.hobbies.join(', ')}</span>
                      </div>
                    </div>

                    <div className="border-t border-border-custom/50 pt-4 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Desired Partner Preferences</h3>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Preferred Age Range</span>
                          <span className="font-semibold text-text-primary">{targetProfile.preferences.preferredAgeRange.min} to {targetProfile.preferences.preferredAgeRange.max} Years</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Preferred Locations</span>
                          <span className="font-semibold text-text-primary">{targetProfile.preferences.preferredLocation.join(', ')}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Education Requirement</span>
                          <span className="font-semibold text-text-primary">{targetProfile.preferences.educationPreference}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Wants Children</span>
                          <span className="font-semibold text-text-primary">{targetProfile.preferences.wantKids}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Open to Relocation</span>
                          <span className="font-semibold text-text-primary">{targetProfile.preferences.openToRelocate}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-text-muted block font-medium">Allows Pets</span>
                          <span className="font-semibold text-text-primary">{targetProfile.preferences.openToPets}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Notes CRM Module */}
                {activeTab === 'notes' && (
                  <div className="space-y-6">
                    {/* Add note input form */}
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <label className="text-xs font-semibold text-text-secondary block">
                        Record Matchmaker Consultation Notes
                      </label>
                      <textarea
                        rows={3}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Type raw call notes e.g., 'Wants family-oriented tech professional, must be non-smoker, open to relocation to Mumbai only...'"
                        disabled={isProcessingNoteAi}
                        className="w-full rounded-lg border border-border-custom bg-surface p-3 text-sm text-text-primary outline-hidden transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-text-muted"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-text-muted max-w-xs flex items-center gap-1.5">
                          <Info className="h-3 w-3 shrink-0" />
                          AI Notes Intelligence parses raw text into structured CRM attributes automatically.
                        </span>
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={!noteInput.trim() || isProcessingNoteAi}
                          className="gap-2 cursor-pointer font-semibold"
                        >
                          {isProcessingNoteAi ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Processing AI...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Save Call Note
                            </>
                          )}
                        </Button>
                      </div>
                    </form>

                    {/* Notes listing */}
                    <div className="space-y-4 border-t border-border-custom pt-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-text-muted" />
                        CRM History Log ({notes.length})
                      </h3>
                      
                      {notes.length === 0 ? (
                        <p className="text-xs text-text-muted py-6 text-center italic">No consultation history recorded yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {notes.map((note) => (
                            <div 
                              key={note.id} 
                              className="p-4 rounded-xl border border-border-custom bg-surface-secondary/40 relative group space-y-3"
                            >
                              {/* Edit / Delete actions */}
                              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStartEditNote(note)}
                                  className="h-7 w-7 text-text-muted hover:text-text-primary cursor-pointer"
                                  title="Edit note"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="h-7 w-7 text-text-muted hover:text-red-500 cursor-pointer"
                                  title="Delete note"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {editingNoteId === note.id ? (
                                <div className="space-y-2 pt-2">
                                  <textarea
                                    rows={2}
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="w-full rounded-lg border border-border-custom bg-surface p-2 text-sm text-text-primary outline-hidden"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingNoteId(null)} className="h-8 text-xs cursor-pointer">
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleSaveEditNote(note.id)} disabled={isProcessingNoteAi} className="h-8 text-xs cursor-pointer">
                                      {isProcessingNoteAi ? "AI parsing..." : "Save"}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-text-secondary leading-relaxed pr-12">{note.content}</p>
                                  <span className="text-[10px] text-text-muted block">{note.createdAt}</span>

                                  {/* AI insights extracted metadata */}
                                  {note.aiInsights && (
                                    <div className="border-t border-border-custom/50 pt-3 mt-3">
                                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block mb-2 flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        AI Extracted Insights
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {note.aiInsights.values.map((v) => (
                                          <span key={v} className="bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded font-semibold border border-primary/20">
                                            Value: {v}
                                          </span>
                                        ))}
                                        {note.aiInsights.religionPreference && note.aiInsights.religionPreference !== "Not mentioned" && note.aiInsights.religionPreference !== "No Preference" && (
                                          <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded font-semibold border border-accent/20">
                                            Religion: {note.aiInsights.religionPreference}
                                          </span>
                                        )}
                                        {note.aiInsights.relocationPreference && note.aiInsights.relocationPreference !== "Not mentioned" && note.aiInsights.relocationPreference !== "No Preference" && (
                                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-emerald-500/20">
                                            Relocation: {note.aiInsights.relocationPreference}
                                          </span>
                                        )}
                                        {note.aiInsights.smokingPreference && note.aiInsights.smokingPreference !== "Not mentioned" && note.aiInsights.smokingPreference !== "No Preference" && (
                                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-red-500/20">
                                            Smoking: {note.aiInsights.smokingPreference}
                                          </span>
                                        )}
                                        {note.aiInsights.professionPreference && note.aiInsights.professionPreference !== "Not mentioned" && note.aiInsights.professionPreference !== "No Preference" && (
                                          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-purple-500/20">
                                            Industry: {note.aiInsights.professionPreference}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Match History */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Sent Recommendations Log</h3>
                    
                    {matchHistory.length === 0 ? (
                      <p className="text-xs text-text-muted py-8 text-center italic">No recommendations have been sent to this customer yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Recommended Match</TableHead>
                              <TableHead>Date Sent</TableHead>
                              <TableHead>Match Score</TableHead>
                              <TableHead>Match Journey Stage</TableHead>
                              <TableHead className="text-right">Recommendation Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {matchHistory.map((h) => {
                              const isReceived = h.matchId === targetProfile.id;
                              let matchName = h.matchName;
                              let matchId = h.matchId;
                              if (isReceived) {
                                const sender = allProfiles.find((p) => p.id === h.customerId);
                                matchName = sender ? `${sender.firstName} ${sender.lastName}` : `Client ID: ${h.customerId}`;
                                matchId = h.customerId;
                              }

                              return (
                                <TableRow key={h.id}>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-text-primary flex items-center gap-1.5">
                                        {matchName}
                                        {isReceived ? (
                                          <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 rounded-full px-1.5 py-0.2">
                                            Received
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 rounded-full px-1.5 py-0.2">
                                            Sent
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[10px] text-text-muted font-medium">ID: {matchId}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-text-secondary text-xs font-medium">{h.date}</TableCell>
                                  <TableCell>
                                    <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-primary/20">
                                      {h.score}% Match
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge status={h.journeyStatus}>{h.journeyStatus}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={cn("text-xs font-bold px-2 py-1 rounded-full inline-block border", {
                                        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30": h.status === 'Accepted',
                                        "bg-surface-secondary text-text-secondary border-border-custom": h.status === 'Sent',
                                        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30": h.status === 'Discussing' || h.status === 'Viewed',
                                        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30": h.status === 'Rejected'
                                      })}>
                                        {h.status}
                                      </span>
                                      
                                      <select
                                        value={h.status}
                                        onChange={(e) => handleUpdateMatchStatus(h.id, e.target.value as MatchHistory['status'])}
                                        className="text-[10px] font-bold border border-border-custom bg-surface rounded px-1.5 py-0.5 outline-none text-text-secondary cursor-pointer hover:border-primary transition-colors"
                                      >
                                        <option value="Sent">Sent</option>
                                        <option value="Discussing">Discussing</option>
                                        <option value="Accepted">Accepted</option>
                                        <option value="Rejected">Rejected</option>
                                      </select>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggestions Engine Matching Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Algorithmic Match Suggestions</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Top 10 opposite-gender recommendations based on client traits</p>
                </div>
                <div className="flex items-center gap-1 bg-primary-light text-primary px-2.5 py-1 rounded-full text-xs font-semibold border border-primary/20">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  AI Matching Live
                </div>
              </div>

              {/* Match Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map(({ score, reasons, profile: candidate }) => {
                  const cache = compatibilityCache[candidate.id];
                  const isLoadingAnalysis = cache?.loading;

                  return (
                    <Card key={candidate.id} className="hover:shadow-md transition-all duration-200 border-border-custom flex flex-col justify-between overflow-hidden">
                      <div>
                        {/* Upper card block */}
                        <div className="p-5 border-b border-border-custom flex items-start gap-4">
                          <img 
                            src={candidate.avatar} 
                            alt={`${candidate.firstName} ${candidate.lastName}`}
                            className="h-16 w-16 rounded-full border border-border-custom bg-surface-secondary p-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${candidate.firstName} ${candidate.lastName}`;
                            }}
                          />
                          <div className="space-y-1 overflow-hidden">
                            <span className="font-bold text-text-primary block truncate hover:underline cursor-pointer" onClick={() => router.push(`/customer/${candidate.id}`)}>
                              {candidate.firstName} {candidate.lastName}
                            </span>
                            <span className="text-xs text-text-secondary block truncate">{candidate.age} Yrs • {candidate.career.designation}</span>
                            <span className="text-[10px] text-text-muted block truncate">{candidate.city} • {formatCurrency(candidate.career.income)}</span>
                          </div>
                        </div>

                        {/* Mid card block: Scores & Analysis */}
                        <div className="p-5 space-y-4">
                          {/* Match score progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-text-secondary">Algorithmic Compatibility</span>
                              <strong className={cn("font-bold text-sm", {
                                "text-emerald-600 dark:text-emerald-400": score >= 80,
                                "text-accent": score >= 65 && score < 80,
                                "text-text-secondary": score < 65
                              })}>{score}%</strong>
                            </div>
                            <Progress value={score} className="h-1.5" indicatorClassName={cn({
                              "bg-emerald-500": score >= 80,
                              "bg-accent": score >= 65 && score < 80,
                              "bg-text-muted": score < 65
                            })} />
                          </div>

                          {/* AI compatibility layout */}
                          {cache ? (
                            <div className="bg-gradient-to-br from-primary-light to-transparent p-4 rounded-xl border border-primary/20 space-y-3 shadow-xs">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block flex items-center gap-1 font-serif">
                                ✨ AI Match Analysis
                              </span>

                              {/* Strengths & Concerns bullets */}
                              <div className="space-y-1.5 text-xs text-text-secondary">
                                {cache.strengths.map((str, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{str}</span>
                                  </div>
                                ))}
                                {cache.concerns.map((con, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-text-muted">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>{con}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t border-primary/10 pt-2.5">
                                <span className="text-[10px] font-bold uppercase text-text-muted block">AI Recommendation</span>
                                <span className="text-xs font-bold text-accent">{cache.recommendation}</span>
                                <p className="text-[11px] text-text-secondary mt-1 leading-normal italic">{cache.explanation}</p>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={isLoadingAnalysis}
                              onClick={() => requestCompatibilityAnalysis(candidate.id, score, reasons)}
                              className="w-full text-xs h-9 gap-1.5 hover:bg-primary-light hover:text-primary border-border-custom cursor-pointer"
                            >
                              {isLoadingAnalysis ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ✨ AI Evaluating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                                  ✨ Run AI Advisor
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Lower card block: Send Match */}
                      <CardFooter className="bg-surface-secondary/30 border-t border-border-custom p-4">
                        <Button 
                          onClick={() => handleOpenSendModal(candidate, score)}
                          className="w-full font-semibold text-xs h-9 gap-1.5 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Match Suggestion
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Send Match confirmation & AI intro Dialog */}
      <Dialog isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-text-primary">
            <Send className="h-5 w-5 text-primary" />
            Send Recommendation Profile
          </DialogTitle>
          <DialogDescription>
            Preview and edit the AI-generated introduction message for <strong>{targetProfile.firstName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div className="bg-primary-light p-3 rounded-lg border border-primary/20 flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-text-secondary">Recipient:</span> {targetProfile.firstName} {targetProfile.lastName}
            </div>
            <div>
              <span className="font-semibold text-text-secondary">Match:</span> {selectedCandidate?.firstName}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
              Personalized Intro message
            </label>
            {isGeneratingIntro ? (
              <div className="h-44 w-full flex flex-col items-center justify-center border border-border-custom rounded-lg bg-surface-secondary gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs text-text-secondary animate-pulse font-medium">AI writing introduction letter...</span>
              </div>
            ) : (
              <textarea
                rows={8}
                value={introLetter}
                onChange={(e) => setIntroLetter(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface p-3 text-sm text-text-primary outline-hidden transition-colors focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed font-sans"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full justify-between items-center">
            <div className="flex gap-1.5 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateIntro}
                disabled={isGeneratingIntro}
                className="h-9 text-xs gap-1.5 cursor-pointer w-full sm:w-auto font-medium"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", { "animate-spin": isGeneratingIntro })} />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyIntro}
                disabled={isGeneratingIntro}
                className="h-9 text-xs gap-1.5 cursor-pointer w-full sm:w-auto font-medium"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
            <div className="flex gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSendModalOpen(false)}
                className="h-9 text-xs cursor-pointer font-medium"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSendMatch}
                disabled={isGeneratingIntro || !introLetter.trim()}
                className="h-9 text-xs gap-1.5 cursor-pointer w-full sm:w-auto font-semibold"
              >
                <Send className="h-3.5 w-3.5" />
                Send Profile
              </Button>
            </div>
          </div>
        </DialogFooter>
      </Dialog>
      </div>
    </div>
  );
}

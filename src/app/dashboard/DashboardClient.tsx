"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Profile, MatchHistory, Note, Meeting, Notification } from "@/lib/types";
import { findMatches } from "@/lib/matcher";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Users, 
  UserCheck, 
  Send, 
  Calendar, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  FilterX,
  Heart,
  Eye,
  Trash2,
  TrendingUp,
  Settings2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  Plus
} from "lucide-react";

const maritalStatuses = ["Never Married", "Divorced", "Widowed"];
  
const journeyStatuses: Profile['journeyStatus'][] = [
  "Lead", "Verified", "Searching", "Matched", 
  "Meeting Scheduled", "Engaged", "Married", "Inactive"
];

const kanbanColumns = journeyStatuses;

const generateNextId = (gender: 'male' | 'female', currentProfiles: Profile[]) => {
  const prefix = gender === 'male' ? 'M' : 'F';
  const ids = currentProfiles
    .filter(p => p.id.startsWith(prefix))
    .map(p => {
      const num = parseInt(p.id.slice(1), 10);
      return isNaN(num) ? 0 : num;
    });
  const maxId = ids.length > 0 ? Math.max(...ids) : 200;
  const nextNum = maxId + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

interface DashboardClientProps {
  initialProfiles: Profile[];
}

export default function DashboardClient({ initialProfiles }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Read active view from query parameter (view=directory | view=journey | view=matches | view=logs | view=settings | view=meetings)
  const activeView = searchParams.get("view") || "directory";

  // Scheduled Meetings State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingVenue, setMeetingVenue] = useState("");
  const [securityLevel, setSecurityLevel] = useState<'Low' | 'Medium' | 'High' | 'Elite'>("Medium");
  const [securityStaff, setSecurityStaff] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  // Add Candidate Form State
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [candFirstName, setCandFirstName] = useState("");
  const [candLastName, setCandLastName] = useState("");
  const [candGender, setCandGender] = useState<'male' | 'female'>("male");
  const [candAge, setCandAge] = useState("");
  const [candCity, setCandCity] = useState("");
  const [candReligion, setCandReligion] = useState("");
  const [candCaste, setCandCaste] = useState("");
  const [candMaritalStatus, setCandMaritalStatus] = useState<Profile['maritalStatus']>("Never Married");
  const [candDesignation, setCandDesignation] = useState("");
  const [candDegree, setCandDegree] = useState("");
  const [candIncome, setCandIncome] = useState("");
  const [candMotherTongue, setCandMotherTongue] = useState("");
  const [candJourneyStatus, setCandJourneyStatus] = useState<Profile['journeyStatus']>("Lead");

  const handleAddCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !candFirstName ||
      !candLastName ||
      !candAge ||
      !candCity ||
      !candReligion ||
      !candCaste ||
      !candDesignation ||
      !candDegree ||
      !candIncome ||
      !candMotherTongue
    ) {
      toast("Error", "Please fill in all fields.", "error");
      return;
    }

    const nextId = generateNextId(candGender, directoryProfiles);
    const ageNum = parseInt(candAge, 10);
    const incomeNum = parseInt(candIncome, 10);
    const currentYear = new Date().getFullYear();
    const dobYear = currentYear - ageNum;
    const dob = `${dobYear}-01-01`;

    const newProfile: Profile = {
      id: nextId,
      firstName: candFirstName.trim(),
      lastName: candLastName.trim(),
      gender: candGender,
      dob: dob,
      age: ageNum,
      height: 175,
      email: `${candFirstName.toLowerCase()}.${candLastName.toLowerCase()}@example.com`,
      phone: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
      city: candCity.trim(),
      country: "India",
      education: {
        degree: candDegree.trim(),
        college: "University"
      },
      career: {
        company: "Private Company",
        designation: candDesignation.trim(),
        income: incomeNum
      },
      family: {
        religion: candReligion.trim(),
        caste: candCaste.trim(),
        siblings: 1,
        familyType: "Nuclear"
      },
      lifestyle: {
        diet: "Vegetarian",
        smoking: "No",
        drinking: "No"
      },
      preferences: {
        preferredAgeRange: {
          min: Math.max(18, ageNum - 5),
          max: ageNum + 5
        },
        preferredLocation: [candCity.trim()],
        educationPreference: candDegree.trim(),
        wantKids: "Open",
        openToRelocate: "Open",
        openToPets: "Yes"
      },
      motherTongue: candMotherTongue.trim(),
      manglik: "No",
      hobbies: ["Reading", "Music"],
      journeyStatus: candJourneyStatus,
      maritalStatus: candMaritalStatus,
      favorite: false,
      avatar: `https://robohash.org/${candGender}_${candFirstName}_${candLastName}.png?set=set4&bgset=bg1`
    };

    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register candidate");
      }

      // Add a notification for new entry
      const newNotification: Notification = {
        id: `n_${Math.random().toString(36).substring(2, 9)}`,
        title: "New Candidate Registered",
        message: `${newProfile.firstName} ${newProfile.lastName} (${newProfile.id}) added to CRM directory.`,
        type: "new_entry",
        timestamp: new Date().toISOString(),
        read: false,
        link: `/customer/${newProfile.id}`
      };
      
      const storedNotifications = JSON.parse(localStorage.getItem("tdc-notifications") || "[]");
      const updatedNotifications = [newNotification, ...storedNotifications];
      localStorage.setItem("tdc-notifications", JSON.stringify(updatedNotifications));
      window.dispatchEvent(new Event("tdc-notifications-updated"));

      toast("Candidate Added", "Successfully added new candidate profile to CRM.", "success");
      
      setCandFirstName("");
      setCandLastName("");
      setCandGender("male");
      setCandAge("");
      setCandCity("");
      setCandReligion("");
      setCandCaste("");
      setCandMaritalStatus("Never Married");
      setCandDesignation("");
      setCandDegree("");
      setCandIncome("");
      setCandMotherTongue("");
      setCandJourneyStatus("Lead");
      setIsAddCandidateOpen(false);

      router.refresh();
      setPipelineVersion(v => v + 1);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save candidate.";
      toast("Error", errMsg, "error");
    }
  };

  // Core Directory State
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [religionFilter, setReligionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("all");
  const [journeyStatusFilter, setJourneyStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "age" | "matches">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Pipeline Kanban & Dynamic Overrides State
  const [pipelineVersion, setPipelineVersion] = useState(0);

  // Match History / Sent Suggestions View State
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [historyDateFilter, setHistoryDateFilter] = useState("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);

  // Call Logs View State
  const [logsSearchQuery, setLogsSearchQuery] = useState("");

  // CRM Settings Algorithm Tuning State
  const [algoWeights, setAlgoWeights] = useState({
    kids: 25,
    religion: 15,
    height: 15,
    location: 15,
    income: 10,
    education: 15,
    lifestyle: 15,
    profession: 20,
    relocation: 15
  });
  
  // Seed Match History if empty, and load initial data
  useEffect(() => {
    let history: MatchHistory[] = JSON.parse(localStorage.getItem("tdc-match-history") || "[]");
    
    if (history.length === 0) {
      // Seed 12 premium mock matches to support pagination resembling the reference image
      const seededMatches: MatchHistory[] = [
        {
          id: "m_seed1",
          customerId: "M001",
          matchId: "F001",
          matchName: "Priya Patel",
          matchGender: "female",
          date: "Oct 24, 2023",
          score: 94,
          status: "Accepted",
          journeyStatus: "Meeting Scheduled"
        },
        {
          id: "m_seed2",
          customerId: "F002",
          matchId: "M002",
          matchName: "Rohan Singh",
          matchGender: "male",
          date: "Oct 21, 2023",
          score: 82,
          status: "Discussing",
          journeyStatus: "Matched"
        },
        {
          id: "m_seed3",
          customerId: "M003",
          matchId: "F003",
          matchName: "Meera Reddy",
          matchGender: "female",
          date: "Oct 19, 2023",
          score: 75,
          status: "Sent",
          journeyStatus: "Searching"
        },
        {
          id: "m_seed4",
          customerId: "M004",
          matchId: "F004",
          matchName: "Grace Montgomery",
          matchGender: "female",
          date: "Oct 15, 2023",
          score: 48,
          status: "Rejected",
          journeyStatus: "Inactive"
        },
        {
          id: "m_seed5",
          customerId: "M005",
          matchId: "F005",
          matchName: "Anjali Gupta",
          matchGender: "female",
          date: "Oct 12, 2023",
          score: 88,
          status: "Accepted",
          journeyStatus: "Engaged"
        },
        {
          id: "m_seed6",
          customerId: "M006",
          matchId: "F006",
          matchName: "Vikram Rao",
          matchGender: "male",
          date: "Oct 08, 2023",
          score: 62,
          status: "Rejected",
          journeyStatus: "Inactive"
        },
        {
          id: "m_seed7",
          customerId: "M007",
          matchId: "F007",
          matchName: "Neha Shah",
          matchGender: "female",
          date: "Sep 28, 2023",
          score: 78,
          status: "Sent",
          journeyStatus: "Searching"
        },
        {
          id: "m_seed8",
          customerId: "M008",
          matchId: "F008",
          matchName: "Rohan Gupta",
          matchGender: "male",
          date: "Sep 24, 2023",
          score: 85,
          status: "Accepted",
          journeyStatus: "Engaged"
        },
        {
          id: "m_seed9",
          customerId: "M009",
          matchId: "F009",
          matchName: "Divya Rao",
          matchGender: "female",
          date: "Sep 20, 2023",
          score: 91,
          status: "Discussing",
          journeyStatus: "Matched"
        },
        {
          id: "m_seed10",
          customerId: "M010",
          matchId: "F010",
          matchName: "Karan Johar",
          matchGender: "male",
          date: "Sep 15, 2023",
          score: 55,
          status: "Rejected",
          journeyStatus: "Inactive"
        },
        {
          id: "m_seed11",
          customerId: "M011",
          matchId: "F011",
          matchName: "Madhuri Dixit",
          matchGender: "female",
          date: "Sep 10, 2023",
          score: 83,
          status: "Discussing",
          journeyStatus: "Matched"
        },
        {
          id: "m_seed12",
          customerId: "M012",
          matchId: "F012",
          matchName: "Abhishek Bachchan",
          matchGender: "male",
          date: "Sep 05, 2023",
          score: 96,
          status: "Accepted",
          journeyStatus: "Married"
        }
      ];
      localStorage.setItem("tdc-match-history", JSON.stringify(seededMatches));
      history = seededMatches;
    }
    setMatchHistory(history);

    // Load and seed scheduled meetings
    let storedMeetings = JSON.parse(localStorage.getItem("tdc-meetings") || "[]");
    if (storedMeetings.length === 0) {
      const defaultMeetings: Meeting[] = [
        {
          id: "meet_seed1",
          hostId: "M001",
          hostName: "Amit Choudhury",
          guestId: "F001",
          guestName: "Priya Patel",
          date: "2026-06-10",
          time: "16:00",
          venue: "Taj Mahal Palace, Mumbai",
          securityLevel: "Elite",
          securityStaff: "Senior Officer Vikram Singh",
          status: "Scheduled",
          notes: "First face-to-face meet. Families are attending."
        },
        {
          id: "meet_seed2",
          hostId: "M002",
          hostName: "Rohit Das",
          guestId: "F003",
          guestName: "Meera Reddy",
          date: "2026-06-12",
          time: "18:30",
          venue: "Aerocity Marriott, New Delhi",
          securityLevel: "High",
          securityStaff: "Guard Rajesh Kumar",
          status: "Scheduled",
          notes: "Discussing horoscope. Matchmaker supervision requested."
        }
      ];
      localStorage.setItem("tdc-meetings", JSON.stringify(defaultMeetings));
      storedMeetings = defaultMeetings;

      // Seed status overrides for these profiles to synchronize
      const localStatusOverrides = JSON.parse(localStorage.getItem("tdc-profile-statuses") || "{}");
      localStatusOverrides["M001"] = "Meeting Scheduled";
      localStatusOverrides["F001"] = "Meeting Scheduled";
      localStatusOverrides["M002"] = "Meeting Scheduled";
      localStatusOverrides["F003"] = "Meeting Scheduled";
      localStorage.setItem("tdc-profile-statuses", JSON.stringify(localStatusOverrides));
    }
    setMeetings(storedMeetings);

    // Load algorithm weights from local storage if saved
    const savedWeights = localStorage.getItem("milan-algo-weights");
    if (savedWeights) {
      try {
        setAlgoWeights(JSON.parse(savedWeights));
      } catch (err) {
        console.error(err);
      }
    }
  }, [pipelineVersion]);

  // Aggregate stats across profiles
  const directoryProfiles = useMemo(() => {
    if (pipelineVersion) { /* force re-memoize */ }
    // Dynamic status overrides
    const localStatusOverrides = JSON.parse(localStorage.getItem("tdc-profile-statuses") || "{}");
    return initialProfiles.map(p => {
      const status = localStatusOverrides[p.id] || p.journeyStatus;
      return {
        ...p,
        journeyStatus: status
      };
    });
  }, [initialProfiles, pipelineVersion]);

  // Host/Guest Selector options and schedule logic
  const hostOptions = useMemo(() => {
    return directoryProfiles.filter(p => p.journeyStatus !== "Inactive" && p.journeyStatus !== "Married");
  }, [directoryProfiles]);

  const guestOptions = useMemo(() => {
    if (!selectedHostId) return [];
    const host = directoryProfiles.find(p => p.id === selectedHostId);
    return directoryProfiles.filter(p => 
      p.id !== selectedHostId && 
      p.journeyStatus !== "Inactive" && 
      p.journeyStatus !== "Married" &&
      (!host || p.gender !== host.gender)
    );
  }, [directoryProfiles, selectedHostId]);

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostId || !selectedGuestId || !meetingDate || !meetingTime || !meetingVenue) {
      toast("Error", "Please fill in all required fields.", "error");
      return;
    }

    const host = directoryProfiles.find(p => p.id === selectedHostId);
    const guest = directoryProfiles.find(p => p.id === selectedGuestId);

    if (!host || !guest) {
      toast("Error", "Selected profiles are invalid.", "error");
      return;
    }

    const newMeeting: Meeting = {
      id: `meet_${Math.random().toString(36).substring(2, 9)}`,
      hostId: selectedHostId,
      hostName: `${host.firstName} ${host.lastName}`,
      guestId: selectedGuestId,
      guestName: `${guest.firstName} ${guest.lastName}`,
      date: meetingDate,
      time: meetingTime,
      venue: meetingVenue,
      securityLevel: 'Low',
      securityStaff: '',
      status: "Scheduled",
      notes: meetingNotes.trim()
    };

    const updatedMeetings = [newMeeting, ...meetings];
    localStorage.setItem("tdc-meetings", JSON.stringify(updatedMeetings));
    setMeetings(updatedMeetings);

    const localStatusOverrides = JSON.parse(localStorage.getItem("tdc-profile-statuses") || "{}");
    localStatusOverrides[selectedHostId] = "Meeting Scheduled";
    localStatusOverrides[selectedGuestId] = "Meeting Scheduled";
    localStorage.setItem("tdc-profile-statuses", JSON.stringify(localStatusOverrides));

    const newNotification: Notification = {
      id: `n_${Math.random().toString(36).substring(2, 9)}`,
      title: "Meeting Scheduled",
      message: `${host.firstName} & ${guest.firstName} scheduled at ${meetingVenue}.`,
      type: "reminder",
      timestamp: new Date().toISOString(),
      read: false,
      link: "/dashboard?view=meetings"
    };
    const storedNotifications = JSON.parse(localStorage.getItem("tdc-notifications") || "[]");
    const updatedNotifications = [newNotification, ...storedNotifications];
    localStorage.setItem("tdc-notifications", JSON.stringify(updatedNotifications));

    window.dispatchEvent(new Event("tdc-notifications-updated"));

    setIsMeetingModalOpen(false);
    setSelectedHostId("");
    setSelectedGuestId("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingVenue("");
    setSecurityLevel("Medium");
    setSecurityStaff("");
    setMeetingNotes("");

    setPipelineVersion(v => v + 1);
    toast("Meeting Scheduled", "Matrimonial consultation meeting logged successfully.", "success");
  };

  // Pre-calculate matches count for each profile to show in the table (score >= 70)
  const profilesWithMatchCount = useMemo(() => {
    return directoryProfiles.map((profile) => {
      const matches = findMatches(profile, directoryProfiles);
      const highPotentialCount = matches.filter((m) => m.score >= 70).length;
      return {
        ...profile,
        matchCount: highPotentialCount,
      };
    });
  }, [directoryProfiles]);

  // Aggregate Metrics for Header
  const metrics = useMemo(() => {
    const total = directoryProfiles.length;
    const active = directoryProfiles.filter(
      (p) => p.journeyStatus !== "Inactive" && p.journeyStatus !== "Married"
    ).length;
    const meetings = directoryProfiles.filter(
      (p) => p.journeyStatus === "Meeting Scheduled"
    ).length;

    return {
      total,
      active,
      meetings,
    };
  }, [directoryProfiles]);

  // Dynamic Lookup options for filters
  const religions = useMemo(() => {
    const set = new Set(directoryProfiles.map((p) => p.family.religion));
    return Array.from(set).sort();
  }, [directoryProfiles]);

  const cities = useMemo(() => {
    const set = new Set(directoryProfiles.map((p) => p.city));
    return Array.from(set).sort();
  }, [directoryProfiles]);



  // ----------------------------------------------------
  // VIEW: 1. Directory Filter & Sort Logic
  // ----------------------------------------------------
  const filteredProfiles = useMemo(() => {
    return profilesWithMatchCount
      .filter((p) => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchQuery.toLowerCase()) ||
          p.family.religion.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesGender = genderFilter === "all" || p.gender === genderFilter;
        const matchesReligion = religionFilter === "all" || p.family.religion === religionFilter;
        const matchesCity = cityFilter === "all" || p.city === cityFilter;
        const matchesMarital = maritalStatusFilter === "all" || p.maritalStatus === maritalStatusFilter;
        const matchesStatus = journeyStatusFilter === "all" || p.journeyStatus === journeyStatusFilter;

        return (
          matchesSearch &&
          matchesGender &&
          matchesReligion &&
          matchesCity &&
          matchesMarital &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") {
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        } else if (sortBy === "age") {
          comparison = a.age - b.age;
        } else if (sortBy === "matches") {
          comparison = a.matchCount - b.matchCount;
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [profilesWithMatchCount, searchQuery, genderFilter, religionFilter, cityFilter, maritalStatusFilter, journeyStatusFilter, sortBy, sortOrder]);

  // Reset pagination when directory filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, genderFilter, religionFilter, cityFilter, maritalStatusFilter, journeyStatusFilter]);

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage]);

  const toggleSort = (field: "name" | "age" | "matches") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
    setReligionFilter("all");
    setCityFilter("all");
    setMaritalStatusFilter("all");
    setJourneyStatusFilter("all");
  };

  // ----------------------------------------------------
  // VIEW: 2. Customer Journey Pipeline Kanban Board
  // ----------------------------------------------------
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, Profile[]> = {};
    kanbanColumns.forEach(c => { groups[c] = []; });
    directoryProfiles.forEach(p => {
      if (groups[p.journeyStatus]) {
        groups[p.journeyStatus].push(p);
      }
    });
    return groups;
  }, [directoryProfiles]);

  const movePipelineStage = (profileId: string, currentStatus: Profile['journeyStatus'], direction: 'left' | 'right') => {
    const currentIndex = kanbanColumns.indexOf(currentStatus);
    let nextIndex = currentIndex;
    if (direction === 'left' && currentIndex > 0) nextIndex--;
    if (direction === 'right' && currentIndex < kanbanColumns.length - 1) nextIndex++;
    
    if (nextIndex !== currentIndex) {
      const nextStatus = kanbanColumns[nextIndex];
      const localStatusOverrides = JSON.parse(localStorage.getItem("tdc-profile-statuses") || "{}");
      localStatusOverrides[profileId] = nextStatus;
      localStorage.setItem("tdc-profile-statuses", JSON.stringify(localStatusOverrides));
      setPipelineVersion(v => v + 1);
      toast("Journey Stage Moved", `Moved customer to ${nextStatus}.`, "success");
    }
  };

  const handleStageSelectChange = (profileId: string, newStatus: Profile['journeyStatus']) => {
    const localStatusOverrides = JSON.parse(localStorage.getItem("tdc-profile-statuses") || "{}");
    localStatusOverrides[profileId] = newStatus;
    localStorage.setItem("tdc-profile-statuses", JSON.stringify(localStatusOverrides));
    setPipelineVersion(v => v + 1);
    toast("Journey Stage Updated", `Customer journey status set to ${newStatus}.`, "success");
  };

  // ----------------------------------------------------
  // VIEW: 3. Match History Analytics (Reference Image)
  // ----------------------------------------------------
  const processedMatchHistory = useMemo(() => {
    return matchHistory.map(h => {
      const primary = directoryProfiles.find(p => p.id === h.customerId);
      const matched = directoryProfiles.find(p => p.id === h.matchId);
      return {
        ...h,
        primary,
        matched
      };
    });
  }, [matchHistory, directoryProfiles]);

  const filteredMatchHistory = useMemo(() => {
    return processedMatchHistory.filter(h => {
      const matchesStatus = historyStatusFilter === "all" || h.status === historyStatusFilter;
      // Date filter mock filtering
      let matchesDate = true;
      if (historyDateFilter === "7days") {
        matchesDate = h.date.includes("/2026"); // Simulated filter
      }
      return matchesStatus && matchesDate;
    });
  }, [processedMatchHistory, historyStatusFilter, historyDateFilter]);

  const acceptanceRate = useMemo(() => {
    if (matchHistory.length === 0) return 68.4;
    const accepted = matchHistory.filter(h => h.status === "Accepted").length;
    return Math.round((accepted / matchHistory.length) * 1000) / 10;
  }, [matchHistory]);

  const historyItemsPerPage = 10;
  const totalHistoryPages = Math.ceil(filteredMatchHistory.length / historyItemsPerPage);
  
  const paginatedMatchHistory = useMemo(() => {
    const start = (historyPage - 1) * historyItemsPerPage;
    return filteredMatchHistory.slice(start, start + historyItemsPerPage);
  }, [filteredMatchHistory, historyPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyDateFilter, historyStatusFilter]);

  const handleDeleteHistoryLog = (id: string) => {
    const updated = matchHistory.filter(h => h.id !== id);
    localStorage.setItem("tdc-match-history", JSON.stringify(updated));
    setMatchHistory(updated);
    toast("History Log Removed", "Deleted recommendation event log.", "info");
  };

  // ----------------------------------------------------
  // VIEW: 4. Consultation logs unified feed
  // ----------------------------------------------------
  const unifiedLogs = useMemo(() => {
    const logsList: { note: Note; profile: Profile }[] = [];
    directoryProfiles.forEach(profile => {
      const stored = JSON.parse(localStorage.getItem(`tdc-notes-${profile.id}`) || "[]");
      stored.forEach((n: Note) => {
        logsList.push({ note: n, profile });
      });
    });
    // Sort chronological descending
    return logsList
      .filter(l => l.note.content.toLowerCase().includes(logsSearchQuery.toLowerCase()) || l.profile.firstName.toLowerCase().includes(logsSearchQuery.toLowerCase()))
      .sort((a, b) => b.note.createdAt.localeCompare(a.note.createdAt));
  }, [directoryProfiles, logsSearchQuery]);

  // ----------------------------------------------------
  // VIEW: 5. CRM Settings Weight Configurator
  // ----------------------------------------------------
  const saveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("milan-algo-weights", JSON.stringify(algoWeights));
    toast("Settings Saved", "Matchmaker alignment weights updated successfully.", "success");
  };

  const resetCRMDatabase = () => {
    if (confirm("Are you sure you want to clear all notes, user statuses, and matches? This will restore seeded presets.")) {
      localStorage.clear();
      setPipelineVersion(v => v + 1);
      toast("CRM Reset Complete", "Database restored to seeded default settings.", "success");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Dynamic sidebar loaded with query boundaries */}
      <Suspense fallback={<div className="hidden md:block w-64 h-screen bg-[#120A2B]" />}>
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

        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/* VIEW 1: WORKSPACE DIRECTORY TAB */}
        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeView === "directory" && (
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10 w-full">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">MilanAI Workstation</h1>
                <p className="text-sm text-text-secondary mt-1">AI-Powered CRM & Matchmaking Workstation</p>
              </div>
              <div className="flex items-center gap-3 self-start md:self-auto">
                <Button
                  onClick={() => setIsAddCandidateOpen(true)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider h-10 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Candidate
                </Button>
                <div className="flex items-center gap-2 text-xs bg-surface-secondary px-3 py-2.5 rounded-lg border border-border-custom text-text-secondary select-none whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full bg-[var(--status-married)] animate-pulse" />
                  System Active: {directoryProfiles.length} Profiles
                </div>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Total Customers</p>
                    <p className="text-3xl font-bold text-foreground">{metrics.total}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Pipeline</p>
                    <p className="text-3xl font-bold text-foreground">{metrics.active}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                    <UserCheck className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Matches Sent</p>
                    <p className="text-3xl font-bold text-foreground">{matchHistory.length}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                    <Send className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Meetings Scheduled</p>
                    <p className="text-3xl font-bold text-foreground">{metrics.meetings}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Directory Advanced filter card */}
            <Card className="shadow-xs">
              <CardHeader className="pb-4 border-b border-border-custom flex flex-row items-center justify-between space-y-0 py-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-text-secondary" />
                  <h2 className="text-sm font-semibold text-text-primary">Filter Customers</h2>
                </div>
                {(searchQuery || genderFilter !== "all" || religionFilter !== "all" || cityFilter !== "all" || maritalStatusFilter !== "all" || journeyStatusFilter !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="h-8 text-text-secondary hover:text-red-600 text-xs gap-1.5 cursor-pointer font-semibold"
                  >
                    <FilterX className="h-3.5 w-3.5" />
                    Clear Filters
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search customers by name, religion, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-border-custom bg-surface py-2 pl-10 pr-4 text-sm text-foreground placeholder-text-muted/65 outline-hidden transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Grid selectors */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Gender</label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 text-xs text-foreground outline-hidden focus:border-primary"
                    >
                      <option value="all">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Religion</label>
                    <select
                      value={religionFilter}
                      onChange={(e) => setReligionFilter(e.target.value)}
                      className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 text-xs text-foreground outline-hidden focus:border-primary"
                    >
                      <option value="all">All Religions</option>
                      {religions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">City</label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 text-xs text-foreground outline-hidden focus:border-primary"
                    >
                      <option value="all">All Cities</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Marital Status</label>
                    <select
                      value={maritalStatusFilter}
                      onChange={(e) => setMaritalStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 text-xs text-foreground outline-hidden focus:border-primary"
                    >
                      <option value="all">All Statuses</option>
                      {maritalStatuses.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Journey Stage</label>
                    <select
                      value={journeyStatusFilter}
                      onChange={(e) => setJourneyStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 text-xs text-foreground outline-hidden focus:border-primary"
                    >
                      <option value="all">All Stages</option>
                      {journeyStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profiles directory data table */}
            <Card className="shadow-xs overflow-hidden">
              <CardHeader className="pb-2 border-b border-border-custom flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary font-serif">Customer Profiles Directory</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Found {filteredProfiles.length} matching entries in CRM</p>
                </div>
                <div className="flex items-center gap-2 self-stretch md:self-auto">
                  <span className="text-xs text-text-secondary font-medium whitespace-nowrap">Sort:</span>
                  <div className="grid grid-cols-3 gap-1 bg-surface-secondary p-1 rounded-lg border border-border-custom w-full md:w-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleSort("name")}
                      className={`h-7 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${sortBy === "name" ? "bg-surface text-primary shadow-xs" : "text-text-muted"}`}
                    >
                      Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleSort("age")}
                      className={`h-7 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${sortBy === "age" ? "bg-surface text-primary shadow-xs" : "text-text-muted"}`}
                    >
                      Age {sortBy === "age" && (sortOrder === "asc" ? "↑" : "↓")}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleSort("matches")}
                      className={`h-7 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${sortBy === "matches" ? "bg-surface text-primary shadow-xs" : "text-text-muted"}`}
                    >
                      Matches {sortBy === "matches" && (sortOrder === "asc" ? "↑" : "↓")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {filteredProfiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
                    <Users className="h-12 w-12 stroke-[1.5] mb-3 text-text-muted animate-pulse" />
                    <h3 className="font-semibold text-text-primary">No Customers Found</h3>
                    <p className="text-xs text-text-secondary mt-1 max-w-xs">Adjust your search input or filters to match database entries.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Age / Gender</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Religion / Caste</TableHead>
                        <TableHead>Marital Status</TableHead>
                        <TableHead>Journey Status</TableHead>
                        <TableHead>Scheduled Meeting</TableHead>
                        <TableHead className="text-right">Top Matches</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProfiles.map((p) => (
                        <TableRow 
                          key={p.id}
                          onClick={() => router.push(`/customer/${p.id}`)}
                          className="cursor-pointer transition-colors hover:bg-surface-secondary/40"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img 
                                src={p.avatar} 
                                alt={`${p.firstName} ${p.lastName}`}
                                className="h-10 w-10 rounded-full border border-border-custom bg-surface-secondary shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.firstName} ${p.lastName}`;
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-text-primary flex items-center gap-1.5">
                                  {p.firstName} {p.lastName}
                                  {p.favorite && <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />}
                                </span>
                                <span className="text-xs text-text-muted">{p.id} • {p.career.designation}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary">{p.age} Yrs</span>
                              <span className="text-xs text-text-muted capitalize">{p.gender}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary">{p.city}</span>
                              <span className="text-xs text-text-muted">{p.country}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary">{p.family.religion}</span>
                              <span className="text-xs text-text-muted">{p.family.caste}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-text-primary font-bold text-xs bg-surface-secondary px-2.5 py-1 rounded-md border border-border-custom">
                              {p.maritalStatus}
                            </span>
                          </TableCell>
                           <TableCell>
                            <Badge status={p.journeyStatus}>{p.journeyStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const clientMeeting = meetings.find(m => (m.hostId === p.id || m.guestId === p.id) && m.status === 'Scheduled');
                              if (clientMeeting) {
                                return (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push("/dashboard?view=meetings");
                                    }}
                                    className="flex flex-col max-w-[190px] text-xs hover:opacity-85 transition-opacity"
                                  >
                                    <span className="font-bold text-primary truncate">
                                      Meet w/ {clientMeeting.hostId === p.id ? clientMeeting.guestName : clientMeeting.hostName}
                                    </span>
                                    <span className="text-[10px] text-text-muted mt-0.5">
                                      📅 {clientMeeting.date} @ {clientMeeting.time}
                                    </span>
                                    <span className="text-[10px] text-text-secondary truncate mt-0.5" title={clientMeeting.venue}>
                                      📍 {clientMeeting.venue}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHostId(p.id);
                                    setSelectedGuestId("");
                                    setMeetingDate("");
                                    setMeetingTime("");
                                    setMeetingVenue("");
                                    setSecurityLevel("Medium");
                                    setSecurityStaff("");
                                    setMeetingNotes("");
                                    setIsMeetingModalOpen(true);
                                  }}
                                  className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-primary gap-1 cursor-pointer"
                                >
                                  <Calendar className="h-3 w-3" />
                                  + Schedule
                                </Button>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", {
                                "bg-emerald-500/10 text-[var(--status-married)] border-emerald-500/20": p.matchCount > 5,
                                "bg-primary-light text-primary border-primary/20": p.matchCount <= 5 && p.matchCount > 2,
                                "bg-surface-secondary text-text-secondary border-border-custom": p.matchCount <= 2
                              })}>
                                {p.matchCount} suggestions
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>

              {/* Table pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border-custom px-6 py-4 bg-surface-secondary/40 select-none">
                  <span className="text-xs text-text-muted">
                    Showing page <strong className="font-bold text-text-primary">{currentPage}</strong> of <strong className="font-bold text-text-primary">{totalPages}</strong> ({filteredProfiles.length} total)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </main>
        )}

        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/* VIEW 2: CUSTOMER JOURNEY PIPELINE KANBAN */}
        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeView === "journey" && (
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-in relative z-10 w-full flex-1 flex flex-col min-h-0">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Relationship Pipeline Stages</h1>
              <p className="text-sm text-text-secondary mt-1">Manage active matchmaking lifecycles by shifting stages.</p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start select-none scrollbar-thin">
              {kanbanColumns.map((col) => {
                const profilesInCol = kanbanGroups[col] || [];
                return (
                  <div key={col} className="w-72 shrink-0 flex flex-col max-h-[70vh] bg-surface-secondary p-3.5 rounded-[18px] border border-border-custom">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{col}</span>
                      <Badge className="h-5 px-1.5 py-0 text-[10px] bg-surface text-primary border border-border-custom">{profilesInCol.length}</Badge>
                    </div>

                    {/* Cards Scroll */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin">
                      {profilesInCol.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-text-muted italic bg-surface/20 rounded-xl border border-dashed border-border-custom/50">
                          Empty column
                        </div>
                      ) : (
                        profilesInCol.map(p => (
                          <div 
                            key={p.id}
                            className="bg-surface p-3.5 rounded-xl border border-border-custom hover:shadow-md transition-shadow relative group cursor-pointer"
                            onClick={(e) => {
                              // Prevent click triggering if select was clicked
                              if ((e.target as HTMLElement).tagName !== 'SELECT' && !(e.target as HTMLElement).closest('button')) {
                                router.push(`/customer/${p.id}`);
                              }
                            }}
                          >
                            {/* Profile details */}
                            <div className="flex gap-3">
                              <img 
                                src={p.avatar} 
                                alt={p.firstName}
                                className="h-9 w-9 rounded-full bg-surface-secondary border border-border-custom shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.firstName} ${p.lastName}`;
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs text-text-primary block truncate leading-tight">{p.firstName} {p.lastName}</span>
                                <span className="text-[10px] text-text-muted block truncate mt-0.5">{p.age} • {p.city}</span>
                                <span className="text-[9px] font-semibold text-[var(--status-matched)] block truncate mt-0.5">{p.career.designation}</span>
                              </div>
                            </div>

                            {/* Move stage footer controls */}
                            <div className="mt-3.5 pt-2.5 border-t border-border-custom/40 flex items-center justify-between gap-1">
                              {/* Left shift */}
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={col === "Lead"}
                                onClick={() => movePipelineStage(p.id, col, 'left')}
                                className="h-6 w-6 text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </Button>

                              {/* Dropdown jump */}
                              <select
                                value={p.journeyStatus}
                                onChange={(e) => handleStageSelectChange(p.id, e.target.value as Profile['journeyStatus'])}
                                className="text-[9px] font-bold text-primary bg-surface border border-border-custom rounded px-1.5 py-0.5 max-w-[110px] outline-hidden"
                              >
                                {journeyStatuses.map(stage => (
                                  <option key={stage} value={stage}>{stage}</option>
                                ))}
                              </select>

                              {/* Right shift */}
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={col === "Inactive"}
                                onClick={() => movePipelineStage(p.id, col, 'right')}
                                className="h-6 w-6 text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/* VIEW 3: MATCH HISTORY (SENT SUGGESTIONS - REFERENCE IMAGE) */}
        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeView === "matches" && (
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10 w-full">
            {/* Header info */}
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Match History Archive</h1>
              <p className="text-sm text-text-secondary mt-1">Audit pairings dispatched by matchmaker agents.</p>
            </div>

            {/* Metrics block from Reference Image */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: TOTAL MATCHES SENT */}
              <Card className="shadow-sm border-border-custom rounded-[18px]">
                <CardContent className="pt-6 pb-5 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Matches Sent</p>
                    <span className="text-4xl font-serif font-bold tracking-tight text-foreground">
                      {matchHistory.length}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--status-married)] font-bold select-none pt-1">
                      <TrendingUp className="h-3.5 w-3.5 fill-current" />
                      +12% from last month
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <Send className="h-5 w-5 fill-current" />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: ACCEPTANCE RATE */}
              <Card className="shadow-sm border-border-custom rounded-[18px]">
                <CardContent className="pt-6 pb-5 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Acceptance Rate</p>
                      <span className="text-4xl font-serif font-bold tracking-tight text-foreground">
                        {acceptanceRate}%
                      </span>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <Progress value={acceptanceRate} className="h-2" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
                    <span className="text-[9px] text-text-muted block select-none">Goal threshold: 70%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: TOP CRITERIA */}
              <Card className="shadow-sm border-border-custom rounded-[18px]">
                <CardContent className="pt-6 pb-5 flex items-start justify-between">
                  <div className="space-y-1.5 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Top Criteria</p>
                    
                    <div className="flex flex-wrap gap-1.5 py-1">
                      <span className="bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded border border-primary/20 font-semibold uppercase tracking-wider">Values Alignment</span>
                      <span className="bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded border border-primary/20 font-semibold uppercase tracking-wider">Lifestyle</span>
                      <span className="bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded border border-primary/20 font-semibold uppercase tracking-wider">Career Stage</span>
                    </div>

                    <p className="text-[10px] text-text-muted leading-normal pt-1 italic select-none">
                      Based on successful pairings this month.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter controls from Reference Image */}
            <Card className="shadow-sm border-border-custom">
              <CardContent className="pt-6 pb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Date Range</label>
                  <select
                    value={historyDateFilter}
                    onChange={(e) => setHistoryDateFilter(e.target.value)}
                    className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-xs text-foreground outline-hidden focus:border-primary"
                  >
                    <option value="all">All Time</option>
                    <option value="7days">Last 30 Days</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Match Status</label>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-xs text-foreground outline-hidden focus:border-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Sent">Sent</option>
                    <option value="Discussing">Discussing</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Matchmaker Admin</label>
                  <div className="w-full rounded-lg border border-border-custom bg-surface-secondary py-2 px-3 text-xs text-text-muted font-semibold select-none">
                    All Matchmakers
                  </div>
                </div>

                <Button
                  className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-1.5 rounded-lg cursor-pointer animate-fade-in"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Apply Filters
                </Button>
              </CardContent>
            </Card>

            {/* Pairing logs table from Reference Image */}
            <Card className="shadow-xs overflow-hidden">
              <CardHeader className="pb-3 border-b border-border-custom py-4">
                <h2 className="text-md font-bold text-text-primary font-serif">Logged Pairings</h2>
              </CardHeader>
              <CardContent className="p-0">
                {filteredMatchHistory.length === 0 ? (
                  <p className="text-xs text-text-muted italic text-center py-10">No recommendation events match the criteria.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Primary Customer</TableHead>
                        <TableHead>Matched With</TableHead>
                        <TableHead>Match Date</TableHead>
                        <TableHead>AI Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMatchHistory.map((h) => (
                        <TableRow key={h.id}>
                          {/* Col 1 */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img 
                                src={h.primary?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Client`} 
                                alt={h.primary?.firstName || "Client"}
                                className="h-9 w-9 rounded-full border border-border-custom bg-surface-secondary shrink-0"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-text-primary">{h.primary?.firstName} {h.primary?.lastName}</span>
                                <span className="text-[10px] text-text-muted">ID: {h.customerId}</span>
                              </div>
                            </div>
                          </TableCell>
                          {/* Col 2 */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img 
                                src={h.matched?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${h.matchName}`} 
                                alt={h.matchName}
                                className="h-9 w-9 rounded-full border border-border-custom bg-surface-secondary shrink-0"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-text-primary">{h.matchName}</span>
                                <span className="text-[10px] text-text-muted">ID: {h.matchId}</span>
                              </div>
                            </div>
                          </TableCell>
                          {/* Col 3 */}
                          <TableCell className="text-xs text-text-secondary font-medium">{h.date}</TableCell>
                          {/* Col 4 */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {/* Simple Circular Score matching reference image circular metric */}
                              <div className="relative h-7 w-7 flex items-center justify-center shrink-0">
                                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                                  <circle cx="14" cy="14" r="11" stroke="var(--border)" strokeWidth="2" fill="transparent" />
                                  <circle cx="14" cy="14" r="11" stroke="var(--primary)" strokeWidth="2" fill="transparent" strokeDasharray="69" strokeDashoffset={69 - (69 * h.score) / 100} />
                                </svg>
                                <span className="text-[9px] font-bold text-primary">{h.score}%</span>
                              </div>
                            </div>
                          </TableCell>
                          {/* Col 5 */}
                          <TableCell>
                            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full inline-block border uppercase tracking-wider", {
                              "bg-[rgba(52,199,89,0.1)] text-[var(--status-married)] border-[rgba(52,199,89,0.2)]": h.status === 'Accepted',
                              "bg-[rgba(142,142,147,0.1)] text-[var(--status-lead)] border-[rgba(142,142,147,0.2)]": h.status === 'Sent',
                              "bg-[rgba(50,173,230,0.1)] text-[var(--status-meeting)] border-[rgba(50,173,230,0.2)]": h.status === 'Discussing' || h.status === 'Viewed',
                              "bg-red-500/10 text-red-500 border-red-500/20": h.status === 'Rejected'
                            })}>
                              {h.status}
                            </span>
                          </TableCell>
                          {/* Col 6 */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/customer/${h.customerId}`)}
                                className="h-8 text-[10px] font-bold uppercase tracking-wider gap-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Details
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteHistoryLog(h.id)}
                                className="h-8 w-8 text-text-muted hover:text-red-650 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>

              {/* Table pagination for history */}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-between border-t border-border-custom px-6 py-4 bg-surface-secondary/40 select-none">
                  <span className="text-xs text-text-muted">
                    Showing page <strong className="font-bold text-text-primary">{historyPage}</strong> of <strong className="font-bold text-text-primary">{totalHistoryPages}</strong> ({filteredMatchHistory.length} total)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                      disabled={historyPage === totalHistoryPages}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </main>
        )}

        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/* VIEW 6: SCHEDULED MEETINGS BOARD */}
        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeView === "meetings" && (
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10 w-full">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">Scheduled Meetings Board</h1>
                <p className="text-sm text-text-secondary mt-1">Audit security protocols, locations, and safety concierge detail for live matches.</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedHostId("");
                  setSelectedGuestId("");
                  setMeetingDate("");
                  setMeetingTime("");
                  setMeetingVenue("");
                  setSecurityLevel("Medium");
                  setSecurityStaff("");
                  setMeetingNotes("");
                  setIsMeetingModalOpen(true);
                }}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider h-10 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
              >
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 pb-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Scheduled Meetings</p>
                    <p className="text-3xl font-bold text-foreground">
                      {meetings.filter(m => m.status === 'Scheduled').length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 pb-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Completed Meetings</p>
                    <p className="text-3xl font-bold text-foreground">
                      {meetings.filter(m => m.status === 'Completed').length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-[var(--status-married)] shrink-0">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 pb-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Cancelled Meetings</p>
                    <p className="text-3xl font-bold text-foreground">
                      {meetings.filter(m => m.status === 'Cancelled').length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 shrink-0">
                    <Trash2 className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Meetings Grid List */}
            {meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface-secondary/40 border border-border-custom rounded-xl">
                <Calendar className="h-12 w-12 stroke-[1.5] mb-3 text-text-muted animate-pulse" />
                <h3 className="font-semibold text-text-primary">No Scheduled Meetings</h3>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">Create scheduled pairings to monitor security status and safety logs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none animate-fade-in">
                {meetings.map((meeting) => (
                  <Card key={meeting.id} className="shadow-xs overflow-hidden flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-border-custom bg-surface-secondary/20 flex flex-row items-center justify-between space-y-0 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-primary">Meeting Log</span>
                        <span className="text-[10px] text-text-muted">ID: {meeting.id}</span>
                      </div>
                      <Badge status={meeting.status === 'Scheduled' ? 'Meeting Scheduled' : meeting.status === 'Completed' ? 'Married' : 'Inactive'}>
                        {meeting.status}
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="pt-5 space-y-4">
                      {/* People involved */}
                      <div className="flex items-center justify-between gap-2 border-b border-border-custom pb-3.5">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Host Customer</span>
                          <span className="font-bold text-sm text-foreground mt-0.5">{meeting.hostName}</span>
                          <span className="text-[10px] text-text-muted">ID: {meeting.hostId}</span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-surface-secondary border border-border-custom flex items-center justify-center shrink-0">
                          ❤️
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Guest Match</span>
                          <span className="font-bold text-sm text-foreground mt-0.5">{meeting.guestName}</span>
                          <span className="text-[10px] text-text-muted">ID: {meeting.guestId}</span>
                        </div>
                      </div>

                      {/* Venue, Date and Time */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Schedule Timing</span>
                          <span className="font-bold text-text-primary block">📅 {meeting.date}</span>
                          <span className="text-[11px] text-text-secondary block">⏰ {meeting.time}</span>
                        </div>
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Venue Location</span>
                          <span className="font-bold text-text-primary block truncate" title={meeting.venue}>📍 {meeting.venue}</span>
                          <span className="text-[10px] text-text-muted block">Verified Safe Space</span>
                        </div>
                      </div>

                      {/* Notes block */}
                      {meeting.notes && (
                        <div className="bg-surface-secondary/45 border border-border-custom p-3 rounded-xl text-left text-xs">
                          <span className="text-[10px] font-bold uppercase text-text-muted block">Meeting Notes</span>
                          <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5 italic">
                            &quot;{meeting.notes}&quot;
                          </p>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="border-t border-border-custom pt-4 pb-4 flex justify-between bg-surface-secondary/10">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this meeting?")) {
                            const updated = meetings.map(m => m.id === meeting.id ? { ...m, status: 'Cancelled' as const } : m);
                            localStorage.setItem("tdc-meetings", JSON.stringify(updated));
                            setMeetings(updated);
                            toast("Meeting Cancelled", "Meeting status updated to Cancelled.", "info");
                          }
                        }}
                        disabled={meeting.status === 'Cancelled'}
                        className="text-red-500 border-red-500/20 hover:bg-red-500/10 cursor-pointer text-xs font-semibold h-8"
                      >
                        Cancel Match Meet
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (confirm("Mark this meeting as successfully Completed?")) {
                              const updated = meetings.map(m => m.id === meeting.id ? { ...m, status: 'Completed' as const } : m);
                              localStorage.setItem("tdc-meetings", JSON.stringify(updated));
                              setMeetings(updated);
                              toast("Meeting Completed", "Matchmaking consultation session logged.", "success");
                            }
                          }}
                          disabled={meeting.status !== 'Scheduled'}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-8 px-3 rounded-lg cursor-pointer animate-fade-in"
                        >
                          Complete Meet
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this meeting log completely?")) {
                              const updated = meetings.filter(m => m.id !== meeting.id);
                              localStorage.setItem("tdc-meetings", JSON.stringify(updated));
                              setMeetings(updated);
                              toast("Meeting Log Deleted", "Pairing record completely removed.", "info");
                            }
                          }}
                          className="h-8 w-8 text-text-muted hover:text-red-650 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </main>
        )}

        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/* VIEW 4: CONSULTATION CALL LOGS */}
        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeView === "logs" && (
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10 w-full">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Unified Consultation Logs</h1>
              <p className="text-sm text-text-secondary mt-1">Audit unstructured call notes and parsed AI preferences.</p>
            </div>

            <Card className="shadow-xs border-border-custom">
              <CardContent className="pt-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search logs by keyword or client name..."
                    value={logsSearchQuery}
                    onChange={(e) => setLogsSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-border-custom bg-surface py-2 pl-10 pr-4 text-sm text-foreground outline-hidden focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {unifiedLogs.length === 0 ? (
                <div className="text-center py-12 text-text-muted italic">No notes found matching your search.</div>
              ) : (
                unifiedLogs.map(({ note, profile }) => (
                  <Card key={note.id} className="p-5 relative group flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex gap-3 items-start">
                      <img 
                        src={profile.avatar} 
                        alt={profile.firstName}
                        onClick={() => router.push(`/customer/${profile.id}`)}
                        className="h-10 w-10 rounded-full border border-border-custom bg-surface-secondary shrink-0 cursor-pointer"
                      />
                      <div className="space-y-1 min-w-0">
                        <span className="font-bold text-xs text-text-primary block cursor-pointer hover:underline" onClick={() => router.push(`/customer/${profile.id}`)}>
                          {profile.firstName} {profile.lastName}
                        </span>
                        <span className="text-[10px] text-text-muted block">{note.createdAt}</span>
                        <p className="text-xs text-text-primary leading-relaxed pt-2">{note.content}</p>
                      </div>
                    </div>

                    {/* AI extracted badge metadata logs info */}
                    {note.aiInsights && (
                      <div className="md:w-64 border-t md:border-t-0 md:border-l border-border-custom pt-3 md:pt-0 md:pl-4 shrink-0 space-y-2">
                        <span className="text-[9px] font-bold text-accent uppercase tracking-wider block flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 fill-current" />
                          AI Structured Extractor
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {note.aiInsights.values.map(val => (
                            <span key={val} className="bg-accent/10 text-accent text-[9px] px-1.5 py-0.5 rounded font-semibold border border-accent/20">
                              {val}
                            </span>
                          ))}
                          {note.aiInsights.religionPreference && note.aiInsights.religionPreference !== "Not mentioned" && (
                            <span className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded font-semibold border border-primary/20">
                              Religion: {note.aiInsights.religionPreference}
                            </span>
                          )}
                          {note.aiInsights.relocationPreference && note.aiInsights.relocationPreference !== "Not mentioned" && (
                            <span className="bg-[rgba(0,199,190,0.1)] text-[var(--status-matched)] text-[9px] px-1.5 py-0.5 rounded font-semibold border border-[rgba(0,199,190,0.2)]">
                              Loc: {note.aiInsights.relocationPreference}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </main>
        )}

        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/* VIEW 5: CRM SETTINGS */}
        {/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {activeView === "settings" && (
          <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-8 animate-fade-in relative z-10 w-full">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">CRM configurations</h1>
              <p className="text-sm text-text-secondary mt-1">Configure algorithmic scoring metrics and models.</p>
            </div>

            <form onSubmit={saveWeights} className="space-y-6">
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-serif font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Settings2 className="h-4 w-4" />
                    Algorithmic compatibility weight tuning
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define the importance of variables when ranking opposite-gender compatibility profiles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {/* Kids */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-secondary">Children preference weight (1-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={algoWeights.kids}
                        onChange={(e) => setAlgoWeights({ ...algoWeights, kids: Number(e.target.value) })}
                        className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 outline-hidden"
                      />
                    </div>
                    {/* Religion */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-secondary">Religion alignment weight (1-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={algoWeights.religion}
                        onChange={(e) => setAlgoWeights({ ...algoWeights, religion: Number(e.target.value) })}
                        className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 outline-hidden"
                      />
                    </div>
                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-secondary">Location alignment weight (1-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={algoWeights.location}
                        onChange={(e) => setAlgoWeights({ ...algoWeights, location: Number(e.target.value) })}
                        className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 outline-hidden"
                      />
                    </div>
                    {/* Profession */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-secondary">Profession alignment weight (1-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={algoWeights.profession}
                        onChange={(e) => setAlgoWeights({ ...algoWeights, profession: Number(e.target.value) })}
                        className="w-full rounded-lg border border-border-custom bg-surface py-1.5 px-3 outline-hidden"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-border-custom pt-4 flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs cursor-pointer px-4 h-9"
                  >
                    Save Weights
                  </Button>
                </CardFooter>
              </Card>

              {/* Advanced System reset settings */}
              <Card className="border-red-200 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-red-650 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-xs text-red-500">
                    Irreversible systems cleanup settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-text-muted">
                    Restoring defaults clears pipeline stage alterations, consultation call logs, and matchmaking records.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetCRMDatabase}
                    className="text-red-500 border-red-500/20 hover:bg-red-500/10 cursor-pointer h-9 text-xs font-semibold gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset CRM Database
                  </Button>
                </CardContent>
              </Card>
            </form>
          </main>
        )}
      </div>

      {/* Schedule Meeting Dialog Modal */}
      <Dialog isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)}>
        <form onSubmit={handleScheduleMeeting}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 font-serif font-bold text-primary uppercase tracking-wider text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              Schedule Safe Matrimonial Meeting
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Record venue particulars, schedule timelines, and security logistics for client matching.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3.5 text-xs text-foreground">
            {/* Host Selector */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="host-select">
                Host Client (Person A)
              </label>
              <select
                id="host-select"
                required
                value={selectedHostId}
                onChange={(e) => {
                  setSelectedHostId(e.target.value);
                  setSelectedGuestId("");
                }}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select Host Profile</option>
                {hostOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.id} • {p.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Guest Selector */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="guest-select">
                Guest Match (Person B)
              </label>
              <select
                id="guest-select"
                required
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                disabled={!selectedHostId}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Select Candidate Match</option>
                {guestOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.id} • {p.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="meet-date">
                  Meeting Date
                </label>
                <input
                  id="meet-date"
                  type="date"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="meet-time">
                  Meeting Time
                </label>
                <input
                  id="meet-time"
                  type="time"
                  required
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Venue Location */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="meet-venue">
                Venue Location
              </label>
              <input
                id="meet-venue"
                type="text"
                required
                placeholder="e.g. Taj Mahal Palace Hotel, Mumbai"
                value={meetingVenue}
                onChange={(e) => setMeetingVenue(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Meeting Notes */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="meet-notes">
                Concierge Notes
              </label>
              <textarea
                id="meet-notes"
                placeholder="Details of families attending, matchmaker presence, or specific requirements..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMeetingModalOpen(false)}
                className="h-9 text-xs cursor-pointer px-4 font-semibold animate-fade-in"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs bg-primary hover:bg-primary-hover text-white cursor-pointer px-4 font-semibold animate-fade-in"
              >
                Save Schedule
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Candidate Dialog Modal */}
      <Dialog isOpen={isAddCandidateOpen} onClose={() => setIsAddCandidateOpen(false)} className="max-w-2xl">
        <form onSubmit={handleAddCandidateSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 font-serif font-bold text-primary uppercase tracking-wider text-sm">
              <Plus className="h-4 w-4 text-primary" />
              Register New Candidate Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Input candidate demographics, education, career, and family background to create an active matchmaker record.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-foreground">
            {/* First Name */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-first-name">
                First Name
              </label>
              <input
                id="cand-first-name"
                type="text"
                required
                placeholder="e.g. Ramesh"
                value={candFirstName}
                onChange={(e) => setCandFirstName(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-last-name">
                Last Name
              </label>
              <input
                id="cand-last-name"
                type="text"
                required
                placeholder="e.g. Kumar"
                value={candLastName}
                onChange={(e) => setCandLastName(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-gender">
                Gender
              </label>
              <select
                id="cand-gender"
                required
                value={candGender}
                onChange={(e) => setCandGender(e.target.value as 'male' | 'female')}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Age */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-age">
                Age
              </label>
              <input
                id="cand-age"
                type="number"
                required
                min="18"
                max="100"
                placeholder="e.g. 28"
                value={candAge}
                onChange={(e) => setCandAge(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* City */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-city">
                City
              </label>
              <input
                id="cand-city"
                type="text"
                required
                placeholder="e.g. Delhi"
                value={candCity}
                onChange={(e) => setCandCity(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Mother Tongue */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-mother-tongue">
                Mother Tongue
              </label>
              <input
                id="cand-mother-tongue"
                type="text"
                required
                placeholder="e.g. Hindi"
                value={candMotherTongue}
                onChange={(e) => setCandMotherTongue(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Religion */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-religion">
                Religion
              </label>
              <input
                id="cand-religion"
                type="text"
                required
                placeholder="e.g. Hindu"
                value={candReligion}
                onChange={(e) => setCandReligion(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Caste */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-caste">
                Caste / Subcaste
              </label>
              <input
                id="cand-caste"
                type="text"
                required
                placeholder="e.g. Brahmin"
                value={candCaste}
                onChange={(e) => setCandCaste(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Marital Status */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-marital-status">
                Marital Status
              </label>
              <select
                id="cand-marital-status"
                required
                value={candMaritalStatus}
                onChange={(e) => setCandMaritalStatus(e.target.value as Profile['maritalStatus'])}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {maritalStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Journey Status */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-journey-status">
                Journey Status
              </label>
              <select
                id="cand-journey-status"
                required
                value={candJourneyStatus}
                onChange={(e) => setCandJourneyStatus(e.target.value as Profile['journeyStatus'])}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {journeyStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Degree */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-degree">
                Education Degree
              </label>
              <input
                id="cand-degree"
                type="text"
                required
                placeholder="e.g. MBA"
                value={candDegree}
                onChange={(e) => setCandDegree(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-designation">
                Career Designation
              </label>
              <input
                id="cand-designation"
                type="text"
                required
                placeholder="e.g. Product Manager"
                value={candDesignation}
                onChange={(e) => setCandDesignation(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Annual Income */}
            <div className="space-y-1 text-left md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="cand-income">
                Annual Income (INR)
              </label>
              <input
                id="cand-income"
                type="number"
                required
                placeholder="e.g. 1500000"
                value={candIncome}
                onChange={(e) => setCandIncome(e.target.value)}
                className="w-full rounded-lg border border-border-custom bg-surface py-2 px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddCandidateOpen(false)}
                className="h-9 text-xs cursor-pointer px-4 font-semibold animate-fade-in"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs bg-primary hover:bg-primary-hover text-white cursor-pointer px-4 font-semibold animate-fade-in"
              >
                Register Candidate
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

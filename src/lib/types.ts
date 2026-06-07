export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  dob: string;
  age: number;
  height: number; // in cm (e.g., 175)
  email: string;
  phone: string;
  city: string;
  country: string;
  education: {
    degree: string;
    college: string;
  };
  career: {
    company: string;
    designation: string;
    income: number; // annual income in INR (e.g., 1500000)
  };
  family: {
    religion: string;
    caste: string;
    siblings: number;
    familyType: 'Joint' | 'Nuclear' | 'Extended';
  };
  lifestyle: {
    diet: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Vegan';
    smoking: 'Yes' | 'No' | 'Occasionally';
    drinking: 'Yes' | 'No' | 'Socially';
  };
  preferences: {
    preferredAgeRange: {
      min: number;
      max: number;
    };
    preferredLocation: string[]; // e.g., ["Mumbai", "Bangalore"]
    educationPreference: string; // e.g., "Bachelors", "Masters", "Any"
    wantKids: 'Yes' | 'No' | 'Open';
    openToRelocate: 'Yes' | 'No' | 'Open';
    openToPets: 'Yes' | 'No';
  };
  motherTongue: string;
  manglik: 'Yes' | 'No' | 'Partial';
  hobbies: string[];
  journeyStatus: 'Lead' | 'Verified' | 'Searching' | 'Matched' | 'Meeting Scheduled' | 'Engaged' | 'Married' | 'Inactive';
  maritalStatus: 'Never Married' | 'Divorced' | 'Widowed';
  favorite?: boolean;
  avatar?: string;
}

export interface AiExtractedInsights {
  values: string[];
  religionPreference: string;
  relocationPreference: string;
  smokingPreference: string;
  professionPreference: string;
}

export interface Note {
  id: string;
  customerId: string;
  content: string;
  createdAt: string;
  aiInsights?: AiExtractedInsights;
}

export interface MatchHistory {
  id: string;
  customerId: string;
  matchId: string;
  matchName: string;
  matchGender: 'male' | 'female';
  date: string;
  score: number;
  status: 'Sent' | 'Viewed' | 'Discussing' | 'Accepted' | 'Rejected';
  journeyStatus: Profile['journeyStatus'];
  introMessage?: string; // AI generated intro
}

export interface CompatibilityAdvisorResult {
  score: number;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  explanation: string;
}

export interface Meeting {
  id: string;
  hostId: string;
  guestId: string;
  hostName: string;
  guestName: string;
  date: string;
  time: string;
  venue: string;
  securityLevel: 'Low' | 'Medium' | 'High' | 'Elite';
  securityStaff: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'new_entry' | 'status_change' | 'security' | 'info';
  timestamp: string;
  read: boolean;
  link?: string;
}


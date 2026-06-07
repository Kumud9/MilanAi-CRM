import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Profile } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Crore`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} Lakh`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHeight(cm: number): string {
  const inchesTotal = cm / 2.54;
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return `${feet}'${inches}" (${cm} cm)`;
}

export function calculateAge(dobString: string): number {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function calculateProfileCompletion(profile: Profile): number {
  const fields: (keyof Profile | string)[] = [
    'firstName', 'lastName', 'gender', 'dob', 'height', 'email', 'phone', 'city', 'country',
    'education.degree', 'education.college', 'career.company', 'career.designation', 'career.income',
    'family.religion', 'family.caste', 'family.siblings', 'family.familyType',
    'lifestyle.diet', 'lifestyle.smoking', 'lifestyle.drinking',
    'preferences.preferredAgeRange', 'preferences.preferredLocation', 'preferences.educationPreference',
    'preferences.wantKids', 'preferences.openToRelocate', 'preferences.openToPets',
    'motherTongue', 'manglik', 'hobbies'
  ];

  let completed = 0;

  for (const field of fields) {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const parentObj = profile[parent as keyof Profile] as Record<string, unknown>;
      if (parentObj && parentObj[child] !== undefined && parentObj[child] !== '' && parentObj[child] !== null) {
        if (Array.isArray(parentObj[child])) {
          if (parentObj[child].length > 0) completed++;
        } else {
          completed++;
        }
      }
    } else {
      const val = profile[field as keyof Profile];
      if (val !== undefined && val !== '' && val !== null) {
        if (Array.isArray(val)) {
          if (val.length > 0) completed++;
        } else {
          completed++;
        }
      }
    }
  }

  return Math.round((completed / fields.length) * 100);
}

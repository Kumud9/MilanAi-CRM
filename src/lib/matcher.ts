import { Profile } from "./types";

export interface MatchResult {
  score: number;
  reasons: string[];
  profile: Profile;
}

// Utility to determine if a degree is a Masters
function isMasters(degree: string): boolean {
  const d = degree.toLowerCase();
  return d.startsWith('m.') || d.includes('masters') || d.includes('mba') || d.includes('md') || d.includes('mca');
}

// Utility to determine if a degree is a Bachelors
function isBachelors(degree: string): boolean {
  const d = degree.toLowerCase();
  return d.startsWith('b.') || d.includes('bachelors') || d.includes('mbbs') || d.includes('llb') || d.includes('bca');
}

export function findMatches(target: Profile, candidates: Profile[]): MatchResult[] {
  // Filter for opposite gender
  const oppositeGenderCandidates = candidates.filter(
    (c) => c.gender !== target.gender && c.id !== target.id && c.journeyStatus !== 'Inactive'
  );

  const results: MatchResult[] = oppositeGenderCandidates.map((candidate) => {
    let score = 0;
    const reasons: string[] = [];

    // --- 1. Children Preference (Weight: 25) ---
    // If both agree, full points. If one is 'Open', 15 points. If they clash, 0 points.
    if (target.preferences.wantKids === candidate.preferences.wantKids) {
      score += 25;
      reasons.push(`Aligned on family planning preferences (${target.preferences.wantKids === 'Yes' ? 'Both want children' : target.preferences.wantKids === 'No' ? 'Neither wants children' : 'Both open to children'})`);
    } else if (target.preferences.wantKids === 'Open' || candidate.preferences.wantKids === 'Open') {
      score += 15;
      reasons.push("Flexible on children preferences (one party open)");
    } else {
      reasons.push("Different preferences regarding children");
    }

    if (target.gender === 'male') {
      // ==========================================
      // MALE MATCHING LOGIC (Matching with Female candidate)
      // Prioritize: Younger partner, Shorter partner, Similar religion, Same city, Similar values, Similar lifestyle, Matching preference for children
      // Weights: Children (25), Religion (15), City (15), Height (15), Income (10), Education (10), Lifestyle (10)
      // ==========================================

      // --- 2. Religion (Weight: 15) ---
      if (target.family.religion === candidate.family.religion) {
        score += 15;
        if (target.family.caste === candidate.family.caste) {
          reasons.push(`Same religion (${target.family.religion}) and community (${target.family.caste})`);
        } else {
          reasons.push(`Same religion (${target.family.religion})`);
        }
      } else {
        reasons.push(`Different religious backgrounds (${target.family.religion} and ${candidate.family.religion})`);
      }

      // --- 3. City (Weight: 15) ---
      if (target.city === candidate.city) {
        score += 15;
        reasons.push(`Same location (${target.city})`);
      } else if (candidate.preferences.openToRelocate === 'Yes' || candidate.preferences.openToRelocate === 'Open') {
        score += 5;
        reasons.push(`Candidate is willing to relocate from ${candidate.city} to ${target.city}`);
      } else {
        reasons.push(`Based in different cities (${target.city} vs ${candidate.city})`);
      }

      // --- 4. Height (Weight: 15) ---
      // Male target typically prefers shorter female partner
      if (candidate.height < target.height) {
        score += 15;
        reasons.push(`Height compatibility (candidate is shorter by ${target.height - candidate.height} cm)`);
      } else if (candidate.height === target.height) {
        score += 5;
        reasons.push("Same height");
      } else {
        reasons.push(`Candidate is taller by ${candidate.height - target.height} cm`);
      }

      // --- 5. Income (Weight: 10) ---
      // Aligned expectations (within 50% income range)
      const maleIncome = target.career.income;
      const femaleIncome = candidate.career.income;
      const incomeDiffRatio = Math.abs(maleIncome - femaleIncome) / maleIncome;
      if (incomeDiffRatio <= 0.5) {
        score += 10;
        reasons.push("Aligned career incomes and financial status");
      } else if (incomeDiffRatio <= 1.0) {
        score += 5;
        reasons.push("Moderately compatible financial status");
      } else {
        reasons.push("Significant difference in current annual incomes");
      }

      // --- 6. Education (Weight: 10) ---
      const targetEduPref = target.preferences.educationPreference;
      const candidateDegree = candidate.education.degree;
      if (targetEduPref === 'Any') {
        score += 10;
        reasons.push("Matches educational preferences");
      } else if (targetEduPref === 'Masters' && isMasters(candidateDegree)) {
        score += 10;
        reasons.push(`Candidate has a Master's degree (${candidate.education.degree})`);
      } else if (targetEduPref === 'Bachelors' && (isBachelors(candidateDegree) || isMasters(candidateDegree))) {
        score += 10;
        reasons.push(`Candidate matches Bachelor's or higher degree preference`);
      } else {
        score += 3;
        reasons.push(`Education level discrepancy (Target prefers ${targetEduPref}, candidate has ${candidateDegree})`);
      }

      // --- 7. Lifestyle (Weight: 10) ---
      // Compare diet, smoking, drinking
      let lifestyleScore = 0;
      if (target.lifestyle.diet === candidate.lifestyle.diet || target.lifestyle.diet === 'Non-Vegetarian') {
        lifestyleScore += 4;
      }
      if (target.lifestyle.smoking === candidate.lifestyle.smoking || candidate.lifestyle.smoking === 'No') {
        lifestyleScore += 3;
      }
      if (target.lifestyle.drinking === candidate.lifestyle.drinking || candidate.lifestyle.drinking === 'No' || candidate.lifestyle.drinking === 'Socially') {
        lifestyleScore += 3;
      }
      score += lifestyleScore;
      if (lifestyleScore >= 8) {
        reasons.push("Highly compatible lifestyle choices (diet, smoking, drinking)");
      } else if (lifestyleScore >= 5) {
        reasons.push("Somewhat compatible lifestyle habits");
      } else {
        reasons.push("Differing lifestyle habits");
      }

    } else {
      // ==========================================
      // FEMALE MATCHING LOGIC (Matching with Male candidate)
      // Prioritize: Similar education, Similar profession, Similar values, Relocation compatibility, Lifestyle compatibility, Children preference, Similar income
      // Weights: Children (25), Profession (20), Education (15), Relocation (15), Lifestyle (15), Income (10)
      // ==========================================

      // --- 2. Profession (Weight: 20) ---
      // Extract career domains or match exactly
      const targetDesig = target.career.designation.toLowerCase();
      const candDesig = candidate.career.designation.toLowerCase();
      const targetCompany = target.career.company.toLowerCase();
      const candCompany = candidate.career.company.toLowerCase();
      
      const isBothTech = (targetDesig.includes('software') || targetDesig.includes('sde') || targetDesig.includes('developer') || targetDesig.includes('analyst') || targetDesig.includes('founder') || targetDesig.includes('engineer')) &&
                         (candDesig.includes('software') || candDesig.includes('sde') || candDesig.includes('developer') || candDesig.includes('analyst') || candDesig.includes('founder') || candDesig.includes('engineer'));

      if (target.career.designation === candidate.career.designation) {
        score += 20;
        reasons.push(`Exact profession match (Both are ${target.career.designation}s)`);
      } else if (isBothTech) {
        score += 18;
        reasons.push("Both are working in the technology sector");
      } else if (targetCompany === candCompany) {
        score += 15;
        reasons.push(`Same company (${target.career.company})`);
      } else {
        score += 10;
        reasons.push(`Compatible professional backgrounds (${target.career.designation} and ${candidate.career.designation})`);
      }

      // --- 3. Education (Weight: 15) ---
      const targetEduPref = target.preferences.educationPreference;
      const candidateDegree = candidate.education.degree;
      if (targetEduPref === 'Any') {
        score += 15;
        reasons.push("Matches educational preferences");
      } else if (targetEduPref === 'Masters' && isMasters(candidateDegree)) {
        score += 15;
        reasons.push(`Strong educational alignment (Candidate has Master's: ${candidate.education.degree})`);
      } else if (targetEduPref === 'Bachelors' && (isBachelors(candidateDegree) || isMasters(candidateDegree))) {
        score += 15;
        reasons.push("Candidate meets the education preference criteria");
      } else {
        score += 5;
        reasons.push(`Different education levels (Target prefers ${targetEduPref}, Candidate has ${candidateDegree})`);
      }

      // --- 4. Relocation Compatibility (Weight: 15) ---
      if (target.city === candidate.city) {
        score += 15;
        reasons.push(`Same current city (${target.city})`);
      } else if (target.preferences.openToRelocate === 'Yes' || target.preferences.openToRelocate === 'Open') {
        score += 15;
        reasons.push(`Relocation compatible (Female target is open to relocate to ${candidate.city})`);
      } else if (candidate.preferences.openToRelocate === 'Yes' || candidate.preferences.openToRelocate === 'Open') {
        score += 12;
        reasons.push(`Relocation compatible (Male candidate is open to relocate to ${target.city})`);
      } else {
        reasons.push(`Different cities (${target.city} vs ${candidate.city}) and both prefer not to relocate`);
      }

      // --- 5. Lifestyle Compatibility (Weight: 15) ---
      let lifestyleScore = 0;
      if (target.lifestyle.diet === candidate.lifestyle.diet || target.lifestyle.diet === 'Non-Vegetarian') {
        lifestyleScore += 5;
      }
      if (target.lifestyle.smoking === candidate.lifestyle.smoking || candidate.lifestyle.smoking === 'No') {
        lifestyleScore += 5;
      }
      if (target.lifestyle.drinking === candidate.lifestyle.drinking || candidate.lifestyle.drinking === 'No' || candidate.lifestyle.drinking === 'Socially') {
        lifestyleScore += 5;
      }
      score += lifestyleScore;
      if (lifestyleScore >= 12) {
        reasons.push("High lifestyle compatibility (diet, smoking, drinking preferences)");
      } else if (lifestyleScore >= 8) {
        reasons.push("Moderate lifestyle compatibility");
      } else {
        reasons.push("Lifestyle habits may clash");
      }

      // --- 6. Income Compatibility (Weight: 10) ---
      // Female target typically prefers male candidate to have similar or higher income
      if (candidate.career.income >= target.career.income) {
        score += 10;
        reasons.push(`Male candidate has a higher/matching income (${candidate.career.company} - ${candidate.career.designation})`);
      } else if (candidate.career.income >= target.career.income * 0.7) {
        score += 6;
        reasons.push("Male candidate income is slightly lower but compatible");
      } else {
        score += 2;
        reasons.push("Significant income gap (Candidate income is lower than target)");
      }
    }

    // --- Age Compatibility Adjustment (Bonus Penalty if outside preferred range) ---
    const agePref = target.preferences.preferredAgeRange;
    if (candidate.age < agePref.min || candidate.age > agePref.max) {
      // Penalty for age mismatch (caps at -15)
      const diff = candidate.age < agePref.min ? agePref.min - candidate.age : candidate.age - agePref.max;
      score = Math.max(0, score - Math.min(15, diff * 5));
      reasons.push(`Age is outside target's preferred range (${agePref.min}-${agePref.max} years)`);
    } else {
      reasons.push(`Age is within target's preferred range (${candidate.age} years old)`);
    }

    return {
      score: Math.min(100, Math.round(score)),
      reasons,
      profile: candidate
    };
  });

  // Sort descending and return Top 10
  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

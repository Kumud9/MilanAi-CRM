const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Configuration arrays for realistic Indian profiles
const RELIGIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain'];
const CASTES = {
  Hindu: ['Brahmin', 'Kshatriya', 'Vaishya', 'Kayastha', 'Rajput', 'Maratha', 'Nair', 'Reddy', 'Choudhury', 'Patel'],
  Sikh: ['Jat', 'Khatri', 'Arora', 'Ahluwalia', 'Gill'],
  Muslim: ['Sunni', 'Shia', 'Sayyed', 'Pathan'],
  Christian: ['Roman Catholic', 'Protestant', 'Syrian Christian'],
  Jain: ['Shvetambara', 'Digambara', 'Oswal']
};

const MOTHER_TONGUES = {
  Hindu: ['Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Punjabi', 'Gujarati', 'Kannada', 'Malayalam'],
  Sikh: ['Punjabi'],
  Muslim: ['Urdu', 'Hindi', 'Bengali', 'Malayalam'],
  Christian: ['English', 'Malayalam', 'Tamil', 'Konkani'],
  Jain: ['Gujarati', 'Hindi', 'Rajasthani', 'Marathi']
};

const CITIES_IN_INDIA = [
  'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 
  'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Gurgaon', 'Noida'
];

const MALE_NAMES = [
  'Rahul', 'Amit', 'Rohit', 'Vikram', 'Akash', 'Aditya', 'Siddharth', 'Abhishek', 'Karan', 'Rohan',
  'Nitin', 'Gaurav', 'Varun', 'Manish', 'Raj', 'Sanjay', 'Vijay', 'Sameer', 'Manoj', 'Vivek',
  'Pankaj', 'Kunal', 'Arjun', 'Nikhil', 'Dev', 'Ankit', 'Deepak', 'Sunil', 'Anand', 'Rishi',
  'Tarun', 'Sagar', 'Kabir', 'Ayush', 'Kartik', 'Harsh', 'Yash', 'Pranav', 'Rishabh', 'Aman',
  'Alok', 'Mohit', 'Prateek', 'Shashank', 'Mayank', 'Tushar', 'Saurabh', 'Piyush', 'Abhay', 'Vikas'
];

const FEMALE_NAMES = [
  'Priya', 'Pooja', 'Neha', 'Anjali', 'Riya', 'Sneha', 'Shreya', 'Divya', 'Aditi', 'Tanvi',
  'Kavita', 'Jyoti', 'Aarti', 'Payal', 'Megha', 'Swati', 'Deepa', 'Nisha', 'Sonam', 'Ritu',
  'Preeti', 'Shweta', 'Nikita', 'Mansi', 'Sakshi', 'Kajal', 'Komal', 'Shruti', 'Radhika', 'Rashi',
  'Ishita', 'Kiara', 'Aisha', 'Tanya', 'Natasha', 'Simran', 'Harpreet', 'Gurpreet', 'Jasmine', 'Richa',
  'Kirti', 'Meera', 'Rani', 'Vidya', 'Prisha', 'Aanya', 'Diya', 'Avani', 'Isha', 'Kavya'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Joshi', 'Trivedi', 'Shah', 'Rao', 'Nair',
  'Pillai', 'Iyer', 'Iyengar', 'Reddy', 'Choudhury', 'Das', 'Banerjee', 'Mukherjee', 'Chatterjee', 'Sen',
  'Singh', 'Sodhi', 'Ahluwalia', 'Gill', 'Grewal', 'Khan', 'Shaikh', 'Sayyed', 'Kulkarni', 'Deshpande',
  'Patil', 'Deshmukh', 'Bhat', 'Hegde', 'Bhattacharya', 'Chawla', 'Kapoor', 'Malhotra', 'Mehra', 'Sarihan'
];

const COLLEGES = [
  'IIT Bombay', 'IIT Delhi', 'BITS Pilani', 'Delhi University', 'IIM Ahmedabad', 'IIM Bangalore',
  'NIT Trichy', 'VIT University', 'Manipal Institute of Technology', 'SRCC', 'St. Xavier\'s Mumbai',
  'Symbiosis Pune', 'Anna University', 'RV College of Engineering', 'Osmania University', 'Jadavpur University'
];

const DEGREES = [
  'B.Tech in Computer Science', 'M.Tech in Software Engineering', 'MBA in Finance', 'MBBS', 'MD',
  'B.Com (Hons)', 'M.Com', 'B.Sc in Biotechnology', 'M.Sc in Physics', 'MCA', 'BCA', 'BA in Economics', 'LLB'
];

const CAREERS = [
  { field: 'Technology', company: 'Google', designation: 'Software Engineer', baseIncome: 1800000 },
  { field: 'Technology', company: 'Microsoft', designation: 'Senior Software Engineer', baseIncome: 2500000 },
  { field: 'Technology', company: 'Amazon', designation: 'SDE-2', baseIncome: 2200000 },
  { field: 'Technology', company: 'TCS', designation: 'Systems Engineer', baseIncome: 700000 },
  { field: 'Technology', company: 'Infosys', designation: 'Senior Analyst', baseIncome: 800000 },
  { field: 'Finance', company: 'Goldman Sachs', designation: 'Investment Analyst', baseIncome: 2000000 },
  { field: 'Finance', company: 'J.P. Morgan', designation: 'Financial Associate', baseIncome: 1800000 },
  { field: 'Consulting', company: 'McKinsey & Company', designation: 'Management Consultant', baseIncome: 2400000 },
  { field: 'Consulting', company: 'Deloitte', designation: 'Senior Consultant', baseIncome: 1200000 },
  { field: 'Healthcare', company: 'Apollo Hospitals', designation: 'Resident Medical Officer', baseIncome: 1400000 },
  { field: 'Healthcare', company: 'Fortis Healthcare', designation: 'Consultant Cardiologist', baseIncome: 3500000 },
  { field: 'Legal', company: 'AZB & Partners', designation: 'Corporate Lawyer', baseIncome: 1600000 },
  { field: 'Management', company: 'Hindustan Unilever', designation: 'Brand Manager', baseIncome: 2200000 },
  { field: 'Technology', company: 'StartUp India', designation: 'Co-Founder', baseIncome: 3000000 }
];

const HOBBIES = [
  'Cricket', 'Yoga', 'Reading', 'Photography', 'Cooking', 'Hiking', 'Traveling',
  'Classical Music', 'Painting', 'Gaming', 'Gardening', 'Dancing', 'Swimming', 
  'Cycling', 'Writing', 'Watching Movies', 'Astrology', 'Blogging', 'Playing Guitar'
];

const DIETS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'];
const SMOKING = ['No', 'No', 'No', 'Occasionally', 'Yes']; // bias towards "No"
const DRINKING = ['No', 'No', 'Socially', 'Socially', 'Yes'];

const JOURNEY_STATUSES = [
  'Lead', 'Verified', 'Searching', 'Matched', 
  'Meeting Scheduled', 'Engaged', 'Married', 'Inactive'
];

// Weighted selection helper
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProfile(id, gender) {
  const religion = getRandomElement(RELIGIONS);
  const casteList = CASTES[religion];
  const caste = getRandomElement(casteList);
  const tongueList = MOTHER_TONGUES[religion];
  const motherTongue = getRandomElement(tongueList);
  
  const firstName = gender === 'male' 
    ? MALE_NAMES[id % MALE_NAMES.length] 
    : FEMALE_NAMES[id % FEMALE_NAMES.length];
  
  const lastName = LAST_NAMES[(id + 13) % LAST_NAMES.length];
  const city = getRandomElement(CITIES_IN_INDIA);
  const college = getRandomElement(COLLEGES);
  const degree = getRandomElement(DEGREES);
  
  const careerTemplate = getRandomElement(CAREERS);
  // Add some random variation to base income (+/- 25%)
  const incomeVariation = (Math.random() * 0.5 - 0.25) * careerTemplate.baseIncome;
  const income = Math.round((careerTemplate.baseIncome + incomeVariation) / 50000) * 50000;
  
  const age = faker.number.int({ min: 23, max: 35 });
  // DOB matching the age
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const birthMonth = faker.number.int({ min: 0, max: 11 });
  const birthDay = faker.number.int({ min: 1, max: 28 });
  const dob = new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];

  const height = gender === 'male' 
    ? faker.number.int({ min: 168, max: 188 }) // Male heights in cm
    : faker.number.int({ min: 150, max: 172 }); // Female heights in cm

  // Hobbies list (select 2-4 randomly)
  const numHobbies = faker.number.int({ min: 2, max: 4 });
  const selectedHobbies = [];
  while (selectedHobbies.length < numHobbies) {
    const hobby = getRandomElement(HOBBIES);
    if (!selectedHobbies.includes(hobby)) {
      selectedHobbies.push(hobby);
    }
  }

  // Preferences configuration
  const prefAgeMin = Math.max(21, age - (gender === 'male' ? 5 : 2));
  const prefAgeMax = Math.min(38, age + (gender === 'male' ? 2 : 6));
  
  // Preferred locations (always include current city, plus 1-2 others)
  const preferredLocation = [city];
  const extraLocCount = faker.number.int({ min: 0, max: 2 });
  for (let i = 0; i < extraLocCount; i++) {
    const otherCity = getRandomElement(CITIES_IN_INDIA);
    if (!preferredLocation.includes(otherCity)) {
      preferredLocation.push(otherCity);
    }
  }

  // Education Preference bias
  let educationPreference = 'Any';
  if (degree.includes('M.Tech') || degree.includes('MBA') || degree.includes('MD')) {
    educationPreference = 'Masters';
  } else if (Math.random() > 0.4) {
    educationPreference = 'Bachelors';
  }

  // Status weights: bias towards searching/matched for realistic CRM experience
  const statusRand = Math.random();
  let journeyStatus = 'Searching';
  if (statusRand < 0.1) journeyStatus = 'Lead';
  else if (statusRand < 0.25) journeyStatus = 'Verified';
  else if (statusRand < 0.65) journeyStatus = 'Searching';
  else if (statusRand < 0.8) journeyStatus = 'Matched';
  else if (statusRand < 0.9) journeyStatus = 'Meeting Scheduled';
  else if (statusRand < 0.95) journeyStatus = 'Engaged';
  else journeyStatus = 'Inactive'; // Keep married low in database as it is an active matchmaker DB

  // Avatar using robohash with seed for beautiful dynamic graphics
  const avatar = `https://robohash.org/${gender}_${firstName}_${lastName}.png?set=set4&bgset=bg1`;

  return {
    id: `${gender === 'male' ? 'M' : 'F'}${String(id).padStart(3, '0')}`,
    firstName,
    lastName,
    gender,
    dob,
    age,
    height,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `+91 ${faker.number.int({ min: 7000000000, max: 9999999999 })}`,
    city,
    country: 'India',
    education: {
      degree,
      college
    },
    career: {
      company: careerTemplate.company,
      designation: careerTemplate.designation,
      income
    },
    family: {
      religion,
      caste,
      siblings: faker.number.int({ min: 0, max: 3 }),
      familyType: getRandomElement(['Joint', 'Nuclear', 'Extended'])
    },
    lifestyle: {
      diet: getRandomElement(DIETS),
      smoking: getRandomElement(SMOKING),
      drinking: getRandomElement(DRINKING)
    },
    preferences: {
      preferredAgeRange: {
        min: prefAgeMin,
        max: prefAgeMax
      },
      preferredLocation,
      educationPreference,
      wantKids: getRandomElement(['Yes', 'No', 'Open']),
      openToRelocate: getRandomElement(['Yes', 'No', 'Open']),
      openToPets: getRandomElement(['Yes', 'No'])
    },
    motherTongue,
    manglik: getRandomElement(['Yes', 'No', 'Partial']),
    hobbies: selectedHobbies,
    journeyStatus,
    maritalStatus: getRandomElement(['Never Married', 'Never Married', 'Never Married', 'Never Married', 'Never Married', 'Never Married', 'Never Married', 'Never Married', 'Divorced', 'Widowed']),
    favorite: false,
    avatar
  };
}

// Generate 100 Male and 100 Female profiles
const profiles = [];

for (let i = 1; i <= 100; i++) {
  profiles.push(generateProfile(i, 'male'));
}
for (let i = 1; i <= 100; i++) {
  profiles.push(generateProfile(i, 'female'));
}

// Write to directory
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'profiles.json'),
  JSON.stringify(profiles, null, 2),
  'utf-8'
);

console.log(`Successfully generated ${profiles.length} profiles (100 Male, 100 Female) in data/profiles.json`);

export type UserRole = 'student' | 'owner';

export type Locality =
  | 'Clement Town'
  | 'Dalanwala'
  | 'Rajpur Road'
  | 'Prem Nagar'
  | 'Bidholi'
  | 'Patel Nagar';

export type GenderPolicy = 'Boys' | 'Girls' | 'Co-ed';
export type RoomType = 'Single Studio' | 'Twin Sharing' | 'Triple Sharing';
export type VerificationStatus = 'Verified' | 'Pending Verification';
export type BookingType = 'Schedule Visit' | 'Reserve Bed';
export type BookingStatus =
  | 'Pending Visit'
  | 'Visit Scheduled'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled';
export type ServiceCategory =
  | 'Tiffin & Meals'
  | 'Campus Laundry'
  | 'Room Cleaning'
  | 'Basic Repairs';
export type ServiceOrderStatus = 'Active' | 'Scheduled' | 'Completed' | 'Cancelled';

export const BOUNDS = {
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 80,
  UNIVERSITY_MAX: 100,
  COURSE_YEAR_MAX: 40,
  PHONE_MIN: 6,
  PHONE_MAX: 24,
  LISTING_NAME_MIN: 3,
  LISTING_NAME_MAX: 100,
  NEAR_CAMPUS_MAX: 80,
  HOUSE_RULES_MAX: 400,
  DESCRIPTION_MAX: 600,
  REVIEW_COMMENT_MIN: 10,
  REVIEW_COMMENT_MAX: 800,
  BOOKING_NOTES_MAX: 400,
  SERVICE_NOTES_MAX: 300,
  MAX_SAFETY_FEATURES: 10,
  MAX_FACILITIES: 14,
} as const;

export const LOCALITIES: Locality[] = [
  'Clement Town',
  'Dalanwala',
  'Bidholi',
  'Prem Nagar',
  'Patel Nagar',
  'Rajpur Road',
];

export const DEHRADUN_UNIVERSITIES = [
  'DBS Global University (DGU)',
  'Graphic Era University',
  'UPES Bidholi',
  'Dev Bhoomi Uttarakhand University (DBUU)',
  'Shri Guru Ram Rai University (SGRRU)',
  'DIT University',
  'Uttaranchal University',
  'Other Dehradun College',
] as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  university: string;
  courseYear?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateContact {
  email: string;
  phone: string;
  guardianPhone?: string;
  updatedAt?: unknown;
}

export interface HostelListing {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  locality: Locality;
  nearCampus: string;
  distanceKm: number;
  gender: GenderPolicy;
  roomType: RoomType;
  monthlyRent: number;
  securityDeposit: number;
  availableBeds: number;
  safetyScore: number;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  imageUrl: string;
  safetyFeatures: string[];
  facilities: string[];
  houseRules: string;
  description: string;
  avgRating: number;
  reviewCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PropertyReview {
  id: string;
  listingId: string;
  authorId: string;
  authorName: string;
  authorUniversity: string;
  overallRating: number;
  safetyRating: number;
  cleanlinessRating: number;
  foodWifiRating: number;
  valueRating: number;
  comment: string;
  verifiedResident: boolean;
  bookingId: string;
  createdAt?: unknown;
}

export interface BookingEnquiry {
  id: string;
  studentId: string;
  studentName: string;
  studentUniversity: string;
  studentPhone: string;
  listingId: string;
  listingName: string;
  ownerId: string;
  moveInDate: string;
  roomType: RoomType;
  monthlyRent: number;
  bookingType: BookingType;
  status: BookingStatus;
  commissionInr: number;
  variableCostInr: number;
  netContributionInr: number;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ServiceOrder {
  id: string;
  studentId: string;
  studentName: string;
  campusArea: string;
  serviceCategory: ServiceCategory;
  planName: string;
  monthlyPriceInr: number;
  scheduleSlot: string;
  status: ServiceOrderStatus;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ServicePlan {
  id: string;
  category: ServiceCategory;
  planName: string;
  priceInr: number;
  billingCycle: string;
  turnaround: string;
  description: string;
  highlights: string[];
  imageUrl?: string;
}

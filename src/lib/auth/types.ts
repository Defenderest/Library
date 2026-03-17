export type SessionUser = {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

export type ProfileData = {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  loyaltyProgram: boolean;
  loyaltyPoints: number;
};

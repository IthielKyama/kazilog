export type UserRole = 'student' | 'supervisor' | 'assessor' | 'admin';

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  registrationNumber?: string;
  department?: string;
};

export type AuthResponse = AuthUser & {
  token: string;
};

export type Company = {
  _id: string;
  name: string;
  address: string;
  allowedRadiusMeters: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type AttachmentSession = {
  _id: string;
  company: Company;
  supervisor?: { _id?: string; name: string; email: string };
  assessor?: { _id?: string; name: string; email: string };
  startDate: string;
  endDate: string;
  isActive: boolean;
  finalGrade: string;
};

export type LogEntry = {
  _id: string;
  session?: string;
  date: string;
  tasksDone: string;
  skillsLearned: string;
  supervisorStatus: 'Pending' | 'Approved' | 'Rejected';
  supervisorComment?: string;
  distanceFromCompanyMeters: number;
  isWithinBoundary: boolean;
  createdAt: string;
};

export type SyncState = 'queued' | 'syncing' | 'synced' | 'failed';

export type OfflineLogPayload = {
  localId: string;
  idempotencyKey: string;
  sessionId: string;
  tasksDone: string;
  skillsLearned: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  imageUri?: string;
  
  // Sync Metadata
  syncState: SyncState;
  retryCount: number;
  lastError?: string;
  nextRetryAt?: number;
  lastAttemptAt?: string;
};

export type LogSubmissionPayload = Pick<
  OfflineLogPayload,
  'idempotencyKey' | 'sessionId' | 'tasksDone' | 'skillsLearned' | 'latitude' | 'longitude' | 'imageUri'
>;

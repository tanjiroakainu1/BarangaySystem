import { User } from './auth.service';
import {
  AppointmentRequest,
  Certificate,
  CertificateForm,
} from './certificate.service';
import {
  BasketballCourt,
  BasketballCourtReservation,
} from './basketball-court.service';

function formatDateForInput(value: unknown): string | undefined {
  if (!value) return undefined;
  const str = String(value);
  return str.includes('T') ? str.split('T')[0] : str;
}

const WORKFLOW_STATUSES = [
  'pending', 'approved', 'rejected', 'completed', 'processing', 'issued', 'cancelled',
] as const;

function normalizeWorkflowStatus(status?: string): string {
  const normalized = (status || 'pending').toLowerCase();
  return WORKFLOW_STATUSES.includes(normalized as typeof WORKFLOW_STATUSES[number])
    ? normalized
    : 'pending';
}

function toDateOrNull(value: unknown): string | null {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.includes('T') ? str.split('T')[0] : str;
}

function toUuidOrNull(value: unknown): string | null {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    ? str
    : null;
}

function toTextOrNull(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str || null;
}

function buildDisplayName(parts: {
  first?: string | null;
  middle?: string | null;
  last?: string | null;
  suffix?: string | null;
}): string {
  const base = [parts.first, parts.middle, parts.last].filter(Boolean).join(' ');
  if (!base) return '';
  return parts.suffix ? `${base}, ${parts.suffix}` : base;
}

/** Map Supabase profile row → app User */
export function mapProfile(row: any): User {
  const role = normalizeRole(row.role);
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    middleName: row.middle_name ?? '',
    suffix: row.suffix ?? '',
    name: row.name || buildDisplayName({
      first: row.first_name,
      middle: row.middle_name,
      last: row.last_name,
      suffix: row.suffix,
    }),
    phone: row.phone ?? '',
    phoneNumber: row.phone ?? '',
    address: row.address ?? '',
    birthDate: formatDateForInput(row.birth_date) ?? '',
    gender: row.gender ?? '',
    civilStatus: row.civil_status ?? '',
    nationality: row.nationality ?? '',
    purok: row.purok ?? '',
    residentSince: row.resident_since ?? '',
    role,
    status: row.status,
    position: row.position ?? '',
    department: row.department ?? '',
    employeeId: row.employee_id ?? '',
    hireDate: formatDateForInput(row.hire_date) ?? '',
    passwordChangedAt: row.password_changed_at,
    createdAt: row.created_at,
  };
}

export function normalizeRole(role: string): User['role'] {
  const r = (role || 'resident').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'staff') return 'staff';
  if (r === 'resident') return 'Resident';
  return 'user';
}

export interface ProfileDbRow {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
  name?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
  civil_status?: string;
  nationality?: string;
  purok?: string;
  resident_since?: string;
  role?: string;
  status?: string;
  position?: string;
  department?: string;
  employee_id?: string;
  hire_date?: string;
}

export function profileToDb(updates: Partial<User> & Record<string, any>): ProfileDbRow {
  const db: ProfileDbRow = {};
  if (updates.firstName !== undefined) db.first_name = updates.firstName;
  if (updates.lastName !== undefined) db.last_name = updates.lastName;
  if (updates.middleName !== undefined) db.middle_name = updates.middleName;
  if (updates.suffix !== undefined) db.suffix = updates.suffix;
  if (updates.name !== undefined) db.name = updates.name;
  if (updates.phone !== undefined) db.phone = updates.phone;
  if (updates.address !== undefined) db.address = updates.address;
  if (updates.birthDate) db.birth_date = updates.birthDate;
  if (updates.gender !== undefined) db.gender = updates.gender;
  if (updates.civilStatus !== undefined) db.civil_status = updates.civilStatus;
  if (updates.nationality !== undefined) db.nationality = updates.nationality;
  if (updates.purok !== undefined) db.purok = updates.purok;
  if (updates.residentSince !== undefined) db.resident_since = updates.residentSince;
  if (updates.role !== undefined) db.role = updates.role === 'Resident' ? 'resident' : updates.role;
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.position !== undefined) db.position = updates.position;
  if (updates.department !== undefined) db.department = updates.department;
  if (updates.employeeId !== undefined) db.employee_id = updates.employeeId;
  if (updates.hireDate !== undefined) db.hire_date = updates.hireDate;

  if (
    db.first_name !== undefined ||
    db.middle_name !== undefined ||
    db.last_name !== undefined ||
    db.suffix !== undefined
  ) {
    db.name = buildDisplayName({
      first: db.first_name ?? updates.firstName,
      middle: db.middle_name ?? updates.middleName,
      last: db.last_name ?? updates.lastName,
      suffix: db.suffix ?? updates.suffix,
    });
  }

  return db;
}

export function mapCertificateForm(row: any): CertificateForm {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    requirements: row.requirements || [],
    price: Number(row.price),
    fee: Number(row.fee ?? row.price),
    processingTime: row.processing_time,
    isActive: row.is_active,
  };
}

/** Map profile → appointment request personal-info form fields */
export function profileToAppointmentForm(user: {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  phone?: string;
  phoneNumber?: string;
  purok?: string;
  residentSince?: string;
  createdAt?: string;
}): Record<string, string> {
  const residentSince = user.residentSince
    || (user.createdAt ? String(new Date(user.createdAt).getFullYear()) : '');

  return {
    firstName: user.firstName ?? '',
    middleName: user.middleName ?? '',
    lastName: user.lastName ?? '',
    address: user.address ?? '',
    dateOfBirth: user.birthDate ?? '',
    gender: user.gender ?? '',
    civilStatus: user.civilStatus ?? '',
    phoneNo: user.phone ?? user.phoneNumber ?? '',
    purok: user.purok ?? '',
    residentSince,
  };
}

export function mapAppointment(row: any): AppointmentRequest {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time || '',
    requestedDate: row.requested_date || row.appointment_date,
    requestedTime: row.requested_time || row.appointment_time || '',
    userEmail: row.user_email,
    userName: row.user_name,
    certificateName: row.certificate_name,
    certificateId: row.certificate_form_id,
    certificateType: row.certificate_type || row.certificate_name,
    purpose: row.purpose,
    notes: row.notes,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    address: row.address,
    purok: row.purok,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    civilStatus: row.civil_status,
    phoneNo: row.phone_no,
    residentSince: row.resident_since,
    createdAt: row.created_at,
  };
}

export function appointmentToDb(data: any): Record<string, any> {
  const appointmentDate = toDateOrNull(
    data.appointmentDate ?? data.requestedDate
  );
  const requestedDate = toDateOrNull(
    data.requestedDate ?? data.appointmentDate
  );

  return {
    user_id: data.userId ? String(data.userId) : null,
    certificate_form_id: toUuidOrNull(data.certificateId ?? data.certificate_form_id),
    status: normalizeWorkflowStatus(data.status),
    appointment_date: appointmentDate,
    appointment_time: toTextOrNull(data.appointmentTime ?? data.requestedTime ?? data.time),
    requested_date: requestedDate,
    requested_time: toTextOrNull(data.requestedTime ?? data.appointmentTime ?? data.time),
    request_date: toDateOrNull(data.date ?? data.requestDate),
    user_email: toTextOrNull(data.userEmail),
    user_name: toTextOrNull(data.userName ?? data.requester),
    certificate_name: toTextOrNull(data.certificateType ?? data.certificateName),
    certificate_type: toTextOrNull(data.certificateType ?? data.certificateName),
    purpose: toTextOrNull(data.purpose),
    notes: toTextOrNull(data.notes),
    first_name: toTextOrNull(data.firstName),
    middle_name: toTextOrNull(data.middleName),
    last_name: toTextOrNull(data.lastName),
    address: toTextOrNull(data.address),
    purok: toTextOrNull(data.purok),
    date_of_birth: toDateOrNull(data.dateOfBirth),
    gender: toTextOrNull(data.gender),
    civil_status: toTextOrNull(data.civilStatus),
    phone_no: toTextOrNull(data.phoneNo),
    resident_since: toTextOrNull(data.residentSince),
  };
}

export function mapCertificate(row: any): Certificate {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    certificateType: row.certificate_type,
    certificateNumber: row.certificate_number,
    status: row.status,
    requestDate: row.request_date,
    issuedDate: row.issued_date,
    expiryDate: row.expiry_date,
    purpose: row.purpose,
    notes: row.notes,
    appointmentId: row.appointment_id,
    address: row.address,
    gender: row.gender,
    civilStatus: row.civil_status,
    dateOfBirth: row.date_of_birth,
    residentSince: row.resident_since,
    isSample: row.is_sample ?? false,
  };
}

export function reservationToDb(data: any): Record<string, any> {
  const reservationDate = data.reservationDate instanceof Date
    ? data.reservationDate.toISOString().slice(0, 10)
    : data.reservationDate;

  return {
    court_id: toUuidOrNull(data.courtId),
    court_number: Number(data.courtNumber) || null,
    user_name: toTextOrNull(data.userName),
    user_email: toTextOrNull(data.userEmail),
    reservation_date: toDateOrNull(reservationDate),
    start_time: toTextOrNull(data.startTime),
    end_time: toTextOrNull(data.endTime),
    duration: Math.max(1, Number(data.duration) || 1),
    purpose: toTextOrNull(data.purpose),
    notes: toTextOrNull(data.notes),
    status: normalizeWorkflowStatus(data.status),
  };
}

export function mapCourt(row: any): BasketballCourt {
  return {
    id: row.court_number,
    supabaseId: row.id,
    courtNumber: row.court_number,
    name: row.name,
    location: row.location,
    capacity: row.capacity,
    amenities: row.amenities || [],
    hourlyRate: Number(row.hourly_rate),
    isActive: row.is_active,
    maintenanceSchedule: row.maintenance_start ? {
      startDate: new Date(row.maintenance_start),
      endDate: new Date(row.maintenance_end),
      reason: row.maintenance_reason || '',
    } : undefined,
  };
}

export function mapReservation(row: any): BasketballCourtReservation {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    courtNumber: row.court_number,
    reservationDate: new Date(row.reservation_date),
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    purpose: row.purpose,
    status: row.status,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    approvedBy: row.approved_by,
    approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
  };
}

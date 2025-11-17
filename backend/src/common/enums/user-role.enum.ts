/**
 * User roles in the clinical management system
 */
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  PATIENT = 'patient',
  LAB_TECHNICIAN = 'lab_technician',
  PHARMACIST = 'pharmacist',
}

export const ROLE_HIERARCHY = [
  UserRole.PATIENT,
  UserRole.RECEPTIONIST,
  UserRole.LAB_TECHNICIAN,
  UserRole.PHARMACIST,
  UserRole.NURSE,
  UserRole.DOCTOR,
  UserRole.ADMIN,
];

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

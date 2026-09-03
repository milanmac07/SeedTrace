export type UserRole = 'da_head' | 'da_staff' | 'farmer';

export type Feature = 
  | 'audit_logs' 
  | 'manage_seed_varieties' 
  | 'batch_inventory' 
  | 'system_settings';

// Role Permissions Mapping
const PERMISSIONS: Record<Feature, UserRole[]> = {
  audit_logs: ['da_head'],
  manage_seed_varieties: ['da_head', 'da_staff'], // Farmers get Read-Only
  batch_inventory: ['da_head', 'da_staff'],      // Farmers get View Own Receipts
  system_settings: ['da_head'],
};

export const hasPermission = (userRole: UserRole | undefined, feature: Feature): boolean => {
  if (!userRole) return false;
  return PERMISSIONS[feature]?.includes(userRole) ?? false;
};
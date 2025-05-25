
/**
 * Backup scheduler for automatic Google Drive uploads
 */

import { googleDriveService } from './googleDriveService';
import { getCurrentUserIdentity } from './portableIdentityUtils';

export interface BackupSchedule {
  enabled: boolean;
  lastBackupDate: string | null;
  nextBackupDate: string | null;
  autorized: boolean;
}

/**
 * Checks if today is a backup day (15th or 28th)
 */
export const isBackupDay = (): { isBackupDay: boolean; isReplacementDay: boolean } => {
  const today = new Date();
  const day = today.getDate();
  
  return {
    isBackupDay: day === 15 || day === 28,
    isReplacementDay: day === 28
  };
};

/**
 * Gets the next backup date
 */
export const getNextBackupDate = (): Date => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  if (currentDay < 15) {
    return new Date(currentYear, currentMonth, 15);
  } else if (currentDay < 28) {
    return new Date(currentYear, currentMonth, 28);
  } else {
    // Next month's 15th
    return new Date(currentYear, currentMonth + 1, 15);
  }
};

/**
 * Performs scheduled backup check
 */
export const performScheduledBackup = async (): Promise<boolean> => {
  const { isBackupDay: shouldBackup, isReplacementDay } = isBackupDay();
  
  if (!shouldBackup) {
    return false;
  }
  
  // Check if backup was already done today
  const lastBackupKey = `lastBackup_${new Date().toDateString()}`;
  if (localStorage.getItem(lastBackupKey)) {
    return false; // Already backed up today
  }
  
  const identity = getCurrentUserIdentity();
  if (!identity || !identity.emailBackupEnabled) {
    return false;
  }
  
  try {
    if (!googleDriveService.isUserAuthorized()) {
      console.log('User not authorized for Google Drive backup');
      return false;
    }
    
    const success = await googleDriveService.uploadBackup(identity, isReplacementDay);
    
    if (success) {
      // Mark backup as completed for today
      localStorage.setItem(lastBackupKey, 'completed');
      localStorage.setItem('lastSuccessfulBackup', new Date().toISOString());
      console.log('Scheduled backup completed successfully');
    }
    
    return success;
  } catch (error) {
    console.error('Scheduled backup failed:', error);
    return false;
  }
};

/**
 * Initializes backup scheduler
 */
export const initializeBackupScheduler = (): void => {
  // Check for backup every hour
  const checkInterval = 60 * 60 * 1000; // 1 hour
  
  setInterval(() => {
    performScheduledBackup().catch(console.error);
  }, checkInterval);
  
  // Also check immediately when initialized
  setTimeout(() => {
    performScheduledBackup().catch(console.error);
  }, 5000); // Wait 5 seconds after initialization
};

/**
 * Gets backup schedule status
 */
export const getBackupScheduleStatus = async (): Promise<BackupSchedule> => {
  const identity = getCurrentUserIdentity();
  const lastBackupDate = await googleDriveService.getLastBackupDate();
  const nextBackupDate = getNextBackupDate();
  
  return {
    enabled: identity?.emailBackupEnabled || false,
    lastBackupDate,
    nextBackupDate: nextBackupDate.toISOString(),
    autorized: googleDriveService.isUserAuthorized()
  };
};

/**
 * Forces immediate backup
 */
export const forceBackupNow = async (): Promise<boolean> => {
  const identity = getCurrentUserIdentity();
  if (!identity) {
    throw new Error('No user identity found');
  }
  
  if (!googleDriveService.isUserAuthorized()) {
    throw new Error('Google Drive not authorized');
  }
  
  return await googleDriveService.uploadBackup(identity, false);
};

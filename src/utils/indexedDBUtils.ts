/**
 * IndexedDB utilities for Naam Japa App
 * Provides enhanced storage capabilities and maintains compatibility with existing app features
 */

// Database configuration
const DB_NAME = "NaamJapaDB";
const DB_VERSION = 1;

// Object store names
const STORES = {
  userIdentity: "userIdentity",
  mantrasData: "mantrasData",
  reminders: "reminders",
  achievements: "achievements",
  settings: "settings",
  audioCache: "audioCache",
  activityData: "activityData"
};

// Keys for backwards compatibility with localStorage
const KEYS = {
  userData: 'chantTrackerUserData',
  lifetimeCount: 'lifetimeCount',
  todayCount: 'todayCount',
  lastCountDate: 'lastCountDate'
};

/**
 * Initialize the database with all required object stores
 */
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.userIdentity)) {
        db.createObjectStore(STORES.userIdentity, { keyPath: "id" });
      }
      
      if (!db.objectStoreNames.contains(STORES.mantrasData)) {
        db.createObjectStore(STORES.mantrasData, { keyPath: "key" });
      }
      
      if (!db.objectStoreNames.contains(STORES.reminders)) {
        db.createObjectStore(STORES.reminders, { keyPath: "id" });
      }
      
      if (!db.objectStoreNames.contains(STORES.achievements)) {
        db.createObjectStore(STORES.achievements, { keyPath: "id" });
      }
      
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: "key" });
      }
      
      if (!db.objectStoreNames.contains(STORES.audioCache)) {
        db.createObjectStore(STORES.audioCache, { keyPath: "id" });
      }
      
      if (!db.objectStoreNames.contains(STORES.activityData)) {
        db.createObjectStore(STORES.activityData, { keyPath: "date" });
      }
    };
  });
};

/**
 * Store data in the specified object store
 */
const storeData = async (storeName: string, data: any, key?: string): Promise<void> => {
  try {
    const db = await initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      
      const request = key ? store.put(data, key) : store.put(data);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error("Error storing data:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to store data in IndexedDB:", error);
    // Fallback to localStorage if IndexedDB fails
    if (key) {
      localStorage.setItem(key, JSON.stringify(data));
    }
    throw error;
  }
};

/**
 * Retrieve data from the specified object store
 */
const getData = async (storeName: string, key: string): Promise<any> => {
  try {
    const db = await initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error("Error retrieving data:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to retrieve data from IndexedDB:", error);
    // Fallback to localStorage if IndexedDB fails
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : null;
  }
};

/**
 * Delete data from the specified object store
 */
const deleteData = async (storeName: string, key: string): Promise<void> => {
  try {
    const db = await initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error("Error deleting data:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to delete data from IndexedDB:", error);
    // Fallback to localStorage if IndexedDB fails
    localStorage.removeItem(key);
    throw error;
  }
};

/**
 * Get all data from an object store
 */
const getAllData = async (storeName: string): Promise<any[]> => {
  try {
    const db = await initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error("Error retrieving all data:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to retrieve all data from IndexedDB:", error);
    return [];
  }
};

/**
 * Migrate data from localStorage to IndexedDB
 */
export const migrateFromLocalStorage = async (): Promise<boolean> => {
  try {
    // Check if we've already migrated
    const migrationCompleted = await getData(STORES.settings, "migrationCompleted");
    if (migrationCompleted) {
      return true;
    }
    
    // Migrate user data
    const userDataStr = localStorage.getItem(KEYS.userData);
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      await storeData(STORES.userIdentity, userData);
    }
    
    // Migrate mantra counts
    const lifetimeCount = localStorage.getItem(KEYS.lifetimeCount);
    if (lifetimeCount) {
      await storeData(STORES.mantrasData, { 
        value: parseInt(lifetimeCount, 10),
        key: KEYS.lifetimeCount
      });
    }
    
    const todayCount = localStorage.getItem(KEYS.todayCount);
    const lastCountDate = localStorage.getItem(KEYS.lastCountDate);
    if (todayCount) {
      await storeData(STORES.mantrasData, { 
        value: parseInt(todayCount, 10),
        date: lastCountDate || new Date().toDateString(),
        key: KEYS.todayCount
      });
    }
    
    // Mark migration as complete
    await storeData(STORES.settings, { key: "migrationCompleted", value: true });
    
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
};

/**
 * User identity management functions
 */
export const saveUserData = async (userData: any): Promise<void> => {
  await storeData(STORES.userIdentity, userData);
  // Keep localStorage for backwards compatibility
  localStorage.setItem(KEYS.userData, JSON.stringify(userData));
};

export const getUserData = async (): Promise<any> => {
  // Try to get user ID from localStorage first for faster access
  const localDataStr = localStorage.getItem(KEYS.userData);
  let userId = "defaultUser";
  
  // Extract user ID if localStorage has data
  if (localDataStr) {
    try {
      const localData = JSON.parse(localDataStr);
      if (localData && localData.id) {
        userId = localData.id;
      }
    } catch (e) {
      console.error("Error parsing localStorage user data:", e);
    }
  }
  
  // Try IndexedDB with the obtained ID
  const userData = await getData(STORES.userIdentity, userId);
  
  // Fall back to localStorage for existing users
  if (!userData && localDataStr) {
    try {
      const parsedData = JSON.parse(localDataStr);
      // Store it in IndexedDB for future use
      await storeData(STORES.userIdentity, parsedData);
      return parsedData;
    } catch (e) {
      console.error("Error parsing user data from localStorage:", e);
    }
  }
  
  return userData;
};

export const logoutUser = async (): Promise<void> => {
  // For logout we only remove from localStorage as that's the quick check
  localStorage.removeItem(KEYS.userData);
};

export const isUserLoggedIn = async (): Promise<boolean> => {
  // Check localStorage first for faster response
  if (localStorage.getItem(KEYS.userData) !== null) {
    return true;
  }
  
  // Then check IndexedDB
  const userData = await getAllData(STORES.userIdentity);
  return userData.length > 0;
};

/**
 * Mantra counting functions
 */
export const getLifetimeCount = async (): Promise<number> => {
  const countData = await getData(STORES.mantrasData, KEYS.lifetimeCount);
  if (countData) {
    return countData.value;
  }
  
  // Fall back to localStorage
  const localCount = localStorage.getItem(KEYS.lifetimeCount);
  return localCount ? parseInt(localCount, 10) : 0;
};

export const getTodayCount = async (): Promise<number> => {
  const today = new Date().toDateString();
  const countData = await getData(STORES.mantrasData, KEYS.todayCount);
  
  if (countData && countData.date === today) {
    return countData.value;
  }
  
  // Check if we need to reset for a new day
  if (countData && countData.date !== today) {
    await storeData(STORES.mantrasData, {
      key: KEYS.todayCount,
      value: 0,
      date: today
    });
    return 0;
  }
  
  // Fall back to localStorage
  const localCount = localStorage.getItem(KEYS.todayCount);
  const localDate = localStorage.getItem(KEYS.lastCountDate);
  
  if (localDate === today && localCount) {
    return parseInt(localCount, 10);
  }
  
  return 0;
};

export const updateMantraCounts = async (increment: number = 1): Promise<{lifetimeCount: number, todayCount: number}> => {
  const today = new Date().toDateString();
  
  // Get current counts
  let lifetimeCount = await getLifetimeCount();
  let todayCount = await getTodayCount();
  
  // Update counts
  lifetimeCount += increment;
  todayCount += increment;
  
  // Save to IndexedDB
  await storeData(STORES.mantrasData, {
    key: KEYS.lifetimeCount,
    value: lifetimeCount
  });
  
  await storeData(STORES.mantrasData, {
    key: KEYS.todayCount,
    value: todayCount,
    date: today
  });
  
  // Keep localStorage in sync for backwards compatibility
  localStorage.setItem(KEYS.lifetimeCount, lifetimeCount.toString());
  localStorage.setItem(KEYS.todayCount, todayCount.toString());
  localStorage.setItem(KEYS.lastCountDate, today);
  
  return { lifetimeCount, todayCount };
};

/**
 * Get chants by date for activity tracking
 */
export const getChantsByDate = async (date: string): Promise<Array<{count: number, timestamp: number}>> => {
  try {
    const activityData = await getData(STORES.activityData, date);
    if (activityData && activityData.chants) {
      return activityData.chants;
    }
    
    // If no specific activity data, check if there's count data for this date
    const todayCountData = await getData(STORES.mantrasData, KEYS.todayCount);
    if (todayCountData && todayCountData.date === date && todayCountData.value > 0) {
      return [{ count: todayCountData.value, timestamp: Date.now() }];
    }
    
    return [];
  } catch (error) {
    console.error("Error getting chants by date:", error);
    return [];
  }
};

/**
 * Store daily chant activity - Enhanced version
 */
export const storeDailyActivity = async (date: string, count: number): Promise<void> => {
  try {
    // Store in IndexedDB
    const existingData = await getData(STORES.activityData, date);
    const chants = existingData?.chants || [];
    
    chants.push({ count, timestamp: Date.now() });
    
    const totalCount = chants.reduce((sum, chant) => sum + chant.count, 0);
    
    await storeData(STORES.activityData, {
      date,
      chants,
      totalCount
    });
    
    // Also store in localStorage for quick access
    localStorage.setItem(`activity_${date}`, JSON.stringify({
      date,
      totalCount,
      lastUpdate: Date.now()
    }));
    
  } catch (error) {
    console.error("Error storing daily activity:", error);
    
    // Fallback to localStorage only
    const existingData = localStorage.getItem(`activity_${date}`);
    let totalCount = count;
    
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        totalCount = parsed.totalCount + count;
      } catch (e) {
        console.error("Error parsing existing activity data:", e);
      }
    }
    
    localStorage.setItem(`activity_${date}`, JSON.stringify({
      date,
      totalCount,
      lastUpdate: Date.now()
    }));
  }
};

/**
 * Check if browser supports IndexedDB
 */
export const isIndexedDBSupported = (): boolean => {
  return window.indexedDB !== undefined && window.indexedDB !== null;
};

/**
 * Wrapper functions to ensure compatibility with existing code
 */
// Synchronous localStorage-like functions with async implementation
// This will help make the transition smoother
export const setItem = async (key: string, value: any): Promise<void> => {
  const storeName = key.includes('chantTracker') ? STORES.userIdentity : STORES.mantrasData;
  await storeData(storeName, { key, value: value });
  // Keep localStorage for backwards compatibility
  localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
};

export const getItem = async (key: string): Promise<any> => {
  const storeName = key.includes('chantTracker') ? STORES.userIdentity : STORES.mantrasData;
  const data = await getData(storeName, key);
  return data ? data.value : null;
};

export const removeItem = async (key: string): Promise<void> => {
  const storeName = key.includes('chantTracker') ? STORES.userIdentity : STORES.mantrasData;
  await deleteData(storeName, key);
  // Keep localStorage for backwards compatibility
  localStorage.removeItem(key);
};

/**
 * Initialize database and perform migration from localStorage if needed
 */
export const initializeDatabase = async (): Promise<void> => {
  if (!isIndexedDBSupported()) {
    console.warn("IndexedDB is not supported in this browser. Falling back to localStorage.");
    return;
  }
  
  try {
    // Open database connection to ensure the stores are created
    await initializeDB();
    
    // Migrate data from localStorage if needed
    await migrateFromLocalStorage();
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

export { STORES, storeData, getData, deleteData, getAllData };

export default {
  saveUserData,
  getUserData,
  logoutUser,
  isUserLoggedIn,
  getLifetimeCount,
  getTodayCount,
  updateMantraCounts,
  migrateFromLocalStorage,
  initializeDatabase,
  setItem,
  getItem,
  removeItem,
  storeData,
  getData,
  deleteData,
  getAllData
};

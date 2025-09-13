import { initializeApp } from "firebase/app";
import { getAuth, signOut, updateProfile, createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { calculatePips, calculateProfit } from './forex-calculator';
import { DASHBOARD_CONFIG } from './config';
import { debug, logError, logWarning } from './debug';
import { captureTradeImages } from "@/lib/api-service";
import { processTradeTrigger as originalProcessTradeTrigger } from './achievements-service';
import { debounce } from './utils';
import { tradeUpdateService } from '@/services/trade-update-service';
import { TradingStrategy, Goal, Milestone } from "@/types";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  getDocs,
  deleteDoc,
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  where,
  Timestamp,
  limit,
  startAfter,
  getCountFromServer,
  writeBatch,
  increment
} from "firebase/firestore";

// ❌ BỎ Cloudinary: KHÔNG import từ './api-service' các hàm upload/delete Cloudinary nữa
// import { uploadTradeImage as apiUploadTradeImage, deleteTradeImage as apiDeleteTradeImage } from './api-service';

// Import Firebase configuration from separate file
import firebaseConfig from './firebase-config';

// PERFORMANCE OPTIMIZATION: Lazy and non-blocking initialization
// Get projectId and storageBucket from configuration for logs (only if debug enabled)
if (process.env.NODE_ENV === 'development') {
  const { projectId, storageBucket } = firebaseConfig;
  debug("Firebase config:", { projectId, storageBucket });
}

// Initialize Firebase - lazy loaded to avoid loading Firebase on first render
let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

// Performance optimized initialization flag
let isInitialized = false;

// Debounced version of processTradeTrigger to improve performance
const processTradeTrigger = debounce((userId: string, action: 'create' | 'update' | 'delete') => {
  debug(`Running debounced achievement processing for ${action}`);
  originalProcessTradeTrigger(userId, action)
    .catch(error => logError("Error in debounced achievement processing:", error));
}, 2000);

// Function to initialize Firebase once when needed - performance optimized
function initFirebase() {
  if (isInitialized) return { app, auth, db };

  isInitialized = true;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (process.env.NODE_ENV === 'development') {
    debug("Firebase has been initialized:");
    debug("- Auth Domain:", firebaseConfig.authDomain);
    debug("- Project ID:", firebaseConfig.projectId);
  }

  return { app, auth, db };
}

// Ensure Firebase is initialized, but don't wait for it
initFirebase();

// Get current user ID token for authentication
async function getIdToken(forceRefresh = false): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      debug('No user is currently signed in');
      return null;
    }
    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    logError('Error getting ID token:', error);
    return null;
  }
}

// Fetch helper for Firebase Functions that includes auth token
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const token = await getIdToken(true); // Always get fresh token
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  } catch (error) {
    logError('Error in fetchWithAuth:', error);
    throw error;
  }
}

// Auth functions
async function loginUser(email: string, password: string) {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Đăng nhập với Google và tự động tạo tài khoản hoặc liên kết tài khoản nếu cần
 */
async function loginWithGoogle() {
  try {
    const { 
      GoogleAuthProvider, 
      signInWithPopup, 
      getAdditionalUserInfo,
      fetchSignInMethodsForEmail
    } = await import("firebase/auth");

    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser || false;

      if (isNewUser && result.user) {
        debug("Creating new user profile for Google sign-in");
        const { uid, email, displayName, photoURL } = result.user;
        await setDoc(doc(db, "users", uid), {
          email,
          displayName: displayName || email?.split('@')[0] || "User",
          photoURL,
          createdAt: serverTimestamp(),
          provider: "google",
          initialBalance: DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE,
          currentBalance: DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE,
        });
        debug("User profile created successfully for Google sign-in");
      }

      return { ...result, isNewUser };
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        if (!email) throw error;
        debug(`Email ${email} đã tồn tại với phương thức khác`);
        const methods = await fetchSignInMethodsForEmail(auth, email);
        debug(`Phương thức đăng nhập hiện có cho ${email}: ${methods.join(', ')}`);
        if (methods.includes('password')) {
          throw new Error(
            `Email ${email} đã được đăng ký. Đăng nhập email/mật khẩu trước, rồi vào "Tài khoản > Liên kết tài khoản" để kết nối Google.`
          );
        } else {
          let providerName = "phương thức khác";
          const primaryProvider = methods[0];
          if (primaryProvider === 'google.com') providerName = 'Google';
          else if (primaryProvider === 'facebook.com') providerName = 'Facebook';
          else if (primaryProvider === 'github.com') providerName = 'GitHub';
          else if (primaryProvider === 'twitter.com') providerName = 'Twitter';
          else if (primaryProvider === 'apple.com') providerName = 'Apple';
          else if (primaryProvider === 'password') providerName = 'Email/Mật khẩu';
          throw new Error(
            `Email ${email} đã liên kết với ${providerName}. Hãy đăng nhập bằng ${providerName} trước, rồi vào "Liên kết đăng nhập" để kết nối Google.`
          );
        }
      }
      throw error;
    }
  } catch (error) {
    logError("Error during Google sign-in:", error);
    throw error;
  }
}

async function registerUser(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
    displayName,
    createdAt: serverTimestamp(),
    initialBalance: DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE,
    currentBalance: DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE,
  });
  return userCredential;
}

async function logoutUser() {
  return signOut(auth);
}

// User data functions
async function getUserData(userId: string) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data();
  throw new Error("User not found");
}

// Firebase Authentication functions
async function updateDisplayName(newDisplayName: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in");
    await updateProfile(user, { displayName: newDisplayName });
    debug("Display name updated successfully in Firebase Auth");
    if (user.uid) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { displayName: newDisplayName });
      debug("Display name also updated in Firestore");
    }
    return true;
  } catch (error) {
    logError("Error updating display name:", error);
    throw error;
  }
}

async function updateUserData(userId: string, data: any) {
  const userRef = doc(db, "users", userId);
  return updateDoc(userRef, data);
}

// Trade functions
async function addTrade(userId: string, tradeData: any) {
  try {
    debug("Adding new trade to Firestore", { userId });
    const tradesRef = collection(db, "users", userId, "trades");

    const docRef = await addDoc(tradesRef, {
      ...tradeData,
      createdAt: serverTimestamp(),
    });

    debug("Trade added successfully with ID:", docRef.id);

    processTradeTrigger(userId, 'create');

    debug(`[REALTIME-DEBUG] Notifying trade creation via TradeUpdateService for ID: ${docRef.id}`);
    tradeUpdateService.notifyTradeCreated(userId, docRef.id);

    // AUTO-CAPTURE sau khi tạo (không block UI)
    (async () => {
      try {
        const pair: string = String(tradeData?.pair || "").trim().toUpperCase();
        if (!pair) return;

        // NOTE: captureTradeImages trong api-service KHÔNG còn liên quan Cloudinary
        const { entryH4: h4, entryM15: m15 } = await captureTradeImages(pair);

        const updatePayload: any = {
          updatedAt: serverTimestamp(),
          captureStatus: (h4 || m15) ? "uploaded" : "empty",
        };

        if (h4)  updatePayload.entryImage     = h4;   // H4
        if (m15) updatePayload.entryImageM15 = m15;  // M15

        await updateDoc(docRef, updatePayload);
      } catch (err: any) {
        await updateDoc(docRef, {
          updatedAt: serverTimestamp(),
          captureStatus: "error",
          errorMessage: String(err?.message || err),
        });
        logError("[autoCapture-after-create] ", err);
      }
    })().catch(logError);

    return { success: true, id: docRef.id };
  } catch (error) {
    logError("Error adding trade:", error);
    throw error;
  }
}

async function getTrades(userId: string) {
  const tradesRef = collection(db, "users", userId, "trades");
  const q = query(tradesRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Lấy tất cả trades của user
 */
async function getAllTrades(userId: string) {
  debug(`Getting all trades for user ${userId}`);
  const tradesRef = collection(db, "users", userId, "trades");
  const q = query(tradesRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getPaginatedTrades(
  userId: string, 
  pageSize: number = 10, 
  lastDoc: any = null,
  sortOption: string = 'newest',
  filters: Record<string, any> = {}
) {
  try {
    debug(`Getting paginated trades for user ${userId}, sort: ${sortOption}`);
    const tradesRef = collection(db, "users", userId, "trades");
    let queryFilters: any[] = [];

    if (filters.isOpen !== undefined) queryFilters.push(where("isOpen", "==", filters.isOpen));
    if (filters.pair)                 queryFilters.push(where("pair", "==", filters.pair));
    if (filters.direction)            queryFilters.push(where("direction", "==", filters.direction));
    if (filters.result)               queryFilters.push(where("result", "==", filters.result));

    let sortField = "createdAt";
    let sortDirection: "asc" | "desc" = "desc";
    switch (sortOption) {
      case 'oldest': sortDirection = "asc"; break;
      case 'profit': sortField = "profitLoss"; sortDirection = "desc"; break;
      case 'loss':   sortField = "profitLoss"; sortDirection = "asc"; break;
      case 'newest':
      default:       sortDirection = "desc"; break;
    }

    const countQuery = query(tradesRef, ...queryFilters);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    let dataQuery;
    if (lastDoc) {
      dataQuery = query(tradesRef, ...queryFilters, orderBy(sortField, sortDirection), startAfter(lastDoc), limit(pageSize));
    } else {
      dataQuery = query(tradesRef, ...queryFilters, orderBy(sortField, sortDirection), limit(pageSize));
    }

    const querySnapshot = await getDocs(dataQuery);
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const trades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    debug(`Got ${trades.length} trades for page, total count: ${totalCount}`);
    return { trades, lastDoc: lastVisible, totalCount };
  } catch (error) {
    logError("Error getting paginated trades:", error);
    throw error;
  }
}

async function getTradeById(userId: string, tradeId: string) {
  const docRef = doc(db, "users", userId, "trades", tradeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  throw new Error("Trade not found");
}

/**
 * Tối ưu hiệu năng: batch update
 */
async function updateTradeWithBatch(userId: string, tradeId: string, tradeData: any) {
  try {
    debug(`Using batch update for trade ${tradeId}`);
    const batch = writeBatch(db);
    const tradeRef = doc(db, `users/${userId}/trades/${tradeId}`);
    batch.update(tradeRef, tradeData);

    if ('profitLoss' in tradeData && tradeData.isOpen === false) {
      debug(`Batch update: Adding balance update for P/L ${tradeData.profitLoss}`);
      const userRef = doc(db, `users/${userId}`);
      batch.update(userRef, {
        currentBalance: increment(tradeData.profitLoss),
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
    debug(`Batch commit completed successfully for trade ${tradeId}`);
    return { success: true, data: tradeData };
  } catch (error) {
    logError(`Error in batch update for trade ${tradeId}:`, error);
    throw error;
  }
}

/**
 * Xử lý ảnh khi cập nhật giao dịch (đÃ bỏ Cloudinary)
 */
async function processTradeImages(userId: string, tradeId: string, currentTrade: any, tradeData: any) {
  const imageFields = ['entryImage','entryImageM15','exitImage','exitImageM15'];
  const imageProcessPromises: Promise<void>[] = [];

  for (const field of imageFields) {
    if (field in tradeData) {
      const oldImagePath = currentTrade[field];
      const newImagePath = tradeData[field];
      if (oldImagePath && newImagePath && oldImagePath !== newImagePath) {
        debug(`Field ${field} changed - scheduling deletion of old image`);
        const deletePromise = new Promise<void>(resolve => {
          setTimeout(() => {
            try {
              // Chỉ xoá ảnh local (server uploads). Không xử lý Cloudinary/URL ngoài nữa.
              if (oldImagePath.startsWith('/uploads/') || oldImagePath.startsWith('uploads/')) {
                fetch(`/api/uploads/delete?path=${encodeURIComponent(oldImagePath)}`, { method: 'DELETE' })
                  .catch(err => console.warn(`Could not delete old upload: ${oldImagePath}`, err));
              }
            } catch (imageError) {
              console.warn(`Error processing old image ${field}:`, imageError);
            }
            resolve();
          }, 100);
        });
        imageProcessPromises.push(deletePromise);
      }
    }
  }
  // Không đợi xoá xong
  return true;
}

/**
 * Recalc P/L
 */
function recalculateTradeResults(currentTrade: any, tradeData: any) {
  const needToRecalculate = (
    (tradeData.isOpen === false && tradeData.exitPrice && !currentTrade.exitPrice) ||
    (currentTrade.exitPrice && tradeData.exitPrice && currentTrade.exitPrice !== tradeData.exitPrice) ||
    (tradeData.entryPrice && currentTrade.entryPrice !== tradeData.entryPrice) ||
    (tradeData.lotSize && currentTrade.lotSize !== tradeData.lotSize)
  );

  if (needToRecalculate && tradeData.exitPrice) {
    debug("Recalculating pips and profit/loss due to price or lotSize changes");
    const direction = tradeData.direction || currentTrade.direction;
    const entryPrice = tradeData.entryPrice || currentTrade.entryPrice;
    const exitPrice  = tradeData.exitPrice;
    const lotSize    = tradeData.lotSize || currentTrade.lotSize;
    const pair       = tradeData.pair || currentTrade.pair;

    const pips = calculatePips(pair, direction, entryPrice, exitPrice);
    const profitLoss = calculateProfit({
      pair, direction, entryPrice, exitPrice, lotSize,
      accountCurrency: "USD"
    });

    tradeData.pips = parseFloat(pips.toFixed(1));
    tradeData.profitLoss = parseFloat(profitLoss.toFixed(2));
    return true;
  }
  return false;
}

/**
 * Update trade
 */
async function updateTrade(userId: string, tradeId: string, tradeData: any, options: {
  skipImageProcessing?: boolean;
  skipRecalculation?: boolean;
  skipAchievements?: boolean;
  skipGoalsRecalculation?: boolean;
  useBatch?: boolean;
} = {}) {
  try {
    const tradeRef = doc(db, "users", userId, "trades", tradeId);
    const tradeSnapshot = await getDoc(tradeRef);
    if (!tradeSnapshot.exists()) throw new Error("Trade not found");
    const currentTrade = tradeSnapshot.data();
    debug(`Updating trade ${tradeId}`);

    if (!options.skipImageProcessing) {
      processTradeImages(userId, tradeId, currentTrade, tradeData);
    }
    if (!options.skipRecalculation) {
      recalculateTradeResults(currentTrade, tradeData);
    }
    tradeData.updatedAt = serverTimestamp();

    const isClosingTrade = tradeData.isOpen === false && (currentTrade.isOpen === true || currentTrade.isOpen === undefined);
    if (isClosingTrade || options.useBatch) {
      await updateTradeWithBatch(userId, tradeId, tradeData);
    } else {
      await updateDoc(tradeRef, tradeData);
    }

    if (!options.skipAchievements) {
      processTradeTrigger(userId, 'update');
    }
    if (!options.skipGoalsRecalculation) {
      setTimeout(async () => {
        try { await calculateAllGoalsProgress(userId); }
        catch (error) { logError("Error recalculating goals after trade update:", error); }
      }, 1000);
    }

    if (isClosingTrade) {
      debug(`[REALTIME-DEBUG] Notifying trade closed: ${tradeId}`);
      tradeUpdateService.notifyTradeClosed(userId, tradeId);
    } else {
      debug(`[REALTIME-DEBUG] Notifying trade updated: ${tradeId}`);
      tradeUpdateService.notifyTradeUpdated(userId, tradeId);
    }

    return { success: true, data: tradeData };
  } catch (error) {
    logError("Error updating trade:", error);
    throw error;
  }
}

async function deleteTrade(userId: string, tradeId: string) {
  try {
    const tradeRef = doc(db, "users", userId, "trades", tradeId);
    const tradeDoc = await getDoc(tradeRef);
    if (!tradeDoc.exists()) {
      debug(`Trade ${tradeId} not found when attempting to delete`);
      return;
    }

    const tradeData = tradeDoc.data();
    debug(`Deleting trade ${tradeId}`);

    const imageFields = ['entryImage','entryImageM15','exitImage','exitImageM15'];
    for (const field of imageFields) {
      if (tradeData[field] && typeof tradeData[field] === 'string') {
        const imagePath = tradeData[field];
        try {
          // Chỉ xoá ảnh local server
          if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
            const deleteUrl = `/api/uploads/delete?path=${encodeURIComponent(imagePath)}`;
            fetch(deleteUrl, { method: 'DELETE' })
              .catch(err => console.warn(`Could not delete server image: ${imagePath}`, err));
          }
          // URL ngoài (http/https) — bỏ qua, không cố xoá
        } catch (imageError) {
          console.warn(`Error processing image ${field}:`, imageError);
        }
      }
    }

    await deleteDoc(tradeRef);
    await updateAccountBalance(userId);
    processTradeTrigger(userId, 'delete');

    setTimeout(async () => {
      try { await calculateAllGoalsProgress(userId); }
      catch (error) { logError("Error recalculating goals after trade deletion:", error); }
    }, 1000);

    tradeUpdateService.notifyTradeDeleted(userId, tradeId);
    return true;
  } catch (error) {
    logError(`Error in deleteTrade function:`, error);
    throw error;
  }
}

/**
 * Get the URL for an image
 */
async function getStorageDownloadUrl(path: string): Promise<string> {
  try {
    debug(`Getting image URL: ${path}`);
    if (path.startsWith('http')) return path;
    return path; // local path trả về nguyên trạng cho UI
  } catch (error) {
    logError(`Error getting URL for image:`, error);
    return path;
  }
}

/**
 * Upload ảnh giao dịch — KHÔNG dùng Cloudinary.
 * Dùng endpoint local `/api/uploads` (FormData: file,userId,tradeId,type)
 */
async function uploadTradeImage(
  userId: string, 
  tradeId: string, 
  file: File, 
  type: 'h4before' | 'm15before' | 'h4after' | 'm15after',
  progressCallback?: (progress: number) => void
): Promise<string> {
  try {
    debug('===== UPLOAD IMAGE: START =====');
    const { auth } = initFirebase();

    if (!auth.currentUser) {
      logError("UPLOAD ERROR: Người dùng chưa đăng nhập");
      try {
        await signInAnonymously(auth);
        debug("Đã đăng nhập ẩn danh để tải ảnh");
        return await uploadTradeImage(userId, tradeId, file, type, progressCallback);
      } catch (error: any) {
        logError("Không thể đăng nhập ẩn danh:", error);
        throw new Error("Không thể xác thực để tải ảnh lên. Vui lòng thử lại.");
      }
    }

    debug(`Người dùng đã đăng nhập: ${auth.currentUser.uid}`);
    if (auth.currentUser.uid !== userId) {
      logWarning(`User ID không khớp: ${auth.currentUser.uid} vs ${userId}`);
    }

    if (!file) throw new Error("File không được cung cấp");
    if (!userId) throw new Error("ID người dùng là bắt buộc");
    if (!tradeId) tradeId = "temp-" + Date.now();

    debug(`File gốc: ${file.name} (${(file.size/1024).toFixed(2)}KB), type: ${file.type}`);
    debug(`User ID: ${userId}, Trade ID: ${tradeId}, Image type: ${type}`);

    if (progressCallback) progressCallback(10);

    // Map sang type nội bộ cho server nếu cần
    const imageType = type.replace('before', 'chart').replace('after', 'exit');

    const form = new FormData();
    form.append('file', file);
    form.append('userId', userId);
    form.append('tradeId', tradeId);
    form.append('type', imageType);

    // Dùng fetchWithAuth để server có thể verify token nếu cần
    const res = await fetchWithAuth('/api/uploads', { method: 'POST', body: form });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Upload failed: ${res.status} ${txt.slice(0, 200)}`);
    }

    // Kỳ vọng server trả về { url: "/uploads/..." }
    const data = await res.json().catch(() => ({} as any));
    const url = data?.url || data?.imageUrl || '';
    if (!url) throw new Error('Upload succeeded but no URL returned');

    if (progressCallback) progressCallback(100);
    debug(`Upload complete, URL: ${url}`);
    return url;
  } catch (error) {
    logError("Error in uploadTradeImage:", error);
    throw error;
  }
}

/**
 * Xoá ảnh qua endpoint local — KHÔNG Cloudinary
 */
async function deleteTradeImage(path: string): Promise<boolean> {
  try {
    if (!path) return false;
    debug(`Deleting image: ${path}`);

    if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
      const res = await fetchWithAuth(`/api/uploads/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(await res.text());
      debug("Image deleted successfully");
      return true;
    }

    // URL ngoài: bỏ qua
    debug("Skip deleting external image (non-local)");
    return false;
  } catch (error) {
    logError("Error deleting image:", error);
    return false;
  }
}

async function updateAccountBalance(userId: string) {
  try {
    debug(`Updating account balance for user ${userId}`);
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) throw new Error("User not found");

    const userData = userDoc.data();
    const initialBalance = userData.initialBalance || DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE;

    const tradesRef = collection(db, "users", userId, "trades");
    const querySnapshot = await getDocs(tradesRef);

    let totalPL = 0;
    querySnapshot.forEach((doc) => {
      const trade = doc.data();
      if (trade.isOpen === false && trade.profitLoss !== undefined) {
        totalPL += trade.profitLoss;
      }
    });

    const currentBalance = initialBalance + totalPL;
    await updateDoc(doc(db, "users", userId), {
      currentBalance,
      updatedAt: serverTimestamp()
    });

    debug(`Account balance updated: initial=${initialBalance}, totalPL=${totalPL}, current=${currentBalance}`);
    return { initialBalance, totalPL, currentBalance };
  } catch (error) {
    logError("Error updating account balance:", error);
    throw error;
  }
}

// ===== Strategy / Goals / Milestones phần dưới giữ nguyên logic (không liên quan Cloudinary) =====

async function saveStrategyAnalysis(userId: string, strategyId: string, strategyName: string, analysisData: any) {
  try {
    debug(`Saving analysis for strategy ${strategyId} of user ${userId}`);
    const analysesRef = collection(db, "users", userId, "strategyAnalyses");
    const q = query(analysesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const analyses = querySnapshot.docs;

    if (analyses.length >= 5) {
      debug("Maximum analyses reached, removing oldest one");
      const oldestAnalysis = analyses[analyses.length - 1];
      await deleteDoc(doc(analysesRef, oldestAnalysis.id));
    }

    const dataToSave = {
      recommendations: analysisData.recommendations,
      summary: analysisData.summary
    };

    const newAnalysisRef = await addDoc(analysesRef, {
      strategyId,
      strategyName,
      data: dataToSave,
      createdAt: serverTimestamp()
    });

    debug(`Analysis saved with ID: ${newAnalysisRef.id}`);
    return { id: newAnalysisRef.id, strategyId, strategyName, data: dataToSave };
  } catch (error) {
    logError("Error saving strategy analysis:", error);
    throw error;
  }
}

async function getStrategyAnalyses(userId: string) {
  try {
    debug(`Getting saved analyses for user ${userId}`);
    const analysesRef = collection(db, "users", userId, "strategyAnalyses");
    const q = query(analysesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logError("Error getting strategy analyses:", error);
    throw error;
  }
}

async function deleteStrategyAnalysis(userId: string, analysisId: string) {
  try {
    debug(`Deleting analysis ${analysisId} for user ${userId}`);
    const analysisRef = doc(db, "users", userId, "strategyAnalyses", analysisId);
    await deleteDoc(analysisRef);
    debug("Analysis deleted successfully");
    return true;
  } catch (error) {
    logError("Error deleting strategy analysis:", error);
    throw error;
  }
}

async function getStrategies(userId: string): Promise<Array<TradingStrategy & { id: string }>> {
  try {
    debug(`Getting strategies for user ${userId}`);
    const strategiesRef = collection(db, "users", userId, "strategies");
    const querySnapshot = await getDocs(strategiesRef);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as TradingStrategy;
      return { ...data, id: doc.id };
    });
  } catch (error) {
    logError("Error getting strategies:", error);
    throw error;
  }
}

function onStrategiesSnapshot(userId: string, callback: (strategies: any[]) => void) {
  if (!userId) return () => {};
  const strategiesRef = collection(db, "users", userId, "strategies");
  let isActive = true;
  const unsubscribe = onSnapshot(
    strategiesRef,
    (snapshot) => {
      if (!isActive) return;
      try {
        const strategies = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(strategies);
      } catch (error) {
        logError("Error in strategies snapshot callback:", error);
      }
    },
    (error) => logError("Error in strategies snapshot:", error)
  );
  return () => { isActive = false; unsubscribe(); };
}

async function getStrategyById(userId: string, strategyId: string) {
  try {
    const docRef = doc(db, "users", userId, "strategies", strategyId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Strategy not found");
    const data = docSnap.data();
    return { ...data, id: docSnap.id };
  } catch (error) {
    logError("Error getting strategy by ID:", error);
    throw error;
  }
}

async function addStrategy(userId: string, strategyData: any) {
  try {
    const strategiesRef = collection(db, "users", userId, "strategies");
    const docRef = await addDoc(strategiesRef, { ...strategyData, createdAt: serverTimestamp() });
    return { ...strategyData, id: docRef.id };
  } catch (error) {
    logError("Error adding strategy:", error);
    throw error;
  }
}

async function updateStrategy(userId: string, strategyId: string, strategyData: any) {
  try {
    const strategyRef = doc(db, "users", userId, "strategies", strategyId);
    const cleanData = { ...strategyData };
    delete cleanData.updatedAt;
    cleanData.updatedAt = serverTimestamp();
    delete cleanData.id;

    if (Array.isArray(cleanData.rules)) {
      cleanData.rules = cleanData.rules.map((rule: any) => ({
        id: typeof rule.id === 'string' ? rule.id : `rule-${Math.random().toString(36).substr(2, 9)}`,
        label: typeof rule.label === 'string' ? rule.label : "",
        order: typeof rule.order === 'number' ? rule.order : 0,
        ...(rule.indicator && { indicator: rule.indicator }),
        ...(rule.timeframe && { timeframe: rule.timeframe }),
        ...(rule.expectedValue && { expectedValue: rule.expectedValue }),
        ...(rule.description && { description: rule.description })
      }));
    }
    if (Array.isArray(cleanData.entryConditions)) {
      cleanData.entryConditions = cleanData.entryConditions.map((condition: any) => ({
        id: typeof condition.id === 'string' ? condition.id : `entry-${Math.random().toString(36).substr(2, 9)}`,
        label: typeof condition.label === 'string' ? condition.label : "",
        order: typeof condition.order === 'number' ? condition.order : 0,
        ...(condition.indicator && { indicator: condition.indicator }),
        ...(condition.timeframe && { timeframe: condition.timeframe }),
        ...(condition.expectedValue && { expectedValue: condition.expectedValue }),
        ...(condition.description && { description: condition.description })
      }));
    }
    if (Array.isArray(cleanData.exitConditions)) {
      cleanData.exitConditions = cleanData.exitConditions.map((condition: any) => ({
        id: typeof condition.id === 'string' ? condition.id : `exit-${Math.random().toString(36).substr(2, 9)}`,
        label: typeof condition.label === 'string' ? condition.label : "",
        order: typeof condition.order === 'number' ? condition.order : 0,
        ...(condition.indicator && { indicator: condition.indicator }),
        ...(condition.timeframe && { timeframe: condition.timeframe }),
        ...(condition.expectedValue && { expectedValue: condition.expectedValue }),
        ...(condition.description && { description: condition.description })
      }));
    }
    Object.keys(cleanData).forEach(key => { if (cleanData[key] === undefined) delete cleanData[key]; });
    await updateDoc(strategyRef, cleanData);
    return { ...strategyData, id: strategyId };
  } catch (error) {
    logError("Error updating strategy:", error);
    if (error instanceof Error) console.error(`Error type: ${error.name}, message: ${error.message}`);
    throw error;
  }
}

async function deleteStrategy(userId: string, strategyId: string) {
  try {
    const strategyRef = doc(db, "users", userId, "strategies", strategyId);
    await deleteDoc(strategyRef);
    return true;
  } catch (error) {
    logError("Error deleting strategy:", error);
    throw error;
  }
}

async function createDefaultStrategiesIfNeeded(userId: string) {
  try {
    const strategiesRef = collection(db, "users", userId, "strategies");
    const snapshot = await getDocs(strategiesRef);
    if (snapshot.empty) {
      debug("Creating default strategies for new user");
      const defaults = [
        { name: "Trend Following", description: "Following the trend with confirmation from multiple timeframes.", rules: "Wait for a clear trend, confirm with indicators, enter on pullbacks.", indicators: ["Moving Average", "RSI", "MACD"], pairs: ["EURUSD","GBPUSD","USDJPY"], timeframes: ["H4","D1"] },
        { name: "Breakout", description: "Trading breakouts from key levels or patterns.", rules: "Identify strong support/resistance, wait for breakout with increased volume.", indicators: ["Support/Resistance","Volume"], pairs: ["XAUUSD","GBPJPY","USDCAD"], timeframes: ["H1","H4"] },
        { name: "Price Action", description: "Pure price action without indicators.", rules: "Look for candlestick patterns at key levels.", indicators: ["None"], pairs: ["All major pairs"], timeframes: ["Any"] }
      ];
      const batch = writeBatch(db);
      defaults.forEach(strategy => {
        const strategyRef = doc(collection(db, "users", userId, "strategies"));
        batch.set(strategyRef, { ...strategy, createdAt: serverTimestamp(), isDefault: true });
      });
      await batch.commit();
      debug("Default strategies created successfully");
    }
    return true;
  } catch (error) {
    logError("Error creating default strategies:", error);
    return false;
  }
}

// Goals CRUD / listeners / milestones / analytics — giữ nguyên như bạn gửi (không liên quan Cloudinary)
async function addGoal(userId: string, goalData: any) { /* ... nguyên như bạn gửi ... */ throw new Error("trimmed for brevity in this snippet"); }
async function getGoals(userId: string): Promise<Array<Goal & { milestones: Milestone[] }>> { throw new Error("trimmed"); }
async function getGoalById(userId: string, goalId: string): Promise<Goal & { milestones: Milestone[] }> { throw new Error("trimmed"); }
async function updateGoal(userId: string, goalId: string, goalData: any) { throw new Error("trimmed"); }
async function deleteGoal(userId: string, goalId: string) { throw new Error("trimmed"); }
function onGoalsSnapshot(userId: string, callback: (goals: any[]) => void, errorCallback?: (error: Error) => void) { throw new Error("trimmed"); }
async function addMilestone(userId: string, goalId: string, milestoneData: any) { throw new Error("trimmed"); }
async function getMilestones(userId: string, goalId: string): Promise<Milestone[]> { throw new Error("trimmed"); }
async function updateMilestone(userId: string, goalId: string, milestoneId: string, milestoneData: any) { throw new Error("trimmed"); }
async function deleteMilestone(userId: string, goalId: string, milestoneId: string) { throw new Error("trimmed"); }
async function deleteMilestonesForGoal(userId: string, goalId: string) { throw new Error("trimmed"); }
async function calculateAllGoalsProgress(userId: string): Promise<void> { throw new Error("trimmed"); }
async function calculateGoalProgress(userId: string, goalId: string): Promise<number> { throw new Error("trimmed"); }
async function getTradeStats(userId: string) { throw new Error("trimmed"); }
function getProviderName(providerId: string): string { throw new Error("trimmed"); }
async function linkAccountWithGoogle() { throw new Error("trimmed"); }
async function getLinkedProviders(): Promise<string[]> { throw new Error("trimmed"); }
async function unlinkProvider(providerId: string) { throw new Error("trimmed"); }

// ===== EXPORTS (giữ nguyên như cũ) =====
export { 
  auth, 
  db, 
  getIdToken, 
  fetchWithAuth,
  initFirebase as functions,

  // Auth
  loginUser,
  loginWithGoogle,
  registerUser,
  logoutUser,

  // User
  getUserData,
  updateDisplayName,
  updateUserData,

  // Trade CRUD
  addTrade,
  getTrades,
  getAllTrades,
  getPaginatedTrades,
  getTradeById,
  updateTrade,
  updateTradeWithBatch,
  deleteTrade,

  // Image
  getStorageDownloadUrl,
  uploadTradeImage,
  deleteTradeImage,

  // Helper
  updateAccountBalance,

  // Strategy
  getStrategies,
  getStrategyById,
  addStrategy,
  updateStrategy,
  deleteStrategy,
  onStrategiesSnapshot,
  createDefaultStrategiesIfNeeded,

  // Strategy Analysis
  saveStrategyAnalysis,
  getStrategyAnalyses,
  deleteStrategyAnalysis,

  // Account linking
  linkAccountWithGoogle,
  getLinkedProviders,
  unlinkProvider,
  getProviderName,

  // Goals
  addGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  onGoalsSnapshot,

  // Milestones
  addMilestone,
  getMilestones,
  updateMilestone,
  deleteMilestone,

  // Goal analytics
  calculateGoalProgress,
  calculateAllGoalsProgress,
  getTradeStats
};

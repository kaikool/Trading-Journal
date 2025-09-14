import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut,
  updateProfile,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth";
import { calculatePips, calculateProfit } from "./forex-calculator";
import { DASHBOARD_CONFIG } from "./config";
import { debug, logError, logWarning } from "./debug";
import { captureTradeImages } from "@/lib/api-service";
import { processTradeTrigger as originalProcessTradeTrigger } from "./achievements-service";
import { debounce } from "./utils";
import { tradeUpdateService } from "@/services/trade-update-service";
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
  increment,
} from "firebase/firestore";

// Import Firebase configuration from separate file
import firebaseConfig from "./firebase-config";

/* =========================
 * Firebase init (lazy)
 * ========================= */
if (process.env.NODE_ENV === "development") {
  const { projectId, storageBucket } = firebaseConfig;
  debug("Firebase config:", { projectId, storageBucket });
}

let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let isInitialized = false;

const processTradeTrigger = debounce(
  (userId: string, action: "create" | "update" | "delete") => {
    debug(`Running debounced achievement processing for ${action}`);
    originalProcessTradeTrigger(userId, action).catch((error) =>
      logError("Error in debounced achievement processing:", error)
    );
  },
  2000
);

function initFirebase() {
  if (isInitialized) return { app, auth, db };
  isInitialized = true;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (process.env.NODE_ENV === "development") {
    debug("Firebase has been initialized:");
    debug("- Auth Domain:", firebaseConfig.authDomain);
    debug("- Project ID:", firebaseConfig.projectId);
  }
  return { app, auth, db };
}
initFirebase();

/* =========================
 * Auth helpers
 * ========================= */
async function getIdToken(forceRefresh = false): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      debug("No user is currently signed in");
      return null;
    }
    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    logError("Error getting ID token:", error);
    return null;
  }
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const token = await getIdToken(true);
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  } catch (error) {
    logError("Error in fetchWithAuth:", error);
    throw error;
  }
}

/* =========================
 * Auth APIs
 * ========================= */
async function loginUser(email: string, password: string) {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  return signInWithEmailAndPassword(auth, email, password);
}

async function loginWithGoogle() {
  try {
    const {
      GoogleAuthProvider,
      signInWithPopup,
      getAdditionalUserInfo,
      fetchSignInMethodsForEmail,
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
          displayName: displayName || email?.split("@")[0] || "User",
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
      if (error.code === "auth/account-exists-with-different-credential") {
        const email = error.customData?.email;
        if (!email) throw error;
        debug(`Email ${email} đã tồn tại với phương thức khác`);
        const methods = await fetchSignInMethodsForEmail(auth, email);
        debug(`Phương thức đăng nhập hiện có: ${methods.join(", ")}`);

        if (methods.includes("password")) {
          throw new Error(
            `Email ${email} đã được đăng ký. Đăng nhập email/mật khẩu trước, rồi vào "Tài khoản > Liên kết tài khoản" để kết nối Google.`
          );
        } else {
          let providerName = "phương thức khác";
          const primaryProvider = methods[0];
          if (primaryProvider === "google.com") providerName = "Google";
          else if (primaryProvider === "facebook.com") providerName = "Facebook";
          else if (primaryProvider === "github.com") providerName = "GitHub";
          else if (primaryProvider === "twitter.com") providerName = "Twitter";
          else if (primaryProvider === "apple.com") providerName = "Apple";
          else if (primaryProvider === "password")
            providerName = "Email/Mật khẩu";
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

async function registerUser(
  email: string,
  password: string,
  displayName: string
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
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

/* =========================
 * User data
 * ========================= */
async function getUserData(userId: string) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data();
  throw new Error("User not found");
}

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

/* =========================
 * Trades
 * ========================= */
async function addTrade(userId: string, tradeData: any) {
  try {
    debug("Adding new trade to Firestore", { userId });
    const tradesRef = collection(db, "users", userId, "trades");

    const docRef = await addDoc(tradesRef, {
      ...tradeData,
      createdAt: serverTimestamp(),
      captureStatus: "pending", // UI có thể hiện ngay trạng thái
    });

    debug("Trade added successfully with ID:", docRef.id);

    processTradeTrigger(userId, "create");
    tradeUpdateService.notifyTradeCreated(userId, docRef.id);

    // Auto-capture H4 + M15 (không block UI)
    (async () => {
      try {
        const pair: string = String(tradeData?.pair || "")
          .trim()
          .toUpperCase();
        if (!pair) return;

        const { entryH4, entryM15 } = await captureTradeImages(pair);

        const updatePayload: any = {
          updatedAt: serverTimestamp(),
          captureStatus: entryH4 || entryM15 ? "uploaded" : "empty",
        };
        if (entryH4) updatePayload.entryImage = entryH4; // H4
        if (entryM15) updatePayload.entryImageM15 = entryM15; // M15

        await updateDoc(docRef, updatePayload);
        tradeUpdateService.notifyTradeUpdated(userId, docRef.id);
      } catch (err: any) {
        await updateDoc(docRef, {
          updatedAt: serverTimestamp(),
          captureStatus: "error",
          errorMessage: String(err?.message || err),
        });
        logError("[autoCapture-after-create]", err);
        tradeUpdateService.notifyTradeUpdated(userId, docRef.id);
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
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getAllTrades(userId: string) {
  debug(`Getting all trades for user ${userId}`);
  const tradesRef = collection(db, "users", userId, "trades");
  const q = query(tradesRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getPaginatedTrades(
  userId: string,
  pageSize: number = 10,
  lastDoc: any = null,
  sortOption: string = "newest",
  filters: Record<string, any> = {}
) {
  try {
    debug(`Getting paginated trades for user ${userId}, sort: ${sortOption}`);
    const tradesRef = collection(db, "users", userId, "trades");
    let queryFilters: any[] = [];

    if (filters.isOpen !== undefined)
      queryFilters.push(where("isOpen", "==", filters.isOpen));
    if (filters.pair) queryFilters.push(where("pair", "==", filters.pair));
    if (filters.direction)
      queryFilters.push(where("direction", "==", filters.direction));
    if (filters.result) queryFilters.push(where("result", "==", filters.result));

    let sortField = "createdAt";
    let sortDirection: "asc" | "desc" = "desc";
    switch (sortOption) {
      case "oldest":
        sortDirection = "asc";
        break;
      case "profit":
        sortField = "profitLoss";
        sortDirection = "desc";
        break;
      case "loss":
        sortField = "profitLoss";
        sortDirection = "asc";
        break;
      case "newest":
      default:
        sortDirection = "desc";
        break;
    }

    const countQuery = query(tradesRef, ...queryFilters);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    let dataQuery;
    if (lastDoc) {
      dataQuery = query(
        tradesRef,
        ...queryFilters,
        orderBy(sortField, sortDirection),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      dataQuery = query(
        tradesRef,
        ...queryFilters,
        orderBy(sortField, sortDirection),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(dataQuery);
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const trades = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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

/* ---------------------------------------------------------
 * Batch update helper
 * --------------------------------------------------------- */
async function updateTradeWithBatch(
  userId: string,
  tradeId: string,
  tradeData: any
) {
  try {
    debug(`Using batch update for trade ${tradeId}`);
    const batch = writeBatch(db);
    const tradeRef = doc(db, `users/${userId}/trades/${tradeId}`);
    batch.update(tradeRef, tradeData);

    if ("profitLoss" in tradeData && tradeData.isOpen === false) {
      debug(
        `Batch update: Adding balance update for P/L ${tradeData.profitLoss}`
      );
      const userRef = doc(db, `users/${userId}`);
      batch.update(userRef, {
        currentBalance: increment(tradeData.profitLoss),
        updatedAt: serverTimestamp(),
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

/* ---------------------------------------------------------
 * Image change cleanup (local uploads only)
 * --------------------------------------------------------- */
async function processTradeImages(
  userId: string,
  tradeId: string,
  currentTrade: any,
  tradeData: any
) {
  const imageFields = [
    "entryImage",
    "entryImageM15",
    "exitImage",
    "exitImageM15",
  ];
  const imageProcessPromises: Promise<void>[] = [];

  for (const field of imageFields) {
    if (field in tradeData) {
      const oldImagePath = currentTrade[field];
      const newImagePath = tradeData[field];
      if (oldImagePath && newImagePath && oldImagePath !== newImagePath) {
        debug(`Field ${field} changed - scheduling deletion of old image`);
        const deletePromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            try {
              if (
                oldImagePath.startsWith("/uploads/") ||
                oldImagePath.startsWith("uploads/")
              ) {
                fetch(
                  `/api/uploads/delete?path=${encodeURIComponent(
                    oldImagePath
                  )}`,
                  { method: "DELETE" }
                ).catch((err) =>
                  console.warn(
                    `Could not delete old upload: ${oldImagePath}`,
                    err
                  )
                );
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
  return true;
}

/* ---------------------------------------------------------
 * Recalculate P/L when needed
 * --------------------------------------------------------- */
function recalculateTradeResults(currentTrade: any, tradeData: any) {
  const needToRecalculate =
    (tradeData.isOpen === false &&
      tradeData.exitPrice &&
      !currentTrade.exitPrice) ||
    (currentTrade.exitPrice &&
      tradeData.exitPrice &&
      currentTrade.exitPrice !== tradeData.exitPrice) ||
    (tradeData.entryPrice && currentTrade.entryPrice !== tradeData.entryPrice) ||
    (tradeData.lotSize && currentTrade.lotSize !== tradeData.lotSize);

  if (needToRecalculate && tradeData.exitPrice) {
    debug("Recalculating pips and profit/loss due to changes");
    const direction = tradeData.direction || currentTrade.direction;
    const entryPrice = tradeData.entryPrice || currentTrade.entryPrice;
    const exitPrice = tradeData.exitPrice;
    const lotSize = tradeData.lotSize || currentTrade.lotSize;
    const pair = tradeData.pair || currentTrade.pair;

    const pips = calculatePips(pair, direction, entryPrice, exitPrice);
    const profitLoss = calculateProfit({
      pair,
      direction,
      entryPrice,
      exitPrice,
      lotSize,
      accountCurrency: "USD",
    });

    tradeData.pips = parseFloat(pips.toFixed(1));
    tradeData.profitLoss = parseFloat(profitLoss.toFixed(2));
    return true;
  }
  return false;
}

/* ---------------------------------------------------------
 * Update trade (also auto-capture on close)
 * --------------------------------------------------------- */
async function updateTrade(
  userId: string,
  tradeId: string,
  tradeData: any,
  options: {
    skipImageProcessing?: boolean;
    skipRecalculation?: boolean;
    skipAchievements?: boolean;
    skipGoalsRecalculation?: boolean;
    useBatch?: boolean;
  } = {}
) {
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

    const isClosingTrade =
      tradeData.isOpen === false &&
      (currentTrade.isOpen === true || currentTrade.isOpen === undefined);

    if (isClosingTrade || options.useBatch) {
      await updateTradeWithBatch(userId, tradeId, tradeData);
    } else {
      await updateDoc(tradeRef, tradeData);
    }

    if (!options.skipAchievements) {
      processTradeTrigger(userId, "update");
    }
    if (!options.skipGoalsRecalculation) {
      setTimeout(async () => {
        try {
          await calculateAllGoalsProgress(userId);
        } catch (error) {
          logError("Error recalculating goals after trade update:", error);
        }
      }, 1000);
    }

    if (isClosingTrade) {
      debug(`[REALTIME-DEBUG] Notifying trade closed: ${tradeId}`);
      tradeUpdateService.notifyTradeClosed(userId, tradeId);

      // Auto-capture khi đóng lệnh -> ghi vào exitImage/exitImageM15 (không block UI)
      (async () => {
        try {
          const pair: string = String(
            tradeData?.pair || currentTrade?.pair || ""
          )
            .trim()
            .toUpperCase();
          if (!pair) return;

          const { entryH4, entryM15 } = await captureTradeImages(pair);
          const payload: any = {
            updatedAt: serverTimestamp(),
            // đánh dấu trạng thái nếu muốn
            captureStatus: entryH4 || entryM15 ? "uploaded" : "empty",
          };
          if (entryH4) payload.exitImage = entryH4;
          if (entryM15) payload.exitImageM15 = entryM15;

          await updateDoc(tradeRef, payload);
          tradeUpdateService.notifyTradeUpdated(userId, tradeId);
        } catch (err: any) {
          await updateDoc(tradeRef, {
            updatedAt: serverTimestamp(),
            captureStatus: "error",
            errorMessage: String(err?.message || err),
          });
          logError("[autoCapture-after-close]", err);
          tradeUpdateService.notifyTradeUpdated(userId, tradeId);
        }
      })().catch(logError);
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

    const imageFields = [
      "entryImage",
      "entryImageM15",
      "exitImage",
      "exitImageM15",
    ];
    for (const field of imageFields) {
      if (tradeData[field] && typeof tradeData[field] === "string") {
        const imagePath = tradeData[field];
        try {
          if (
            imagePath.startsWith("/uploads/") ||
            imagePath.startsWith("uploads/")
          ) {
            const deleteUrl = `/api/uploads/delete?path=${encodeURIComponent(
              imagePath
            )}`;
            fetch(deleteUrl, { method: "DELETE" }).catch((err) => {
              console.warn(
                `Could not delete server image: ${imagePath}`,
                err
              );
            });
          }
          // URL ngoài (http/https) — bỏ qua
        } catch (imageError) {
          console.warn(`Error processing image ${field}:`, imageError);
        }
      }
    }

    await deleteDoc(tradeRef);
    await updateAccountBalance(userId);
    processTradeTrigger(userId, "delete");

    setTimeout(async () => {
      try {
        await calculateAllGoalsProgress(userId);
      } catch (error) {
        logError("Error recalculating goals after trade deletion:", error);
      }
    }, 1000);

    tradeUpdateService.notifyTradeDeleted(userId, tradeId);
    return true;
  } catch (error) {
    logError(`Error in deleteTrade function:`, error);
    throw error;
  }
}

/* ---------------------------------------------------------
 * Image helpers (local uploads only)
 * --------------------------------------------------------- */
async function getStorageDownloadUrl(path: string): Promise<string> {
  try {
    debug(`Getting image URL: ${path}`);
    if (path.startsWith("http")) return path;
    return path;
  } catch (error) {
    logError(`Error getting URL for image:`, error);
    return path;
  }
}

async function uploadTradeImage(
  userId: string,
  tradeId: string,
  file: File,
  type: "h4before" | "m15before" | "h4after" | "m15after",
  progressCallback?: (progress: number) => void
): Promise<string> {
  try {
    debug("===== UPLOAD IMAGE: START =====");
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

    debug(
      `File gốc: ${file.name} (${(file.size / 1024).toFixed(2)}KB), type: ${
        file.type
      }`
    );
    debug(`User ID: ${userId}, Trade ID: ${tradeId}, Image type: ${type}`);

    if (progressCallback) progressCallback(10);

    const imageType = type.replace("before", "chart").replace("after", "exit");

    const form = new FormData();
    form.append("file", file);
    form.append("userId", userId);
    form.append("tradeId", tradeId);
    form.append("type", imageType);

    const res = await fetchWithAuth("/api/uploads", { method: "POST", body: form });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Upload failed: ${res.status} ${txt.slice(0, 200)}`);
    }

    const data = await res.json().catch(() => ({} as any));
    const url = data?.url || data?.imageUrl || "";
    if (!url) throw new Error("Upload succeeded but no URL returned");

    if (progressCallback) progressCallback(100);
    debug(`Upload complete, URL: ${url}`);
    return url;
  } catch (error) {
    logError("Error in uploadTradeImage:", error);
    throw error;
  }
}

async function deleteTradeImage(path: string): Promise<boolean> {
  try {
    if (!path) return false;
    debug(`Deleting image: ${path}`);

    if (path.startsWith("/uploads/") || path.startsWith("uploads/")) {
      const res = await fetchWithAuth(
        `/api/uploads/delete?path=${encodeURIComponent(path)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());
      debug("Image deleted successfully");
      return true;
    }

    debug("Skip deleting external image (non-local)");
    return false;
  } catch (error) {
    logError("Error deleting image:", error);
    return false;
  }
}

/* =========================
 * Account balance
 * ========================= */
async function updateAccountBalance(userId: string) {
  try {
    debug(`Updating account balance for user ${userId}`);
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) throw new Error("User not found");

    const userData = userDoc.data();
    const initialBalance =
      userData.initialBalance || DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE;

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
      updatedAt: serverTimestamp(),
    });

    debug(
      `Account balance updated: initial=${initialBalance}, totalPL=${totalPL}, current=${currentBalance}`
    );

    return { initialBalance, totalPL, currentBalance };
  } catch (error) {
    logError("Error updating account balance:", error);
    throw error;
  }
}

/* =========================
 * Strategies
 * ========================= */
async function saveStrategyAnalysis(
  userId: string,
  strategyId: string,
  strategyName: string,
  analysisData: any
) {
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
      summary: analysisData.summary,
    };

    const newAnalysisRef = await addDoc(analysesRef, {
      strategyId,
      strategyName,
      data: dataToSave,
      createdAt: serverTimestamp(),
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
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

async function getStrategies(
  userId: string
): Promise<Array<TradingStrategy & { id: string }>> {
  try {
    debug(`Getting strategies for user ${userId}`);
    const strategiesRef = collection(db, "users", userId, "strategies");
    const querySnapshot = await getDocs(strategiesRef);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as TradingStrategy;
      return { ...data, id: doc.id };
    });
  } catch (error) {
    logError("Error getting strategies:", error);
    throw error;
  }
}

function onStrategiesSnapshot(
  userId: string,
  callback: (strategies: any[]) => void
) {
  if (!userId) return () => {};
  const strategiesRef = collection(db, "users", userId, "strategies");
  let isActive = true;
  const unsubscribe = onSnapshot(
    strategiesRef,
    (snapshot) => {
      if (!isActive) return;
      try {
        const strategies = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        callback(strategies);
      } catch (error) {
        logError("Error in strategies snapshot callback:", error);
      }
    },
    (error) => logError("Error in strategies snapshot:", error)
  );
  return () => {
    isActive = false;
    unsubscribe();
  };
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
    const docRef = await addDoc(strategiesRef, {
      ...strategyData,
      createdAt: serverTimestamp(),
    });
    return { ...strategyData, id: docRef.id };
  } catch (error) {
    logError("Error adding strategy:", error);
    throw error;
  }
}

async function updateStrategy(
  userId: string,
  strategyId: string,
  strategyData: any
) {
  try {
    const strategyRef = doc(db, "users", userId, "strategies", strategyId);
    const cleanData = { ...strategyData };
    delete cleanData.updatedAt;
    cleanData.updatedAt = serverTimestamp();
    delete cleanData.id;

    if (Array.isArray(cleanData.rules)) {
      cleanData.rules = cleanData.rules.map((rule: any) => ({
        id:
          typeof rule.id === "string"
            ? rule.id
            : `rule-${Math.random().toString(36).substr(2, 9)}`,
        label: typeof rule.label === "string" ? rule.label : "",
        order: typeof rule.order === "number" ? rule.order : 0,
        ...(rule.indicator && { indicator: rule.indicator }),
        ...(rule.timeframe && { timeframe: rule.timeframe }),
        ...(rule.expectedValue && { expectedValue: rule.expectedValue }),
        ...(rule.description && { description: rule.description }),
      }));
    }
    if (Array.isArray(cleanData.entryConditions)) {
      cleanData.entryConditions = cleanData.entryConditions.map(
        (condition: any) => ({
          id:
            typeof condition.id === "string"
              ? condition.id
              : `entry-${Math.random().toString(36).substr(2, 9)}`,
          label: typeof condition.label === "string" ? condition.label : "",
          order: typeof condition.order === "number" ? condition.order : 0,
          ...(condition.indicator && { indicator: condition.indicator }),
          ...(condition.timeframe && { timeframe: condition.timeframe }),
          ...(condition.expectedValue && { expectedValue: condition.expectedValue }),
          ...(condition.description && { description: condition.description }),
        })
      );
    }
    if (Array.isArray(cleanData.exitConditions)) {
      cleanData.exitConditions = cleanData.exitConditions.map(
        (condition: any) => ({
          id:
            typeof condition.id === "string"
              ? condition.id
              : `exit-${Math.random().toString(36).substr(2, 9)}`,
          label: typeof condition.label === "string" ? condition.label : "",
          order: typeof condition.order === "number" ? condition.order : 0,
          ...(condition.indicator && { indicator: condition.indicator }),
          ...(condition.timeframe && { timeframe: condition.timeframe }),
          ...(condition.expectedValue && { expectedValue: condition.expectedValue }),
          ...(condition.description && { description: condition.description }),
        })
      );
    }
    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key] === undefined) delete cleanData[key];
    });
    await updateDoc(strategyRef, cleanData);
    return { ...strategyData, id: strategyId };
  } catch (error) {
    logError("Error updating strategy:", error);
    if (error instanceof Error)
      console.error(`Error type: ${error.name}, message: ${error.message}`);
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
        {
          name: "Trend Following",
          description:
            "Following the trend with confirmation from multiple timeframes.",
          rules:
            "Wait for a clear trend, confirm with indicators, enter on pullbacks.",
          indicators: ["Moving Average", "RSI", "MACD"],
          pairs: ["EURUSD", "GBPUSD", "USDJPY"],
          timeframes: ["H4", "D1"],
        },
        {
          name: "Breakout",
          description: "Trading breakouts from key levels or patterns.",
          rules:
            "Identify strong support/resistance, wait for breakout with increased volume.",
          indicators: ["Support/Resistance", "Volume"],
          pairs: ["XAUUSD", "GBPJPY", "USDCAD"],
          timeframes: ["H1", "H4"],
        },
        {
          name: "Price Action",
          description: "Pure price action without indicators.",
          rules:
            "Look for candlestick patterns, pin bars, engulfing patterns at key levels.",
          indicators: ["None"],
          pairs: ["All major pairs"],
          timeframes: ["Any"],
        },
      ];
      const batch = writeBatch(db);
      defaults.forEach((strategy) => {
        const strategyRef = doc(collection(db, "users", userId, "strategies"));
        batch.set(strategyRef, {
          ...strategy,
          createdAt: serverTimestamp(),
          isDefault: true,
        });
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

/* =========================
 * Goals / Milestones
 * ========================= */
async function addGoal(userId: string, goalData: any) {
  try {
    debug("Adding new goal to Firestore", { userId });
    const goalsRef = collection(db, "users", userId, "goals");

    const processedData = {
      ...goalData,
      startDate:
        goalData.startDate instanceof Date
          ? Timestamp.fromDate(goalData.startDate)
          : goalData.startDate,
      endDate:
        goalData.endDate instanceof Date
          ? Timestamp.fromDate(goalData.endDate)
          : goalData.endDate,
    };

    const docRef = await addDoc(goalsRef, {
      ...processedData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    debug("Goal added successfully with ID:", docRef.id);
    return {
      ...docRef,
      id: docRef.id,
    };
  } catch (error) {
    logError("Error adding goal:", error);
    throw error;
  }
}

async function getMilestones(
  userId: string,
  goalId: string
): Promise<Milestone[]> {
  try {
    const milestonesRef = collection(
      db,
      "users",
      userId,
      "goals",
      goalId,
      "milestones"
    );
    const q = query(milestonesRef, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docu) => {
      const data = docu.data();

      const milestone: Milestone = {
        id: docu.id,
        goalId,
        title: data.title || "",
        description: data.description || "",
        targetType: data.targetType || "profit",
        targetValue: Number(data.targetValue) || 0,
        currentValue: Number(data.currentValue) || 0,
        isCompleted: Boolean(data.isCompleted) || false,
        completedDate: data.completedDate || null,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
      };

      return milestone;
    });
  } catch (error) {
    logError("Error getting milestones:", error);
    return [];
  }
}

async function getGoals(
  userId: string
): Promise<Array<Goal & { milestones: Milestone[] }>> {
  try {
    const goalsRef = collection(db, "users", userId, "goals");
    const q = query(goalsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const goals = await Promise.all(
      querySnapshot.docs.map(async (docu) => {
        const goalData = docu.data() as Omit<Goal, "id">;
        const milestones = await getMilestones(userId, docu.id);
        return {
          id: docu.id,
          ...goalData,
          milestones,
        } as Goal & { milestones: Milestone[] };
      })
    );

    return goals;
  } catch (error) {
    logError("Error getting goals:", error);
    throw error;
  }
}

async function getGoalById(
  userId: string,
  goalId: string
): Promise<Goal & { milestones: Milestone[] }> {
  try {
    const docRef = doc(db, "users", userId, "goals", goalId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const goalData = docSnap.data();
      const milestones = await getMilestones(userId, goalId);

      const goalRaw = {
        id: docSnap.id,
        userId: userId,
        title: goalData.title || "",
        description: goalData.description,
        targetType: goalData.targetType || "profit",
        targetValue: goalData.targetValue || 0,
        currentValue: goalData.currentValue || 0,
        startDate: goalData.startDate,
        endDate: goalData.endDate,
        isCompleted: goalData.isCompleted || false,
        priority: goalData.priority || "medium",
        color: goalData.color,
        createdAt: goalData.createdAt,
        updatedAt: goalData.updatedAt,
        milestones,
      };

      return goalRaw as Goal & { milestones: Milestone[] };
    } else {
      throw new Error("Goal not found");
    }
  } catch (error) {
    logError("Error getting goal by ID:", error);
    throw error;
  }
}

async function updateGoal(userId: string, goalId: string, goalData: any) {
  try {
    const goalRef = doc(db, "users", userId, "goals", goalId);
    const processedData = { ...goalData };
    if (goalData.startDate instanceof Date) {
      processedData.startDate = Timestamp.fromDate(goalData.startDate);
    }
    if (goalData.endDate instanceof Date) {
      processedData.endDate = Timestamp.fromDate(goalData.endDate);
    }
    delete processedData.milestones;

    const dataToUpdate = {
      ...processedData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(goalRef, dataToUpdate);
    debug("Goal updated successfully:", goalId);

    return getGoalById(userId, goalId);
  } catch (error) {
    logError("Error updating goal:", error);
    throw error;
  }
}

async function deleteMilestonesForGoal(userId: string, goalId: string) {
  try {
    const milestonesRef = collection(
      db,
      "users",
      userId,
      "goals",
      goalId,
      "milestones"
    );
    const querySnapshot = await getDocs(milestonesRef);

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((docu) => {
      batch.delete(docu.ref);
    });

    await batch.commit();
    debug(`${querySnapshot.docs.length} milestones deleted for goal:`, goalId);
  } catch (error) {
    logError("Error deleting milestones for goal:", error);
    throw error;
  }
}

async function deleteGoal(userId: string, goalId: string) {
  try {
    await deleteMilestonesForGoal(userId, goalId);
    const goalRef = doc(db, "users", userId, "goals", goalId);
    await deleteDoc(goalRef);
    debug("Goal deleted successfully:", goalId);
  } catch (error) {
    logError("Error deleting goal:", error);
    throw error;
  }
}

function onGoalsSnapshot(
  userId: string,
  callback: (goals: any[]) => void,
  errorCallback?: (error: Error) => void
) {
  if (!userId) return () => {};

  const goalsRef = collection(db, "users", userId, "goals");
  const q = query(goalsRef, orderBy("createdAt", "desc"));

  let listenerActive = true;
  let cacheVersion = 0;
  const currentCacheVersion = cacheVersion;

  debug(`Setting up goals snapshot listener for user ${userId}`);

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (!listenerActive || currentCacheVersion !== cacheVersion) {
        debug(
          "Goals snapshot received, but listener no longer active or cache version changed"
        );
        return;
      }

      try {
        debug(`Received ${snapshot.docs.length} goals from snapshot`);

        const goals = await Promise.all(
          snapshot.docs.map(async (docu) => {
            const goalData = docu.data();

            const milestones = await getMilestones(userId, docu.id);

            const goal: Goal = {
              id: docu.id,
              userId: userId,
              title: goalData.title || "",
              description: goalData.description,
              targetType: goalData.targetType || "profit",
              targetValue: goalData.targetValue || 0,
              currentValue: goalData.currentValue || 0,
              startDate: goalData.startDate || Timestamp.now(),
              endDate: goalData.endDate || Timestamp.now(),
              isCompleted: goalData.isCompleted || false,
              priority: goalData.priority || "medium",
              color: goalData.color,
              createdAt: goalData.createdAt || Timestamp.now(),
              updatedAt: goalData.updatedAt,
            };

            return {
              ...goal,
              milestones,
            };
          })
        );

        callback(goals);
      } catch (error) {
        debug("Error in goals snapshot callback:", error);
        if (errorCallback) {
          errorCallback(error as Error);
        }
      }
    },
    (error) => {
      logError("Error in goals snapshot listener:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );

  return () => {
    debug("Goals snapshot listener unsubscribed and cleaned up");
    listenerActive = false;
    cacheVersion++;
    unsubscribe();
  };
}

async function addMilestone(
  userId: string,
  goalId: string,
  milestoneData: any
) {
  try {
    debug(`Adding new milestone for goal ${goalId}`);
    const milestonesRef = collection(
      db,
      "users",
      userId,
      "goals",
      goalId,
      "milestones"
    );

    const processedData = { ...milestoneData };
    if (milestoneData.completedDate instanceof Date) {
      processedData.completedDate = Timestamp.fromDate(
        milestoneData.completedDate
      );
    }

    const docRef = await addDoc(milestonesRef, {
      ...processedData,
      goalId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    debug("Milestone added successfully with ID:", docRef.id);
    return {
      ...docRef,
      id: docRef.id,
    };
  } catch (error) {
    logError("Error adding milestone:", error);
    throw error;
  }
}

async function updateMilestone(
  userId: string,
  goalId: string,
  milestoneId: string,
  milestoneData: any
) {
  try {
    const milestoneRef = doc(
      db,
      "users",
      userId,
      "goals",
      goalId,
      "milestones",
      milestoneId
    );

    const processedData = { ...milestoneData };
    if (milestoneData.completedDate instanceof Date) {
      processedData.completedDate = Timestamp.fromDate(
        milestoneData.completedDate
      );
    }

    const dataToUpdate = {
      ...processedData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(milestoneRef, dataToUpdate);
    debug("Milestone updated successfully:", milestoneId);
  } catch (error) {
    logError("Error updating milestone:", error);
    throw error;
  }
}

async function deleteMilestone(
  userId: string,
  goalId: string,
  milestoneId: string
) {
  try {
    const milestoneRef = doc(
      db,
      "users",
      userId,
      "goals",
      goalId,
      "milestones",
      milestoneId
    );
    await deleteDoc(milestoneRef);
    debug("Milestone deleted successfully:", milestoneId);
  } catch (error) {
    logError("Error deleting milestone:", error);
    throw error;
  }
}

/* =========================
 * Goal analytics
 * ========================= */
async function getTradeStats(userId: string) {
  try {
    const trades = await getAllTrades(userId);
    const closedTrades = trades.filter(
      (trade: any) => trade.closeDate && trade.profitLoss !== undefined
    );

    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
        avgRiskRewardRatio: 0,
      };
    }

    const winningTrades = closedTrades.filter(
      (trade: any) => trade.profitLoss > 0
    );
    const losingTrades = closedTrades.filter(
      (trade: any) => trade.profitLoss < 0
    );

    const totalProfit = winningTrades.reduce(
      (sum: number, trade: any) => sum + trade.profitLoss,
      0
    );
    const totalLoss = Math.abs(
      losingTrades.reduce(
        (sum: number, trade: any) => sum + trade.profitLoss,
        0
      )
    );

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      avgProfit:
        winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      profitFactor:
        totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      largestWin:
        winningTrades.length > 0
          ? Math.max(...winningTrades.map((t: any) => t.profitLoss))
          : 0,
      largestLoss:
        losingTrades.length > 0
          ? Math.abs(Math.min(...losingTrades.map((t: any) => t.profitLoss)))
          : 0,
      avgRiskRewardRatio:
        closedTrades.reduce(
          (sum: number, trade: any) => sum + (trade.riskRewardRatio || 0),
          0
        ) / closedTrades.length,
    };
  } catch (error) {
    logError("Error calculating trade stats:", error);
    throw error;
  }
}

async function calculateAllGoalsProgress(userId: string): Promise<void> {
  try {
    const goals = await getGoals(userId);
    if (goals.length === 0) {
      debug("No goals found for user, skipping goal progress calculation");
      return;
    }

    const userData = await getUserData(userId);
    const tradeStats = await getTradeStats(userId);

    debug(`Updating progress for ${goals.length} goals`);

    for (const goalItem of goals) {
      try {
        const goalId = goalItem.id;
        if (
          !("targetType" in goalItem) ||
          !("targetValue" in goalItem) ||
          !("isCompleted" in goalItem)
        ) {
          logError(`Goal ${goalId} is missing required properties, skipping`);
          continue;
        }

        const targetType = goalItem.targetType as
          | "profit"
          | "winRate"
          | "profitFactor"
          | "riskRewardRatio"
          | "balance"
          | "trades";
        const targetValue = Number(goalItem.targetValue) || 0;
        const isCompleted = Boolean(goalItem.isCompleted);

        let currentValue = 0;
        switch (targetType) {
          case "profit":
            currentValue = tradeStats.netProfit;
            break;
          case "winRate":
            currentValue = tradeStats.winRate;
            break;
          case "profitFactor":
            currentValue = tradeStats.profitFactor;
            break;
          case "riskRewardRatio":
            currentValue = tradeStats.avgRiskRewardRatio;
            break;
          case "balance":
            currentValue = userData.currentBalance;
            break;
          case "trades":
            currentValue = tradeStats.totalTrades;
            break;
          default:
            currentValue = 0;
        }

        await updateGoal(userId, goalId, { currentValue });
        const progress = Math.min(100, (currentValue / targetValue) * 100);

        if (progress >= 100 && !isCompleted) {
          await updateGoal(userId, goalId, { isCompleted: true });
          debug(
            `Goal ${goalId} marked as completed with progress ${progress.toFixed(
              2
            )}%`
          );
        }
      } catch (error) {
        logError(`Error calculating progress for goal ${goalItem.id}:`, error);
      }
    }

    debug(`Successfully updated progress for all ${goals.length} goals`);
  } catch (error) {
    logError("Error calculating all goals progress:", error);
    throw error;
  }
}

async function calculateGoalProgress(
  userId: string,
  goalId: string
): Promise<number> {
  try {
    const goal = await getGoalById(userId, goalId);
    if (
      !goal ||
      typeof goal.targetType === "undefined" ||
      typeof goal.targetValue === "undefined"
    ) {
      throw new Error("Goal not found or missing required properties");
    }

    const userData = await getUserData(userId);
    const tradeStats = await getTradeStats(userId);

    let currentValue = 0;
    const targetType = goal.targetType as
      | "profit"
      | "winRate"
      | "profitFactor"
      | "riskRewardRatio"
      | "balance"
      | "trades";

    switch (targetType) {
      case "profit":
        currentValue = tradeStats.netProfit;
        break;
      case "winRate":
        currentValue = tradeStats.winRate;
        break;
      case "profitFactor":
        currentValue = tradeStats.profitFactor;
        break;
      case "riskRewardRatio":
        currentValue = tradeStats.avgRiskRewardRatio;
        break;
      case "balance":
        currentValue = userData.currentBalance;
        break;
      case "trades":
        currentValue = tradeStats.totalTrades;
        break;
      default:
        currentValue = 0;
    }

    await updateGoal(userId, goalId, { currentValue });

    const targetValue = Number(goal.targetValue) || 1;
    const progress = Math.min(100, (currentValue / targetValue) * 100);

    const isCompleted = Boolean(goal.isCompleted);
    if (progress >= 100 && !isCompleted) {
      await updateGoal(userId, goalId, { isCompleted: true });
    }

    return progress;
  } catch (error) {
    logError("Error calculating goal progress:", error);
    throw error;
  }
}

/* =========================
 * Account linking
 * ========================= */
async function linkAccountWithGoogle() {
  try {
    const { GoogleAuthProvider, linkWithPopup } = await import("firebase/auth");

    const user = auth.currentUser;
    if (!user) {
      throw new Error("Bạn cần đăng nhập trước khi liên kết tài khoản");
    }

    const provider = new GoogleAuthProvider();
    const result = await linkWithPopup(user, provider);

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
      linkedProviders: {
        google: true,
      },
    });

    return result;
  } catch (error: any) {
    if (
      error.code === "auth/credential-already-in-use" ||
      error.code === "auth/email-already-in-use"
    ) {
      throw new Error(
        "Tài khoản Google này đã được liên kết với một tài khoản khác. Vui lòng sử dụng tài khoản Google khác."
      );
    }
    logError("Error linking account with Google:", error);
    throw error;
  }
}

function getProviderName(providerId: string): string {
  switch (providerId) {
    case "google.com":
      return "Google";
    case "facebook.com":
      return "Facebook";
    case "twitter.com":
      return "Twitter";
    case "github.com":
      return "GitHub";
    case "microsoft.com":
      return "Microsoft";
    case "apple.com":
      return "Apple";
    case "password":
      return "Email/Mật khẩu";
    case "phone":
      return "Số điện thoại";
    default:
      return providerId;
  }
}

async function getLinkedProviders(): Promise<string[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }
    const providerData = user.providerData.map(
      (provider) => provider.providerId
    );
    return providerData;
  } catch (error) {
    logError("Error getting linked providers:", error);
    return [];
  }
}

async function unlinkProvider(providerId: string) {
  try {
    const { unlink } = await import("firebase/auth");

    const user = auth.currentUser;
    if (!user) {
      throw new Error("Không có người dùng đang đăng nhập");
    }

    const providers = await getLinkedProviders();
    if (providers.length <= 1) {
      throw new Error(
        "Bạn không thể xóa phương thức đăng nhập duy nhất. Hãy thêm phương thức khác trước."
      );
    }

    await unlink(user, providerId);

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
      [`linkedProviders.${providerId.replace(".", "_")}`]: false,
    });

    return true;
  } catch (error) {
    logError("Error unlinking provider:", error);
    throw error;
  }
}

/* =========================
 * EXPORTS
 * ========================= */
export {
  auth,
  db,
  getIdToken,
  fetchWithAuth,
  // Expose init as `functions` like original codebase
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
  getTradeStats,
};

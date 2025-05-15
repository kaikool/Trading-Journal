import { initializeApp } from "firebase/app";
import { getAuth, type User, signOut, updateProfile, createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { calculatePips, calculateProfit } from './forex-calculator';
import { DASHBOARD_CONFIG } from './config';
import { debug, logError, logWarning } from './debug';
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
// Interface com servidor para gerenciamento de imagens
import { uploadTradeImage as apiUploadTradeImage, deleteTradeImage as apiDeleteTradeImage } from './api-service';

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
// This delays achievement processing for 2 seconds to avoid blocking UI updates
const processTradeTrigger = debounce((userId: string, action: 'create' | 'update' | 'delete') => {
  debug(`Running debounced achievement processing for ${action}`);
  originalProcessTradeTrigger(userId, action)
    .catch(error => logError("Error in debounced achievement processing:", error));
}, 2000);

// Function to initialize Firebase once when needed - performance optimized
function initFirebase() {
  if (isInitialized) return { app, auth, db };
  
  // Mark as initialized immediately to prevent duplicate init calls
  isInitialized = true;
  
  // Actual initialization
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Minimal logging in development
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
    
    // Get fresh token if requested
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
    // Get ID token
    const token = await getIdToken(true); // Always get fresh token
    
    // If token exists, add it to headers
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Make request with auth headers
    return fetch(url, {
      ...options,
      headers
    });
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
 * 
 * Trả về kết quả đăng nhập và thông tin bổ sung
 * PERFORMANCE OPTIMIZATION: Lazy loading của auth providers
 */
async function loginWithGoogle() {
  try {
    // Tối ưu hoá: Chỉ import các thành phần cần thiết
    const { 
      GoogleAuthProvider, 
      signInWithPopup, 
      getAdditionalUserInfo,
      fetchSignInMethodsForEmail
    } = await import("firebase/auth");
    
    const provider = new GoogleAuthProvider();
    
    try {
      // Đăng nhập với Google
      const result = await signInWithPopup(auth, provider);
      
      // Kiểm tra xem người dùng là mới hay không
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser || false;
      
      // Nếu là người dùng mới, tạo hồ sơ người dùng trong Firestore
      if (isNewUser && result.user) {
        debug("Creating new user profile for Google sign-in");
        
        // Lấy thông tin cơ bản từ tài khoản Google
        const { uid, email, displayName, photoURL } = result.user;
        
        // Tạo tài liệu người dùng trong Firestore
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
      
      // Trả về kết quả đăng nhập và thêm thông tin isNewUser
      return {
        ...result,
        isNewUser
      };
    } catch (error: any) {
      // Xử lý trường hợp email đã tồn tại nhưng dùng phương thức khác
      if (error.code === 'auth/account-exists-with-different-credential') {
        // Lấy email từ lỗi
        const email = error.customData?.email;
        if (!email) throw error;
        
        debug(`Email ${email} đã tồn tại với phương thức khác, cố gắng tự động đăng nhập và liên kết tài khoản`);
        
        try {
          // Lấy danh sách phương thức đăng nhập hiện có cho email này
          const methods = await fetchSignInMethodsForEmail(auth, email);
          debug(`Phương thức đăng nhập hiện có cho ${email}: ${methods.join(', ')}`);
          
          if (methods.includes('password')) {
            // Chúng ta cần tạo modal yêu cầu mật khẩu và đăng nhập tự động
            // Hiện tại, sẽ gửi thông báo với hướng dẫn rõ ràng hơn
            throw new Error(
              `Email ${email} đã được đăng ký. Để kích hoạt đăng nhập Google, vui lòng:\n1. Đăng nhập bằng email/mật khẩu.\n2. Vào "Tài khoản > Liên kết tài khoản" để kết nối với Google.\n3. Từ lần sau, bạn có thể đăng nhập bằng cả hai phương thức.`
            );
          } else {
            // Tìm provider đầu tiên để thử đăng nhập
            let primaryProvider = methods[0];
            
            // Chuyển đổi tên provider thủ công vì getProviderName chưa được khai báo
            let providerName = "phương thức khác";
            if (primaryProvider === 'google.com') providerName = 'Google';
            else if (primaryProvider === 'facebook.com') providerName = 'Facebook';
            else if (primaryProvider === 'github.com') providerName = 'GitHub';
            else if (primaryProvider === 'twitter.com') providerName = 'Twitter';
            else if (primaryProvider === 'apple.com') providerName = 'Apple';
            else if (primaryProvider === 'password') providerName = 'Email/Mật khẩu';
            
            if (primaryProvider === 'google.com') {
              throw new Error(`Email ${email} đã được liên kết với Google, nhưng đang gặp lỗi xác thực. Vui lòng thử lại sau.`);
            }
            
            // Nếu không phải Google, hiển thị thông báo để đăng nhập bằng phương thức hiện có
            throw new Error(
              `Email ${email} đã được liên kết với tài khoản ${providerName}. Hãy đăng nhập bằng ${providerName} trước, sau đó vào phần "Tài khoản > Liên kết đăng nhập" để kết nối với Google.`
            );
          }
        } catch (linkError) {
          // Nếu lỗi trong quá trình liên kết, trả về lỗi
          debug("Lỗi khi cố gắng liên kết tài khoản:", linkError);
          throw linkError;
        }
      }
      
      // Nếu là lỗi khác, đẩy lên xử lý ở trên
      throw error;
    }
  } catch (error) {
    logError("Error during Google sign-in:", error);
    throw error;
  }
}

async function registerUser(email: string, password: string, displayName: string) {
  // Create user account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  
  // Create user document in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
    displayName,
    createdAt: serverTimestamp(),
    initialBalance: DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE, // Default initial balance
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
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    throw new Error("User not found");
  }
}

// Firebase Authentication functions

async function updateDisplayName(newDisplayName: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in");
    
    // Update the user's display name in Firebase Authentication
    await updateProfile(user, { displayName: newDisplayName });
    debug("Display name updated successfully in Firebase Auth");
    
    // Also update in Firestore if needed
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

// Hàm cập nhật dữ liệu người dùng

async function updateUserData(userId: string, data: any) {
  const userRef = doc(db, "users", userId);
  return updateDoc(userRef, data);
}

// Trade functions
async function addTrade(userId: string, tradeData: any) {
  try {
    debug("Adding new trade to Firestore", { userId });
    const tradesRef = collection(db, "users", userId, "trades");
    
    // Add document to Firestore
    const docRef = await addDoc(tradesRef, {
      ...tradeData,
      createdAt: serverTimestamp(),
    });
    
    debug("Trade added successfully with ID:", docRef.id);
    
    // Cải tiến hiệu suất: Sử dụng debounce để xử lý thành tích (vẫn giữ lại để tương thích)
    processTradeTrigger(userId, 'create');
    
    // Sử dụng TradeUpdateService để thông báo cập nhật UI đồng bộ
    tradeUpdateService.notifyTradeCreated(userId, docRef.id);
    
    // Return success response with id for easier access
    return {
      success: true,
      id: docRef.id
    };
  } catch (error) {
    logError("Error adding trade:", error);
    throw error;
  }
}

async function getTrades(userId: string) {
  const tradesRef = collection(db, "users", userId, "trades");
  const q = query(tradesRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Chức năng theo dõi trades realtime đã được di chuyển sang FirebaseListenerService
// Xem: client/src/services/firebase-listener-service.ts

/**
 * Lưu ý: Chức năng lắng nghe thay đổi trên Firebase không nên gọi trực tiếp từ component.
 * Thay vào đó, nên:
 * 1. Sử dụng FirebaseListenerService.onTradesSnapshot để quản lý các listeners Firebase
 * 2. Đăng ký với TradeUpdateService để nhận thông báo khi có thay đổi
 * 
 * TradeUpdateService cung cấp điểm trung tâm duy nhất cho việc cập nhật UI
 * khi dữ liệu giao dịch thay đổi, sử dụng TanStack Query để quản lý cache.
 */

/**
 * Lấy tất cả giao dịch của người dùng từ Firestore
 * 
 * @param userId - ID của người dùng
 * @returns Mảng tất cả giao dịch
 */
async function getAllTrades(userId: string) {
  debug(`Getting all trades for user ${userId}`);
  const tradesRef = collection(db, "users", userId, "trades");
  const q = query(tradesRef);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Lấy dữ liệu giao dịch có phân trang từ Firestore
 * 
 * @param userId - ID của người dùng
 * @param pageSize - Số lượng giao dịch mỗi trang
 * @param lastDoc - Document cuối cùng của trang trước (dùng cho phân trang)
 * @param sortOption - Tùy chọn sắp xếp ('newest', 'oldest', 'profit', 'loss')
 * @returns Mảng giao dịch, document cuối cùng và tổng số giao dịch
 */
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
    
    // Bắt đầu xây dựng truy vấn với bộ lọc nếu có
    let queryFilters: any[] = [];
    
    // Thêm các bộ lọc nếu được cung cấp
    if (filters.isOpen !== undefined) {
      queryFilters.push(where("isOpen", "==", filters.isOpen));
    }
    
    if (filters.pair) {
      queryFilters.push(where("pair", "==", filters.pair));
    }
    
    if (filters.direction) {
      queryFilters.push(where("direction", "==", filters.direction));
    }
    
    if (filters.result) {
      queryFilters.push(where("result", "==", filters.result));
    }
    
    // Xác định thứ tự sắp xếp
    let sortField = "createdAt";
    let sortDirection: "asc" | "desc" = "desc";
    
    switch (sortOption) {
      case 'oldest':
        sortField = "createdAt";
        sortDirection = "asc";
        break;
      case 'profit':
        sortField = "profitLoss";
        sortDirection = "desc";
        break;
      case 'loss':
        sortField = "profitLoss";
        sortDirection = "asc";
        break;
      case 'newest':
      default:
        sortField = "createdAt";
        sortDirection = "desc";
        break;
    }
    
    // Đếm tổng số tài liệu cho truy vấn này (áp dụng các bộ lọc nhưng không phân trang)
    const countQuery = query(tradesRef, ...queryFilters);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;
    
    // Xây dựng truy vấn để lấy dữ liệu với phân trang và sắp xếp
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
    
    // Lấy tài liệu cuối cùng cho phân trang tiếp theo
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    // Chuyển đổi dữ liệu
    const trades = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    debug(`Got ${trades.length} trades for page, total count: ${totalCount}`);
    
    return {
      trades,
      lastDoc: lastVisible,
      totalCount
    };
  } catch (error) {
    logError("Error getting paginated trades:", error);
    throw error;
  }
}

async function getTradeById(userId: string, tradeId: string) {
  const docRef = doc(db, "users", userId, "trades", tradeId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } else {
    throw new Error("Trade not found");
  }
}

/**
 * Tối ưu hiệu năng: Cập nhật giao dịch sử dụng batch operations
 * Đặc biệt hiệu quả khi đóng giao dịch và cần cập nhật số dư tài khoản
 */
async function updateTradeWithBatch(userId: string, tradeId: string, tradeData: any) {
  try {
    debug(`Using batch update for trade ${tradeId}`);
    
    // Khởi tạo batch
    const batch = writeBatch(db);
    
    // Reference đến trade cần cập nhật
    const tradeRef = doc(db, `users/${userId}/trades/${tradeId}`);
    
    // Thêm update vào batch
    batch.update(tradeRef, tradeData);
    
    // Nếu có P/L và đang đóng giao dịch, cập nhật balance trong cùng transaction
    if ('profitLoss' in tradeData && tradeData.isOpen === false) {
      debug(`Batch update: Adding balance update for P/L ${tradeData.profitLoss}`);
      const userRef = doc(db, `users/${userId}`);
      
      // Cập nhật balance trong batch sử dụng increment để tránh race condition
      batch.update(userRef, {
        currentBalance: increment(tradeData.profitLoss),
        updatedAt: serverTimestamp()
      });
    }
    
    // Commit batch - thực hiện tất cả các thay đổi trong một transaction
    await batch.commit();
    debug(`Batch commit completed successfully for trade ${tradeId}`);
    
    return {
      success: true,
      data: tradeData
    };
  } catch (error) {
    logError(`Error in batch update for trade ${tradeId}:`, error);
    throw error;
  }
}

/**
 * Xử lý ảnh khi cập nhật giao dịch (tách logic ra function riêng)
 * Tối ưu hiệu suất bằng cách xử lý ảnh riêng biệt
 */
async function processTradeImages(userId: string, tradeId: string, currentTrade: any, tradeData: any) {
  // Check and delete old images if images are updated or deleted
  const imageFields = [
    'entryImage', 
    'entryImageM15', 
    'exitImage', 
    'exitImageM15'
  ];
  
  // Khởi tạo mảng promise để xử lý ảnh song song
  const imageProcessPromises = [];
  
  // Process each image field
  for (const field of imageFields) {
    // If the field exists in the updated trade data
    if (field in tradeData) {
      const oldImagePath = currentTrade[field];
      const newImagePath = tradeData[field];
      
      // IMPORTANT: Only delete the old image if a new one is actually uploaded
      // Conditions: old image exists, new image is different, and new image exists (not null)
      if (oldImagePath && newImagePath && oldImagePath !== newImagePath) {
        debug(`Field ${field} changed - scheduling deletion of old image`);
        
        // Use setTimeout to avoid blocking the main thread
        const deletePromise = new Promise<void>(resolve => {
          setTimeout(() => {
            try {
              // Process images based on their path type
              if (oldImagePath.startsWith('/uploads/') || oldImagePath.startsWith('uploads/')) {
                // Local uploads - use fetch with DELETE
                fetch(`/api/uploads/delete?path=${encodeURIComponent(oldImagePath)}`, { 
                  method: 'DELETE' 
                }).catch(err => {
                  console.warn(`Could not delete old upload: ${oldImagePath}`, err);
                });
              } else if (oldImagePath.includes('cloudinary.com') || 
                        !oldImagePath.startsWith('http') || 
                        oldImagePath.startsWith('data:')) {
                // For Cloudinary or any non-HTTP path, use our API service
                apiDeleteTradeImage(userId, tradeId, oldImagePath)
                  .catch(err => {
                    console.warn(`Could not delete image: ${oldImagePath}`, err);
                  });
              }
            } catch (imageError) {
              console.warn(`Error processing old image ${field}:`, imageError);
            }
            resolve();
          }, 100); // Slight delay to prioritize UI updates
        });
        
        imageProcessPromises.push(deletePromise);
      }
    }
  }
  
  // Không đợi quá trình xóa ảnh cũ hoàn thành để không làm chậm UI
  // Quá trình xóa ảnh sẽ diễn ra độc lập trong background
  return true;
}

/**
 * Kiểm tra và tính toán lại P/L và pips nếu cần
 * Tách thành function riêng để tối ưu code
 */
function recalculateTradeResults(currentTrade: any, tradeData: any) {
  // Check cases that require recalculation of pip and profit/loss
  const needToRecalculate = (
    // Case 1: Closing a trade with exit price
    (tradeData.isOpen === false && tradeData.exitPrice && !currentTrade.exitPrice) ||
    
    // Case 2: Changes to exitPrice when editing a closed trade
    (currentTrade.exitPrice && tradeData.exitPrice && currentTrade.exitPrice !== tradeData.exitPrice) ||
    
    // Case 3: Changes to entryPrice
    (tradeData.entryPrice && currentTrade.entryPrice !== tradeData.entryPrice) ||
    
    // Case 4: Changes to lotSize
    (tradeData.lotSize && currentTrade.lotSize !== tradeData.lotSize)
  );
  
  if (needToRecalculate && tradeData.exitPrice) {
    debug("Recalculating pips and profit/loss due to price or lotSize changes");
    
    // Get necessary parameters, prioritizing new values from tradeData
    const direction = tradeData.direction || currentTrade.direction;
    const entryPrice = tradeData.entryPrice || currentTrade.entryPrice;
    const exitPrice = tradeData.exitPrice;
    const lotSize = tradeData.lotSize || currentTrade.lotSize;
    const pair = tradeData.pair || currentTrade.pair;
    
    // Tính pip difference và profit/loss
    const pips = calculatePips(pair, direction, entryPrice, exitPrice);
    const profitLoss = calculateProfit({
      pair, direction, entryPrice, exitPrice, lotSize,
      accountCurrency: "USD" // Mặc định USD
    });
    
    // Round to 2 decimal places and update tradeData 
    tradeData.pips = parseFloat(pips.toFixed(1));
    tradeData.profitLoss = parseFloat(profitLoss.toFixed(2));
    
    return true;
  }
  
  return false;
}

/**
 * Cập nhật giao dịch và tự động tính toán P/L nếu cần
 * @param userId ID người dùng
 * @param tradeId ID giao dịch
 * @param tradeData Dữ liệu cập nhật
 * @param options Tùy chọn cập nhật
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
    
    // Get current trade data to compare and process images
    const tradeSnapshot = await getDoc(tradeRef);
    if (!tradeSnapshot.exists()) {
      throw new Error("Trade not found");
    }
    
    const currentTrade = tradeSnapshot.data();
    debug(`Updating trade ${tradeId}`);
    
    // Xử lý ảnh - có thể bỏ qua để tối ưu hiệu suất
    if (!options.skipImageProcessing) {
      // Sử dụng hàm tối ưu đã tách ra
      processTradeImages(userId, tradeId, currentTrade, tradeData);
    }
    
    // Tính toán lại P/L nếu cần
    if (!options.skipRecalculation) {
      recalculateTradeResults(currentTrade, tradeData);
    }
    
    // Thêm updatedAt timestamp
    tradeData.updatedAt = serverTimestamp();
    
    // Kiểm tra nếu đây là thao tác đóng giao dịch hoặc yêu cầu dùng batch
    const isClosingTrade = tradeData.isOpen === false && (currentTrade.isOpen === true || currentTrade.isOpen === undefined);
    
    if (isClosingTrade || options.useBatch) {
      // Sử dụng batch cho các hoạt động quan trọng (đóng giao dịch, cập nhật balance)
      await updateTradeWithBatch(userId, tradeId, tradeData);
    } else {
      // Cập nhật thông thường
      await updateDoc(tradeRef, tradeData);
    }
    
    // Cập nhật thành tích nếu không bị bỏ qua (vẫn giữ lại để tương thích)
    if (!options.skipAchievements) {
      processTradeTrigger(userId, 'update');
    }
    
    // Tự động tính toán lại tiến độ mục tiêu khi cập nhật giao dịch (vẫn giữ lại để tương thích)
    if (!options.skipGoalsRecalculation) {
      setTimeout(async () => {
        try {
          await calculateAllGoalsProgress(userId);
        } catch (error) {
          logError("Error recalculating goals after trade update:", error);
        }
      }, 1000);
    }
    
    // Sử dụng TradeUpdateService để thông báo cập nhật UI đồng bộ
    if (isClosingTrade) {
      tradeUpdateService.notifyTradeClosed(userId, tradeId);
    } else {
      tradeUpdateService.notifyTradeUpdated(userId, tradeId);
    }
    
    return {
      success: true,
      data: tradeData
    };
  } catch (error) {
    logError("Error updating trade:", error);
    throw error;
  }
}

async function deleteTrade(userId: string, tradeId: string) {
  try {
    // Lấy thông tin giao dịch để tìm các ảnh cần xóa
    const tradeRef = doc(db, "users", userId, "trades", tradeId);
    const tradeDoc = await getDoc(tradeRef);
    
    if (!tradeDoc.exists()) {
      debug(`Trade ${tradeId} not found when attempting to delete`);
      return;
    }
    
    const tradeData = tradeDoc.data();
    debug(`Deleting trade ${tradeId}`);
    
    // Danh sách các trường có thể chứa ảnh
    const imageFields = [
      'entryImage', 
      'entryImageM15', 
      'exitImage', 
      'exitImageM15'
    ];
    
    // Xử lý xóa ảnh từ server upload
    for (const field of imageFields) {
      if (tradeData[field] && typeof tradeData[field] === 'string') {
        const imagePath = tradeData[field];
        
        try {
          // Xử lý ảnh từ local upload service
          if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
            // API call để xóa ảnh từ server
            const deleteUrl = `/api/uploads/delete?path=${encodeURIComponent(imagePath)}`;
            fetch(deleteUrl, { method: 'DELETE' })
              .catch(err => {
                console.warn(`Could not delete server image: ${imagePath}`, err);
              });
          }
          
          // Xử lý ảnh từ Cloudinary hoặc URL ngoài
          if (imagePath.includes('cloudinary.com') || !imagePath.startsWith('/uploads/')) {
            // Dùng API service để xóa ảnh
            apiDeleteTradeImage(userId, tradeId, imagePath)
              .catch(err => {
                console.warn(`Could not delete image at ${imagePath}:`, err);
              });
          }
        } catch (imageError) {
          console.warn(`Error processing image ${field}:`, imageError);
        }
      }
    }
    
    // Xóa document giao dịch - thực hiện ngay cả khi có lỗi xóa ảnh
    await deleteDoc(tradeRef);
    
    // Cập nhật số dư tài khoản sau khi xóa giao dịch
    await updateAccountBalance(userId);
    
    // Xử lý thành tích (vẫn giữ lại để tương thích)
    processTradeTrigger(userId, 'delete');
    
    // Tính toán lại tiến độ mục tiêu (vẫn giữ lại để tương thích)
    setTimeout(async () => {
      try {
        await calculateAllGoalsProgress(userId);
      } catch (error) {
        logError("Error recalculating goals after trade deletion:", error);
      }
    }, 1000);
    
    // Sử dụng TradeUpdateService để thông báo cập nhật UI đồng bộ
    tradeUpdateService.notifyTradeDeleted(userId, tradeId);
    
    return true;
  } catch (error) {
    logError(`Error in deleteTrade function:`, error);
    throw error;
  }
}

// Image functions
/**
 * Get the URL for an image
 * This simplified version just returns the URL as-is for HTTP URLs
 * or forwards to the new API for other paths
 */
async function getStorageDownloadUrl(path: string): Promise<string> {
  try {
    debug(`Getting image URL: ${path}`);
    
    // Already a full URL, return as is
    if (path.startsWith('http')) {
      return path;
    }
    
    // For backward compatibility, return the path as-is
    // In a real implementation, this would make an API call to get the URL
    return path;
  } catch (error) {
    logError(`Error getting URL for image:`, error);
    // Return original path if error occurs to avoid breaking UI
    return path;
  }
}

// Hàm upload ảnh giao dịch trực tiếp đến Cloudinary
async function uploadTradeImage(
  userId: string, 
  tradeId: string, 
  file: File, 
  type: 'h4before' | 'm15before' | 'h4after' | 'm15after',
  progressCallback?: (progress: number) => void
): Promise<string> {
  try {
    debug('===== UPLOAD IMAGE: START =====');
    
    // Khởi tạo Firebase và lấy thông tin auth
    const { auth } = initFirebase();
    
    // Đảm bảo đã đăng nhập trước khi tải lên
    if (!auth.currentUser) {
      logError("UPLOAD ERROR: Người dùng chưa đăng nhập");
      try {
        await signInAnonymously(auth);
        debug("Đã đăng nhập ẩn danh để tải ảnh");
        // Tiếp tục quá trình sau khi đăng nhập ẩn danh
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
    
    // Validate input 
    if (!file) throw new Error("File không được cung cấp");
    if (!userId) throw new Error("ID người dùng là bắt buộc");
    if (!tradeId) tradeId = "temp-" + Date.now();
    
    // Log thông tin tải lên
    debug(`File gốc: ${file.name} (${(file.size/1024).toFixed(2)}KB), type: ${file.type}`);
    debug(`User ID: ${userId}, Trade ID: ${tradeId}, Image type: ${type}`);
    
    // Báo cáo tiến trình
    if (progressCallback) progressCallback(10);
    
    // Chuyển đổi loại ảnh cho API
    const imageType = type.replace('before', 'chart').replace('after', 'exit');
    
    // Upload trực tiếp qua API
    const uploadResult = await apiUploadTradeImage(userId, tradeId, file, imageType as any, (progress) => {
      // Map progress from API to our callback
      const mappedProgress = Math.round(progress * 0.9) + 10;
      if (progressCallback) {
        progressCallback(mappedProgress);
      }
      
      // Log progress occasionally
      if (mappedProgress % 20 === 0 || mappedProgress === 100) {
        debug(`Upload progress: ${mappedProgress}%`);
      }
    });
    
    if (!uploadResult.success) {
      throw new Error("Upload failed");
    }
    
    debug(`Upload complete, URL available: ${uploadResult.imageUrl.slice(0, 50)}...`);
    if (progressCallback) progressCallback(100);
    return uploadResult.imageUrl;
  } catch (error) {
    logError("Error in uploadTradeImage:", error);
    throw error;
  }
}

// Function to delete image via API service
async function deleteTradeImage(path: string): Promise<boolean> {
  try {
    if (!path) return false;
    
    debug(`Deleting image: ${path}`);
    
    // Use the API service to delete the image
    // No need for userId and tradeId as the API service can identify the image from the path or URL
    const result = await apiDeleteTradeImage("", "", path);
    
    debug("Image deleted successfully");
    return true;
  } catch (error) {
    logError("Error deleting image:", error);
    return false;
  }
}

async function updateAccountBalance(userId: string) {
  try {
    debug(`Updating account balance for user ${userId}`);
    
    // Get the user's data for initial balance
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    const initialBalance = userData.initialBalance || DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE;
    
    // Get all trades to calculate current balance
    const tradesRef = collection(db, "users", userId, "trades");
    const querySnapshot = await getDocs(tradesRef);
    
    // Calculate total profit/loss from closed trades
    let totalPL = 0;
    querySnapshot.forEach((doc) => {
      const trade = doc.data();
      // Only count closed trades with profitLoss field
      if (trade.isOpen === false && trade.profitLoss !== undefined) {
        totalPL += trade.profitLoss;
      }
    });
    
    // Calculate current balance
    const currentBalance = initialBalance + totalPL;
    
    // Update user document with new balance
    await updateDoc(doc(db, "users", userId), {
      currentBalance,
      updatedAt: serverTimestamp()
    });
    
    debug(`Account balance updated: initial=${initialBalance}, totalPL=${totalPL}, current=${currentBalance}`);
    
    return {
      initialBalance,
      totalPL,
      currentBalance
    };
  } catch (error) {
    logError("Error updating account balance:", error);
    throw error;
  }
}

// Strategy functions
async function getStrategies(userId: string): Promise<Array<TradingStrategy & { id: string }>> {
  try {
    debug(`Getting strategies for user ${userId}`);
    const strategiesRef = collection(db, "users", userId, "strategies");
    const querySnapshot = await getDocs(strategiesRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as TradingStrategy;
      return {
        ...data,
        id: doc.id
      };
    });
  } catch (error) {
    logError("Error getting strategies:", error);
    throw error;
  }
}

/**
 * Tạo một listeners Firebase được tối ưu cho strategies
 * 
 * Cải tiến:
 * 1. Cache control để tránh xử lý callback trễ
 * 2. Debounce để giảm số lần render không cần thiết
 * 3. Xử lý lỗi toàn diện
 * 4. Chỉ nhận thay đổi thực, tránh nhận duplicate từ metadata
 * 
 * @param userId ID của người dùng cần theo dõi strategies
 * @param callback Hàm xử lý khi có dữ liệu mới
 * @returns Hàm unsubscribe
 * @deprecated Sử dụng FirebaseListenerService.onStrategiesSnapshot thay thế.
 * FirebaseListenerService cung cấp quản lý tập trung cho các Firebase listeners.
 */
function onStrategiesSnapshot(userId: string, callback: (strategies: any[]) => void) {
  if (!userId) return () => {};
  
  // Tham chiếu đến collection strategies
  const strategiesRef = collection(db, "users", userId, "strategies");
  
  // Flag để theo dõi trạng thái snapshot
  let isActive = true;
  
  // Đăng ký lắng nghe các thay đổi trên collection strategies
  const unsubscribe = onSnapshot(
    strategiesRef,
    (snapshot) => {
      // Nếu listener không còn active, bỏ qua
      if (!isActive) return;
      
      try {
        // Map data và gọi callback
        const strategies = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id
          };
        });
        
        callback(strategies);
      } catch (error) {
        logError("Error in strategies snapshot callback:", error);
      }
    },
    (error) => {
      logError("Error in strategies snapshot:", error);
    }
  );
  
  // Trả về hàm để ngừng lắng nghe
  return () => {
    isActive = false;
    unsubscribe();
  };
}

async function getStrategyById(userId: string, strategyId: string) {
  try {
    const docRef = doc(db, "users", userId, "strategies", strategyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Strategy not found");
    }
    
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id
    };
  } catch (error) {
    logError("Error getting strategy by ID:", error);
    throw error;
  }
}

async function addStrategy(userId: string, strategyData: any) {
  try {
    const strategiesRef = collection(db, "users", userId, "strategies");
    
    // Add document to Firestore
    const docRef = await addDoc(strategiesRef, {
      ...strategyData,
      createdAt: serverTimestamp(),
    });
    
    return {
      ...strategyData,
      id: docRef.id
    };
  } catch (error) {
    logError("Error adding strategy:", error);
    throw error;
  }
}

async function updateStrategy(userId: string, strategyId: string, strategyData: any) {
  try {
    const strategyRef = doc(db, "users", userId, "strategies", strategyId);
    
    // Tạo bản sao dữ liệu để tránh biến đổi dữ liệu gốc
    const cleanData = { ...strategyData };
    
    // Xóa bỏ trường updatedAt hiện tại (nếu có)
    delete cleanData.updatedAt;
    
    // Thêm server timestamp
    cleanData.updatedAt = serverTimestamp();
    
    // Xử lý các trường Timestamp.now() nếu có
    // Chuyển đổi tất cả các Timestamp.now() thành null để serverTimestamp() xử lý
    Object.keys(cleanData).forEach(key => {
      const value = cleanData[key];
      
      // Xóa giá trị undefined vì Firestore không chấp nhận
      if (value === undefined) {
        delete cleanData[key];
      }
      
      // Xóa functions
      if (typeof value === 'function') {
        delete cleanData[key];
      }
      
      // Xử lý giá trị là Timestamp (không phải serverTimestamp)
      if (value instanceof Timestamp && typeof value.toDate === 'function') {
        // Giữ nguyên các timestamp từ DB, chỉ thay đổi các timestamp mới tạo
        if (key !== 'createdAt') {
          // Chỉ log để debug
          console.log(`Converting client timestamp to server timestamp for field: ${key}`);
          cleanData[key] = serverTimestamp();
        }
      }
    });
    
    // Thực hiện cập nhật
    await updateDoc(strategyRef, cleanData);
    
    return {
      ...strategyData,
      id: strategyId
    };
  } catch (error) {
    logError("Error updating strategy:", error);
    console.error("Strategy update failed:", error);
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
    
    // Only create default strategies if user has none
    if (snapshot.empty) {
      debug("Creating default strategies for new user");
      
      const defaultStrategies = [
        {
          name: "Trend Following",
          description: "Following the trend with confirmation from multiple timeframes.",
          rules: "Wait for a clear trend, confirm with indicators, enter on pullbacks.",
          indicators: ["Moving Average", "RSI", "MACD"],
          pairs: ["EURUSD", "GBPUSD", "USDJPY"],
          timeframes: ["H4", "D1"]
        },
        {
          name: "Breakout",
          description: "Trading breakouts from key levels or patterns.",
          rules: "Identify strong support/resistance, wait for breakout with increased volume.",
          indicators: ["Support/Resistance", "Volume"],
          pairs: ["XAUUSD", "GBPJPY", "USDCAD"],
          timeframes: ["H1", "H4"]
        },
        {
          name: "Price Action",
          description: "Pure price action without indicators.",
          rules: "Look for candlestick patterns, pin bars, engulfing patterns at key levels.",
          indicators: ["None"],
          pairs: ["All major pairs"],
          timeframes: ["Any"]
        }
      ];
      
      // Create a batch to add all strategies at once
      const batch = writeBatch(db);
      
      defaultStrategies.forEach(strategy => {
        const strategyRef = doc(collection(db, "users", userId, "strategies"));
        batch.set(strategyRef, {
          ...strategy,
          createdAt: serverTimestamp(),
          isDefault: true
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

// Goals CRUD Operations
/**
 * Thêm mục tiêu mới vào Firestore
 * 
 * @param userId - ID của người dùng
 * @param goalData - Dữ liệu mục tiêu
 * @returns Đối tượng mục tiêu với ID
 */
async function addGoal(userId: string, goalData: any) {
  try {
    debug("Adding new goal to Firestore", { userId });
    const goalsRef = collection(db, "users", userId, "goals");
    
    // Đảm bảo các trường thời gian là đối tượng Date
    const processedData = {
      ...goalData,
      startDate: goalData.startDate instanceof Date ? 
        Timestamp.fromDate(goalData.startDate) : goalData.startDate,
      endDate: goalData.endDate instanceof Date ? 
        Timestamp.fromDate(goalData.endDate) : goalData.endDate
    };
    
    // Thêm document vào Firestore
    const docRef = await addDoc(goalsRef, {
      ...processedData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    debug("Goal added successfully with ID:", docRef.id);
    
    // Trả về đối tượng với id để dễ truy cập
    return {
      ...docRef,
      id: docRef.id
    };
  } catch (error) {
    logError("Error adding goal:", error);
    throw error;
  }
}

/**
 * Lấy tất cả mục tiêu của người dùng
 * 
 * @param userId - ID của người dùng
 * @returns Mảng các mục tiêu
 */
/**
 * Lấy tất cả mục tiêu của người dùng
 * 
 * @param userId - ID của người dùng
 * @returns Mảng các mục tiêu
 */
async function getGoals(userId: string): Promise<Array<Goal & { milestones: Milestone[] }>> {
  try {
    const goalsRef = collection(db, "users", userId, "goals");
    const q = query(goalsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    // Lấy dữ liệu mục tiêu
    const goals = await Promise.all(querySnapshot.docs.map(async doc => {
      const goalData = doc.data() as Omit<Goal, 'id'>;
      
      // Lấy cột mốc cho mỗi mục tiêu
      const milestones = await getMilestones(userId, doc.id);
      
      return {
        id: doc.id,
        ...goalData,
        milestones
      } as Goal & { milestones: Milestone[] };
    }));
    
    return goals;
  } catch (error) {
    logError("Error getting goals:", error);
    throw error;
  }
}

/**
 * Lấy thông tin mục tiêu theo ID
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @returns Thông tin mục tiêu
 */
async function getGoalById(userId: string, goalId: string): Promise<Goal & { milestones: Milestone[] }> {
  try {
    const docRef = doc(db, "users", userId, "goals", goalId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const goalData = docSnap.data();
      
      // Lấy cột mốc cho mục tiêu
      const milestones = await getMilestones(userId, goalId);
      
      // Đảm bảo định dạng dữ liệu đúng kiểu Goal
      const goalRaw = {
        id: docSnap.id,
        userId: userId,
        title: goalData.title || '',
        description: goalData.description,
        targetType: goalData.targetType || 'profit',
        targetValue: goalData.targetValue || 0,
        currentValue: goalData.currentValue || 0,
        startDate: goalData.startDate,
        endDate: goalData.endDate,
        isCompleted: goalData.isCompleted || false,
        priority: goalData.priority || 'medium',
        color: goalData.color,
        createdAt: goalData.createdAt,
        updatedAt: goalData.updatedAt,
        milestones
      };
      
      // Sử dụng assertion kiểu để đảm bảo TypeScript hiểu đúng
      return goalRaw as Goal & { milestones: Milestone[] };
    } else {
      throw new Error("Goal not found");
    }
  } catch (error) {
    logError("Error getting goal by ID:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin mục tiêu
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @param goalData - Dữ liệu cần cập nhật
 * @returns Promise<void>
 */
async function updateGoal(userId: string, goalId: string, goalData: any) {
  try {
    const goalRef = doc(db, "users", userId, "goals", goalId);
    
    // Xử lý các trường thời gian
    const processedData = { ...goalData };
    if (goalData.startDate instanceof Date) {
      processedData.startDate = Timestamp.fromDate(goalData.startDate);
    }
    if (goalData.endDate instanceof Date) {
      processedData.endDate = Timestamp.fromDate(goalData.endDate);
    }
    
    // Loại bỏ trường milestones nếu có (sẽ được lưu riêng)
    delete processedData.milestones;
    
    // Thêm updatedAt vào dữ liệu cập nhật
    const dataToUpdate = {
      ...processedData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(goalRef, dataToUpdate);
    debug("Goal updated successfully:", goalId);
    
    return getGoalById(userId, goalId);
  } catch (error) {
    logError("Error updating goal:", error);
    throw error;
  }
}

/**
 * Xóa mục tiêu
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @returns Promise<void>
 */
async function deleteGoal(userId: string, goalId: string) {
  try {
    // Xóa tất cả các cột mốc trước (nếu có)
    await deleteMilestonesForGoal(userId, goalId);
    
    // Xóa mục tiêu
    const goalRef = doc(db, "users", userId, "goals", goalId);
    await deleteDoc(goalRef);
    debug("Goal deleted successfully:", goalId);
  } catch (error) {
    logError("Error deleting goal:", error);
    throw error;
  }
}

/**
 * Lắng nghe thay đổi mục tiêu theo thời gian thực
 * 
 * @param userId - ID của người dùng
 * @param callback - Hàm xử lý khi có dữ liệu mới
 * @param errorCallback - Hàm xử lý khi có lỗi (tùy chọn)
 * @returns Hàm hủy lắng nghe
 * @deprecated Sử dụng FirebaseListenerService.onGoalsSnapshot thay thế.
 * FirebaseListenerService cung cấp quản lý tập trung cho các Firebase listeners.
 */
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
  
  const unsubscribe = onSnapshot(q,
    async (snapshot) => {
      if (!listenerActive || currentCacheVersion !== cacheVersion) {
        debug("Goals snapshot received, but listener no longer active or cache version changed");
        return;
      }
      
      try {
        debug(`Received ${snapshot.docs.length} goals from snapshot`);
        
        // Lấy dữ liệu mục tiêu và thêm cột mốc
        const goals = await Promise.all(snapshot.docs.map(async doc => {
          const goalData = doc.data();
          
          // Lấy cột mốc cho mỗi mục tiêu
          const milestones = await getMilestones(userId, doc.id);
          
          // Tạo đối tượng tuân thủ interface Goal
          const goal: Goal = {
            id: doc.id,
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
            updatedAt: goalData.updatedAt
          };
          
          // Trả về đối tượng với milestones
          return {
            ...goal,
            milestones
          };
        }));
        
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

// Milestone CRUD Operations
/**
 * Thêm cột mốc mới cho mục tiêu
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @param milestoneData - Dữ liệu cột mốc
 * @returns Đối tượng cột mốc với ID
 */
async function addMilestone(userId: string, goalId: string, milestoneData: any) {
  try {
    debug(`Adding new milestone for goal ${goalId}`);
    const milestonesRef = collection(db, "users", userId, "goals", goalId, "milestones");
    
    // Xử lý trường completedDate nếu có
    const processedData = { ...milestoneData };
    if (milestoneData.completedDate instanceof Date) {
      processedData.completedDate = Timestamp.fromDate(milestoneData.completedDate);
    }
    
    // Thêm document vào Firestore
    const docRef = await addDoc(milestonesRef, {
      ...processedData,
      goalId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    debug("Milestone added successfully with ID:", docRef.id);
    
    // Trả về đối tượng với id để dễ truy cập
    return {
      ...docRef,
      id: docRef.id
    };
  } catch (error) {
    logError("Error adding milestone:", error);
    throw error;
  }
}

/**
 * Lấy tất cả cột mốc của một mục tiêu
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @returns Mảng các cột mốc
 */
async function getMilestones(userId: string, goalId: string): Promise<Milestone[]> {
  try {
    const milestonesRef = collection(db, "users", userId, "goals", goalId, "milestones");
    const q = query(milestonesRef, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Đảm bảo tất cả các trường cần thiết của Milestone đều tồn tại
      const milestone: Milestone = {
        id: doc.id,
        goalId,
        title: data.title || '',
        description: data.description || '',
        targetType: data.targetType || 'profit', // Thêm targetType
        targetValue: Number(data.targetValue) || 0,
        currentValue: Number(data.currentValue) || 0, // Thêm currentValue
        isCompleted: Boolean(data.isCompleted) || false,
        completedDate: data.completedDate || null,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now()
      };
      
      return milestone;
    });
  } catch (error) {
    logError("Error getting milestones:", error);
    return [];
  }
}

/**
 * Cập nhật thông tin cột mốc
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @param milestoneId - ID của cột mốc
 * @param milestoneData - Dữ liệu cần cập nhật
 * @returns Promise<void>
 */
async function updateMilestone(userId: string, goalId: string, milestoneId: string, milestoneData: any) {
  try {
    const milestoneRef = doc(db, "users", userId, "goals", goalId, "milestones", milestoneId);
    
    // Xử lý trường completedDate nếu có
    const processedData = { ...milestoneData };
    if (milestoneData.completedDate instanceof Date) {
      processedData.completedDate = Timestamp.fromDate(milestoneData.completedDate);
    }
    
    // Thêm updatedAt vào dữ liệu cập nhật
    const dataToUpdate = {
      ...processedData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(milestoneRef, dataToUpdate);
    debug("Milestone updated successfully:", milestoneId);
  } catch (error) {
    logError("Error updating milestone:", error);
    throw error;
  }
}

/**
 * Xóa cột mốc
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @param milestoneId - ID của cột mốc
 * @returns Promise<void>
 */
async function deleteMilestone(userId: string, goalId: string, milestoneId: string) {
  try {
    const milestoneRef = doc(db, "users", userId, "goals", goalId, "milestones", milestoneId);
    await deleteDoc(milestoneRef);
    debug("Milestone deleted successfully:", milestoneId);
  } catch (error) {
    logError("Error deleting milestone:", error);
    throw error;
  }
}

/**
 * Xóa tất cả các cột mốc của một mục tiêu
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @returns Promise<void>
 */
async function deleteMilestonesForGoal(userId: string, goalId: string) {
  try {
    const milestonesRef = collection(db, "users", userId, "goals", goalId, "milestones");
    const querySnapshot = await getDocs(milestonesRef);
    
    // Batch delete để tối ưu hiệu suất
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    debug(`${querySnapshot.docs.length} milestones deleted for goal:`, goalId);
  } catch (error) {
    logError("Error deleting milestones for goal:", error);
    throw error;
  }
}

/**
 * Tính toán tiến độ của tất cả mục tiêu của người dùng
 * 
 * @param userId - ID của người dùng 
 * @returns Promise<void>
 */
async function calculateAllGoalsProgress(userId: string): Promise<void> {
  try {
    // Lấy tất cả goal của người dùng
    const goals = await getGoals(userId);
    
    if (goals.length === 0) {
      debug("No goals found for user, skipping goal progress calculation");
      return;
    }
    
    // Lấy dữ liệu người dùng và thống kê giao dịch (chỉ cần lấy một lần để tối ưu hiệu suất)
    const userData = await getUserData(userId);
    const tradeStats = await getTradeStats(userId);
    
    debug(`Updating progress for ${goals.length} goals`);
    
    // Cập nhật từng goal
    for (const goalItem of goals) {
      try {
        // Truy cập an toàn vào các thuộc tính của goalItem
        // Đảm bảo an toàn về kiểu dữ liệu bằng cách kiểm tra tính tồn tại và gán giá trị mặc định nếu cần
        const goalId = goalItem.id;
        
        // Đảm bảo goalItem có đầy đủ thuộc tính của Goal
        if (!('targetType' in goalItem) || !('targetValue' in goalItem) || !('isCompleted' in goalItem)) {
          logError(`Goal ${goalId} is missing required properties, skipping`);
          continue;
        }
        
        const targetType = goalItem.targetType as 'profit' | 'winRate' | 'profitFactor' | 'riskRewardRatio' | 'balance' | 'trades';
        const targetValue = Number(goalItem.targetValue) || 0;
        const isCompleted = Boolean(goalItem.isCompleted);
        
        // Lấy giá trị hiện tại dựa trên loại mục tiêu
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
        
        // Cập nhật mục tiêu với giá trị hiện tại
        await updateGoal(userId, goalId, { currentValue });
        
        // Tính phần trăm tiến độ (tối đa 100%)
        const progress = Math.min(100, (currentValue / targetValue) * 100);
        
        // Nếu tiến độ đạt 100% hoặc hơn và mục tiêu chưa hoàn thành, đánh dấu là đã hoàn thành
        if (progress >= 100 && !isCompleted) {
          await updateGoal(userId, goalId, { isCompleted: true });
          debug(`Goal ${goalId} marked as completed with progress ${progress.toFixed(2)}%`);
        }
      } catch (error) {
        // Log lỗi nhưng tiếp tục xử lý các goal khác
        logError(`Error calculating progress for goal ${goalItem.id}:`, error);
      }
    }
    
    debug(`Successfully updated progress for all ${goals.length} goals`);
  } catch (error) {
    logError("Error calculating all goals progress:", error);
    throw error;
  }
}

/**
 * Tính toán tiến độ của mục tiêu dựa trên dữ liệu giao dịch
 * 
 * @param userId - ID của người dùng
 * @param goalId - ID của mục tiêu
 * @returns Phần trăm tiến độ
 */
async function calculateGoalProgress(userId: string, goalId: string): Promise<number> {
  try {
    const goal = await getGoalById(userId, goalId);
    
    // Đảm bảo goal và các thuộc tính cần thiết tồn tại
    if (!goal || typeof goal.targetType === 'undefined' || typeof goal.targetValue === 'undefined') {
      throw new Error("Goal not found or missing required properties");
    }
    
    // Lấy dữ liệu người dùng và thống kê giao dịch
    const userData = await getUserData(userId);
    const tradeStats = await getTradeStats(userId);
    
    // Lấy giá trị hiện tại dựa trên loại mục tiêu
    let currentValue = 0;
    
    // Đảm bảo targetType là một giá trị hợp lệ
    const targetType = goal.targetType as 'profit' | 'winRate' | 'profitFactor' | 'riskRewardRatio' | 'balance' | 'trades';
    
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
    
    // Cập nhật mục tiêu với giá trị hiện tại
    await updateGoal(userId, goalId, { currentValue });
    
    // Đảm bảo targetValue là một số
    const targetValue = Number(goal.targetValue) || 1; // Tránh chia cho 0
    
    // Tính phần trăm tiến độ (tối đa 100%)
    const progress = Math.min(100, (currentValue / targetValue) * 100);
    
    // Nếu tiến độ đạt 100% hoặc hơn và mục tiêu chưa hoàn thành, đánh dấu là đã hoàn thành
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

/**
 * Lấy thống kê giao dịch của người dùng
 * 
 * @param userId - ID của người dùng
 * @returns Thống kê giao dịch
 */
async function getTradeStats(userId: string) {
  try {
    // Lấy tất cả giao dịch đã đóng
    const trades = await getAllTrades(userId);
    const closedTrades = trades.filter((trade: any) => trade.closeDate && trade.profitLoss !== undefined);
    
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
        avgRiskRewardRatio: 0
      };
    }
    
    // Tính toán các thống kê
    const winningTrades = closedTrades.filter((trade: any) => trade.profitLoss > 0);
    const losingTrades = closedTrades.filter((trade: any) => trade.profitLoss < 0);
    const breakEvenTrades = closedTrades.filter((trade: any) => trade.profitLoss === 0);
    
    const totalProfit = winningTrades.reduce((sum: number, trade: any) => sum + trade.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum: number, trade: any) => sum + trade.profitLoss, 0));
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      avgProfit: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map((t: any) => t.profitLoss)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map((t: any) => t.profitLoss))) : 0,
      avgRiskRewardRatio: closedTrades.reduce((sum: number, trade: any) => sum + (trade.riskRewardRatio || 0), 0) / closedTrades.length
    };
  } catch (error) {
    logError("Error calculating trade stats:", error);
    throw error;
  }
}

/**
 * Liên kết tài khoản hiện tại với Google
 * 
 * Yêu cầu người dùng đã đăng nhập bằng mật khẩu hoặc phương thức khác
 */
async function linkAccountWithGoogle() {
  try {
    // Lazy loading - Chỉ load GoogleAuthProvider khi cần
    const { GoogleAuthProvider, linkWithPopup } = await import("firebase/auth");
    
    // Đảm bảo người dùng đã đăng nhập
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Bạn cần đăng nhập trước khi liên kết tài khoản");
    }
    
    // Tạo provider Google
    const provider = new GoogleAuthProvider();
    
    // Liên kết với Google
    const result = await linkWithPopup(user, provider);
    
    // Cập nhật thông tin trong Firestore nếu cần
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
      linkedProviders: {
        google: true
      }
    });
    
    return result;
  } catch (error: any) {
    // Xử lý trường hợp tài khoản đã tồn tại
    if (error.code === "auth/credential-already-in-use" || 
        error.code === "auth/email-already-in-use") {
      throw new Error(
        "Tài khoản Google này đã được liên kết với một tài khoản khác. Vui lòng sử dụng tài khoản Google khác."
      );
    }
    
    // Xử lý lỗi chung
    logError("Error linking account with Google:", error);
    throw error;
  }
}

/**
 * Chuyển đổi ID nhà cung cấp thành tên dễ đọc
 * @param providerId ID của nhà cung cấp (e.g., 'google.com')
 * @returns Tên hiển thị của nhà cung cấp (e.g., 'Google')
 */
function getProviderName(providerId: string): string {
  switch (providerId) {
    case 'google.com':
      return 'Google';
    case 'facebook.com':
      return 'Facebook';
    case 'twitter.com':
      return 'Twitter';
    case 'github.com':
      return 'GitHub';
    case 'microsoft.com':
      return 'Microsoft';
    case 'apple.com':
      return 'Apple';
    case 'password':
      return 'Email/Mật khẩu';
    case 'phone':
      return 'Số điện thoại';
    default:
      return providerId;
  }
}

/**
 * Lấy danh sách các phương thức liên kết tài khoản
 */
async function getLinkedProviders(): Promise<string[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }
    
    // Lấy danh sách các provider từ user
    const providerData = user.providerData.map(provider => provider.providerId);
    
    return providerData;
  } catch (error) {
    logError("Error getting linked providers:", error);
    return [];
  }
}

/**
 * Hủy liên kết với một nhà cung cấp xác thực
 * 
 * @param providerId ID của nhà cung cấp (ví dụ: 'google.com', 'password')
 */
async function unlinkProvider(providerId: string) {
  try {
    const { unlink } = await import("firebase/auth");
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Không có người dùng đang đăng nhập");
    }
    
    // Kiểm tra số lượng phương thức đăng nhập
    const providers = await getLinkedProviders();
    if (providers.length <= 1) {
      throw new Error("Bạn không thể xóa phương thức đăng nhập duy nhất. Hãy thêm phương thức khác trước.");
    }
    
    // Thực hiện unlink
    await unlink(user, providerId);
    
    // Cập nhật trong Firestore
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
      [`linkedProviders.${providerId.replace('.', '_')}`]: false
    });
    
    return true;
  } catch (error) {
    logError("Error unlinking provider:", error);
    throw error;
  }
}

// Ensure auth, db and helper functions are accessible
// Xuất các thành phần Firebase và tất cả các hàm cần thiết để sử dụng ở các module khác
export { 
  auth, 
  db, 
  getIdToken, 
  fetchWithAuth,
  // Export hàm này để gọi Firebase Functions từ client
  initFirebase as functions,

  // Auth functions
  loginUser,
  loginWithGoogle,
  registerUser,
  logoutUser,
  
  // User functions
  getUserData,
  updateDisplayName,
  updateUserData,
  
  // Trade CRUD functions
  addTrade,
  getTrades,
  getAllTrades,
  getPaginatedTrades,
  getTradeById,
  updateTrade,
  updateTradeWithBatch,
  deleteTrade,
  
  // Image functions
  getStorageDownloadUrl,
  uploadTradeImage,
  deleteTradeImage,
  
  // Helper functions
  updateAccountBalance,
  
  // Strategy functions
  getStrategies,
  getStrategyById,
  addStrategy,
  updateStrategy,
  deleteStrategy,
  onStrategiesSnapshot,
  createDefaultStrategiesIfNeeded,
  
  // Account linking functions
  linkAccountWithGoogle,
  getLinkedProviders,
  unlinkProvider,
  getProviderName,
  
  // Goals functions
  addGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  onGoalsSnapshot,
  
  // Milestones functions
  addMilestone,
  getMilestones,
  updateMilestone,
  deleteMilestone,
  
  // Goal analytics functions
  calculateGoalProgress,
  calculateAllGoalsProgress,
  getTradeStats
};
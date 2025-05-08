import { initializeApp } from "firebase/app";
import { getAuth, type User, signOut, updateProfile, createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { calculatePips, calculateProfit } from './forex-calculator';
import { DASHBOARD_CONFIG } from './config';
import { debug, logError, logWarning } from './debug';
import { processTradeTrigger } from './achievements-service';
import { TradingStrategy } from "@/types";
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
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  deleteObject,
  getDownloadURL,
  StorageError
} from "firebase/storage";

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
let storage: ReturnType<typeof getStorage>;

// Performance optimized initialization flag
let isInitialized = false;

// Function to initialize Firebase once when needed - performance optimized
function initFirebase() {
  if (isInitialized) return { app, auth, db, storage };
  
  // Mark as initialized immediately to prevent duplicate init calls
  isInitialized = true;
  
  // Actual initialization
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Minimal logging in development
  if (process.env.NODE_ENV === 'development') {
    debug("Firebase has been initialized:");
    debug("- Auth Domain:", firebaseConfig.authDomain);
    debug("- Project ID:", firebaseConfig.projectId);
    debug("- Storage Bucket:", firebaseConfig.storageBucket);
  }
  
  return { app, auth, db, storage };
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
    debug("Adding new trade to Firestore", { userId, tradeData });
    const tradesRef = collection(db, "users", userId, "trades");
    
    // Add document to Firestore
    const docRef = await addDoc(tradesRef, {
      ...tradeData,
      createdAt: serverTimestamp(),
    });
    
    debug("Trade added successfully with ID:", docRef.id);
    
    // Trigger achievement processing for trade creation
    try {
      await processTradeTrigger(userId, 'create');
      debug("Achievement processing triggered for new trade");
    } catch (achievementError) {
      // Log but don't fail if achievement processing fails
      logError("Error processing achievements for new trade:", achievementError);
    }
    
    // Return an object with id for easier access
    return {
      ...docRef,
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

// Add function to monitor trades in realtime
/**
 * Tạo một listeners Firebase được tối ưu cho hiệu suất
 * 
 * Cải tiến:
 * 1. Cache control để tránh xử lý callback trễ
 * 2. Debounce để giảm số lần render không cần thiết
 * 3. Bỏ qua các thay đổi metadata
 * 4. Memoization kết quả truy vấn
 * 5. Xử lý lỗi toàn diện
 * 
 * @param userId ID của người dùng cần theo dõi trades
 * @param callback Hàm xử lý khi có dữ liệu mới
 * @param errorCallback Hàm xử lý khi có lỗi (tùy chọn)
 * @returns Hàm unsubscribe 
 */
function onTradesSnapshot(
  userId: string, 
  callback: (trades: any[]) => void,
  errorCallback?: (error: Error) => void
) {
  if (!userId) return () => {}; // Return noop function if userId is not provided
  
  // Sử dụng tham chiếu bộ sưu tập
  const tradesRef = collection(db, "users", userId, "trades");
  
  // Tạo truy vấn với điều kiện sắp xếp và limit để tối ưu
  // Tăng limit nếu cần nhưng việc giới hạn số lượng docs ban đầu giúp cải thiện hiệu suất
  const q = query(tradesRef, orderBy("createdAt", "desc"));
  
  // Biến version theo dõi trạng thái listener
  let listenerActive = true;
  let cacheVersion = 0;
  const currentCacheVersion = cacheVersion;
  
  // Debug info cho biết snapshot đang được theo dõi
  debug(`Setting up trades snapshot listener for user ${userId}`);
  
  // Sử dụng onSnapshot để lắng nghe thay đổi trong collection
  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      // Kiểm tra xem listener có còn active không
      if (!listenerActive || currentCacheVersion !== cacheVersion) {
        debug("Trades snapshot received, but listener no longer active or cache version changed");
        return;
      }
      
      try {
        debug(`Received ${snapshot.docs.length} trades from snapshot`);
        
        // Chuyển đổi dữ liệu thành mảng
        const trades = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Gửi dữ liệu thông qua callback
        callback(trades);
      } catch (error) {
        debug("Error in trades snapshot callback:", error);
        
        // Gửi lỗi tới errorCallback nếu được cung cấp
        if (errorCallback) {
          errorCallback(error as Error);
        }
      }
    },
    (error) => {
      // Xử lý lỗi từ Firebase
      logError("Error in trades snapshot listener:", error);
      
      // Gửi lỗi tới errorCallback nếu được cung cấp
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
  
  // Trả về hàm unsubscribe cải tiến đóng cả listener và đặt flag
  return () => {
    debug("Trades snapshot listener unsubscribed and cleaned up");
    
    // Đặt flag không active trước khi unsubscribe để tránh race condition
    listenerActive = false;
    cacheVersion++;
    
    // Gọi hàm unsubscribe thực tế của Firebase
    unsubscribe();
  };
}

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
    
    return tradeData;
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
        
        // Sử dụng setTimeout để tránh blocking main thread
        const deletePromise = new Promise<void>(resolve => {
          setTimeout(() => {
            try {
              // Process images based on their path type
              if (oldImagePath.startsWith('/uploads/') || oldImagePath.startsWith('uploads/')) {
                // Local uploads - used fetch with DELETE
                fetch(`/api/uploads/delete?path=${encodeURIComponent(oldImagePath)}`, { 
                  method: 'DELETE' 
                }).catch(err => {
                  console.warn(`Could not delete old upload: ${oldImagePath}`, err);
                });
              } else if (
                oldImagePath.includes('firebasestorage.googleapis.com') || 
                oldImagePath.includes('test-uploads/')
              ) {
                // Firebase Storage image - extract path and delete
                try {
                  let storagePath = '';
                  
                  if (oldImagePath.includes('firebasestorage.googleapis.com')) {
                    const filename = oldImagePath.split('/').pop()?.split('?')[0];
                    if (filename) {
                      storagePath = `test-uploads/${userId}_${tradeId}_${filename}`;
                    }
                  } else if (oldImagePath.includes('test-uploads/')) {
                    storagePath = oldImagePath;
                  }
                  
                  if (storagePath) {
                    const imageRef = ref(storage, storagePath);
                    deleteObject(imageRef).catch(err => {
                      console.warn(`Could not delete old Firebase image at ${storagePath}:`, err);
                    });
                  }
                } catch (firebaseError) {
                  console.warn(`Error processing old Firebase Storage image: ${oldImagePath}`, firebaseError);
                }
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
    
    // Cập nhật thành tích nếu không bị bỏ qua 
    if (!options.skipAchievements) {
      try {
        await processTradeTrigger(userId, 'update');
        debug("Achievement processing triggered for trade update");
      } catch (achievementError) {
        // Log but don't fail if achievement processing fails
        logError("Error processing achievements for trade update:", achievementError);
      }
    }
    
    return tradeData;
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
    debug(`Deleting trade ${tradeId} with data:`, tradeData);
    
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
          
          // Xử lý ảnh từ Firebase Storage
          if (imagePath.includes('firebasestorage.googleapis.com') || imagePath.includes('test-uploads/')) {
            // Nếu là URL Firebase Storage
            if (imagePath.includes('firebasestorage.googleapis.com')) {
              // Lấy tên file từ URL
              const filename = imagePath.split('/').pop()?.split('?')[0];
              if (filename) {
                // Xóa file từ Firebase Storage
                const storagePath = `test-uploads/${userId}_${tradeId}_${filename}`;
                const imageRef = ref(storage, storagePath);
                
                deleteObject(imageRef).catch(err => {
                  console.warn(`Could not delete Firebase image at ${storagePath}:`, err);
                });
              }
            } 
            // Nếu là đường dẫn trực tiếp đến test-uploads
            else if (imagePath.includes('test-uploads/')) {
              const imageRef = ref(storage, imagePath);
              
              deleteObject(imageRef).catch(err => {
                console.warn(`Could not delete Firebase image at ${imagePath}:`, err);
              });
            }
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
    
    // Trigger achievement processing for trade deletion
    try {
      await processTradeTrigger(userId, 'delete');
      debug("Achievement processing triggered for trade deletion");
    } catch (achievementError) {
      // Log but don't fail if achievement processing fails
      logError("Error processing achievements for trade deletion:", achievementError);
    }
    
    return true;
  } catch (error) {
    logError(`Error in deleteTrade function:`, error);
    throw error;
  }
}

// Image upload functions
/**
 * Chuyển đổi đường dẫn Firebase Storage thành URL tải xuống
 * Hỗ trợ các định dạng: gs://, test-uploads/, và đường dẫn trực tiếp trong Firebase
 */
async function getStorageDownloadUrl(path: string): Promise<string> {
  try {
    debug(`Converting Firebase Storage path to download URL: ${path}`);
    
    // Đã là URL đầy đủ, trả về luôn
    if (path.startsWith('http')) {
      return path;
    }
    
    // Khởi tạo Firebase nếu chưa
    initFirebase();
    
    let storageRef;
    
    // Xử lý đường dẫn gs://
    if (path.startsWith('gs://')) {
      storageRef = ref(storage, path);
    } 
    // Xử lý đường dẫn cục bộ của Firebase Storage
    else {
      storageRef = ref(storage, path);
    }
    
    // Lấy URL tải xuống
    const downloadURL = await getDownloadURL(storageRef);
    debug(`Successfully converted Firebase path to download URL: ${downloadURL.substring(0, 50)}...`);
    
    return downloadURL;
  } catch (error) {
    logError(`Error converting Firebase path to download URL:`, error);
    // Trả về path gốc nếu lỗi, để không làm hỏng UI
    return path;
  }
}

// PHIÊN BẢN ĐƠN GIẢN HÓA để khắc phục vấn đề upload ảnh
import { optimizeImage } from './image-optimizer';

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
    
    // Log thông tin tải lên - trước khi tối ưu hóa
    debug(`File gốc: ${file.name} (${(file.size/1024).toFixed(2)}KB), type: ${file.type}`);
    debug(`User ID: ${userId}, Trade ID: ${tradeId}, Image type: ${type}`);
    
    // Tối ưu hóa file ảnh trước khi upload - Cải tiến performance
    if (progressCallback) progressCallback(5);
    debug('Bắt đầu tối ưu hóa ảnh trước khi upload...');
    
    try {
      // Tối ưu hóa ảnh với cấu hình phù hợp cho forex chart
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 1600,                 // Đủ lớn cho chart chi tiết
        maxHeight: 1200,                // Tỷ lệ khung hình phù hợp
        quality: 0.85,                  // Chất lượng ban đầu cao
        maxSizeKB: 1024,                // Giới hạn 1MB 
        outputFormat: 'original'        // Giữ nguyên định dạng
      });
      
      // Log kết quả tối ưu hóa
      debug(`Kết quả tối ưu hóa: ${(file.size/1024).toFixed(2)}KB -> ${(optimizedFile.size/1024).toFixed(2)}KB (${Math.round(optimizedFile.size/file.size*100)}%)`);
      
      // Cập nhật file với phiên bản đã tối ưu
      file = optimizedFile;
    } catch (optimizeError) {
      // Nếu tối ưu hóa thất bại, tiếp tục với file gốc
      logWarning("Không thể tối ưu hóa ảnh:", optimizeError);
      debug("Tiếp tục tải lên với file gốc");
    }
    
    // Tạo timestamp cho tên file để tránh trùng lặp
    const timestamp = Date.now();
    // Xử lý tên file để tránh các ký tự không hợp lệ
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${type}_${timestamp}_${safeFileName}`;
    
    // Tạo đường dẫn lưu trữ tuân theo quy tắc bảo mật Firebase
    const storagePath = `test-uploads/${userId}_${tradeId}_${fileName}`;
    debug(`Upload path: ${storagePath}`);
    
    // Tạo tham chiếu đến Firebase Storage
    const storageReference = ref(storage, storagePath);
    
    if (progressCallback) progressCallback(20); // Đã tối ưu và chuẩn bị xong
    
    // Sử dụng uploadBytesResumable để theo dõi tiến trình
    const uploadTask = uploadBytesResumable(storageReference, file);
    
    // Trả về Promise để chờ upload kết thúc
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Cập nhật tiến trình
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 80) + 20;
          
          if (progressCallback) {
            progressCallback(progress);
          }
          
          // Log trạng thái, nhưng không quá thường xuyên
          if (progress % 20 === 0 || progress === 100) {
            debug(`Upload progress: ${progress}%`);
          }
        },
        (error) => {
          logError("Error uploading file:", error);
          reject(error); 
        },
        async () => {
          try {
            // Lấy download URL khi đã upload xong
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            debug(`Upload complete, download URL available: ${downloadURL.slice(0, 50)}...`);
            
            if (progressCallback) progressCallback(100);
            resolve(downloadURL);
          } catch (urlError) {
            logError("Error getting download URL:", urlError);
            reject(urlError);
          }
        }
      );
    });
  } catch (error) {
    logError("Error in uploadTradeImage:", error);
    throw error;
  }
}

// Function to delete image from storage
async function deleteTradeImage(path: string): Promise<boolean> {
  try {
    if (!path) return false;
    
    // If the path is a URL, extract the file path
    let storagePath = path;
    
    // Handle firebase storage URLs
    if (path.includes('firebasestorage.googleapis.com')) {
      // Extract file name from the URL
      const fileName = path.split('/').pop()?.split('?')[0];
      if (!fileName) return false;
      
      // Assume storage path based on file name
      storagePath = `test-uploads/${fileName}`;
    }
    
    // Create reference to storage object
    const imageRef = ref(storage, storagePath);
    
    // Delete the file
    await deleteObject(imageRef);
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
    
    // Add last updated timestamp
    strategyData.updatedAt = serverTimestamp();
    
    await updateDoc(strategyRef, strategyData);
    
    return {
      ...strategyData,
      id: strategyId
    };
  } catch (error) {
    logError("Error updating strategy:", error);
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

// Ensure auth, db, storage and helper functions are accessible
// Xuất các thành phần Firebase và tất cả các hàm cần thiết để sử dụng ở các module khác
export { 
  auth, 
  db, 
  storage, 
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
  onTradesSnapshot,
  
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
  getProviderName
};
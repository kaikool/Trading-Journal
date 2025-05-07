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
  getCountFromServer
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

// Import interfaces
// No longer importing custom types

// Import Firebase configuration from separate file
import firebaseConfig from './firebase-config';

// Get projectId and storageBucket from configuration
const { projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET } = firebaseConfig;

debug("Firebase config:", { 
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase - lazy loaded to avoid loading Firebase on first render
let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

// Function to initialize Firebase once when needed
function initFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize Storage with bucket from configuration
    storage = getStorage(app);
    
    // Log in development only - debug() already checks NODE_ENV
    debug("Firebase has been initialized:");
    debug("- Auth Domain:", firebaseConfig.authDomain);
    debug("- Project ID:", firebaseConfig.projectId);
    debug("- Storage Bucket:", firebaseConfig.storageBucket);
  }
  return { app, auth, db, storage };
}

// Ensure Firebase is initialized
initFirebase();

// Ensure auth, db, storage and helper functions are accessible
// Xuất các thành phần Firebase và hỗ trợ Firebase Functions
export { 
  auth, 
  db, 
  storage, 
  getIdToken, 
  fetchWithAuth,
  // Export hàm này để gọi Firebase Functions từ client
  initFirebase as functions 
};

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
 */
async function loginWithGoogle() {
  try {
    const { 
      GoogleAuthProvider, 
      signInWithPopup, 
      getAdditionalUserInfo,
      fetchSignInMethodsForEmail,
      signInWithEmailLink,
      OAuthProvider,
      linkWithPopup,
      sendSignInLinkToEmail,
      isSignInWithEmailLink,
      signInWithCredential,
      linkWithCredential,
      EmailAuthProvider
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
  
  // Tạo truy vấn với điều kiện sắp xếp
  const q = query(tradesRef, orderBy("createdAt", "desc"));
  
  // Biến version theo dõi trạng thái listener
  let cacheVersion = 0;
  const currentCacheVersion = cacheVersion;
  
  // Biến debounce để giảm số lần cập nhật
  let debounceTimeout: NodeJS.Timeout | null = null;
  
  // Tối ưu thay đổi với bộ nhớ cache
  const cachedResults: Record<string, any> = {};
  
  // Register listener with optimization options
  const unsubscribe = onSnapshot(
    q, 
    { includeMetadataChanges: false }, // Chỉ nhận khi có thay đổi thực sự
    (snapshot) => {
      // Nếu phiên bản cache đã thay đổi, bỏ qua callback này
      if (currentCacheVersion !== cacheVersion) return;
      
      // Xóa timeout trước nếu có
      if (debounceTimeout) clearTimeout(debounceTimeout);
      
      // Kỹ thuật debounce để giảm thiểu re-render
      debounceTimeout = setTimeout(() => {
        // Tạo một ID cho snapshot này dựa trên các docs và hash của nội dung
        const snapshotId = snapshot.docs.map(d => {
          const data = d.data();
          // Sử dụng ID và một số trường dữ liệu để tạo snapshotId thay vì updateTime
          return `${d.id}_${data.updatedAt || data.createdAt || ''}`;
        }).join('|');
        
        // Kiểm tra xem kết quả đã có trong cache chưa
        if (cachedResults[snapshotId]) {
          callback(cachedResults[snapshotId]);
          return;
        }
        
        // Xử lý dữ liệu mới
        const trades = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Lưu vào cache
        cachedResults[snapshotId] = trades;
        
        // Giới hạn kích thước cache
        const cacheKeys = Object.keys(cachedResults);
        if (cacheKeys.length > 5) {
          delete cachedResults[cacheKeys[0]];
        }
        
        // Gọi callback với dữ liệu
        callback(trades);
      }, 150); // Debounce 150ms
    }, 
    (error) => {
      logError("Error listening to trades:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
  
  // Cải thiện cleanup function
  return () => {
    // Tăng version để bỏ qua các callback trễ
    cacheVersion++;
    
    // Xóa timeout nếu đang có
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Hủy đăng ký listener
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
  try {
    // Tham chiếu đến bộ sưu tập trades của user
    const tradesRef = collection(db, "users", userId, "trades");
    
    // Tạo truy vấn với orderBy
    const q = query(tradesRef, orderBy("createdAt", "desc"));
    
    // Thực hiện truy vấn
    const querySnapshot = await getDocs(q);
    
    // Chuyển đổi dữ liệu
    const trades = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Đánh dấu các giao dịch đang mở ngay trong map
        isOpen: !data.closeDate
      };
    });
    
    debug(`Fetched ${trades.length} total trades for user ${userId}`);
    
    return trades;
  } catch (error) {
    logError("Error getting all trades:", error);
    throw error;
  }
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
  sortOption: string = 'newest'
) {
  try {
    // Sử dụng getAllTrades thay vì truy vấn chỉ một trang
    // Điều này cho phép chúng ta sắp xếp trên toàn bộ dữ liệu, không chỉ trang hiện tại
    const allTrades = await getAllTrades(userId);
    
    // Tổng số giao dịch
    const totalCount = allTrades.length;
    
    // Đánh dấu trang hiện tại dựa trên lastDoc nếu có
    // Nếu không có lastDoc, bắt đầu từ đầu
    let startIndex = 0;
    if (lastDoc) {
      const lastDocId = lastDoc.id;
      const lastDocIndex = allTrades.findIndex(trade => trade.id === lastDocId);
      if (lastDocIndex !== -1) {
        startIndex = lastDocIndex + 1; // Bắt đầu từ sau lastDoc
      }
    }
    
    // Slice phần trang hiện tại
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    
    // Lấy document cuối cùng để dùng cho truy vấn tiếp theo
    const lastVisible = endIndex < totalCount 
      ? { id: allTrades[endIndex - 1].id } 
      : null;
    
    debug(`Pagination for ${userId}: page size ${pageSize}, start index ${startIndex}, end index ${endIndex}, total ${totalCount}`);
    
    // Trả về kết quả bao gồm dữ liệu và thông tin phân trang
    return {
      trades: allTrades.slice(startIndex, endIndex),
      lastDoc: lastVisible,
      totalCount
    };
  } catch (error) {
    logError("Error getting paginated trades:", error);
    throw error;
  }
}

async function getTradeById(userId: string, tradeId: string) {
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  const docSnap = await getDoc(tradeRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } else {
    throw new Error("Trade not found");
  }
}

async function updateTrade(userId: string, tradeId: string, tradeData: any) {
  try {
    const tradeRef = doc(db, "users", userId, "trades", tradeId);
    
    // Get current trade data to compare and process images
    const tradeSnapshot = await getDoc(tradeRef);
    if (!tradeSnapshot.exists()) {
      throw new Error("Trade not found");
    }
    
    const currentTrade = tradeSnapshot.data();
    debug(`Updating trade ${tradeId}, current data:`, currentTrade);
    
    // Check and delete old images if images are updated or deleted
    const imageFields = [
      'entryImage', 
      'entryImageM15', 
      'exitImage', 
      'exitImageM15'
    ];
    
    // Process each image field
    for (const field of imageFields) {
      // If the field exists in the updated trade data
      if (field in tradeData) {
        const oldImagePath = currentTrade[field];
        const newImagePath = tradeData[field];
        
        // IMPORTANT: Only delete the old image if a new one is actually uploaded
        // Conditions: old image exists, new image is different, and new image exists (not null)
        if (oldImagePath && newImagePath && oldImagePath !== newImagePath) {
          debug(`Field ${field} changed from "${oldImagePath}" to "${newImagePath}" - will delete old image`);
          
          try {
            // Process images from local upload service
            if (oldImagePath.startsWith('/uploads/') || oldImagePath.startsWith('uploads/')) {
              debug(`Deleting old local uploaded image: ${oldImagePath}`);
              
              try {
                // API call to delete image from server
                const deleteUrl = `/api/uploads/delete?path=${encodeURIComponent(oldImagePath)}`;
                fetch(deleteUrl, { method: 'DELETE' })
                  .then(response => {
                    if (response.ok) {
                      console.log(`Successfully deleted old server image: ${oldImagePath}`);
                    } else {
                      console.warn(`Server returned ${response.status} when deleting old image: ${oldImagePath}`);
                    }
                  })
                  .catch(err => {
                    console.error(`Error deleting old server image: ${oldImagePath}`, err);
                  });
              } catch (serverError) {
                console.error(`Error making delete request for old server image: ${oldImagePath}`, serverError);
              }
            }
            
            // Process images from Firebase Storage
            if (oldImagePath.includes('firebasestorage.googleapis.com') || oldImagePath.includes('test-uploads/')) {
              console.log(`Deleting old Firebase Storage image: ${oldImagePath}`);
              
              try {
                // If it's a Firebase Storage URL
                if (oldImagePath.includes('firebasestorage.googleapis.com')) {
                  // Extract filename from URL
                  const filename = oldImagePath.split('/').pop()?.split('?')[0];
                  if (filename) {
                    console.log(`Extracted filename from Firebase URL: ${filename}`);
                    
                    // Delete file from Firebase Storage
                    try {
                      // If path can be determined from URL, create a reference and delete
                      // test-uploads path is commonly used
                      const storagePath = `test-uploads/${userId}_${tradeId}_${filename}`;
                      const imageRef = ref(storage, storagePath);
                      
                      console.log(`Attempting to delete old image at path: ${storagePath}`);
                      deleteObject(imageRef)
                        .then(() => console.log(`Successfully deleted old Firebase image: ${filename}`))
                        .catch(err => console.warn(`Could not delete old Firebase image at ${storagePath}:`, err));
                    } catch (deleteStorageError) {
                      console.error(`Error deleting old Firebase Storage image:`, deleteStorageError);
                    }
                  }
                } 
                // If it's a direct path to test-uploads
                else if (oldImagePath.includes('test-uploads/')) {
                  console.log(`Direct storage path found: ${oldImagePath}`);
                  const imageRef = ref(storage, oldImagePath);
                  
                  try {
                    await deleteObject(imageRef);
                    console.log(`Successfully deleted old Firebase image at path: ${oldImagePath}`);
                  } catch (deleteError) {
                    console.warn(`Could not delete old Firebase image at ${oldImagePath}:`, deleteError);
                  }
                }
              } catch (firebaseError) {
                console.error(`Error processing old Firebase Storage image: ${oldImagePath}`, firebaseError);
              }
            }
          } catch (imageError) {
            console.error(`General error processing old image ${field}:`, imageError);
            // Continue processing despite error
          }
        } else if (field in tradeData) {
          console.log(`Field ${field} presence but not replacing existing image (oldImage: ${oldImagePath}, newImage: ${newImagePath})`);
        }
      }
    }
    
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
      console.log("Recalculating pips and profit/loss due to price or lotSize changes");
      
      // Get necessary parameters, prioritizing new values from tradeData
      const direction = tradeData.direction || currentTrade.direction;
      const entryPrice = tradeData.entryPrice || currentTrade.entryPrice;
      const exitPrice = tradeData.exitPrice;
      const lotSize = tradeData.lotSize || currentTrade.lotSize;
      const pair = tradeData.pair || currentTrade.pair;
      
      console.log(`Calculation parameters: direction=${direction}, entry=${entryPrice}, exit=${exitPrice}, lot=${lotSize}, pair=${pair}`);
      
      // Sử dụng hàm từ forex-calculator.ts đã import ở đầu file để tính toán pips và profitLoss
      
      // Tính pip difference
      const pips = calculatePips(
        pair, 
        direction, 
        entryPrice, 
        exitPrice
      );
      
      // Tính profit/loss
      const profitLoss = calculateProfit({
        pair,
        direction,
        entryPrice,
        exitPrice,
        lotSize,
        accountCurrency: "USD" // Mặc định USD
      });
      
      // Không cần fixExistingTradeValues vì tính toán đã chính xác
      
      // Round to 2 decimal places
      tradeData.pips = parseFloat(pips.toFixed(1));
      tradeData.profitLoss = parseFloat(profitLoss.toFixed(2));
      
      console.log(`Trade recalculated original: pips=${pips.toFixed(1)}, P/L=${profitLoss.toFixed(2)}`);
      console.log(`Trade recalculated fixed: pips=${tradeData.pips}, P/L=${tradeData.profitLoss}`);
    }
    
    // Thêm updatedAt timestamp
    tradeData.updatedAt = serverTimestamp();
    
    // Cập nhật lệnh trong Firestore
    debug(`Updating trade document with data:`, tradeData);
    await updateDoc(tradeRef, tradeData);
    
    // Nếu đóng lệnh, cập nhật số dư tài khoản
    if (tradeData.isOpen === false) {
      await updateAccountBalance(userId);
    }
    
    // Trigger achievement processing for trade update
    try {
      await processTradeTrigger(userId, 'update');
      debug("Achievement processing triggered for trade update");
    } catch (achievementError) {
      // Log but don't fail if achievement processing fails
      logError("Error processing achievements for trade update:", achievementError);
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
        console.log(`Checking image in field ${field}: ${imagePath}`);
        
        try {
          // Xử lý ảnh từ local upload service
          if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
            console.log(`Deleting local uploaded image: ${imagePath}`);
            
            try {
              // API call để xóa ảnh từ server
              const deleteUrl = `/api/uploads/delete?path=${encodeURIComponent(imagePath)}`;
              fetch(deleteUrl, { method: 'DELETE' })
                .then(response => {
                  if (response.ok) {
                    console.log(`Successfully deleted server image: ${imagePath}`);
                  } else {
                    console.warn(`Server returned ${response.status} when deleting image: ${imagePath}`);
                  }
                })
                .catch(err => {
                  console.error(`Error deleting server image: ${imagePath}`, err);
                });
            } catch (serverError) {
              console.error(`Error making delete request for server image: ${imagePath}`, serverError);
            }
          }
          
          // Xử lý ảnh từ Firebase Storage
          if (imagePath.includes('firebasestorage.googleapis.com') || imagePath.includes('test-uploads/')) {
            console.log(`Deleting Firebase Storage image: ${imagePath}`);
            
            try {
              // Nếu là URL Firebase Storage
              if (imagePath.includes('firebasestorage.googleapis.com')) {
                // Lấy tên file từ URL
                const filename = imagePath.split('/').pop()?.split('?')[0];
                if (filename) {
                  console.log(`Extracted filename from Firebase URL: ${filename}`);
                  
                  // Xóa file từ Firebase Storage
                  try {
                    // Nếu có thể xác định đường dẫn từ URL, tạo một reference và xóa
                    // Đường dẫn test-uploads thường được sử dụng
                    const storagePath = `test-uploads/${userId}_${tradeId}_${filename}`;
                    const imageRef = ref(storage, storagePath);
                    
                    console.log(`Attempting to delete image at path: ${storagePath}`);
                    deleteObject(imageRef)
                      .then(() => console.log(`Successfully deleted Firebase image: ${filename}`))
                      .catch(err => console.warn(`Could not delete Firebase image at ${storagePath}:`, err));
                  } catch (deleteStorageError) {
                    console.error(`Error deleting Firebase Storage image:`, deleteStorageError);
                  }
                }
              } 
              // Nếu là đường dẫn trực tiếp đến test-uploads
              else if (imagePath.includes('test-uploads/')) {
                console.log(`Direct storage path found: ${imagePath}`);
                const imageRef = ref(storage, imagePath);
                
                try {
                  await deleteObject(imageRef);
                  console.log(`Successfully deleted Firebase image at path: ${imagePath}`);
                } catch (deleteError) {
                  console.warn(`Could not delete Firebase image at ${imagePath}:`, deleteError);
                }
              }
            } catch (firebaseError) {
              console.error(`Error processing Firebase Storage image: ${imagePath}`, firebaseError);
            }
          }
        } catch (imageError) {
          console.error(`General error processing image ${field}:`, imageError);
        }
      }
    }
    
    // Xóa document giao dịch - thực hiện ngay cả khi có lỗi xóa ảnh
    debug(`Deleting trade document: ${tradeId}`);
    await deleteDoc(tradeRef);
    
    debug(`Trade ${tradeId} successfully deleted`);
    
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
      // Log lỗi nhưng vẫn tiếp tục với file gốc
      logError("Không thể tối ưu hóa ảnh, sẽ sử dụng file gốc:", optimizeError);
    }
    
    // Giới hạn kích thước 5MB (kiểm tra lại sau khi tối ưu)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`Kích thước file quá lớn (${(file.size/1024/1024).toFixed(2)}MB) ngay cả sau khi tối ưu. Tối đa là 5MB.`);
    }
    
    // Tạo tên file an toàn
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${type}_${timestamp}_${safeFileName}`;
    
    // Tạo đường dẫn lưu trữ tuân theo quy tắc bảo mật Firebase
    // Sử dụng đường dẫn phân cấp users/{userId}/trades/{tradeId}/{fileName}
    const storagePath = `users/${userId}/trades/${tradeId}/${fileName}`;
    debug(`Đường dẫn lưu trữ: ${storagePath}`);
    
    // Báo cáo tiến độ ban đầu
    if (progressCallback) progressCallback(10);
    
    // Tạo reference và metadata đơn giản
    const storageRef = ref(storage, storagePath);
    const metadata = { 
      contentType: file.type,
      customMetadata: {
        'uploadDate': new Date().toISOString(),
        'userId': userId,
        'tradeId': tradeId,
        'imageType': type
      }
    };
    
    // Log các thông tin quan trọng
    debug(`Firebase storage bucket: ${storage.app.options.storageBucket}`);
    debug(`Bắt đầu upload...`);
    
    // Sử dụng uploadBytes thay vì uploadBytesResumable để tránh vấn đề với iframe
    // Tăng giá trị tiến độ giả lập
    if (progressCallback) progressCallback(30);
    
    try {
      debug("Đang tải lên với uploadBytes...");
      if (progressCallback) progressCallback(50);
      
      // Kiểm tra đường dẫn theo đúng quy tắc trong storage.rules
      if (!storagePath.startsWith('users/')) {
        throw new Error('Đường dẫn không khớp với quy tắc Firebase Storage. Phải bắt đầu với "users/"');
      }
      
      // Kiểm tra format của path theo mẫu users/{userId}/trades/{tradeId}/{fileName}
      const pathRegex = /^users\/[^\/]+\/trades\/[^\/]+\/.+$/;
      if (!pathRegex.test(storagePath)) {
        throw new Error(`Đường dẫn "${storagePath}" không khớp với mẫu yêu cầu "users/{userId}/trades/{tradeId}/{fileName}"`);
      }
      
      // Tải lên với phương thức đơn giản hơn, không có theo dõi tiến trình
      debug(`Đang tải file lên đường dẫn: ${storagePath}`);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      debug(`Upload thành công với snapshot: ${snapshot.metadata.name}`);
      
      if (progressCallback) progressCallback(80);
      
      // Lấy URL tải xuống
      const url = await getDownloadURL(snapshot.ref);
      debug(`Đã lấy được URL: ${url}`);
      if (progressCallback) progressCallback(100);
      debug('===== UPLOAD IMAGE: SUCCESS =====');
      
      return url;
    } catch (error: any) {
      logError(`Lỗi upload:`, error);
      
      // Thông tin lỗi chi tiết hơn cho người dùng
      let errorMessage = "Lỗi không xác định khi tải lên";
      
      // Kiểm tra các loại lỗi phổ biến
      if (error.code) {
        // Firebase error với code cụ thể
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = "Không có quyền truy cập. Kiểm tra đăng nhập và quy tắc Firebase Storage.";
            logError("Lỗi quyền truy cập Firebase Storage. Check storage.rules và trạng thái đăng nhập.");
            break;
          case 'storage/canceled':
            errorMessage = "Việc tải lên đã bị hủy";
            break;
          case 'storage/unknown':
            errorMessage = "Lỗi Firebase không xác định. Đường dẫn có thể không khớp với rules.";
            logError("Path đang dùng:", storagePath);
            logError("Firebase Storage Rules cần được cấu hình cho pattern: users/{userId}/trades/{tradeId}/{fileName}");
            break;
          default:
            errorMessage = `Lỗi Firebase: ${error.message}`;
        }
      } else if (error instanceof Error) {
        // Standard Error object
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      logError(errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    logError(`LỖI UPLOAD ẢNH: `, error);
    
    // Đảm bảo luôn trả về Error thay vì một giá trị không xác định
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Lỗi không xác định khi tải ảnh lên");
    }
  }
}

// PHIÊN BẢN GỐC với uploadBytesResumable - giữ lại để tham khảo
async function uploadTradeImage_original(
  userId: string, 
  tradeId: string, 
  file: File, 
  type: 'h4before' | 'm15before' | 'h4after' | 'm15after',
  progressCallback?: (progress: number) => void
): Promise<string> {
  try {
    // Validate inputs
    if (!file) throw new Error("File is required");
    if (!userId) throw new Error("User ID is required");
    if (!tradeId) tradeId = "temp-" + Date.now(); // ID tạm cho giao dịch mới
    
    console.log(`File: ${file.name} (${(file.size/1024).toFixed(2)}KB)`);
    console.log(`User ID: ${userId}, Trade ID: ${tradeId}`);
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File size too large: ${(file.size/1024/1024).toFixed(2)}MB. Maximum is 5MB.`);
    }
    
    // Create safe filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${type}_${timestamp}_${safeFileName}`;
    
    // Firebase storage path (theo định dạng test-uploads để phù hợp với rules)
    const storagePath = `test-uploads/${userId}_${tradeId}_${fileName}`;
    console.log(`Storage path: ${storagePath}`);
    
    // Set metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'userId': userId,
        'tradeId': tradeId,
        'uploadDate': new Date().toISOString(),
        'imageType': type
      }
    };
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload with progress monitoring
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
    // Return promise with url
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress updates
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
          if (progressCallback) progressCallback(progress);
        },
        (error: StorageError) => {
          // Chi tiết lỗi để gỡ lỗi tốt hơn
          console.error("Upload failed:", error.code, error.message);
          
          let errorMsg = "Upload failed";
          
          // Phân loại các lỗi Firebase Storage phổ biến
          switch (error.code) {
            case 'storage/unauthorized':
              errorMsg = "Không có quyền upload - kiểm tra rules và xác thực";
              break;
            case 'storage/canceled':
              errorMsg = "Upload bị hủy";
              break;
            case 'storage/unknown':
              errorMsg = "Lỗi không xác định - kiểm tra đường dẫn lưu trữ có đúng định dạng và phù hợp với rules không";
              console.warn("Storage path không hợp lệ hoặc không có quyền cho storage path:", storagePath);
              break;
            default:
              errorMsg = `Lỗi upload: ${error.message}`;
          }
          
          reject(new Error(errorMsg));
        },
        async () => {
          // Complete handler
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`Upload complete. URL: ${downloadURL.substring(0, 50)}...`);
            resolve(downloadURL);
          } catch (urlError) {
            console.error("Failed to get download URL:", urlError);
            reject(new Error("Upload succeeded but failed to get download URL"));
          }
        }
      );
    });
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
}

// Function to delete a trade image
async function deleteTradeImage(
  userId: string,
  tradeId: string,
  fileOrType: string
): Promise<boolean> {
  try {
    // Khai báo biến storagePath
    let storagePath = '';

    // Kiểm tra xem URL có phải là loại không được hỗ trợ không
    if (fileOrType.includes('cloudinary.com')) {
      debug(`URL không được hỗ trợ (legacy): ${fileOrType}`);
      debug('Bỏ qua lệnh xóa cho loại URL không hỗ trợ');
      // Trả về false vì không thể xử lý đối với loại URL này
      return false;
    }
    
    // Trường hợp là URL đầy đủ từ Firebase Storage
    if (fileOrType.startsWith('https://firebasestorage.googleapis.com')) {
      debug(`Đang xử lý URL Firebase: ${fileOrType}`);
      
      // Lấy tên file từ URL
      const fileNameWithQuery = fileOrType.split('/').pop() || '';
      const fileName = fileNameWithQuery.split('?')[0];
      
      if (!fileName) {
        throw new Error("Không thể trích xuất tên file từ URL");
      }
      
      // Tạo đường dẫn đầy đủ dựa trên quy ước
      storagePath = `users/${userId}/trades/${tradeId}/${fileName}`;
    }
    // Trường hợp đường dẫn thư mục của Firebase Storage
    else if (fileOrType.startsWith('users/')) {
      storagePath = fileOrType;
    }
    // Trường hợp loại ảnh UI (h4chart, m15chart, ...)
    else if (['h4chart', 'm15chart', 'h4exit', 'm15exit'].includes(fileOrType)) {
      // Ánh xạ từ loại UI sang loại Firebase
      const typeMap: Record<string, string> = {
        'h4chart': 'h4before',
        'm15chart': 'm15before',
        'h4exit': 'h4after',
        'm15exit': 'm15after'
      };
      
      const firebaseType = typeMap[fileOrType];
      if (!firebaseType) {
        throw new Error(`Loại ảnh không hợp lệ: ${fileOrType}`);
      }
      
      // Đường dẫn đầy đủ theo mẫu
      storagePath = `users/${userId}/trades/${tradeId}/${firebaseType}_*`;
      
      // CẢNH BÁO: Đây là quá trình không hiệu quả, vì không thể dùng wildcard
      // Trong thực tế, nên lưu trữ đường dẫn đầy đủ của ảnh trong document giao dịch
      
      debug(`Đang tìm ảnh với đường dẫn: ${storagePath}`);
      
      // QUAN TRỌNG: Không thể tìm kiếm với wildcard trong Firebase Storage
      // Khuyến nghị lưu URL ảnh trong document giao dịch
      
      logWarning("Phương thức xóa theo loại ảnh chưa được triển khai. Cần lưu URL ảnh trong document giao dịch.");
      throw new Error("Phương thức xóa theo loại ảnh chưa được triển khai. Cần lưu URL ảnh trong document giao dịch.");
    }
    // Trường hợp tên file trực tiếp
    else {
      storagePath = `users/${userId}/trades/${tradeId}/${fileOrType}`;
    }
    
    debug(`Đang xóa file: ${storagePath}`);
    
    // Tạo reference và xóa file
    const imageRef = ref(storage, storagePath);
    await deleteObject(imageRef);
    
    return true;
  } catch (storageError: any) {
    logError(`Lỗi xóa file: ${storageError.code} - ${storageError.message}`);
    
    // Trả về false nếu xóa thất bại, nhưng không throw lỗi
    // Điều này giúp quá trình xóa giao dịch vẫn tiếp tục ngay cả khi không xóa được ảnh
    return false;
  }
}

// Cập nhật số dư tài khoản dựa trên tất cả giao dịch đã đóng
async function updateAccountBalance(userId: string) {
  try {
    // Lấy thông tin người dùng để biết số dư ban đầu
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      logError(`User document not found for ID: ${userId}`);
      return;
    }
    
    // Lấy số dư ban đầu từ document người dùng
    const userData = userDoc.data();
    const initialBalance = userData.initialBalance || DASHBOARD_CONFIG.DEFAULT_INITIAL_BALANCE; // Mặc định nếu không có
    
    // Lấy tất cả giao dịch đã đóng
    const tradesRef = collection(db, "users", userId, "trades");
    const q = query(tradesRef, where("isOpen", "==", false));
    const querySnapshot = await getDocs(q);
    
    // Kiểm tra xem có giao dịch đã đóng nào không
    const closedTrades = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Nếu không có giao dịch đã đóng, giữ nguyên số dư ban đầu
    if (closedTrades.length === 0) {
      // Nếu không có giao dịch, cập nhật currentBalance = initialBalance
      await updateDoc(doc(db, "users", userId), {
        currentBalance: initialBalance,
        updatedAt: serverTimestamp()
      });
      
      debug(`No closed trades found. Set balance to initial: ${initialBalance}`);
      return initialBalance;
    }
    
    // Tính tổng lợi nhuận/lỗ từ tất cả giao dịch đã đóng
    let totalProfitLoss = 0;
    
    for (const trade of closedTrades) {
      // Kiểm tra kỹ lưỡng giá trị profitLoss
      if (!trade || typeof trade !== 'object') continue;
      
      // Đảm bảo trade có trường profitLoss
      if (!('profitLoss' in trade)) continue;
      
      const profitLoss = trade.profitLoss;
      
      if (profitLoss !== undefined && profitLoss !== null) {
        // Chuyển đổi sang số nếu là chuỗi
        const profitLossNumber = typeof profitLoss === 'string' 
          ? parseFloat(profitLoss) 
          : Number(profitLoss);
          
        // Chỉ cộng dồn nếu là số hợp lệ
        if (!isNaN(profitLossNumber) && isFinite(profitLossNumber)) {
          totalProfitLoss += profitLossNumber;
        } else {
          logWarning(`Invalid profitLoss value in trade ${trade.id}: ${profitLoss}`);
        }
      }
    }
    
    // Áp dụng quy tắc từ balance-calculation-rules.ts
    // Current Balance = Initial Balance + Tổng P&L của tất cả giao dịch đã đóng
    const newBalance = initialBalance + totalProfitLoss;
    
    // Cập nhật document người dùng với số dư mới
    await updateDoc(doc(db, "users", userId), {
      currentBalance: newBalance,
      updatedAt: serverTimestamp()
    });
    
    debug(`Updated account balance: ${initialBalance} + ${totalProfitLoss} = ${newBalance}`);
    
    return newBalance;
  } catch (error) {
    logError("Error updating account balance:", error);
    throw error;
  }
}

// Trading Strategy functions
async function getStrategies(userId: string): Promise<Array<TradingStrategy & { id: string }>> {
  try {
    const strategiesRef = collection(db, "users", userId, "strategies");
    const q = query(strategiesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TradingStrategy & { id: string }));
  } catch (error) {
    logError("Error getting strategies:", error);
    throw error;
  }
}

function onStrategiesSnapshot(userId: string, callback: (strategies: any[]) => void) {
  const strategiesRef = collection(db, "users", userId, "strategies");
  const q = query(strategiesRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const strategies = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(strategies);
  });
}

async function getStrategyById(userId: string, strategyId: string) {
  try {
    const strategyRef = doc(db, "users", userId, "strategies", strategyId);
    const docSnap = await getDoc(strategyRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("Strategy not found");
    }
  } catch (error) {
    logError("Error getting strategy:", error);
    throw error;
  }
}

async function addStrategy(userId: string, strategyData: any) {
  try {
    debug("Adding new strategy to Firestore", { userId, strategyData });
    const strategiesRef = collection(db, "users", userId, "strategies");
    
    // Xử lý dữ liệu để đảm bảo tính hợp lệ cho Firestore
    // Chỉ giữ lại các trường cần thiết và đưa về định dạng đúng
    const processCondition = (condition: any) => {
      if (!condition || typeof condition !== 'object') return null;
      
      return {
        id: condition.id || "",
        label: condition.label || "",
        order: typeof condition.order === 'number' ? condition.order : 0,
        indicator: condition.indicator || null,
        timeframe: condition.timeframe || null,
        expectedValue: condition.expectedValue || null,
        description: condition.description || null
      };
    };
    
    // Xử lý mảng các điều kiện, loại bỏ giá trị undefined
    const processConditionsArray = (conditionsArray: any[]) => {
      if (!Array.isArray(conditionsArray)) return [];
      
      return conditionsArray
        .filter(item => item && typeof item === 'object')
        .map(processCondition)
        .filter(Boolean); // Loại bỏ các giá trị null
    };
    
    // Tạo dữ liệu sạch cho Firestore
    const cleanedStrategyData = {
      name: strategyData.name || "",
      description: strategyData.description || "",
      
      // Xử lý mảng các điều kiện
      rules: processConditionsArray(strategyData.rules),
      entryConditions: processConditionsArray(strategyData.entryConditions),
      exitConditions: processConditionsArray(strategyData.exitConditions),
      
      // Các trường còn lại
      timeframes: Array.isArray(strategyData.timeframes) ? 
        strategyData.timeframes.filter(Boolean).map(String) : [],
      riskRewardRatio: typeof strategyData.riskRewardRatio === 'number' ? 
        strategyData.riskRewardRatio : 2,
      notes: strategyData.notes || "",
      isDefault: strategyData.isDefault === true,
      
      // Xử lý các trường cũ, tương thích ngược
      rulesText: Array.isArray(strategyData.rulesText) ? 
        strategyData.rulesText.filter(String) : [],
      entryConditionsText: Array.isArray(strategyData.entryConditionsText) ? 
        strategyData.entryConditionsText.filter(String) : [],
      exitConditionsText: Array.isArray(strategyData.exitConditionsText) ? 
        strategyData.exitConditionsText.filter(String) : []
    };
    
    // Thêm các trường mặc định
    const strategyWithDefaults = {
      ...cleanedStrategyData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    debug("Prepared data for Firestore:", strategyWithDefaults);
    
    // Add document to Firestore
    const docRef = await addDoc(strategiesRef, strategyWithDefaults);
    
    debug("Strategy added successfully with ID:", docRef.id);
    
    // Return an object with id for easier access
    return {
      id: docRef.id
    };
  } catch (error) {
    logError("Error adding strategy:", error);
    throw error;
  }
}

async function updateStrategy(userId: string, strategyId: string, strategyData: any) {
  try {
    debug("Updating strategy with ID:", strategyId);
    const strategyRef = doc(db, "users", userId, "strategies", strategyId);
    
    // Xử lý dữ liệu để đảm bảo tính hợp lệ cho Firestore - sử dụng cùng logic như addStrategy
    const processCondition = (condition: any) => {
      if (!condition || typeof condition !== 'object') return null;
      
      return {
        id: condition.id || "",
        label: condition.label || "",
        order: typeof condition.order === 'number' ? condition.order : 0,
        indicator: condition.indicator || null,
        timeframe: condition.timeframe || null,
        expectedValue: condition.expectedValue || null,
        description: condition.description || null
      };
    };
    
    // Xử lý mảng các điều kiện, loại bỏ giá trị undefined
    const processConditionsArray = (conditionsArray: any[]) => {
      if (!Array.isArray(conditionsArray)) return [];
      
      return conditionsArray
        .filter(item => item && typeof item === 'object')
        .map(processCondition)
        .filter(Boolean); // Loại bỏ các giá trị null
    };
    
    // Tạo dữ liệu sạch cho Firestore
    const cleanedStrategyData = {
      name: strategyData.name || "",
      description: strategyData.description || "",
      
      // Xử lý mảng các điều kiện
      rules: processConditionsArray(strategyData.rules),
      entryConditions: processConditionsArray(strategyData.entryConditions),
      exitConditions: processConditionsArray(strategyData.exitConditions),
      
      // Các trường còn lại
      timeframes: Array.isArray(strategyData.timeframes) ? 
        strategyData.timeframes.filter(Boolean).map(String) : [],
      riskRewardRatio: typeof strategyData.riskRewardRatio === 'number' ? 
        strategyData.riskRewardRatio : 2,
      notes: strategyData.notes || "",
      isDefault: strategyData.isDefault === true,
      
      // Xử lý các trường cũ, tương thích ngược
      rulesText: Array.isArray(strategyData.rulesText) ? 
        strategyData.rulesText.filter(String) : [],
      entryConditionsText: Array.isArray(strategyData.entryConditionsText) ? 
        strategyData.entryConditionsText.filter(String) : [],
      exitConditionsText: Array.isArray(strategyData.exitConditionsText) ? 
        strategyData.exitConditionsText.filter(String) : []
    };
    
    // Add updatedAt timestamp
    const updatedData = {
      ...cleanedStrategyData,
      updatedAt: serverTimestamp()
    };
    
    debug("Prepared data for Firestore update:", updatedData);
    
    await updateDoc(strategyRef, updatedData);
    
    debug(`Strategy ${strategyId} updated successfully`);
    
    return {
      id: strategyId,
      ...updatedData
    };
  } catch (error) {
    logError("Error updating strategy:", error);
    throw error;
  }
}

async function deleteStrategy(userId: string, strategyId: string) {
  try {
    const strategyRef = doc(db, "users", userId, "strategies", strategyId);
    
    // Check if strategy exists
    const strategySnap = await getDoc(strategyRef);
    if (!strategySnap.exists()) {
      throw new Error("Strategy not found");
    }
    
    // Delete the strategy
    await deleteDoc(strategyRef);
    
    debug(`Strategy ${strategyId} deleted successfully`);
    
    return true;
  } catch (error) {
    logError("Error deleting strategy:", error);
    throw error;
  }
}

async function createDefaultStrategiesIfNeeded(userId: string) {
  try {
    // Check if user already has strategies
    const existingStrategies = await getStrategies(userId);
    
    if (existingStrategies.length === 0) {
      debug("No strategies found, creating default strategies for user:", userId);
      
      // Default strategies
      const defaultStrategies = [
        {
          name: "Breakout",
          description: "Trading price breakouts from significant levels",
          // Add structured rules with proper format
          rules: [
            {
              id: "breakout-rule-1",
              label: "Wait for price to approach a key level",
              order: 0
            },
            {
              id: "breakout-rule-2",
              label: "Confirm breakout with increased volume",
              order: 1
            },
            {
              id: "breakout-rule-3",
              label: "Enter after a retest of the level",
              order: 2
            }
          ],
          // Add structured entry conditions
          entryConditions: [
            {
              id: "breakout-entry-1",
              label: "Price closes beyond key level",
              order: 0
            },
            {
              id: "breakout-entry-2",
              label: "Volume increases on breakout",
              order: 1
            },
            {
              id: "breakout-entry-3",
              label: "Momentum in breakout direction",
              order: 2
            }
          ],
          // Add structured exit conditions
          exitConditions: [
            {
              id: "breakout-exit-1",
              label: "Price reaches next significant level",
              order: 0
            },
            {
              id: "breakout-exit-2",
              label: "Price action shows reversal signs",
              order: 1
            },
            {
              id: "breakout-exit-3",
              label: "Stop loss at the opposite side of the breakout level",
              order: 2
            }
          ],
          // Legacy fields for backward compatibility
          rulesText: [
            "Wait for price to approach a key level",
            "Confirm breakout with increased volume",
            "Enter after a retest of the level"
          ],
          entryConditionsText: [
            "Price closes beyond key level",
            "Volume increases on breakout",
            "Momentum in breakout direction"
          ],
          exitConditionsText: [
            "Price reaches next significant level",
            "Price action shows reversal signs",
            "Stop loss at the opposite side of the breakout level"
          ],
          timeframes: ["H4", "D1"],
          riskRewardRatio: 2,
          isDefault: true
        },
        {
          name: "Support/Resistance",
          description: "Trading bounces from key support and resistance levels",
          // Add structured rules
          rules: [
            {
              id: "sr-rule-1",
              label: "Identify significant levels on higher timeframes",
              order: 0
            },
            {
              id: "sr-rule-2",
              label: "Wait for price reaction at the level",
              order: 1
            },
            {
              id: "sr-rule-3",
              label: "Look for confirmation patterns",
              order: 2
            }
          ],
          // Add structured entry conditions
          entryConditions: [
            {
              id: "sr-entry-1",
              label: "Price approaches level with decreasing momentum",
              order: 0
            },
            {
              id: "sr-entry-2",
              label: "Confirmation candle pattern forms at the level",
              order: 1
            },
            {
              id: "sr-entry-3",
              label: "Entry after confirmation candle closes",
              order: 2
            }
          ],
          // Add structured exit conditions
          exitConditions: [
            {
              id: "sr-exit-1",
              label: "Price reaches the next level in the direction of the trade",
              order: 0
            },
            {
              id: "sr-exit-2",
              label: "Price breaks through the entry level",
              order: 1
            },
            {
              id: "sr-exit-3",
              label: "Stop loss beyond the level with some buffer",
              order: 2
            }
          ],
          // Legacy fields for backward compatibility
          rulesText: [
            "Identify significant levels on higher timeframes",
            "Wait for price reaction at the level",
            "Look for confirmation patterns"
          ],
          entryConditionsText: [
            "Price approaches level with decreasing momentum",
            "Confirmation candle pattern forms at the level",
            "Entry after confirmation candle closes"
          ],
          exitConditionsText: [
            "Price reaches the next level in the direction of the trade",
            "Price breaks through the entry level",
            "Stop loss beyond the level with some buffer"
          ],
          timeframes: ["H1", "H4"],
          riskRewardRatio: 1.5,
          isDefault: true
        },
        {
          name: "Trend Following",
          description: "Trading in the direction of established trends",
          // Add structured rules
          rules: [
            {
              id: "trend-rule-1",
              label: "Identify trend direction on higher timeframes",
              order: 0
            },
            {
              id: "trend-rule-2",
              label: "Look for pullbacks to value areas",
              order: 1
            },
            {
              id: "trend-rule-3",
              label: "Enter in trend direction after pullback ends",
              order: 2
            }
          ],
          // Add structured entry conditions
          entryConditions: [
            {
              id: "trend-entry-1",
              label: "Price pulls back to moving average or trend line",
              order: 0
            },
            {
              id: "trend-entry-2",
              label: "Lower timeframe shows reversal in trend direction",
              order: 1
            },
            {
              id: "trend-entry-3",
              label: "Momentum indicators show oversold/overbought condition ending",
              order: 2
            }
          ],
          // Add structured exit conditions
          exitConditions: [
            {
              id: "trend-exit-1",
              label: "Price shows signs of trend exhaustion",
              order: 0
            },
            {
              id: "trend-exit-2",
              label: "Target reached based on previous swing points",
              order: 1
            },
            {
              id: "trend-exit-3",
              label: "Stop loss below/above recent swing low/high",
              order: 2
            }
          ],
          // Legacy fields for backward compatibility
          rulesText: [
            "Identify trend direction on higher timeframes",
            "Look for pullbacks to value areas",
            "Enter in trend direction after pullback ends"
          ],
          entryConditionsText: [
            "Price pulls back to moving average or trend line",
            "Lower timeframe shows reversal in trend direction",
            "Momentum indicators show oversold/overbought condition ending"
          ],
          exitConditionsText: [
            "Price shows signs of trend exhaustion",
            "Target reached based on previous swing points",
            "Stop loss below/above recent swing low/high"
          ],
          timeframes: ["H1", "H4", "D1"],
          riskRewardRatio: 2.5,
          isDefault: true
        }
      ];
      
      // Add default strategies to user's account
      for (const strategy of defaultStrategies) {
        await addStrategy(userId, strategy);
      }
      
      debug("Default strategies created successfully");
      return true;
    } else {
      debug("User already has strategies, skipping default creation");
      return false;
    }
  } catch (error) {
    logError("Error creating default strategies:", error);
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
    // Kiểm tra xem đã đăng nhập chưa
    if (!auth.currentUser) {
      throw new Error("Bạn phải đăng nhập để liên kết tài khoản");
    }
    
    const { GoogleAuthProvider, linkWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    
    // Thực hiện liên kết
    const result = await linkWithPopup(auth.currentUser, provider);
    debug(`Đã liên kết tài khoản với Google thành công: ${result.user.email}`);
    
    // Cập nhật thông tin người dùng trong Firestore nếu cần
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      linkedProviders: [
        "google",
        ...(await getLinkedProviders())
      ],
      lastUpdated: serverTimestamp()
    });
    
    return result;
  } catch (error) {
    logError("Lỗi khi liên kết tài khoản với Google:", error);
    throw error;
  }
}

/**
 * Chuyển đổi ID nhà cung cấp thành tên dễ đọc
 * @param providerId ID của nhà cung cấp (e.g., 'google.com')
 * @returns Tên hiển thị của nhà cung cấp (e.g., 'Google')
 */
function getProviderName(providerId: string): string {
  if (providerId === 'google.com') return 'Google';
  if (providerId === 'facebook.com') return 'Facebook';
  if (providerId === 'github.com') return 'GitHub';
  if (providerId === 'twitter.com') return 'Twitter';
  if (providerId === 'apple.com') return 'Apple';
  if (providerId === 'password') return 'Email/Mật khẩu';
  return providerId;
}

/**
 * Lấy danh sách các phương thức liên kết tài khoản
 */
async function getLinkedProviders(): Promise<string[]> {
  try {
    if (!auth.currentUser) return [];
    
    // Danh sách providers được lấy từ providerId trong providerData
    const providers = auth.currentUser.providerData.map(
      provider => provider.providerId.replace('.com', '')
    );
    
    // Chuyển đổi Set thành mảng để tránh lỗi TypeScript
    const uniqueProviders = Array.from(new Set(providers));
    return uniqueProviders;
  } catch (error) {
    logError("Lỗi khi lấy danh sách nhà cung cấp đã liên kết:", error);
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
    if (!auth.currentUser) {
      throw new Error("Bạn phải đăng nhập để hủy liên kết tài khoản");
    }
    
    // Kiểm tra xem có nhiều hơn 1 phương thức không - đảm bảo luôn có ít nhất một cách đăng nhập
    const providers = auth.currentUser.providerData;
    if (providers.length <= 1) {
      throw new Error("Không thể hủy liên kết phương thức đăng nhập duy nhất. Hãy thêm phương thức khác trước.");
    }
    
    const { unlink } = await import("firebase/auth");
    
    // Thực hiện hủy liên kết
    await unlink(auth.currentUser, providerId);
    
    // Cập nhật thông tin trong Firestore
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      linkedProviders: await getLinkedProviders(),
      lastUpdated: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    logError("Lỗi khi hủy liên kết nhà cung cấp:", error);
    throw error;
  }
}

// Export all functions
export {
  initFirebase,
  loginUser,
  loginWithGoogle,
  registerUser,
  logoutUser,
  getUserData,
  updateUserData,
  updateDisplayName, // Thêm mới: function cập nhật Display Name
  addTrade,
  getTrades,
  onTradesSnapshot,
  getAllTrades, // Thêm mới: function lấy tất cả giao dịch để sắp xếp trên frontend
  getPaginatedTrades, // Thêm function phân trang
  getTradeById,
  updateTrade,
  deleteTrade,
  getStorageDownloadUrl,
  uploadTradeImage,
  deleteTradeImage,
  updateAccountBalance,
  // Strategy functions
  getStrategies,
  onStrategiesSnapshot,
  getStrategyById,
  addStrategy,
  updateStrategy,
  deleteStrategy,
  createDefaultStrategiesIfNeeded,
  // Auth linking functions
  linkAccountWithGoogle,
  getLinkedProviders,
  unlinkProvider,
  getProviderName
};
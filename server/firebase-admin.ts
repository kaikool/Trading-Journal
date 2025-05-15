import admin from 'firebase-admin';

// In-memory database để thay thế Firestore
interface CollectionQuerySnapshot {
  empty: boolean;
  docs: Array<{
    id: string;
    data: () => any;
    exists: boolean;
  }>;
}

interface QueryObject {
  get: () => Promise<CollectionQuerySnapshot>;
}

interface DocumentObject {
  set: (data: any) => Promise<void>;
  get: () => Promise<{
    exists: boolean;
    data: () => any;
    id: string;
  }>;
}

interface CollectionReference {
  doc: (id: string) => DocumentObject;
  where: (field: string, operator: string, value: any) => QueryObject;
}

class MemoryFirestore {
  private collections: Map<string, Map<string, any>> = new Map();

  collection(name: string): CollectionReference {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    
    return {
      doc: (id: string) => {
        return {
          set: async (data: any) => {
            const collection = this.collections.get(name)!;
            const timestamp = new Date();
            
            // Handle tradeAnalysis debug
            if (name === 'tradeAnalysis') {
              console.log(`[MemoryDB DEBUG] Saving tradeAnalysis document with ID: ${id}`);
              console.log(`[MemoryDB DEBUG] Document data tempTradeId: ${data.tempTradeId}, tradeId: ${data.tradeId}`);
            }
            
            collection.set(id, {
              ...data,
              updatedAt: timestamp
            });
            
            console.log(`[MemoryDB] Saved document ${id} to collection ${name}`);
            return Promise.resolve();
          },
          get: async () => {
            const collection = this.collections.get(name)!;
            const data = collection.get(id);
            
            // Handle tradeAnalysis debug
            if (name === 'tradeAnalysis') {
              console.log(`[MemoryDB DEBUG] Getting tradeAnalysis document with ID: ${id}, exists: ${!!data}`);
              if (data) {
                console.log(`[MemoryDB DEBUG] Document tempTradeId: ${data.tempTradeId}, tradeId: ${data.tradeId}`);
              }
            }
            
            return {
              exists: !!data,
              data: () => data,
              id
            };
          }
        };
      },
      // Thêm phương thức where để tìm kiếm theo field = value
      where: (field: string, operator: string, value: any) => {
        if (operator !== '==') {
          console.log(`[MemoryDB] Only == operator is supported in MemoryFirestore`);
          return {
            get: async () => ({ empty: true, docs: [] })
          };
        }
        
        return {
          get: async () => {
            const collection = this.collections.get(name) || new Map();
            
            // Debug tradeAnalysis where query
            if (name === 'tradeAnalysis') {
              console.log(`[MemoryDB DEBUG] Where query on tradeAnalysis: ${field} == ${value}`);
              console.log(`[MemoryDB DEBUG] Collection size: ${collection.size}`);
              collection.forEach((data, docId) => {
                console.log(`[MemoryDB DEBUG] Document ${docId}: tempTradeId=${data.tempTradeId}, tradeId=${data.tradeId}`);
              });
            }
            
            const matchingDocs = Array.from(collection.entries())
              .filter(([_, docData]) => docData && docData[field] === value)
              .map(([docId, docData]) => ({
                id: docId,
                data: () => docData,
                exists: true
              }));
            
            console.log(`[MemoryDB] Found ${matchingDocs.length} docs in ${name} where ${field} == ${value}`);
            
            return {
              empty: matchingDocs.length === 0,
              docs: matchingDocs
            };
          }
        };
      }
    };
  }
}

// Mock Firebase Admin for non-Google Cloud environments
console.log("Initializing Firebase Admin with memory database...");

// Khởi tạo Firebase, chỉ cần biết project ID
try {
  admin.initializeApp({
    projectId: 'trading-journal-b83e9'
  });
  console.log("Firebase Admin initialized successfully with project ID");
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// Tạo các dịch vụ
const auth = {
  // Mock auth methods as needed
  verifyIdToken: async () => ({ uid: 'mock-user-id' })
};

const storage = {
  // Mock storage methods as needed
  bucket: () => ({ 
    file: () => ({ 
      save: async () => {},
      getSignedUrl: async () => ['https://example.com/mock-file']
    })
  })
};

// Tạo instance MemoryFirestore để thay thế Firestore
const db = new MemoryFirestore();

// MemoryFirestore không cần dữ liệu mẫu nữa



// Set flag to indicate initialization
const isAdminInitialized = true;

// Export các services
export { admin, auth, db, storage, isAdminInitialized };
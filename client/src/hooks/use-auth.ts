/**
 * Hook để quản lý người dùng đăng nhập
 * Thay thế các tham chiếu trực tiếp đến auth.currentUser?.uid
 */

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    userId: user?.uid || null,
    isAuthenticated: !!user,
    loading
  };
}
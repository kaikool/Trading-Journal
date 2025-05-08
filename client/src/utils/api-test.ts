/**
 * Tiện ích kiểm tra kết nối API TwelveData
 * 
 * File này cung cấp các hàm để kiểm tra kết nối với TwelveData API
 * trong cả môi trường development và production.
 */

import { getApiKey, getApiKeyFromFirebase } from '../lib/market-price-service';

/**
 * Kiểm tra cấu hình TwelveData API
 * 
 * @returns Promise với kết quả kiểm tra
 */
export async function testTwelveDataConfig() {
  console.log('=== TWELVEDATA API CONFIG TEST ===');
  
  // Kiểm tra API key từ các nguồn khác nhau
  const results = {
    localStorage: null as string | null,
    firebaseUser: null as string | null,
    windowENV: null as string | null,
    firebaseFunctionsConfig: null as string | null,
    apiCall: {
      success: false,
      data: null as any,
      error: null as string | null
    }
  };
  
  // 1. Kiểm tra localStorage
  results.localStorage = localStorage.getItem('twelvedata_api_key');
  console.log('1. API Key from localStorage:', results.localStorage ? '✓ FOUND' : '✗ NOT FOUND');
  
  // 2. Kiểm tra API key từ Firebase (nếu đã đăng nhập)
  try {
    results.firebaseUser = await getApiKeyFromFirebase();
    console.log('2. API Key from Firebase user document:', results.firebaseUser ? '✓ FOUND' : '✗ NOT FOUND');
  } catch (error) {
    console.error('Error checking Firebase user API key:', error);
  }
  
  // 3. Kiểm tra window.ENV (môi trường production)
  if (typeof window !== 'undefined' && window.ENV) {
    results.windowENV = window.ENV.TWELVEDATA_API_KEY || null;
    console.log('3. API Key from window.ENV:', results.windowENV ? '✓ FOUND' : '✗ NOT FOUND');
  } else {
    console.log('3. window.ENV not available (normal in development)');
  }
  
  // 4. Kiểm tra Firebase Functions config (định dạng 2-part key)
  if (typeof window !== 'undefined' && window.ENV?.FIREBASE_CONFIG) {
    try {
      const config = JSON.parse(window.ENV.FIREBASE_CONFIG);
      results.firebaseFunctionsConfig = config.twelvedata?.apikey || null;
      console.log('4. API Key from Firebase Functions config:', 
        results.firebaseFunctionsConfig ? '✓ FOUND' : '✗ NOT FOUND');
    } catch (error) {
      console.error('Error parsing Firebase Functions config:', error);
    }
  } else {
    console.log('4. Firebase Functions config not available (normal in development)');
  }
  
  // 5. Test API call - sử dụng bất kỳ API key nào có sẵn
  const apiKey = getApiKey(); // Lấy API key từ bất kỳ nguồn nào có sẵn
  
  if (apiKey) {
    console.log('5. Using API key for test call (hidden for security)');
    
    try {
      const response = await fetch('/api/twelvedata/price?symbol=EURUSD&format=JSON', {
        headers: { 'X-API-KEY': apiKey }
      });
      
      const data = await response.json();
      results.apiCall.data = data;
      
      if (data.code === 401) {
        results.apiCall.success = false;
        results.apiCall.error = 'API key invalid or incorrect';
        console.log('5. API Test: ✗ FAILED - API key invalid');
      } else if (data.price) {
        results.apiCall.success = true;
        console.log(`5. API Test: ✓ SUCCESS - Current EURUSD price: ${data.price}`);
      } else {
        results.apiCall.success = false;
        results.apiCall.error = 'Unknown response format';
        console.log('5. API Test: ✗ FAILED - Unexpected response format');
      }
    } catch (error) {
      results.apiCall.success = false;
      results.apiCall.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('5. API Test error:', error);
    }
  } else {
    console.log('5. No API key available for testing');
    results.apiCall.error = 'No API key available';
  }
  
  console.log('=== TEST COMPLETE ===');
  return results;
}

/**
 * Kiểm tra và hiển thị định dạng của Firebase Functions config
 */
export function checkFirebaseFunctionsConfig() {
  console.log('=== FIREBASE FUNCTIONS CONFIG CHECK ===');
  
  if (typeof window === 'undefined' || !window.ENV) {
    console.log('window.ENV not available (normal in development)');
    return null;
  }
  
  if (!window.ENV.FIREBASE_CONFIG) {
    console.log('FIREBASE_CONFIG not found in window.ENV');
    return null;
  }
  
  try {
    const config = JSON.parse(window.ENV.FIREBASE_CONFIG);
    console.log('Firebase Functions config format:', config);
    
    // Kiểm tra cấu trúc
    if (config.twelvedata?.apikey) {
      console.log('✓ Correct format found: twelvedata.apikey exists');
      return config;
    } else {
      console.log('✗ Incorrect format: twelvedata.apikey not found');
      return config;
    }
  } catch (error) {
    console.error('Error parsing FIREBASE_CONFIG:', error);
    return null;
  }
}
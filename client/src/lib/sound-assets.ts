// Base64-encoded sound effects for achievement notifications
// These are small mp3 files encoded as base64 strings to avoid needing to load external files

// Short success sound for achievement unlocked (2-3 seconds)
export const ACHIEVEMENT_UNLOCKED_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAXAAAARW5jb2RlZCBieSBTb3VuZCBHcmluZGVyVElUMgAAABcAAABBY2hpZXZlbWVudCBVbmxvY2tlZFRQRTEAAAAUAAAAQWNoaWV2ZW1lbnQgU291bmRzVEFMQgAAABQAAABBY2hpZXZlbWVudCBTb3VuZHNUWUVSAAAAAAAAAFRDT04AAAAUAAAAQWN0aW9uIEdhbWUgU291bmRzQVBJQwAAACsEAABNTklhAAAAAQAAADGkHQkFDUABwDSDJANwMkB8A+QC8UgGTAYMBhATwRkExBPSBMAg8SAAB8A0gySB8A+QC8UgGTAYMBhCCCCOCCMCOEDCBANwMkB8A0gySB8A0gySB8A+QC8UgGTAYMBhATwQQQRgQCBANwMkB8A0gySB8A+QC8UgGTAYMBhATwRkExBPSBMAg8SAAB8A0gySB8A+QC8UgGTAYMBhCCCCOCCMCOEDCBANwMkB8A0gySB8A+QC8UgGTAYMBhCCCCOCCMCOEDCMDOED8J+E9IEwCDxIAAHwDSDJIfAPkAvFIBkwGDAYQk7ITtkJuw8KCE/CfhPSBMAg8SAAB8A0gySB8A0gySB8A+QC8UgGTAYMBhCCCAOCCMAOEDCBANwMkB8A0gySB8A+QC8UgGTAYMBhATwQQQRgQCBANwMkB8A0gySB8A0gySB8A0gySHwDSDJHwDSDJHwDSDJHwDSDJHwDSDJIfAPkAvFIBkwGDAYQgggDggjADhAwgQDcDJAfA+QC8UgGTAYMBhATwQQQRgQCBANwMkB8A0gySB8A+QC8UgGTAYMBhCThJwsrCzuHSA0UJOwk4SVk5OWKgZMBlAGULKYmFwmFgngXCFmhZoWbw4fCF/ghZoWaFm8OHwhnggggjhAwgQDcDJAfANIMkgfANIMkh8A+QC8UgGTAYMBhCThJwsrCzuHSA0UJOwk4SVk5OWKgZMBlAGULKYmFwmFh8A+QC8AAAAA=";

// Longer celebratory sound for level up (3-4 seconds)
export const LEVEL_UP_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAXAAAARW5jb2RlZCBieSBTb3VuZCBHcmluZGVyVElUMgAAAA0AAABMZXZlbCBVcCAxVFBFMQAAABQAAABBY2hpZXZlbWVudCBTb3VuZHNUQUxCAAAAFAAAAEFjaGlldmVtZW50IFNvdW5kc1RZRVIAAAAAAAAAVENPVAAAABQAAABBY3Rpb24gR2FtZSBTb3VuZHNBUElDAAAAhAUAAE1OSWEAAAABAAAAMaQdCQUTQAHANIMkA3AyQHwD5ALxSAZMBgwGEJOEnCysLO4dIDRQk7CThJWTk5YqBkwGUAZQspiYXCYWCMKqYvFA+Kj4s4jjCxMJEwUMBQwFDAWMTLwwviy+KJwgnCCcIJxMnCE4QJhAmEiIWKhpOHL40vCk4GTgZOBk4GTEA8QQSQSQYQQRwQSQSQQSQSJCRMCJhRMKJhUMLB4UEiQkTCZMJkws/iyeKJ4oniieIJwgnCAcIBwgHCAcIB4s/iyeDJ4MniicKN447jkuOS45LjkuOSxJKEkoSShJKEkoSChIKEgqSCpIKEgoSChIKEgoSChIKEgoSChIKEgoSCpIKkgqSCpIKkgqSCpIKkgqSChIKEgoSChIKEgoSChIKEgoSCpIKkgqSCpIKsxEmECYQJhIiFioaThy+NLwpOBk4GTgZOBkxAPEEEkEkGEEEcEEkEkEEkEiQkTAiYUTCiYVDCweFBIkJEwmTCZMLPxAPEEEkEkGEEEcA3AyQHwDSDJIHwDSDJIfAPkAvFIBQwIDA+KOIo4JMk5SSJJEgCSBJIEkgCSBJFEkgSSBJIEkgSFBFUgVXBVkgyQJIkISTJAliWWJpYiliKWIpYilUKVQpVClUKVQpVClUKVQpVCpoKmgqaCkgKSApICkgKSApICkgKSQpJCkkKSQpJCkkKSQpJCkkKSApICkgKSApICkgKSApICpIKkgqSCpIKkgqSCpIOkh6SHpIekhqSGpIakh6SHpICgCKDIokigyKHInciVyJXIlfiaMJo4mjiaMJo4mjiZuJm4mbiZuJm4mbiZuBmwGbDZsNmw2LDYsNUw1TDVMLUwtTCVMNUyFTPPE86DjgOOAhUCFQIVAhUCFQGogaqBqoGqgaqBqoBqgGqAaoChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSChIKEgoSCBIIEggSCBIIIggiCCIIIggiCCIIIggiCCIIIggiCCIJugm6CboJuhGpEakRqSGpIakCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQIpAikCKQApACkAKQApAClAKUApQClAKUApQClAKQApACkCKQIpAhkCGQIZAhkCGQIZAhkCGQIpAikCGQIZAhkCGQIZAikCGQIZAhkCGQIZAhkCGQIpAikCKQIVAhUCFQIVAhUCFQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZAhkCGQIZBHACMEkcA3AyQHwDSDJIHwDSDJIfAPkAvGIBmwGrAaMJqQSaCSGCCCBIIEBIfAPkAvAAAAA=";

/**
 * Play a sound effect with specified volume
 * @param soundBase64 - Base64 encoded sound data
 * @param volume - Volume level (0.0 to 1.0)
 * @returns Promise that resolves when sound is played
 */
export function playSound(soundBase64: string, volume: number = 0.5): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(soundBase64);
      audio.volume = Math.min(1.0, Math.max(0.0, volume)); // Clamp volume between 0 and 1
      
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (error) => {
        console.warn('Error playing sound:', error);
        reject(error);
      };
      
      // Play sound
      audio.play().catch(error => {
        console.warn('Error playing sound:', error);
        reject(error);
      });
    } catch (error) {
      console.warn('Error creating audio element:', error);
      reject(error);
    }
  });
}
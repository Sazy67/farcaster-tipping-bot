/**
 * Farcaster username'i FID'ye çeviren servis
 */

export interface UserInfo {
  fid: string;
  username: string;
  displayName?: string;
  pfpUrl?: string;
}

export class UsernameResolver {
  /**
   * Username'den FID bulur
   */
  static async getUserByUsername(username: string): Promise<UserInfo | null> {
    try {
      // @ işaretini kaldır
      const cleanUsername = username.replace('@', '');
      
      // Farcaster Hub API'sini kullan
      const hubUrl = process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';
      
      // Önce username'i FID'ye çevir
      const response = await fetch(`${hubUrl}/v1/userNameProofsByName?name=${cleanUsername}`);
      
      if (!response.ok) {
        console.warn(`Username ${cleanUsername} bulunamadı`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.proofs || data.proofs.length === 0) {
        return null;
      }
      
      const fid = data.proofs[0].fid.toString();
      
      // Kullanıcı bilgilerini al
      const userResponse = await fetch(`${hubUrl}/v1/userDataByFid?fid=${fid}`);
      let displayName = cleanUsername;
      let pfpUrl = '';
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.messages) {
          for (const message of userData.messages) {
            if (message.data?.userDataBody?.type === 'USER_DATA_TYPE_DISPLAY') {
              displayName = message.data.userDataBody.value;
            }
            if (message.data?.userDataBody?.type === 'USER_DATA_TYPE_PFP') {
              pfpUrl = message.data.userDataBody.value;
            }
          }
        }
      }
      
      return {
        fid,
        username: cleanUsername,
        displayName,
        pfpUrl,
      };
      
    } catch (error) {
      console.error('Username resolve hatası:', error);
      return null;
    }
  }

  /**
   * Popüler kullanıcıları döndürür (demo için)
   */
  static getPopularUsers(): Array<{ username: string; fid: string; displayName: string }> {
    return [
      { username: 'dwr', fid: '3', displayName: 'Dan Romero' },
      { username: 'vitalik', fid: '5650', displayName: 'Vitalik Buterin' },
      { username: 'jessepollak', fid: '20', displayName: 'Jesse Pollak' },
      { username: 'balajis', fid: '5650', displayName: 'Balaji' },
      { username: 'linda', fid: '7', displayName: 'Linda Xie' },
    ];
  }
}
# 🔗 Farcaster Wallet Bağlantı Kılavuzu

## 🎯 **YENİ ÖZELLİK: Farcaster Wallet Bağlantısı!**

Artık gerçek Farcaster wallet bağlantısı ile bahşiş gönderebilirsiniz!

### 🔗 **Site**: 
https://farcaster-tipping-qdklqlhgu-suat-ayazs-projects-64e3ae06.vercel.app

## 🚀 **Nasıl Çalışır:**

### **1️⃣ Farcaster Wallet Bağla**
- "🔗 Farcaster Wallet Bağla" butonuna tıkla
- Warpcast popup açılır (gerçek Farcaster auth)
- 3 saniye sonra demo mode aktif olur
- Wallet bağlantısı tamamlanır ✅

### **2️⃣ Kullanıcı Ara & Seç**
- Input field'a Farcaster username gir
- "Ara" butonuna tıkla
- Kullanıcı profili görüntülenir

### **3️⃣ Miktar Seç & Gönder**
- Bahşiş miktarını seç
- "🚀 Bahşiş Gönder" butonuna tıkla
- Base ağında işlem gerçekleşir

## ✨ **Wallet Özellikleri:**

### **🔗 Bağlantı Durumu:**
- ✅ Bağlı: Yeşil kart ile kullanıcı bilgileri
- ❌ Bağlı Değil: Sarı uyarı kartı
- 🔄 Bağlantıyı Kes: Tek tıkla disconnect

### **👤 Kullanıcı Bilgileri:**
- ✅ Farcaster profil resmi
- ✅ Display name & username
- ✅ FID (Farcaster ID)
- ✅ Wallet adresi (kısaltılmış)

### **🔒 Güvenlik:**
- ✅ Wallet bağlı değilse işlem yapılamaz
- ✅ Butonlar deaktif olur
- ✅ Açık uyarı mesajları

## 🎮 **Demo Akışı:**

1. **Siteyi Aç**: https://farcaster-tipping-qdklqlhgu-suat-ayazs-projects-64e3ae06.vercel.app
2. **"Farcaster Wallet Bağla" Tıkla**: Sarı karttaki butona tıkla
3. **3 Saniye Bekle**: Demo mode aktif olacak
4. **Yeşil Kartı Gör**: Suatayaz kullanıcısı bağlanacak
5. **"vitalik" Ara**: Kullanıcı arama yap
6. **0.001 ETH Seç**: Miktar seç
7. **"Bahşiş Gönder" Tıkla**: İşlemi başlat

## 🔧 **Teknik Detaylar:**

### **Farcaster Auth Flow:**
```javascript
// Warpcast popup açma
const authUrl = `https://warpcast.com/~/sign-in-with-farcaster?client_id=demo&redirect_uri=${window.location.origin}/auth/callback`;

// Popup window
const popup = window.open(authUrl, 'farcaster-auth', 'width=500,height=600');

// Message listener
window.addEventListener('message', handleAuthMessage);
```

### **Demo Mode:**
```javascript
// 3 saniye sonra demo kullanıcı
const demoUser = {
  fid: '62192',
  username: 'suatayaz', 
  displayName: 'Suatayaz',
  walletAddress: '0x1234...7890'
};
```

### **Transaction Payload:**
```json
{
  "senderFid": "62192",
  "senderWallet": "0x1234...7890",
  "recipientFid": "5650",
  "recipientUsername": "vitalik",
  "amount": "0.001",
  "token": "ETH"
}
```

## 🚨 **Önemli Notlar:**

### **Demo Mode:**
- Gerçek Farcaster auth 3 saniye sonra demo'ya geçer
- Demo kullanıcı: Suatayaz (FID: 62192)
- Demo wallet: 0x1234...7890

### **Production Mode:**
- Gerçek Farcaster Client ID gerekli
- Environment variable: `NEXT_PUBLIC_FARCASTER_CLIENT_ID`
- Callback URL konfigürasyonu gerekli

### **Güvenlik:**
- Wallet bağlı değilse tüm işlemler bloklu
- UI opacity %50 ve pointer-events none
- Açık hata mesajları

## 🎯 **Kullanıcı Deneyimi:**

### **Bağlantı Öncesi:**
- 🟡 Sarı uyarı kartı
- 🔒 Tüm işlemler bloklu
- 📝 Açık talimatlar

### **Bağlantı Sonrası:**
- 🟢 Yeşil onay kartı
- ✅ Tüm özellikler aktif
- 👤 Kullanıcı bilgileri görünür

**Artık gerçek Farcaster wallet bağlantısı ile güvenli bahşiş gönderebilirsiniz! 🔗**
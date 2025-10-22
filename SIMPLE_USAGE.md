# 🎯 Basit Bahşiş Sistemi - Kullanım Kılavuzu

## 🚀 **YENİ BASİT ARAYÜZ!**

Artık çok daha basit! Sadece 3 adım:

### 📱 **Ana Sayfa**: 
https://farcaster-tipping-a4958f23u-suat-ayazs-projects-64e3ae06.vercel.app

## 🎯 **Nasıl Kullanılır:**

### **1️⃣ Kullanıcı Seç**
- Dan Romero (@dwr)
- Vitalik Buterin (@vitalik) 
- Jesse Pollak (@jessepollak)

### **2️⃣ Miktar Seç**
- 0.001 ETH 💰
- 0.005 ETH 💎  
- 0.01 ETH 🚀
- Özel Miktar ✏️ (0.001-0.1 ETH arası)

### **3️⃣ Gönder**
- "🚀 Bahşiş Gönder" butonuna tık
- Wallet bağlantısı otomatik
- Base ağında anında işlem
- %20 platform ücreti otomatik kesilir

## ✅ **Özellikler:**

- ✅ **Tek Sayfa**: Karmaşık menü yok
- ✅ **3 Adım**: Seç, seç, gönder
- ✅ **Görsel Butonlar**: Kolay seçim
- ✅ **Canlı Özet**: Ne göndereceğini gör
- ✅ **Hata Yönetimi**: Açık hata mesajları
- ✅ **Başarı Bildirimi**: TX hash ile onay

## 🔧 **Teknik Detaylar:**

### **API Endpoint:**
```
POST /api/transactions
{
  "recipientFid": "3",
  "recipientUsername": "dwr", 
  "amount": "0.001",
  "token": "ETH"
}
```

### **Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.001",
  "recipient": "dwr"
}
```

## 🎮 **Demo Flow:**

1. **Siteyi Aç**: https://farcaster-tipping-a4958f23u-suat-ayazs-projects-64e3ae06.vercel.app
2. **Dan Romero'yu Seç**: İlk kullanıcı kartına tıkla
3. **0.001 ETH Seç**: İlk miktar butonuna tıkla  
4. **Gönder**: Mavi butona tıkla
5. **Sonuç**: Başarı mesajını gör

## 🚨 **Önemli:**

- **Wallet Gerekli**: MetaMask veya uyumlu wallet
- **Base Network**: Ethereum L2 ağı
- **Minimum**: 0.001 ETH
- **Maximum**: 0.1 ETH
- **Platform Ücreti**: %20 (otomatik)

## 📱 **Mobil Uyumlu:**

- ✅ Responsive tasarım
- ✅ Touch-friendly butonlar
- ✅ Mobil wallet desteği
- ✅ PWA özellikli

**Artık çok basit! Kullanıcı seç, miktar seç, gönder! 🎯**
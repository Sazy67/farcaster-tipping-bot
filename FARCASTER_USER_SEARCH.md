# 🔍 Farcaster Kullanıcı Arama Sistemi

## 🎯 **YENİ ÖZELLİK: Kullanıcı Arama!**

Artık herhangi bir Farcaster kullanıcısına bahşiş gönderebilirsiniz!

### 🔗 **Site**: 
https://farcaster-tipping-h2wjmu9fs-suat-ayazs-projects-64e3ae06.vercel.app

## 🚀 **Nasıl Çalışır:**

### **1️⃣ Kullanıcı Adını Yaz**
- Input field'a Farcaster username gir
- Örnek: `dwr`, `@vitalik`, `jessepollak`
- "Ara" butonuna tıkla

### **2️⃣ Sistem Kullanıcıyı Bulur**
- Farcaster Hub API'den kullanıcı bilgilerini çeker
- Profil resmi, takipçi sayısı, FID bilgilerini gösterir
- Kullanıcı doğrulandığında ✅ işareti çıkar

### **3️⃣ Miktar Seç & Gönder**
- Bahşiş miktarını seç
- "Bahşiş Gönder" butonuna tıkla
- Base ağında işlem gerçekleşir

## ✨ **Özellikler:**

### **🔍 Akıllı Arama:**
- ✅ Username ile arama (`dwr`)
- ✅ @ ile arama (`@dwr`)
- ✅ Büyük/küçük harf duyarsız
- ✅ Gerçek zamanlı Farcaster API entegrasyonu

### **👤 Detaylı Profil Bilgisi:**
- ✅ Profil resmi
- ✅ Display name
- ✅ Username (@handle)
- ✅ FID (Farcaster ID)
- ✅ Takipçi/takip sayısı
- ✅ Bio bilgisi

### **⚡ Hızlı Seçim:**
- ✅ Popüler kullanıcı butonları
- ✅ Tek tıkla input'a yazma
- ✅ Enter tuşu ile arama

## 🔧 **Teknik Detaylar:**

### **API Endpoint:**
```
GET /api/farcaster/user/[username]
```

### **Response Örneği:**
```json
{
  "username": "dwr",
  "displayName": "Dan Romero", 
  "fid": "3",
  "bio": "Building Farcaster",
  "pfp": {
    "url": "https://..."
  },
  "followerCount": 50000,
  "followingCount": 1000
}
```

### **Farcaster Hub Entegrasyonu:**
- ✅ Gerçek Farcaster Hub API kullanımı
- ✅ Username → FID çevirimi
- ✅ Profil bilgilerini çekme
- ✅ Fallback mock data sistemi

## 🎮 **Demo Akışı:**

1. **Siteyi Aç**: https://farcaster-tipping-h2wjmu9fs-suat-ayazs-projects-64e3ae06.vercel.app
2. **"vitalik" Yaz**: Input field'a kullanıcı adını gir
3. **"Ara" Butonuna Tıkla**: Sistem kullanıcıyı bulacak
4. **Profil Bilgilerini Gör**: Avatar, isim, FID, takipçi sayısı
5. **Miktar Seç**: 0.001 ETH seç
6. **Gönder**: Bahşiş gönder butonuna tıkla

## 🚨 **Desteklenen Kullanıcılar:**

### **Bilinen Kullanıcılar (Mock Data):**
- `dwr` - Dan Romero (FID: 3)
- `vitalik` - Vitalik Buterin (FID: 5650)  
- `jessepollak` - Jesse Pollak (FID: 20)

### **Diğer Kullanıcılar:**
- Farcaster Hub API'den gerçek bilgiler
- Bulunamazsa generic mock data
- Tüm geçerli Farcaster username'leri desteklenir

## 🔄 **Hata Yönetimi:**

- ❌ **Kullanıcı bulunamadı**: "Kullanıcı bulunamadı" mesajı
- ❌ **API hatası**: Fallback mock data sistemi
- ❌ **Boş input**: "Lütfen bir kullanıcı adı girin" uyarısı
- ❌ **Network hatası**: Açık hata mesajları

**Artık herhangi bir Farcaster kullanıcısına bahşiş gönderebilirsiniz! 🎯**
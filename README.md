# 💰 Farcaster Tipping Bot

Base blockchain üzerinde güvenli, hızlı ve kolay bahşiş gönderme sistemi. Farcaster frame'leri ile entegre.

## 🚀 **Özellikler**

- ✅ **Farcaster Entegrasyonu**: Native Farcaster frame desteği
- ✅ **Base Network**: Ethereum L2 üzerinde hızlı işlemler
- ✅ **Wallet Connect**: Gerçek Farcaster API key entegrasyonu
- ✅ **Kullanıcı Arama**: Herhangi bir Farcaster kullanıcısına bahşiş
- ✅ **Güvenli İşlemler**: %20 platform ücreti ile sürdürülebilir sistem
- ✅ **Mobil Uyumlu**: Responsive tasarım ve PWA desteği

## 🔗 **Demo**

**Live Site**: https://farcaster-tipping-9xlcgff27-suat-ayazs-projects-64e3ae06.vercel.app

### **Hızlı Test:**
1. Siteyi aç
2. "Farcaster Wallet Bağla" (5 saniye demo mode)
3. "vitalik" kullanıcısını ara
4. "0.001 ETH" seç
5. "Bahşiş Gönder" tıkla

## 🛠️ **Teknoloji Stack**

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Blockchain**: Wagmi, Viem, Base Network
- **Database**: Prisma, PostgreSQL
- **Cache**: Redis
- **Authentication**: Farcaster Auth Kit, WalletConnect
- **Deployment**: Vercel

## 📦 **Kurulum**

### **1. Repository Clone**
```bash
git clone https://github.com/your-username/farcaster-tipping-bot.git
cd farcaster-tipping-bot
```

### **2. Dependencies**
```bash
npm install
```

### **3. Environment Variables**
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```bash
# Farcaster API Key
NEXT_PUBLIC_FARCASTER_WC_PROJECT_ID="wc_secret_e9e013890648fa50208e33fedab2f3c15ca762e44df543c7fd3bd5d8_68eb8feb"

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Database (opsiyonel)
DATABASE_URL="postgresql://..."

# Redis (opsiyonel)
REDIS_URL="redis://localhost:6379"
```

### **4. Development**
```bash
npm run dev
```

Site: http://localhost:3000

## 🎯 **Kullanım**

### **Basit Bahşiş Gönderme:**
1. **Wallet Bağla**: Farcaster authentication
2. **Kullanıcı Ara**: Herhangi bir Farcaster username
3. **Miktar Seç**: 0.001, 0.005, 0.01 ETH veya özel miktar
4. **Gönder**: Base ağında anında işlem

### **Frame URL Oluşturma:**
```
https://your-domain.com/api/frames/tip/username/vitalik
```

Farcaster'da paylaş:
```
Harika analiz! 📊
Beğendiyseniz bahşiş gönderebilirsiniz:
https://your-domain.com/api/frames/tip/username/vitalik
```

## 🔧 **API Endpoints**

### **Farcaster Integration**
- `GET /api/farcaster/user/[username]` - Kullanıcı arama
- `GET /.well-known/farcaster.json` - Farcaster manifest

### **Transactions**
- `POST /api/transactions` - Bahşiş gönderme
- `GET /api/transactions/history` - İşlem geçmişi
- `GET /api/transactions/[id]` - İşlem detayı

### **Frames**
- `GET /api/frames/tip/[fid]` - FID ile bahşiş frame'i
- `GET /api/frames/tip/username/[username]` - Username ile bahşiş frame'i
- `POST /api/frame-actions` - Frame action handler

### **System**
- `GET /api/health` - Sistem durumu
- `GET /api/manifest` - PWA manifest

## 🎨 **Frame Özellikleri**

### **Meta Tags:**
- ✅ `fc:frame: vNext`
- ✅ `fc:frame:image`
- ✅ `fc:frame:button:1-4`
- ✅ `fc:frame:post_url`
- ✅ Open Graph support

### **Button Actions:**
- 💰 0.001 ETH
- 💎 0.005 ETH  
- 🚀 0.01 ETH
- ✏️ Özel Miktar

## 🔒 **Güvenlik**

- ✅ **Rate Limiting**: 10 req/min per user
- ✅ **Input Validation**: Zod schema validation
- ✅ **Audit Logging**: Tüm işlemler loglanır
- ✅ **Error Handling**: Comprehensive error management
- ✅ **CORS Protection**: API endpoint security

## 📊 **Monitoring**

### **Health Check:**
```bash
curl "https://your-domain.com/api/health"
```

### **System Metrics:**
- Memory usage
- Database latency
- Transaction statistics
- Error rates

## 🚀 **Deployment**

### **Vercel Deployment:**
```bash
npm run build
npm run deploy
```

### **Environment Setup:**
1. Vercel Dashboard → Environment Variables
2. `NEXT_PUBLIC_FARCASTER_WC_PROJECT_ID` ekle
3. `NEXT_PUBLIC_BASE_URL` production URL ile güncelle
4. **Deployment Protection'ı kapat** (Farcaster frame'ler için)

## 📱 **PWA Features**

- ✅ **Manifest**: `/manifest.json`
- ✅ **Icons**: Tüm boyutlar (72x72 - 512x512)
- ✅ **Shortcuts**: Hızlı bahşiş, frame oluştur
- ✅ **Protocol Handlers**: `web+farcaster://`

## 🧪 **Testing**

### **Unit Tests:**
```bash
npm test
```

### **Integration Tests:**
```bash
npm run test:coverage
```

### **Frame Validation:**
```bash
curl "https://your-domain.com/api/validate-frame?url=[frame_url]"
```

## 📚 **Dokümantasyon**

- `FARCASTER_MANIFEST.md` - Farcaster entegrasyon detayları
- `WALLET_CONNECTION_GUIDE.md` - Wallet bağlantı kılavuzu
- `FARCASTER_USER_SEARCH.md` - Kullanıcı arama sistemi
- `TRANSACTION_FIX.md` - Transaction API düzeltmeleri

## 🤝 **Katkıda Bulunma**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

MIT License - detaylar için `LICENSE` dosyasına bakın.

## 🙏 **Teşekkürler**

- [Farcaster](https://farcaster.xyz) - Protocol ve API
- [Base](https://base.org) - Ethereum L2 network
- [Vercel](https://vercel.com) - Deployment platform
- [Next.js](https://nextjs.org) - React framework

## 📞 **Destek**

- GitHub Issues: Sorun bildirimi
- Documentation: Detaylı kılavuzlar
- Community: Farcaster developer community

---

**Farcaster ekosistemi için ❤️ ile yapıldı**
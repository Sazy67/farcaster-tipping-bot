# Farcaster Manifest ve Frame Konfigürasyonu

Bu dokümanda Farcaster Tipping Bot'un Farcaster ekosistemi ile entegrasyonu için gerekli manifest ve konfigürasyon detayları yer almaktadır.

## 🎯 Farcaster Frame Özellikleri

### ✅ Tamamlanan Özellikler

1. **Manifest Dosyası** (`/public/manifest.json`)
   - PWA uyumlu manifest
   - Farcaster özel alanları
   - Protocol handlers
   - Shortcuts ve icons

2. **Dinamik Manifest API** (`/api/manifest`)
   - Runtime'da oluşturulan manifest
   - Environment-aware URL'ler
   - Farcaster özel metadata

3. **Frame Meta Generator** (`/src/lib/farcaster/meta-generator.ts`)
   - Dinamik frame meta tagları
   - Bahşiş, hata ve başarı frame'leri
   - Next.js Metadata API uyumlu

4. **Frame Validator** (`/src/lib/farcaster/frame-validator.ts`)
   - Frame request validation
   - Response generation
   - Error handling

5. **Test Sayfaları**
   - `/test-frame` - Frame test sayfası
   - `/api/validate-frame` - Frame doğrulama API'si

## 🔧 Konfigürasyon

### Environment Variables

```bash
# Temel URL (production'da değiştirilmeli)
NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"

# Farcaster Hub
FARCASTER_HUB_URL="https://hub.farcaster.xyz"

# Developer FID
NEXT_PUBLIC_FARCASTER_DEVELOPER_FID="your_fid_here"
```

### Vercel Deployment

1. **Deployment Protection Kapatma**
   - Vercel Dashboard > Project Settings > Deployment Protection
   - "Off" olarak ayarlayın (Farcaster frame'lerin erişebilmesi için)

2. **Environment Variables Ayarlama**
   - `NEXT_PUBLIC_BASE_URL` production URL'si ile güncelleyin
   - Diğer gerekli environment variable'ları ekleyin

## 📱 Farcaster Frame Kullanımı

### Frame URL Formatları

1. **FID ile Bahşiş Frame'i**
   ```
   https://your-domain.com/api/frames/tip/[fid]
   ```

2. **Username ile Bahşiş Frame'i**
   ```
   https://your-domain.com/api/frames/tip/username/[username]
   ```

### Frame Meta Tags

Sistem otomatik olarak şu meta tagları oluşturur:

```html
<!-- Temel Frame Tags -->
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="[image_url]" />
<meta property="fc:frame:image:aspect_ratio" content="1.91:1" />

<!-- Butonlar -->
<meta property="fc:frame:button:1" content="0.001 ETH 💰" />
<meta property="fc:frame:button:1:action" content="post" />

<!-- Post URL -->
<meta property="fc:frame:post_url" content="[post_url]" />

<!-- Open Graph -->
<meta property="og:image" content="[image_url]" />
<meta property="og:title" content="[title]" />
```

## 🧪 Test Etme

### 1. Local Test

```bash
# Development server başlat
npm run dev

# Frame validator test et
curl "http://localhost:3000/api/validate-frame?url=http://localhost:3000/test-frame"

# Manifest test et
curl "http://localhost:3000/api/manifest"
```

### 2. Production Test

```bash
# Frame URL oluştur (ana sayfada)
https://your-domain.com/

# Test frame sayfası
https://your-domain.com/test-frame

# Frame validator
https://your-domain.com/api/validate-frame?url=[frame_url]
```

### 3. Farcaster Client Test

1. **Warpcast'te Test**
   - Frame URL'sini bir cast'te paylaş
   - Frame'in düzgün görüntülendiğini kontrol et
   - Butonlara tıklayarak etkileşimi test et

2. **Supercast'te Test**
   - Aynı URL'yi Supercast'te test et
   - Cross-platform uyumluluğu kontrol et

## 🔍 Debugging

### Frame Görüntülenmiyorsa

1. **Meta Tags Kontrolü**
   ```bash
   curl -s "https://your-domain.com/api/frames/tip/username/dwr" | grep "fc:frame"
   ```

2. **Image URL Kontrolü**
   - Frame image URL'sinin erişilebilir olduğunu kontrol edin
   - CORS ayarlarını kontrol edin

3. **Post URL Kontrolü**
   - Frame action endpoint'inin çalıştığını kontrol edin
   - Request/response formatını kontrol edin

### Yaygın Sorunlar

1. **CORS Hatası**
   - `vercel.json`'da CORS headers eklenmiş
   - API route'larda CORS middleware kullanın

2. **Image Loading Hatası**
   - Image generation endpoint'ini kontrol edin
   - Image boyutlarının doğru olduğunu kontrol edin

3. **Button Action Hatası**
   - Frame action handler'ını kontrol edin
   - Request validation'ını kontrol edin

## 📚 Farcaster Frame Spesifikasyonu

Bu implementasyon Farcaster Frame v2 spesifikasyonuna uygun olarak geliştirilmiştir:

- **Frame Version**: vNext
- **Image Aspect Ratio**: 1.91:1 (varsayılan)
- **Max Buttons**: 4
- **Button Actions**: post, post_redirect, link, mint
- **Input Support**: Evet (text input)
- **State Management**: JSON state support

## 🚀 Deployment Checklist

- [ ] Environment variables ayarlandı
- [ ] Deployment protection kapatıldı
- [ ] Frame URLs test edildi
- [ ] Meta tags doğrulandı
- [ ] Farcaster client'larda test edildi
- [ ] Error handling test edildi
- [ ] Performance test edildi

## 📞 Destek

Sorun yaşarsanız:

1. GitHub Issues'da sorun bildirin
2. Logs'ları kontrol edin (`vercel logs`)
3. Frame validator ile URL'leri test edin
4. Farcaster developer community'sine danışın
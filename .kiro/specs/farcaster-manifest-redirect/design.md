# Tasarım Belgesi

## Genel Bakış

Bu tasarım, /.well-known/farcaster.json endpoint'ine gelen istekleri Farcaster Hosted Manifest URL'sine 307 (Geçici Yönlendirme) durum kodu ile yönlendiren bir sistem tanımlar. Mevcut Next.js uygulamasında hem Next.js yapılandırması hem de Vercel yapılandırması kullanılarak çift katmanlı bir yaklaşım benimsenecektir.

## Mimari

### Mevcut Durum Analizi
- Vercel.json dosyasında zaten /.well-known/farcaster.json için rewrite yapılandırması mevcut
- Bu rewrite şu anda /api/well-known/farcaster endpoint'ine yönlendiriyor
- Mevcut yapılandırma headers ve cache ayarları içeriyor

### Hedef Mimari
```
İstemci İsteği → Vercel Edge → Next.js Redirect → Farcaster Hosted Manifest
     ↓              ↓              ↓                    ↓
/.well-known/   Vercel.json    next.config.ts      External API
farcaster.json   redirects      redirects           Response
```

## Bileşenler ve Arayüzler

### 1. Vercel Yapılandırması (vercel.json)
**Amaç**: Vercel seviyesinde yönlendirme yapılandırması
**Değişiklikler**:
- Mevcut rewrite yapılandırmasını redirect yapılandırmasına dönüştür
- 307 durum kodunu belirt
- Cache ve header ayarlarını koru

### 2. Next.js Yapılandırması (next.config.ts)
**Amaç**: Uygulama seviyesinde yedek yönlendirme
**Değişiklikler**:
- redirects fonksiyonu ekle
- 307 geçici yönlendirme yapılandır
- Hedef URL'yi tanımla

### 3. API Route (Opsiyonel Yedek)
**Amaç**: Programatik yönlendirme kontrolü
**Konum**: src/app/api/well-known/farcaster/route.ts
**İşlev**: Manuel yönlendirme yanıtı döndür

## Veri Modelleri

### Yönlendirme Yapılandırması
```typescript
interface RedirectConfig {
  source: string;           // "/.well-known/farcaster.json"
  destination: string;      // Farcaster Hosted Manifest URL
  statusCode: number;       // 307
  permanent: boolean;       // false (geçici yönlendirme)
}
```

### HTTP Yanıt Modeli
```typescript
interface RedirectResponse {
  statusCode: 307;
  headers: {
    Location: string;       // Hedef URL
    'Cache-Control': string;
    'Access-Control-Allow-Origin': string;
  }
}
```

## Uygulama Stratejisi

### Yaklaşım 1: Vercel Redirects (Önerilen)
- Vercel.json dosyasında redirects bölümü kullan
- En hızlı yanıt süresi (edge seviyesinde)
- Minimum kaynak kullanımı

### Yaklaşım 2: Next.js Redirects (Yedek)
- next.config.ts dosyasında redirects yapılandırması
- Uygulama seviyesinde kontrol
- Daha esnek yapılandırma seçenekleri

### Yaklaşım 3: API Route (Son Çare)
- Programatik yönlendirme kontrolü
- En yavaş ama en esnek yaklaşım
- Özel mantık ekleme imkanı

## Hata Yönetimi

### Hata Senaryoları
1. **Geçersiz Hedef URL**: Yapılandırma hatası durumunda 500 yanıtı
2. **Ağ Bağlantı Sorunu**: Yönlendirme yine de gerçekleşir (307 yanıtı)
3. **Yapılandırma Eksikliği**: Fallback API route devreye girer

### Hata Yanıtları
```typescript
// Yapılandırma hatası
{
  statusCode: 500,
  error: "Redirect configuration error"
}

// Normal yönlendirme (hedef erişilemez olsa bile)
{
  statusCode: 307,
  headers: { Location: "target-url" }
}
```

## Test Stratejisi

### Birim Testleri
- Yönlendirme yapılandırmasının doğruluğu
- HTTP durum kodlarının kontrolü
- Header değerlerinin doğrulanması

### Entegrasyon Testleri
- End-to-end yönlendirme akışı
- Farklı HTTP metodları için test
- Cache davranışının kontrolü

### Manuel Test Senaryoları
1. `curl -I /.well-known/farcaster.json` - 307 yanıtı kontrolü
2. Tarayıcıda yönlendirme takibi
3. Development ve production ortamlarında test

## Performans Gereksinimleri

### Yanıt Süresi
- Hedef: < 500ms (gereksinim belgesinde belirtildiği gibi)
- Vercel edge redirects ile ~50-100ms beklenir
- Next.js redirects ile ~100-200ms beklenir

### Cache Stratejisi
- `Cache-Control: public, max-age=3600` (1 saat)
- Edge seviyesinde cache
- CDN optimizasyonu

## Güvenlik Değerlendirmesi

### CORS Yapılandırması
- `Access-Control-Allow-Origin: *` (mevcut yapılandırma korunur)
- Farcaster protokolü gereksinimleri ile uyumlu

### URL Doğrulama
- Hedef URL'nin https protokolü kullanması
- Farcaster domain'inin doğrulanması

## Deployment Stratejisi

### Aşamalı Dağıtım
1. **Aşama 1**: Vercel.json güncellemesi
2. **Aşama 2**: Next.js config yedek yapılandırması
3. **Aşama 3**: Test ve doğrulama
4. **Aşama 4**: Production deployment

### Rollback Planı
- Mevcut rewrite yapılandırmasına geri dönüş
- API route ile manuel yönlendirme
- Monitoring ve alerting
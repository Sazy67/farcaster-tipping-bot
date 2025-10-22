# GitHub Repository Setup Guide

## Adım 1: GitHub'da Repository Oluştur

1. GitHub.com'a git
2. Sağ üst köşedeki "+" butonuna tıkla
3. "New repository" seç
4. Repository adı: `farcaster-tipping-bot`
5. Description: `A Next.js 15 Farcaster tipping bot with TypeScript, wallet integration, and frame support`
6. Public olarak ayarla
7. README, .gitignore veya license ekleme (zaten var)
8. "Create repository" butonuna tıkla

## Adım 2: Local Repository'yi GitHub'a Bağla

Repository oluşturduktan sonra GitHub'ın verdiği URL'yi kullan:

```bash
git remote add origin https://github.com/KULLANICI_ADIN/farcaster-tipping-bot.git
git branch -M main
git push -u origin main
```

## Adım 3: Alternatif SSH Yöntemi

SSH key'in varsa:

```bash
git remote add origin git@github.com:KULLANICI_ADIN/farcaster-tipping-bot.git
git branch -M main
git push -u origin main
```

## Proje Özellikleri

✅ **Tam Farcaster Entegrasyonu**
- WalletConnect API key ile gerçek entegrasyon
- Kullanıcı arama ve profil görüntüleme
- Frame desteği ve validasyon

✅ **Tipping Sistemi**
- ETH tipping ile 4 farklı miktar seçeneği
- %20 platform ücreti simülasyonu
- Transaction geçmişi ve dashboard

✅ **Güvenlik Özellikleri**
- Rate limiting
- Input validation
- Audit logging

✅ **PWA Desteği**
- Manifest.json
- Service worker hazır
- Responsive tasarım

✅ **Deployment Hazır**
- Vercel konfigürasyonu
- Environment variables
- Docker desteği

## Dosya Yapısı

- `src/app/` - Next.js 15 app router
- `src/components/` - React bileşenleri
- `src/lib/` - Utility fonksiyonları
- `src/api/` - API endpoints
- `public/` - Static dosyalar
- Kapsamlı dokümantasyon dosyaları
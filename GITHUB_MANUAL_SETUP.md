# GitHub Repository Manuel Kurulum

## Adım 1: GitHub'da Repository Oluştur

1. https://github.com/new adresine git
2. Repository name: `farcaster-tipping-bot`
3. Description: `A Next.js 15 Farcaster tipping bot with TypeScript, wallet integration, and frame support`
4. Public seç
5. **Initialize this repository with** seçeneklerini BOŞTA BIRAK (README, .gitignore, license ekleme)
6. "Create repository" butonuna tıkla

## Adım 2: Local'den Push Yap

Repository oluşturduktan sonra aşağıdaki komutları çalıştır:

```bash
cd farcaster-tipping-bot
git push -u origin main
```

## Mevcut Durum

✅ Local repository hazır
✅ Tüm dosyalar commit edildi
✅ Remote origin eklendi: https://github.com/zaroyunu/farcaster-tipping-bot.git
✅ Branch main olarak ayarlandı

Sadece GitHub'da repository oluşturup push yapman gerekiyor!

## Alternatif: GitHub CLI ile

Eğer GitHub CLI çalışmazsa, web interface kullan:
1. github.com/new
2. Repository adı: farcaster-tipping-bot
3. Public
4. Boş repository oluştur
5. `git push -u origin main` komutunu çalıştır
# 🎯 Farcaster Bahşiş Botu - Kullanım Kılavuzu

## 📋 Sistem Nasıl Çalışır?

Bu sistem **Farcaster Frame** teknolojisi kullanarak çalışır. Kullanıcılar Farcaster postlarında interaktif butonlar görür ve tıklayarak bahşiş gönderebilir.

## 🚀 Hızlı Başlangıç

### 1. Frame URL'si Oluşturma

Bahşiş frame'i oluşturmak için iki yöntem var:

#### A) FID ile (Farcaster ID)
```
https://your-domain.com/api/frames/tip/12345
```

#### B) Kullanıcı Adı ile
```
https://your-domain.com/api/frames/tip/username/dwr
https://your-domain.com/api/frames/tip/username/vitalik
```

### 2. Farcaster'da Kullanım

**Adım 1:** Farcaster'da post oluştururken frame URL'sini ekleyin:
```
Harika bir analiz! 📊
Beğendiyseniz bahşiş gönderebilirsiniz:
https://your-domain.com/api/frames/tip/username/dwr
```

**Adım 2:** Post yayınlandığında kullanıcılar şu butonları görür:
- [0.001 ETH] [0.01 ETH] [0.05 ETH] [Özel Miktar]

**Adım 3:** Kullanıcılar butona tıklayıp cüzdanlarıyla onaylayarak bahşiş gönderir.

## 💰 Gelir Modeli

Her bahşişten **%20 platform ücreti** alınır:

| Bahşiş Miktarı | Platform Payı | Alıcı Payı |
|----------------|---------------|-------------|
| 0.1 ETH        | 0.02 ETH      | 0.08 ETH    |
| 0.01 ETH       | 0.002 ETH     | 0.008 ETH   |
| 0.001 ETH      | 0.0002 ETH    | 0.0008 ETH  |

## 🔍 FID Nasıl Bulunur?

### Yöntem 1: Farcaster Profil URL'sinden
```
https://warpcast.com/dwr
```
Bu URL'deki "dwr" kullanıcı adını kullanın.

### Yöntem 2: Popüler Kullanıcılar
- `dwr` (Dan Romero - Farcaster kurucusu)
- `vitalik` (Vitalik Buterin)
- `jessepollak` (Jesse Pollak - Base)

## 📱 Gerçek Kullanım Örnekleri

### Örnek 1: İçerik Yaratıcısı
```
Yeni NFT koleksiyonum çıktı! 🎨
Desteklemek isterseniz:
https://your-domain.com/api/frames/tip/username/sanatci123
```

### Örnek 2: Analiz Paylaşımı
```
Bitcoin analizi: Yükseliş devam edecek 📈
Faydalı bulduysanız bahşiş gönderebilirsiniz:
https://your-domain.com/api/frames/tip/username/analist
```

### Örnek 3: Topluluk Etkinliği
```
Harika bir AMA gerçekleştirdik! 
@vitalik'e teşekkür edelim:
https://your-domain.com/api/frames/tip/username/vitalik
```

## 🛠️ Teknik Detaylar

### Frame Özellikleri
- ⚡ **Hızlı**: Base L2 ile saniyeler içinde işlem
- 🔒 **Güvenli**: Wallet entegrasyonu ve imza doğrulama
- 📊 **Takip Edilebilir**: Tüm işlemler blockchain'de kayıtlı
- 🔔 **Bildirimli**: Real-time bildirim sistemi

### Desteklenen Tokenlar
- **ETH** (Ethereum)
- **USDC** (USD Coin) - Yakında

### Minimum/Maksimum Limitler
- **Minimum**: 0.001 ETH
- **Maksimum**: 0.1 ETH (güvenlik için)

## 📈 İstatistikler ve Takip

### Kontrol Paneli
`https://your-domain.com/dashboard` adresinden:
- Toplam kazanç
- İşlem geçmişi
- Aylık istatistikler
- Kullanıcı aktivitesi

### Sistem Durumu
`https://your-domain.com/api/health` adresinden sistem sağlığını kontrol edin.

## 🎯 Pazarlama Stratejileri

### 1. İçerik Yaratıcıları İçin
- Farcaster'da düzenli içerik paylaşın
- Her postun sonuna bahşiş frame'i ekleyin
- Takipçilerinizi bahşiş göndermeye teşvik edin

### 2. Topluluk Liderleri İçin
- AMA etkinliklerinde konuşmacılara bahşiş frame'i ekleyin
- Değerli katkı sağlayan üyeleri ödüllendirin
- Topluluk etkinliklerinde bahşiş yarışmaları düzenleyin

### 3. Analistler İçin
- Piyasa analizlerinizin sonuna frame ekleyin
- Doğru tahminleriniz için bahşiş toplayın
- Premium içerik için bahşiş sistemi kullanın

## 🔧 Sorun Giderme

### Frame Görünmüyor
- URL'nin doğru olduğundan emin olun
- Farcaster cache'ini temizleyin
- Farklı Farcaster client'ı deneyin

### İşlem Başarısız
- Wallet'ta yeterli ETH olduğundan emin olun
- Gas ücretleri için ekstra ETH bulundurun
- Base ağına bağlı olduğunuzu kontrol edin

### Bahşiş Ulaşmıyor
- İşlem hash'ini blockchain explorer'da kontrol edin
- 1-2 dakika bekleyin (ağ yoğunluğu)
- Alıcının doğru FID'sine gönderildiğini doğrulayın

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Sistem durumunu kontrol edin: `/api/health`
2. İşlem geçmişinizi inceleyin: `/dashboard`
3. Blockchain explorer'da işlemi arayın

---

**🚀 Başarılı bahşiş gönderme deneyimi için bu kılavuzu takip edin!**
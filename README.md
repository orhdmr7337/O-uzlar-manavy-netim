# Oğuzlar Fiş — Masaüstü Fiş / Teklif Yazdırma Programı

Windows için masaüstü uygulaması. Manav satış fişi, teklif ve termal rulo fiş keser, yazdırır ve PDF olarak kaydeder.
Fiş tasarımı program içinden tamamen özelleştirilebilir.

## 📥 İndir ve çalıştır

**[Son sürümü indir → Releases](../../releases/latest)**

| Dosya | Açıklama |
|---|---|
| `OguzlarFis-Tasinabilir.exe` | Kurulum yok — çift tıkla, çalışsın. |
| `OguzlarFis-Kurulum.exe` | Bilgisayara kurar, masaüstüne kısayol koyar. |

> Windows SmartScreen "bilinmeyen yayıncı" derse: **Ek bilgi → Yine de çalıştır**.

EXE dosyaları her `push` sonrası GitHub Actions tarafından Windows üzerinde otomatik derlenir
(`.github/workflows/build-windows.yml`).

## Ekranlar

| Ekran | Ne yapar |
|---|---|
| **Yeni Fiş** (F1) | Çizimdeki düzen: sol üstte *belge no / alıcı şirket* butonu (tıklayınca popup), ortada şirket adı ve logo, sağ üstte tarih–saat–gün. Ürün / Kilosu yada Birimi / Fiyat / Tutar tablosu. Sağ altta toplam tutar, iskonto, **KDV oranı seçimi** ve **genel toplam**. Sağda tek tıkla eklenen ürün kartları. |
| **Fiş Geçmişi** (F3) | Kayıtlı fişler, günlük/aylık ciro, arama, tarih filtresi, tekrar yazdır, PDF, düzenle, kopyala, sil. |
| **Ürünler** | Kod, ad, birim (kg/adet/kasa/bağ…), fiyat, KDV; satış ekranında kart olarak gösterme ve sıralama. |
| **Müşteriler** | Alıcı firmalar: yetkili, telefon, adres, vergi dairesi/no; müşteriye göre fiş sayısı ve toplam. |
| **Fiş Tasarımı** | Canlı önizlemeli tasarımcı (aşağıda). |
| **Ayarlar** | Şirket bilgileri ve logo, yazıcı seçimi ve hızlı (diyalogsuz) yazdırma, KDV oranları ve dahil/hariç, belge numarası, birimler, yedek alma/geri yükleme. |

### Kısayollar
`F1` yeni fiş · `F2` ürün arama · `F3` geçmiş · `F8` kaydet · `F9` kaydet ve yazdır · `Esc` pencereyi kapat

## 🎨 Fiş tasarımı (tam özelleştirme)

- **3 hazır şablon:** Manav Fişi (verilen çizim), Teklif/Fatura (Excel örneği), Termal rulo (80/58 mm)
- **Kağıt:** A4, A5, 80 mm, 58 mm · kenar boşluğu · en az satır sayısı · tabloyu sayfa sonuna uzatma
- **Görünen alanlar:** logo, şirket adı/adres/telefon, belge no/türü, müşteri ve detayları, tarih, saat, gün, geçerlilik, KDV, açıklama, imza alanları, alt yazı…
- **Sütunlar:** No, Kod, Ürün, Miktar, Fiyat, KDV, Tutar — göster/gizle, başlık metni, genişlik, sıra
- **Tüm yazılar:** "Genel Toplam", "Teklif No", "Müşteri Onayı" vb. her etiket değiştirilebilir
- **Renk ve yazı:** yazı tipi, boyut, vurgu/başlık/tablo/toplam renkleri, çizgi kalınlığı, köşe yuvarlaklığı, logo boyutu
- **Kayıtlı tasarımlar:** birden çok tasarımı isimle kaydet/yükle, dosyaya aktar
- **Özel CSS:** ileri düzey kullanıcılar için

## Geliştirici

```bash
npm install
npm start          # uygulamayı aç
npm run dist       # Windows EXE üret (Windows üzerinde)
npm run icon       # build/icon.png ikonunu yeniden üret
```

Veriler `%APPDATA%/Oğuzlar Fiş/veri.json` dosyasında saklanır.

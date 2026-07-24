# ShuttleX Enterprise Suite v5.0 — Kapsamlı Mimari, Yazılım Geliştirme ve Operasyonel Şartname Dokümanı

> **Doküman Sürümü:** v5.0 Master Specifications (v4.0 ve v4.1 Sistem Eklentileri Entegre Edilmiş Nihai Sürüm)
> **Hedef Kitle:** Kıdemli Yazılım Mimarları, Backend/Frontend/Mobil Mühendisleri, Veri Mühendisleri, DevSecOps ve Ürün Yöneticileri
> **Platform Tanımı:** Küresel ölçekte, çoklu dil ve para birimi destekli, ultra-premium, multi-tenant (çoklu kurumsal yalıtımlı), yapay zeka, yönlendirilmiş graf (Directed Graph) rota budama destekli, ses asistanı ve QR/NFC özellikli tamamen otonom servis otomasyon ekosistemi.

---

## 1. Genel Bakış ve Mimari Felsefe

ShuttleX Enterprise Suite; okullar, şirketler ve lojistik filoları için geliştirilmiş; makine öğrenimi ile öngörüsel rota optimizasyonu yapan, mikro saniyeler düzeyinde canlı telemetri takibi, katı kurallara dayalı kurumsal mesajlaşma mimarisi ve entegre ödeme/finans katmanı sunan premium bir yazılım platformudur.

### 1.1. Sürüm Evrimi ve v4.1 Hibrit Rota Budama Felsefesi
* **v4.0 Çekirdeği:** Olay güdümlü mikroservisler, gRPC telemetri toplama, OCR/VLM (Görsel Zeka) ile dokümandan akıllı adres çıkarımı ve tam otonom yapay zekalı rota oluşturma.
* **v4.1 Şoför Otoritesine Bağlı Manuel Budama (Sürücü Merkezli Yaklaşım):** Yalnızca otonom sistemlerde velinin devamsızlık bildiriminin (Bazen yanlışlıkla) şoförden habersiz rotayı değiştirmesi sahada ciddi sorunlar yaratmıştır. V5.0 ile otomasyon körü körüne kararlar almak yerine, **Operasyonel Güvenlik ve Şoför Denetimine** geçmiştir:
  1. **Rotanın Sabit Kalması (Preserved Sequence):** Veli "Çocuğum okula gelmeyecek" tuşuna bastığında, durak **harita grafiğinden (Directed Graph) doğrudan SİLİNMEZ**, durak sırası (Sequence Number) korunur.
  2. **Görsel Uyarı Katmanı:** İlgili durağın üzerine gerçek zamanlı yanıp sönen dikkat çekici turuncu/kırmızı bir **Ünlem Rozeti (Alert Badge)** yerleştirilir.
  3. **Şoförün Tekelinde Rota Kesinleştirme (`EXECUTE_PRUNE`):** Durağı tamamen rota dışına çıkarma veya atlama yetkisi sadece Şoför HUD (Head-Up Display) ekranına ve Sesli Asistana (Voice AI) bağlanmıştır. Şoför durağı atladığı an sistem arkadaki duraklar için yeni ETA matrisini (450 ms içinde) yeniden hesaplar.

---

## 2. Dağıtık Mikroservis Mimarisi, Ağ Topolojisi ve Veri Boru Hattı

Sistem, monolitik yapıdan arındırılmış; ölçeklenebilirliği (Scalability) ve hata toleransını (Fault Tolerance) maksimuma çıkaran, sıfır kesinti ve yüksek trafikli olay güdümlü (Event-Driven) Kubernetes (K8s) mimarisinde çalışır.

### 2.1. Ağ ve Servis Topolojisi

```text
                               ┌────────────────────────────────────────────────────────┐
                               │       Akamai / Cloudflare (WAF, DDoS, CDN)             │
                               └────────────────────────┬───────────────────────────────┘
                                                        │
                      ┌─────────────────────────────────┼─────────────────────────────────┐
                      │    Kong API Gateway (Rate Limiting, JWT Auth, TLS 1.3 Term.)      │
                      └─────────────────────────────────┬─────────────────────────────────┘
                                                        │
         ┌───────────────────────┬──────────────────────┼───────────────────────┬───────────────────────┐
         ▼                       ▼                      ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Telemetry       │     │ Identity & RBAC │    │ Predictive      │     │ Notification &  │     │ Document &      │
│ Ingestion (Go)  │     │ Service (Java)  │    │ Routing (Py/C++)│     │ Comm. (Node.js) │     │ Voice AI (Py)   │
└────────┬────────┘     └────────┬────────┘    └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                      │                       │                       │
         ▼                       ▼                      ▼                       ▼                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                Apache Kafka Event Bus (Log-based Streaming Bus)                               │
│ Topics: delivery.telemetry.live | attendance.events | voice.intents | chat.msgs | billing.events | push.notifications  │
└───────────────────────────────────────────────┬───────────────────────────────────────────────────────────────┘
                                                │
         ┌───────────────────────┬──────────────┴───────┬───────────────────────┬───────────────────────┐
         ▼                       ▼                      ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Redis Cluster   │     │ PostgreSQL (16) │    │ TimescaleDB     │     │ MongoDB         │     │ ElasticSearch   │
│ (TTL 60s Buffer)│     │ PostGIS Spatial │    │ (Telemetry Logs)│     │ (Chat Archives) │     │ (Audit Logs)    │
└─────────────────┘     └─────────────────┘    └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2. Veri Boru Hattı (Data Pipeline) 
Araçtan (Donanım veya Şoför Cihazı) çıkan veri, `Telemetry Ingestion Service` tarafından gRPC protokolü üzerinden yakalanır. Doğrulanıp `Apache Kafka (Topic: delivery.telemetry.live)` tüneline fırlatılır. Bu hattan beslenen asenkron hai iki ana tüketici (Consumer) vardır:
1. **WebSocket Tüketicileri (Node.js):** Veriyi gecikmesiz olarak Admin, Planlayıcı ve Velilerin ekranlarına canlı çizer.
2. **Kalıcı Log Tüketicileri (Go):** Veritabanı diski şişmesini (I/O Darboğazı) engellemek için GPS verilerini toplu halde ve hızlıca TimescaleDB ve ElasticSearch (Hukuki Audit log) içerisine kaydeder.

---

## 3. Ekran Rolleri (UI/UX) ve İstemci Mimari Mimarisi

Kullanıcı ergonomisi ve görev kısıtları için 4 farklı arayüz stratejisi uygulanmaktadır.

### 3.1. Rol Yetki Matrisi ve Haberleşme

Sistem **Tam Kapalı Devre** (Closed-Loop) çalışır:

| Rol | İzleme & Görünüm Katmanı (Canlı Takip) | Etkileşim ve Haberleşme Çerçevesi |
| :--- | :--- | :--- |
| **Sistem Admini** | Küresel harita. Tüm kurumlar ve araçlar görünür. Kriz anında devamsızlık durakları sarı halkalarla işaretlenir. | Sınırsız iletişim sınırları, genel push duyuru yetkisi. |
| **Planlayıcı** | Yalnızca kendi şirketine/kuruluna ait, havadan izleme radar ekranı. Rota iptallerinde durak şeffaf griye döner. | Şoför, Öğretmen ve Velilerle iki yönlü iletişim. Ancak rota düğümünü şoför basana kadar fiziksel silemez. |
| **Servis Şoförü** | **(HUD EKRANI)** Yüksek kontrastlı Dark Mode, Sadece kendi rotası. Uyarılar devasa ünlem (!) logolu. | Veliyle serbest WhatsApp yazışması **YAPAMAZ**. Sadece SOS veya Sistem onay komutu tetikler. |
| **Öğretmen** | Sadece sınıf öğrencileri ve o araçların ETA'sını izler. | Öğrencinin velisi veya sistem Planlayıcısı ile kriptolu yazışabilir. |
| **Veli** | Çocuğun bindiği aracın canlı radarı (metre/dakika bazlı ETA). | "Servis İptal" butonu ve planlayıcıya not kısmı. Diğer öğrenci evlerini haritada asla göremez. |

### 3.2. E2E Şifreli (Kriptografik) Mesajlaşma Mimarisi
Hiyerarşik (Planlayıcı-Veli, Planlayıcı-Öğretmen) tüm sohbet odaları uçtan uca şifrelidir. Veriler MongoDB'ye ham şekilde yazılmaz.
* Anahtar Değişimi: `ECDH` (Elliptic Curve Diffie-Hellman P-256).
* Taşıma Şifreleme: `AES-256-GCM` algoritması.

---

## 4. Yapay Zeka Rota Optimizasyon (VRPTW) ve Akıllı Budama Çekirdeği (v4.1 Algoritması)

ShuttleX, statik harita hesaplamalarının ötesine geçerek makine öğrenimi tabanlı kararlar matrisi (Directed Graph) sunar. Makro düzeyde trafik tahmini (LSTM tabanlı model) yapan Google OR-Tools destekli bir rota motoru çalıştırır. 

### 4.1. Hiyerarşik Dağıtık Akış Yönetimi (Durak İptal Süreci)
1. **Olay Tetikleme:** Veli `"Çocuğum Bugün Servise Binmeyecek"` butonuna bastığı an, `attendance.absence_flagged` olayı üretilir.
2. **Dağıtım (Broadcast):** Kafka üzerinden bu durum Admin ve Planlayıcı WebSocket odalarına fırlatılır. Şoför HUD Ekranında saniyeler içinde **Turuncu Renkli Bir Ünlem Kartı (⚠)** parlar.
3. **Şoför Kesin Aksiyonu:** Sürücü ekrandaki ünleme basar ve `"Bu Durağı Atla"` seçeneğini veya **Sesli Asistan** ile "ShuttleX Durağı Atla" diyerek onay verir. (`Event: route.node_pruned`).
4. **Asenkron Yeniden Hesaplama:** Yapay zeka makinesi ilgili koordinat düğümünü graf üzerinden kalıcı olarak budar ve kalan duraklar için optimize edilmiş (Google Distance Matrix ve LSTM destekli) ETA (beklenen varış süresi) ve navigasyon dizilimini **450 milisaniye (0.45sn) içinde yeniden üretir**. 

---

## 5. Çevrimdışı Sürüş Koruma (Offline-First) ve Geofence Doğrulaması

Sinyal kopmalarına, şehir kanyonları ve kırsal bölge bağlantısızlığına (Network Disconnect Mode) karşı endüstri standardında savunma.

### 5.1. Eylemsizlik Seyrüseferi (Dead-Reckoning) ve Veri Kurtarma (FIFO Buffering)
* İnternet kesilirse: Mobil cihaz, GPS ve Bekleme Kronometresi loglarını AES-256 şifrelemeyle anlık kendi yerel belleğine (SQLite) kaydeder.
* Şoförün haritadaki tahmini konumu cihazın ivmeölçer (Accelerometer) ve jiroskop (Gyroscope) verilerinden hareketle (Vektörel vektör) ekranda yürütülmeye devam eder, böylece donma veya navigasyon kopması yaşanmaz.
* **Network Reconnect:** Çevrimiçi olunduğunda kuyruktaki yüzlerce paket FIFO mantığıyla sıkıştırılarak (Gzip blob) backend'e fırlatılır; sunucu TimescaleDB üzerinden zamanları onarır, boşlukları enterpolasyon ile tamamlar.

### 5.2. Zaman Bazlı Coğrafi Çit (Temporal Geofence)
Kuş uçuşu yarıçap kullanımı tamamen iptal edilmiştir.
Sistemin veliye "Servis Yaklaştı" sinyalini (Push Notification) iletmesi için uzaklık ölçümü yerine canlı trafik kullanılır. Aracın hızı ve yolun yoğunluk endeksi hesaplanarak (Distance / Canlı Hız = ETA), durağa (hedefe) varış **5 dakikanın (300 saniye/zaman penceresinin) altına indiği (Temporal Geofence tetiklendiği) an veliye FCM/APNS üzerinden "Aracınız yaklaştı" uyarısı gider**.

---

## 6. Kurumsal Yönetim, Finans ve Gelişmiş Çoklu Plan (Multi-Tenant)

### 6.1. Finans, Abone ve Çift Yönlü Katı Sistem
* **Iyzico / Stripe Recurring (Abonelik):** Mobil veli uygulamasında kredi kartı saklama ve okula/servisçi firmasına (Alt-işyeri paylaşımlı) aidat sistemi.
* **Biniş, QR & NFC Lock (Çocuk Unutma Emniyeti):** Biniş ve İniş logları (Şoför paneline temas - NFC Hash) üzerinden karşılaştırılır."Sabah araca binen toplam çocuk ile akşam binen çocuk sayısı aynı mı?" Eğer eşleşmezse Şoför arayüzü Kilit (Kırmızı Alert) alır.

### 6.2. Araç Envanteri ve Günlük Takvim Çarpanı
* Araç marka, model yılı, total yolcu kapasitesi ve trafik/sigorta vize bitiş tarihi tutulur. 19 koltuklu araçta 20. öğrenci planlama ekranından atanamaz (Yapay zeka kırmızı hata verir).
* **Günlük Vardiya Takvimi:** Aracın atıl durmasını önlemek için bir araç aynı günde (07.00 Anaokulu, 12.00 Fabrika gibi) çoklu vardiyada (Shift) yapılandırılır (Kurumsal kârlılığı maksimize eder). Veriler katı **Row-Level Security (RLS)** ile kurumsal olarak ayrıştırılmıştır. (Tenant A kurulu, Tenant B'nin işlerini/veritabanını katiyen çekemez).

---

## 7. PostgreSQL 16 + PostGIS Veri Tabanı Şemaları 

```sql
-- 1. Kurumlar (Tenants)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    country_code VARCHAR(5) DEFAULT 'TR',
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Çok Rollerli Kullanıcı ve RBAC Tablosu
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'PLANNER', 'DRIVER', 'TEACHER', 'PARENT')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Araç Envanteri ve Gelişmiş Kapasite/Sigorta Takibi
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50),
    model_year INT,
    total_capacity INT NOT NULL,
    insurance_expiry_date DATE NOT NULL,
    inspection_expiry_date DATE NOT NULL, -- Vize tarihi (Araç muayene)
    is_operational BOOLEAN DEFAULT TRUE
);

-- 4. Araç-Şoför Atama ve Zaman Çarpanı (Çoklu Plan Tablosu)
CREATE TABLE vehicle_driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES users(id),
    shift_start TIME,  -- Vardiya Başı Örn: 06:30
    shift_end TIME,    -- Vardiya Sonu Örn: 08:30
    active_days INT[], -- [1,2,3,4,5] (Pzt-Cuma Günler Listesi)
    valid_until DATE
);

-- 5. Öğrenciler ve NFC Hash Biniş Kontrolü
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    school_number VARCHAR(50),
    qr_nfc_code VARCHAR(255) UNIQUE, -- Şifrelenmiş Biniş/İniş Kodu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Dağıtık Rotalar (Master)
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    route_name VARCHAR(100) NOT NULL,
    schedule_type VARCHAR(30) DEFAULT 'MORNING_PICKUP',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Rota Durak Düğümleri PostGIS & v4.1 Budama Bayraklı Tablosu
CREATE TABLE route_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    stop_sequence_number INT NOT NULL,
    geo_location GEOMETRY(Point, 4326) NOT NULL,
    node_status VARCHAR(30) DEFAULT 'ACTIVE',
    
    -- V4.1 Veli Alert / Budama Kontrol Alanları
    parent_absence_reported BOOLEAN DEFAULT FALSE,
    absence_note VARCHAR(255) DEFAULT NULL,
    driver_acknowledgment_status VARCHAR(30) DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, MARKED_WITH_WARNING, EXPLICITLY_SKIPPED_BY_DRIVER
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PostgreSQL İndeksleri
CREATE INDEX idx_route_nodes_geo ON route_nodes USING GIST(geo_location);
CREATE INDEX idx_route_nodes_tenant ON route_nodes(tenant_id);
CREATE INDEX idx_route_nodes_absence ON route_nodes(parent_absence_reported) WHERE parent_absence_reported = TRUE;

-- 8. Sohbet Odaları ve Yoklama Audit / Trace Tabloları
CREATE TABLE chat_rooms (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID REFERENCES tenants(id),
     room_type VARCHAR(30), -- E2E İçin Oda Kimliği
     participant_ids UUID[],
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    node_id UUID REFERENCES route_nodes(id) ON DELETE CASCADE,
    scan_type VARCHAR(20) CHECK (scan_type IN ('BOARDED', 'ALIGHTED', 'NO_SHOW', 'MANUAL_DRIVER_SKIP')),
    scan_method VARCHAR(20) CHECK (scan_method IN ('QR_CODE', 'NFC_CARD', 'DRIVER_HUD_TAP', 'VOICE_COMMAND')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row-Level Security (RLS) Donanım Seviyesi İzole Başlatıcısı (Sızıntı Önleyici)
ALTER TABLE route_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON route_nodes
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

---

## 8. Tam API Kontratları (REST & gRPC Protobufs)

### 8.1. Hiyerarşik Veli İptal ve Sürücü Budama (POST Akışları)
Veli sadece "İşaret (Flag)" atar, Budama komutunu Sürücü (Driver-Prune) çalıştırır.

#### A. Veli İptal Bayrağı Koyma İşlemi Uç Noktası
```json
// POST `/api/v5/routes/node/flag-absence`
{
  "tenant_id": "e301-...",
  "route_id": "route_uuid",
  "node_id": "node_uuid",
  "student_id": "student_uuid",
  "absence_reason": "Çocuğum rahatsız (Opsiyonel)",
  "action_type": "FLAG_WARNING_ONLY" // Rotadan silmez, Şoföre işaret atar.
}
```

#### B. Şoför Budama (Execution) Uç Noktası
```json
// POST `/api/v5/routes/node/driver-prune`
{
  "tenant_id": "e301...",
  "route_id": "route_uuid",
  "node_id": "node_uuid",
  "driver_id": "driver_uuid",
  "action": "EXECUTE_PRUNE", // Gerçekten graf düğümü haritadan budanır
  "timestamp": 1784878200
}
```

### 8.2. Filo (Çoklu Araç) Rota Optimizasyon Uç Noktası
Yapay zekaya (Google OR-Tools VRPTW'ye) birden fazla aracı yollayıp görev paylaştırma ve Traffic Aware çizimi.

```json
// POST `/api/v5/routes/multi-optimize`
{
  "tenant_id": "uid...",
  "optimization_timestamp": 1784875038,
  "config": {
    "algorithm_type": "GENETIC_TRAFFIC_AWARE",
    "avoid_highways": false,
    "waiting_buffer_seconds": 120
  },
  "fleet": [
    {
      "vehicle_id": "uuid88...",
      "max_capacity": 19,
      "shift_start_time": "06:30",
      "shift_end_time": "08:30",
      "start_coordinates": { "lat": 40.2216, "lng": 28.9612 }
    }
  ],
  "associated_student_nodes": ["node_1", "node_2", "node_3"],
  "blacklisted_node_ids": ["veli_iptal_eden_node_4"]
}
```

### 8.3. Go (Golang) Telemetry gRPC Protobuf
Canlı (Saniyede binlerce istek) telemetri akıtmak için kullanılan performans tamponu.

```protobuf
syntax = "proto3";
package shuttlex.telemetry.v1;

service TelemetryService {
  rpc StreamTelemetry (stream TelemetryFrame) returns (TelemetryAck);
}

message TelemetryFrame {
  string tenant_id = 1;
  string vehicle_id = 2;
  double latitude = 3;
  double longitude = 4;
  float speed_kmh = 5;
  int64 timestamp_utc = 6;
  bool is_offline_buffered = 7;
}

message TelemetryAck {
  bool success = 1;
  int64 processed_frames_count = 2;
}
```

---

## 9. Akıllı Doküman (Vision-Language OCR/VLM ) ve Sanal Sesli Asistan (Voice AI & NLP)

Sektör standartlarını premium bir yapay zeka deneyimine çeken 2 çekirdek teknoloji modülü.

### 9.1. Planlayıcı İçin Fotoğraftan Saniyede Rota (Document AI) 
* **Dosya Girişi:** JPEG, PNG (El yazısı kağıtları, WhatsApp ekran görüntüleri), PDF veya CSV.
* **NER İstihbaratı ve Çıkarım:** Planlayıcı, fotoğrafı arayüzdeki `"Dosyadan / Görüntüden Yükle"` kısmına sürüklediğinde, Vision AI (Geniş / Görsel Dil Modeli) metindeki logistik verileri (Sokak, kapı no) cımbızla çeker. 
* **C. Akıllı Kodlama (Geocoding-Fallback):** Eğer adreste sadece "Cumhuriyet Mah. No:1" gibi eksik bilgi varsa sistem kurumsal bölge bilgisini alır Google Geocoding API ile bağdaştırıp Enlem / Boylama (4326 Geo Location) çevirir. Onay ekranında "Doğrulama Bekleyen (Olası 2 konum)" olarak sunar.

`POST /api/v5/routes/ingest-document` servisi bulut deposunda (S3/GCS) resim dosyasını yapay zeka analizine sunar anında imha eder.

### 9.2. Şoför Eller Serbest (Hands-Free) Çift Yönlü Dinamik Asistan Modülü
Aracın tüm kontrollerini Ses (TTS - STT) motorlarına bağlar:
1. **TTS (Yolcu Durak Asistanı):** Şebeke veya Radyo/Bluetooth cihazı üzerinden sistem yandığında bağırır. ("Sıradaki Durak: Eymen Altunel. 300 Metre kaldı").
2. **STT ve Intent Recognition (Algılama):** Şoför düğmelere dokunmak yerine ekrana "ShuttleX (Uyandırma kelimesi), kaza yaptık sistem bildirimi yap, veya Eymen gelmedi atla" der. Voice Intent arayüzü, komutu NLP üzerinden yorumlayıp doğrudan mikroservisteki `EXECUTE_PRUNE` veya `SOS_ALERT` modülünü çalıştırır. (Ham ses blob kaydı saniyeler içinde Kafka `voice.intents` modülünden işleme girer).
3. **Veli / Öğretmen Siri Asistanı Entegrasyonu:** Veli App'a hiç girmeden "Hey Siri, ShuttleX'e çocuğumun servise binmeyeceğini bildir" komutunu verebilir. Bu direkt V4.1 Uyarı (Turuncu rozet) API'sine istek yollar.

---

## 10. Hukuki Denetim, Audit Log (İzlenebilirlik) ve KVKK Süreçleri

### 10.1. Yasal Bekleme Trace/Audit Örneği ve Hak İddiası Logu (ElasticSearch)
Milisaniyelik adli tıp logları (Geriye yönelik inceleme) şikayet davaları için izole bir Elasticsearch tablosunda tutulur.

| Zaman (UTC) | Servis / Modül | Sistem Audit Log (Değiştirilemez / Immutable) | GPS ve Telemetri Kanıtı |
| :--- | :--- | :--- | :--- |
| `07:12:01` | Geofence Broker | Araç Durak sınırına girdi. | 40.2231 N, 28.9645 E \| Hız: 12 km/s |
| `07:12:15` | Driver HUD App | Şoför "Vardım" komutu verdi. Veli cihazına push iletildi. | 40.2231 N, 28.9645 E \| Hız: 0 km/s |
| `07:14:15` | Core Logic | **(KURAL) 2 dakikalık yasal bekleme hak edişi doldu.** Çocuk gelmedi işaretlendi. Log kilitlendi. | 40.2232 N, 28.9645 E \| Hız: 0 km/s |
| `07:14:22` | Routing Motoru | Sürücü "Atla" Budama işlemini mühürledi. Node "SKIPPED". | 40.2235 N, 28.9648 E \| Hız: 24 km/s |

### 10.2. Madde 17 (KVKK / GDPR: Unutulma Hakkı) 
Sistem tasarımı gereğince, bir şirket / veli sistemden ayrılır ise, PII (Kişisel ve Biyometrik / İsim-Soyisim) alanları `anonymized_user_id` üzerinden tam kriptolanır; fakat devasa araç operasyon metrikleri (Telemetri makine öğrenimi antrenman veri havuzu) yasal olarak anonim bir istatistik olarak veritabanında kalır.

---

## 11. Kubernetes (K8s) Cluster, CI/CD Dağılımı ve Güvenilirlik Altyapısı (DevOps)

ShuttleX global ölçeklenebilirlik, sıfır gecikme ve kusursuz uptime regülasyonları için "Container (Kapsayıcı) Native" tasarlanmıştır.

### 11.1. CI/CD Sürekli Entegrasyon & Gözlemlenebilirlik (Observability) 
1. **GitHub/GitLab Actions Pipeline:** Unit ve Integration Testleri -> SonarQube Q-Gate -> Docker (Distroless imajları) İnşaası -> Elastic Container Registry (ECR).
2. **Cluster Orkestrasyonu (ArgoCD):** EKS/GKE cluster'larına Canary Releases (Kademeli geçiş) üzerinden otomatik deploy fırlatma.
3. **Gözlem ve İz (Monitoring):** 
   - **Prometheus & Grafana:** Kafka consumer delay süresi, API Hata Payları, Gecikme metrikleri 7/24 görsel dashboard'larda izlenir.
   - **Jaeger veya OpenTelemetry (Distributed Tracing):** Tüketicinin mobil uygulamasından çıkıp, API, Veritabanı ve Mesaj kuyruğunda dönen çok katmanlı bir verinin "hangi Node'da takıldığı" Spans'lar halinde görüntülenir.

### 11.2. Kubernetes Auto-Scaling (HPA) ve Deployment Spesifikasyon örneği
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telemetry-ingestion-deployment
  namespace: shuttlex-core
spec:
  replicas: 5 # Min 5 pod
  selector:
    matchLabels:
      app: telemetry-ingestion
  template:
    metadata:
      labels:
        app: telemetry-ingestion
    spec:
      containers:
      - name: telemetry-go
        image: shuttlex/telemetry-service:v5.0.0
        ports:
        - containerPort: 50051 # gRPC bağlantı noktası
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        env:
        - name: KAFKA_BROKERS
          value: "kafka-cluster:9092"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: telemetry-hpa
  namespace: shuttlex-core
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: telemetry-ingestion-deployment
  minReplicas: 5
  maxReplicas: 50 # Oran %75 üzerine çıkarsa 50 sunucuya kadar kendisini çoğaltır
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
```

### 11.3. Service Level Agreement (SLA) & Felaket Senaryoları (DR)
* **Real-time Latency (Gecikme Hedefi):** Telemetri paketleri dünya genelinde <150 milisaniye (WebSockets + GoLang Caching ile ping performansı).
* **RPO (Recovery Point Objective):** < 1 saniye veri kaybı payı (TimescaleDB Streaming Replication Cluster).
* **RTO (Recovery Time Objective):** Multi-Region K8s Failover teknolojisi ile (Sunucu çökmesi durumunda A'dan B'ye aktarım) maks 5 dakikada sistem tam yedekliliği ayağa kaldırır.

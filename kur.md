# ShuttleX Enterprise Suite v5.0 — Kapsamlı Mimari, Yazılım Geliştirme ve Operasyonel Şartname Dokümanı

> **Doküman Sürümü:** v5.0 Master Specifications (v4.0 & v4.1 Sistem Eklentileri Entegre Edilmiş Nihai Sürüm)
> **Hedef Kitle:** Kıdemli Yazılım Mimarları, Backend/Frontend/Mobil Mühendisleri, Veri Mühendisleri, DevSecOps ve Ürün Yöneticileri
> **Platform Tanımı:** Küresel ölçekte, çoklu dil ve para birimi destekli, ultra-premium, multi-tenant (kurumsal yalıtımlı), yapay zeka ve ses asistanı destekli, QR/NFC entegrasyonlu kapalı devre servis ve lojistik otomasyon ekosistemi.

---

## 1. Genel Bakış ve Mimari Felsefe

ShuttleX Enterprise Suite; okullar, şirketler ve lojistik filoları için geliştirilmiş otonom durak optimizasyonu, canlı telemetri takibi, katı hiyerarşik iletişim, yapay zeka destekli operasyon ve entegre finans platformudur.

### 1.1. Sürüm Evrimi ve v4.1 Hibrit Budama Felsefesi
* **v4.0 Altyapısı:** Olay güdümlü mikroservisler, gRPC telemetri toplama, OCR/VLM ile dokümandan adres çıkarma, çift yönlü Voice AI ve tam otonom rota budama mekanizması.
* **v4.1 Mimari Düzeltmesi (Sürücü Odaklı Manuel Budama):** Tam otonom sistemlerde velinin anlık iptal yapması veya yanlışlıkla butona basması durumunda rotanın şoförün radarı dışında değişmesi sahada karışıklığa yol açmıştır. v5.0 ile mimari **"Otonom Müdahaleden -> Şeffaf İşaretleme ve Şoför Otoritesine"** geçirilmiştir:
  1. Veli "Çocuğum Bugün Binmeyecek" dediğinde durak **rotadan silinmez**, sırası (sequence) korunur.
  2. Durağın üzerine canlı haritada turuncu **Dikkat Rozeti (Alert Badge)** yerleştirilir.
  3. Rota budama (`EXECUTE_PRUNE`) yetkisi **yalnızca Şoför HUD ekranına ve Sürücü Sesli Komutuna** verilmiştir.

---

## 2. Dağıtık Mikroservis Mimarisi ve Ağ Topolojisi

Sistem, yüksek erişilebilirlik, felaket kurtarma ve coğrafi yedeklilik sağlamak üzere tamamen izole konteyner (K8s) mimarisinde çalışır.

### 2.1. Genel Topoloji

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
│ Topics: telemetry.live | attendance.events | voice.intents | chat.msgs | billing.events | push.notifications  │
└───────────────────────────────────────────────┬───────────────────────────────────────────────────────────────┘
                                                │
         ┌───────────────────────┬──────────────┴───────┬───────────────────────┬───────────────────────┐
         ▼                       ▼                      ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Redis Cluster   │     │ PostgreSQL (16) │    │ TimescaleDB     │     │ MongoDB         │     │ ElasticSearch   │
│ (In-memory TTL) │     │ PostGIS (Spatial│    │ (Telemetry Logs)│     │ (Chat Archives) │     │ (Audit Logs)    │
└─────────────────┘     └─────────────────┘    └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2. Veri Boru Hattı (Data Pipeline) Consumer Grupları

Telemetry Ingestion Service üzerinden Kafka'ya (`telemetry.live` topiğine) dökülen anlık konum verileri **iki bağımsız Consumer Group** tarafından işlenir:
1. **Real-time Broadcasters (WebSocket/Node.js):** Konum verisini gecikmesiz olarak ilgili odalardaki (tenant+route bazlı) Admin, Planlayıcı ve Velilerin ekranlarına çizer.
2. **Persistent Loggers (Go/TimescaleDB):** Geriye dönük raporlama (Audit), makine öğrenimi modellerinin eğitilmesi ve şikayet çözümleri için veriyi batch'ler halinde (örn: her 5 saniyede bir) TimescaleDB'ye kalıcı olarak yazar. Bu izolasyon, I/O darboğazlarını (bottleneck) engeller.

---

## 3. Ekran Rolleri (UI/UX) ve İstemci Mimarisi

Uç birimler, her rolün ergonomisine özel olarak optimize edilmiştir.

### 3.1. İstemci Teknoloji Yığını
* **Web Dashboard (Admin / Planlayıcı):** React.js + TypeScript, Redux Toolkit, Framer Motion (Glassmorphism), Mapbox GL JS veya Deck.gl (Yüksek veri yoğunluklu haritalar).
* **Şoför Ekranı (Driver HUD):** Flutter (veya React Native), yüksek kontrastlı Dark Mode, devasa buton yapıları, Offline-first local DB (SQLite/Isar), Background Geolocation ve Ses Tanıma Varlık Katmanı.
* **Veli / Öğretmen App:** Swift / Kotlin (Native) veya Flutter, hafif harita katmanı, Siri/Google Assistant Entegrasyonu, Apple/Google Pay Wallet (NFC Kimlik Kartı Pass'leri).

### 3.2. Ekran ve Kullanıcı Deneyimi (UX) Spesifikasyonları

| Ekran / Rol | Özellik ve Arayüz |
| :--- | :--- |
| **Sürücü HUD** | **Sade, Gece Modu (Dark Mode).** Dikkat dağıtmayan arayüz. Kayan harita, kocaman "Yaklaştım", "Atla" butonları. Turuncu ünlem uyarıları animasyonlu belirir. Ekran hiç kapanmaz (Wakelock). |
| **Planlayıcı Gösterge Paneli** | **Havacılık Radarı Yaklaşımı.** Sol menü: Günlük/Haftalık dinamik araç atama matrisleri. Orta: Filo haritası. Sağ: Akıllı doküman yükleme alanı (Drag & Drop) ve yapay zeka onay pencereleri. |
| **Öğretmen App** | Öğrenci listeleri (Yoklama alabilme), okul kapısına gelen servislerin geri sayım sayacı, veli ile şifreli sohbet odası görünümü. |
| **Veli App** | Çocuğun ETA sayacı (metrik/dakika). "Bugün Servise Binmeyecek" butonu, tek tuşla öğretmene/şoför firmasına not ve fatura ödeme alanı. |

---

## 4. Hiyerarşik RBAC, İletişim ve Güvenlik

### 4.1. Rol Yetki Matrisi

Sistem **Tam Kapalı Devredir**.

| Rol | İzleme ve Müdahale Kapsamı | Haberleşme Sınırları |
| :--- | :--- | :--- |
| **Sistem Yöneticisi (Admin)**| Kuruma ait tüm veri, çoklu plan, analiz, fatura. | Kurum geneli anons geçebilir. |
| **Planlayıcı (Operasyon)** | Tüm aktif araçlar. Cihaz/rota arıza müdahalesi. | Herkesle (Şoför, Veli, Öğr.) İletişim kurabilir. |
| **Şoför** | Sadece aktif atandığı rotayı görür. | Veliyle doğrudan **yazışamaz**. SOS atar. |
| **Öğretmen** | Sadece sınıfındaki çocukların bindiği servisi izler. | Şoförle yazışamaz. Veli ile yazışır. |
| **Veli** | Sadece çocuğunun aracı. (Araç içi diğer çocukları göremez).| Sadece kurum ofisine ve öğretmene yazabilir. |

### 4.2. Güvenlik Katmanları (Security Posture)
1. **API Gateway & Rate Limiting:** Kong üzerinden IP ve Session başına katı Rate Limit (örn: saniyede max 10 istek).
2. **Auth & OIDC:** JWT tabanlı, kısa ömürlü (15 dk) Access Token, HttpOnly Cookie ile Refresh Token.
3. **E2E Şifreli Chat:** İstemciler arası `ECDH-P256` key exchange ve `AES-256-GCM` şifrelemesi.
4. **Veri Yalıtımı (Multi-Tenancy):** PostgreSQL Row-Level Security (RLS) kullanılarak donanım seviyesinde zorunlu *Tenant Isolation*.
5. **DDoS & WAF:** Cloudflare proxy ve Web Application Firewall ile uygulama katmanı saldırılarına karşı koruma, OWASP Top 10 uyumluluğu.
6. **Penetration Test (Sızma Testi) Planı:** Her major release öncesi yetkisiz yatay erişim (IDOR) ve SQL Enjeksiyonu testleri.

---

## 5. Gelişmiş Özellikler: Planlama, Finans ve Biniş Doğrulama

### 5.1. Dinamik Çoklu Plan ve Takvim Modülü
Araç verimliliğini (ROI) maksimize etmek için bir araç günde birden fazla operasyona atanabilir.
* **Sabah Bandı (06:30 - 08:30):** İlköğretim rotası.
* **Öğlen Bandı (11:30 - 13:00):** Anaokulu yarım gün dağıtımı.
* **Akşam Bandı (17:00 - 19:00):** Holding / Fabrika personel servisi.

### 5.2. Akıllı İşlem / Finans Modülü
* Servis ücretlerinin velinin kredi kartından abonelik (Recurring) modeliyle Stripe / Iyzico tabanlı çekimi.
* Çoklu kurum destekli, alt-üye işyeri modeli ile para akışlarının doğrudan servis firmasına veya okula aktarımı.

### 5.3. Biniş - İniş Doğrulama (QR & NFC)
Çocukların yanlış servise binmesini veya serviste unutulmasını önler:
* **QR Kod / NFC Kart:** Mobil uygulamadan üretilen QR veya NFC kart, servise binişte ve inişte şoför cihazına / okutucuya temas eder.
* **Canlı Sayım:** "15 çocuk bindi, 14 çocuk indi" eşleşmediğinde şoför uygulaması turuncu kilit (Lock) moduna girer, aracı park konumundan çıkarttırmaz. Admin'e "Araçta Öğrenci Unutulma İhtimali" alarmı gider.

---

## 6. Veri Tabanı Şeması ve Tam DDL (PostgreSQL 16 + PostGIS)

Aşağıda mimarinin çekirdek nesne ilişkileri ve detaylı şifrelenmiş tabloları bulunmaktadır.

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

-- 2. Kullanıcılar
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role VARCHAR(30) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Araç Envanteri ve Bakım
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50),
    model_year INT,
    total_capacity INT NOT NULL,
    insurance_expiry_date DATE NOT NULL,
    inspection_expiry_date DATE NOT NULL, -- Vize tarihi
    is_operational BOOLEAN DEFAULT TRUE
);

-- 4. Araç-Şoför Atama (Günlük/Haftalık Takvim)
CREATE TABLE vehicle_driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES users(id),
    shift_start TIME,
    shift_end TIME,
    active_days INT[], -- [1,2,3,4,5] (Pzt-Cuma)
    valid_until DATE
);

-- 5. Öğrenciler
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    school_number VARCHAR(50),
    qr_nfc_code VARCHAR(255) UNIQUE, -- Hashli RFID numarası
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Rotalar (Master)
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    route_name VARCHAR(100) NOT NULL,
    schedule_type VARCHAR(30) DEFAULT 'MORNING_PICKUP',
    is_active BOOLEAN DEFAULT FALSE
);

-- 7. Duraklar / Düğümler (PostGIS v4.1 - Manual Pruning Flag'leri)
CREATE TABLE route_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    stop_sequence_number INT NOT NULL,
    geo_location GEOMETRY(Point, 4326) NOT NULL,
    node_status VARCHAR(30) DEFAULT 'ACTIVE',
    parent_absence_reported BOOLEAN DEFAULT FALSE,
    absence_note VARCHAR(255) DEFAULT NULL,
    driver_acknowledgment_status VARCHAR(30) DEFAULT 'PENDING_REVIEW', -- MARKED_WITH_WARNING, EXPLICITLY_SKIPPED_BY_DRIVER
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_route_nodes_geo ON route_nodes USING GIST(geo_location);
CREATE INDEX idx_route_nodes_tenant ON route_nodes(tenant_id);

-- 8. İletişim / Sohbet Odaları (Meta Data)
CREATE TABLE chat_rooms (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID REFERENCES tenants(id),
     room_type VARCHAR(30), -- PARENT_TEACHER, PARENT_OFFICE
     participant_ids UUID[],
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row-Level Security Aktivasyonu (Örnek)
ALTER TABLE route_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON route_nodes
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

---

## 7. Tam API Kontratları (gRPC ve REST)

Genişletilmiş mikroservis mimarisine ait temel API Uç Noktaları.

### 7.1. Çoklu Rota Optimizasyon Girdisi (POST `/api/v5/routes/multi-optimize`)
Yapay zeka (Google OR-Tools) motoruna birden fazla aracın kapasite ve trafik durumuna göre rota çizdirmesi için gönderilen payload.

```json
{
  "tenant_id": "e30129a4-2309-4112-b211-89ccaa112233",
  "optimization_timestamp": 1784875038,
  "config": {
    "algorithm_type": "GENETIC_TRAFFIC_AWARE",
    "avoid_highways": false,
    "waiting_buffer_seconds": 120
  },
  "fleet": [
    {
      "vehicle_id": "88ffaa...",
      "start_coordinates": { "lat": 40.2216, "lng": 28.9612 },
      "max_capacity": 19,
      "shift_start_time": "06:30",
      "shift_end_time": "08:30"
    }
  ],
  "associated_student_nodes": ["id1", "id2", "id3"],
  "blacklisted_node_ids": ["c8a11b..."]
}
```

### 7.2. Akıllı Doküman (VLM/OCR) Adres Yükleme (POST `/api/v5/routes/ingest-document`)
Bu endpoint Planlayıcı panelindeki "Fotoğraf Yükle" butonuna tıklandığında belgenin sisteme yüklenip anlamlandırılmasını başlatır.

```json
{
  "tenant_id": "e30129a4-2309-4112-b211-89ccaa112233",
  "route_id": "optional_route_uuid",
  "upload_reference_id": "s3-file-uuid-778899",
  "file_type": "IMAGE_JPEG",
  "ocr_confidence_threshold": 0.85,
  "config": {
    "auto_create_nodes_on_success": false,
    "geocoding_fallback": true,
    "language_context": "tr-TR"
  }
}
```

### 7.3. Hiyerarşik Mesaj Odası Tetikleme (POST `/api/v5/chat/room/init`)
Öldürülmüş oturumların (room) güvenli E2E parametreleriyle tekrar diriltilmesi.

```json
{
  "tenant_id": "uid...",
  "sender_id": "parent_uuid_77211",
  "sender_role": "PARENT",
  "recipient_id": "teacher_uuid_99102",
  "recipient_role": "TEACHER",
  "context": {
    "student_id": "student_uuid_55102",
    "route_id": "route_uuid_002"
  },
  "encryption_type": "ECDH_AES_GCM"
}
```

### 7.4. Voice Intent (Ses Tanıma) Payload (POST `/api/v5/voice/intent`)
Şoförün "Eymen'i atla" ses kaydının NLP katmanında anlama kavuşmuş JSON dönüşü.

```json
{
  "tenant_id": "uid...",
  "user_id": "driver_uuid_104",
  "role": "DRIVER",
  "audio_payload_sha256": "abcdef123456...",
  "resolved_intent": {
    "action": "EXECUTE_PRUNE",
    "target_node": "Eymen Altunel",
    "confidence_score": 0.98
  },
  "timestamp": 1784876123
}
```

---

## 8. Hukuki Loglama, Çevrimdışı Sürüş ve Olası Sorun Çözümü (Audit)

### 8.1. 2 Dakikalık Yasal Bekleme Trace/Audit Örneği
Sistemin milisaniyelik logları bir veli şikayeti geldiğinde Admin paneline yansır (Elasticsearch tabanlı):

| Zaman (UTC) | Servis Modülü | Olay Detayı | İvme & GPS |
| :--- | :--- | :--- | :--- |
| `07:12:01` | Geofence | Araç durak çevresel çemberine (300m) girdi. | 40!... N, Hız: 12 km/s |
| `07:12:15` | HUD Event | Şoför **"Durağa Vardım - Kronometre Başlat"** tuşladı. Arabanın tekeri durdu. Veliye push atıldı. | 40!... N, Hız: 0 km/s |
| `07:14:15` | Core Logic | **2 dakikalık yasal bekleme doldu.** Çocuk gelmedi işaretlendi. Log Immutable (Değiştirilemez) yapıldı. | ..., Hız: 0 km/s |
| `07:14:22` | Routing Engine | Şoför sesli/butonlu komutla "ATLA (PRUNE)" dedi. Rota sonraki düğüme bağlandı. | ..., Hız: 24 km/s |

### 8.2. Çevrimdışı Eylemsizlik (Dead-Reckoning)
Tünelde veya kırsalda internet koparsa:
1. Şoför App, GPS koordinatlarını ve offline olay tetiklemelerini AES-256 olarak telefonda (SQLite) depolar.
2. Formülsel Eylemsizlik (Accelerometer tabanlı ilerleme tahmini) algoritmaları devreye girer ki harita şoföre donmuş görünmesin.
3. Bağlantı (Network Reconnect) anında `Gzip` paket olarak veriler TimescaleDB'ye dökülür ve geçmiş veriler enterpolasyon ile tamamlanır.

---

## 9. CI/CD Altyapısı, Monitoring ve Gözlemlenebilirlik (Observability)

Sektör lideri operasyon sürekliliği (Uptime %99.99) için;
* **Sürekli Entegrasyon (CI) / Sürekli Dağıtım (CD):** GitHub Actions veya GitLab CI üzerinden; Unit testler (Pytest, JUnit, Jest) -> SonarQube Quality Gate -> Docker Build -> AWS ECR -> ArgoCD üzerinden Kubernetes cluster'larına (EKS/GKE) otomatik deploy (`Canary Releases` destekli).
* **Metrics (Ölçüm):** Prometheus ile Kafka tüketici gecikmeleri (consumer lag), API gateway hata metrikleri, node işlemci yükleri anlık takip edilir.
* **Dashboards:** Grafana ile hem operasyon mühendislerine sistemin nabzı, hem de C-Level yöneticilere günlük fatura/işlem cirosu, sisteme eklenen rota hacimleri gösterilir.
* **Tracing (İz Sürücü):** Jaeger veya OpenTelemetry. Bir mikroservisten çıkan isteğin (örn: SMS gönderimi) hangi mikroserviste takılıp latency oluşturduğunu milisaniye bazında tespit yeteneği.

Kurulum ve orkestrasyon, "Infrastructure as Code" (IaC) mantığıyla Terraform ile yönetilir.

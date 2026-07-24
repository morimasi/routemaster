# ShuttleX Enterprise Suite v5.0 — Tam Mimari, Yazılım Geliştirme ve Operasyonel Şartname Dokümanı

> **Doküman Sürümü:** v5.0 Master Specifications (v4.0 & v4.1 Sistem Eklentileri Entegre Edilmiş Nihai Sürüm)  
> **Hedef Kitle:** Kıdemli Yazılım Mimarları, Backend/Frontend/Mobil Mühendisleri, Veri Mühendisleri, DevSecOps ve Ürün Yöneticileri  
> **Platform Tanımı:** Küresel ölçekte, çoklu dil ve para birimi destekli, ultra-premium, multi-tenant (kurumsal yalıtımlı), yapay zeka ve ses asistanı destekli kapalı devre servis ve lojistik otomasyon ekosistemi.

---

## 1. Genel Bakış ve Mimari Felsefe

ShuttleX Enterprise Suite; okullar, şirketler ve lojistik filoları için geliştirilmiş otonom durak optimizasyonu, canlı telemetri takibi, katı hiyerarşik iletişim ve yapay zeka destekli operasyon platformudur.

### 1.1. Sürüm Evrimi ve v4.1 Hibrit Budama Felsefesi
* **v4.0 Altyapısı:** Olay güdümlü mikroservisler, gRPC telemetri toplama, OCR/VLM ile dokümandan adres çıkarma, çift yönlü Voice AI ve tam otonom rota budama mekanizmasını tanıtmıştır.
* **v4.1 Mimari Düzeltmesi (Sürücü Odaklı Manuel Budama):** Tam otonom sistemlerde velinin anlık iptal yapması veya yanlışlıkla iptal butonuna basması durumunda rotanın şoförün bilgisi dışında değişmesi sahada karışıklığa yol açmıştır. v5.0 ile mimari **"Otonom Müdahaleden -> Şeffaf İşaretleme ve Şoför Otoritesine"** geçirilmiştir.
  1. Veli "Çocuğum Bugün Binmeyecek" dediğinde durak **rotadan silinmez**, sırası (sequence) korunur.
  2. Durağın üzerine canlı haritada turuncu **Dikkat Rozeti (Alert Badge)** yerleştirilir.
  3. Rota budama (`EXECUTE_PRUNE`) yetkisi **yalnızca Şoför HUD ekranına ve Sürücü Sesli Komutuna** verilmiştir.

---

## 2. Dağıtık Mikroservis Mimarisi ve Ağ Topolojisi

Sistem monolitik yapılardan tamamen arındırılmış; yüksek eşzamanlılık (high concurrency), sıfır kesinti (zero-downtime) ve yüksek hata toleransı (fault tolerance) sağlayan mikroservis mimarisine oturtulmuştur.

```
                    ┌─────────────────────────────────────────┐
                    │  Kong API Gateway + TLS 1.3 Termination │
                    └────────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
┌───────▼────────┐              ┌────────▼───────┐               ┌────────▼────────┐
│ Telemetry      │              │ Identity &     │               │ Predictive      │
│ Ingestion (Go) │              │ RBAC (Java)    │               │ Routing (Py/C++)│
└───────┬────────┘              └────────┬───────┘               └────────┬────────┘
        │ gRPC                           │ REST/gRPC                      │ REST/gRPC
        ▼                                ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Apache Kafka Event Bus                                 │
│  Topics: delivery.telemetry.live | attendance.events | voice.intents | chat.msg │
└───────┬────────────────────────────────┬────────────────────────────────┬───────┘
        │                                │                                │
┌───────▼────────┐              ┌────────▼───────┐               ┌────────▼────────┐
│ Notification   │              │ Document AI    │               │ Voice AI        │
│ Broker (Node)  │              │ Engine (Py)    │               │ Engine (Py)     │
└───────┬────────┘              └────────┬───────┘               └────────┬────────┘
        │ WebSockets                     │ S3 / Vision API                │ STT / NLP
        ▼                                ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                PostgreSQL 16 + PostGIS / Redis Cluster / TimescaleDB             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Çekirdek Servisler ve Teknoloji Yığını

| Servis Adı | Teknoloji Yığını | Çekirdek Fonksiyonu | Veri Katmanı / Cache |
| :--- | :--- | :--- | :--- |
| **Telemetry Ingestion** | Go (Golang) + gRPC | Saniyede 50.000+ araç GPS/ivme telemetrisini toplar, Kalman süzgecinden geçirir. | Redis Cluster (TTL: 60s) |
| **Predictive Routing Engine** | Python 3.11 + C++ Core | Google OR-Tools (VRPTW), LSTM trafik tahminleme ve Dijkstra/A* graf budama. | PostgreSQL + PostGIS |
| **Notification & Message Broker** | Node.js (TypeScript) + Socket.io | Hiyerarşik E2E şifreli mesaj odalarını ve FCM/APNS anlık bildirimleri yönetir. | MongoDB (Arşiv) + Apache Kafka |
| **Identity & RBAC Service** | Java 21 (Spring Boot 3) | OAuth2/OIDC, Multi-tenant JWT token doğrulama, PostgreSQL Row-Level Security. | PostgreSQL (Multi-Tenant Schema) |
| **Document AI Ingestion** | Python + OpenCV + VLM/LLM | PDF, Görsel, El yazısı ve Excel dosyalarından OCR ve NER ile adres/öğrenci çıkarımı. | AWS S3 / MinIO |
| **Voice AI Engine** | Python + Whisper STT + Coqui TTS | Sürücü için Hands-Free komut işleme, Wake-Word ve Siri/Google Assistant entegrasyonu. | Local Vector DB (Faiss) |

---

## 3. Rol Tabanlı Erişim Kontrolü (RBAC) ve Hiyerarşik Mesajlaşma

### 3.1. Rol Yetki ve İzleme Matrisi

| Rol | Kayıt & Onay Akışı | Canlı Takip Kapsamı | Haberleşme İzin Sınırları |
| :--- | :--- | :--- | :--- |
| **Sistem Admin** | Kurumsal kurulum ile otomatik. | Tüm kurumların tüm araç ve rotalarını küresel olarak izler. | Sınırsız genel duyuru ve müdahale yetkisi. |
| **Planlayıcı / Görevli** | Admin davet linki + SMS OTP doğrulaması. | Kendi kurumuna ait tüm aktif araç matrisini canlı izler. | Şoför, Öğretmen ve Veliler ile tam çift yönlü iletişim. |
| **Servis Şoförü** | Planlayıcı tarafından plaka/ehliyet ile eklenir, SMS şifre belirleme. | Sadece kendi aktif rotasını ve durak dizilimini görür. | Sadece Planlayıcı ve Rehber Öğretmene SOS ve sesli onay gönderebilir. |
| **Rehber Öğretmen** | Kurum sicil no + e-posta doğrulaması, Admin/Planlayıcı onayı. | Sınıfındaki öğrencileri taşıyan servislerin konumunu ve ETA'yı görür. | Kendi velileri ve Planlayıcı ile mesajlaşır. Şoförle doğrudan yazışamaz. |
| **Veli** | Öğrenci TC Kimlik / Okul No eşleştirmesi + Admin onayı. | Sadece kendi çocuğunun bindiği aracı, canlı metre/dakika ETA'sını izler. | Yalnızca Rehber Öğretmen ve Planlayıcıya yazabilir. Şoföre serbest metin atamaz. |

### 3.2. E2E Şifreli Mesajlaşma Mimarisi (ECDH-P256 + AES-256-GCM)
Hiyerarşik mesajlaşma odaları uçtan uca şifrelenir. Mesaj içeriği sunucuda ham olarak **asla saklanmaz**.
* **Key Exchange:** `ECDH` (Elliptic Curve Diffie-Hellman P-256) kullanılarak istemciler arası ortak anahtar türetilir.
* **Payload Encryption:** Mesaj gövdesi `AES-256-GCM` ile şifrelenir.

---

## 4. Yapay Zeka Rota Optimizasyonu, VRPTW ve Sürücü Odaklı Budama

### 4.1. VRPTW (Vehicle Routing Problem with Time Windows) Matematiksel Modeli

Yapay zeka motoru aşağıdaki amaç fonksiyonunu (Objective Function) minimize eder:

$$\min \left( \sum_{i \in N} \sum_{j \in N} c_{ij} x_{ij} + \gamma \sum_{k \in V} \text{Delay}_k \right)$$

**Kısıtlar (Constraints):**
1. **Zaman Penceresi Kısıtı:** $a_i \le t_i \le b_i$ (Her durak için belirtilen zaman penceresinde bulunma zorunluluğu).
2. **Kapasite Kısıtı:** $\sum_{i \in N} q_i y_{ik} \le Q_k$ (Araç $k$'nın yolcu kapasitesi $Q_k$ aşılamaz).
3. **Maksimum Sürüş Süresi Kısıtı:** $T_k \le T_{\max}$ (Şoförün yasal maksimum kesintisiz sürüş süresi).

### 4.2. Veli İptal Bildirimi ve Sürücü Budama Akışı (v4.1 Algoritması)

```
[Veli İptal Butonu] ──► Event: attendance.absence_flagged
                              │
                              ▼
                [Kafka Topics & WebSocket Broadcast]
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
[Admin Dashboard]    [Planlayıcı Paneli]    [Sürücü HUD Ekranı]
(Sarı Halka İkonu)   (Gri Transparan Satır) (Turuncu Ünlem Rozeti + Sesli Anons)
                                                    │
                                                    ▼
                                          [Şoför Aksiyonu]
                                      ┌─────────────┴─────────────┐
                                      ▼                           ▼
                           [Durağa Uğra & Al]           [Bu Durağı Atla (Sesli/Dokunmatik)]
                                                                  │
                                                                  ▼
                                                      Event: route.node_pruned
                                                                  │
                                                                  ▼
                                                      [Graf Düğümü Silinir &
                                                       ETA 450ms'de Yeniden Hesaplanır]
```

---

## 5. Çevrimdışı Sürüş (Offline-First), Eylemsizlik Seyrüseferi ve Geofencing

### 5.1. Dead-Reckoning (Eylemsizlik Seyrüseferi) Algoritması
İnternet veya GPS sinyali koptuğunda (Network/GPS Loss Mode), mobil uygulama konum tahminlemesini cihazın donanımsal ivmeölçer (Accelerometer) ve jiroskop (Gyroscope) sensörleri üzerinden sürdürür.

$$\vec{P}_{t} = \vec{P}_{t-1} + \vec{v}_{t-1} \cdot \Delta t + \frac{1}{2} \vec{a}_{\text{sensör}} \cdot (\Delta t)^2$$

* **Şifreli Yerel Kuyruk:** GPS verileri cihaz içinde SQLite / IndexedDB üzerinde `AES-256` ile şifrelenerek FIFO kuyruğuna alınır.
* **Network Reconnect:** Bağlantı sağlandığında biriken loglar `Gzip compressed blob` halinde tek paket olarak backend'e gönderilir ve TimescaleDB'de zaman sırasına göre birleştirilir.

### 5.2. Zaman Bazlı Coğrafi Çit (Temporal Geofence)
Kuş uçuşu yarıçap kullanımı yasaklanmıştır. Coğrafi çit tetiklemesi canlı harita trafiği ve araç hızıyla hesaplanır:

$$\text{ETA}_{\text{durak}} = \frac{\text{Distance}_{\text{Graph}}(P_{\text{araç}}, P_{\text{durak}})}{v_{\text{canlı\_trafik}}} + \sum t_{\text{bekleme}}$$

$\text{ETA}_{\text{durak}} \le 300 \text{ saniye (5 dakika)}$ olduğu an Velinin cihazına Push Notification fırlatılır.

---

## 6. Veri Tabanı Şeması ve Tam DDL (PostgreSQL 16 + PostGIS)

Sistem katı **Row-Level Security (RLS)** ile kurumsal yalıtım sağlar.

```sql
-- 1. Kurumlar Tablosu (Tenants)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    country_code VARCHAR(5) DEFAULT 'TR',
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Kullanıcılar ve RBAC Tablosu
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

-- 3. Araç Envanter Tablosu
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    total_capacity INT NOT NULL,
    insurance_expiry_date DATE NOT NULL,
    is_operational BOOLEAN DEFAULT TRUE
);

-- 4. Öğrenciler Tablosu
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    school_number VARCHAR(50),
    class_name VARCHAR(20),
    qr_nfc_code VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rota Tablosu
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

-- 6. PostGIS Destekli Rota Düğümleri / Duraklar Tablosu (v4.1 Sürücü Budama Alanları Dahil)
CREATE TABLE route_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    stop_sequence_number INT NOT NULL,
    geo_location GEOMETRY(Point, 4326) NOT NULL,
    node_status VARCHAR(30) DEFAULT 'ACTIVE', -- ACTIVE, VISITED, SKIPPED, MUTED
    parent_absence_reported BOOLEAN DEFAULT FALSE,
    absence_note VARCHAR(255) DEFAULT NULL,
    driver_acknowledgment_status VARCHAR(30) DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, MARKED_WITH_WARNING, EXPLICITLY_SKIPPED_BY_DRIVER
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatiotemporal & Tenant İndeksleri
CREATE INDEX idx_route_nodes_geo ON route_nodes USING GIST(geo_location);
CREATE INDEX idx_route_nodes_tenant ON route_nodes(tenant_id);
CREATE INDEX idx_route_nodes_absence ON route_nodes(parent_absence_reported) WHERE parent_absence_reported = TRUE;

-- 7. Yoklama / Biniş-İniş Log Tablosu
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

-- Row-Level Security (RLS) Aktivasyonu
ALTER TABLE route_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON route_nodes
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

---

## 7. Tam API Kontratları (gRPC, REST JSON ve WebSockets)

### 7.1. Telemetri gRPC Protobuf Kontratı (`telemetry.proto`)

```protobuf
syntax = "proto3";

package shuttlex.telemetry.v1;

option go_package = "shuttlex/telemetry/v1;telemetryv1";

service TelemetryService {
  rpc StreamTelemetry (stream TelemetryFrame) returns (TelemetryAck);
}

message TelemetryFrame {
  string tenant_id = 1;
  string vehicle_id = 2;
  string driver_id = 3;
  double latitude = 4;
  double longitude = 5;
  float speed_kmh = 6;
  float heading_degree = 7;
  int64 timestamp_utc = 8;
  bool is_offline_buffered = 9;
}

message TelemetryAck {
  bool success = 1;
  int64 processed_frames_count = 2;
}
```

### 7.2. REST API Payload Şemaları

#### A. Veli Devamsızlık İşaretleme (POST `/api/v4/routes/node/flag-absence`)
```json
{
  "tenant_id": "e30129a4-2309-4112-b211-89ccaa112233",
  "route_id": "route_uuid_002",
  "node_id": "c8a11b22-99cc-44dd-aa77-88eeddff0011",
  "student_id": "student_uuid_55102",
  "absence_reason": "Çocuğum bugün rahatsız, servise binmeyecek.",
  "action_type": "FLAG_WARNING_ONLY"
}
```

#### B. Şoför Onaylı Rota Budama (POST `/api/v4/routes/node/driver-prune`)
```json
{
  "tenant_id": "e30129a4-2309-4112-b211-89ccaa112233",
  "route_id": "route_uuid_002",
  "node_id": "c8a11b22-99cc-44dd-aa77-88eeddff0011",
  "driver_id": "driver_uuid_104",
  "action": "EXECUTE_PRUNE",
  "timestamp": 1784878200
}
```

#### C. Akıllı Doküman (OCR/VLM) Adres Yükleme (POST `/api/v3/routes/ingest-document`)
```json
{
  "tenant_id": "e30129a4-2309-4112-b211-89ccaa112233",
  "upload_reference_id": "s3-file-uuid-778899",
  "file_type": "IMAGE_JPEG",
  "ocr_confidence_threshold": 0.85,
  "config": {
    "auto_create_nodes_on_success": true,
    "geocoding_fallback": true,
    "language_context": "tr-TR"
  }
}
```

#### D. Voice Intent (Sesli Komut İşleme) Payload (POST `/api/v4/voice/intent`)
```json
{
  "tenant_id": "e30129a4-2309-4112-b211-89ccaa112233",
  "user_id": "driver_uuid_104",
  "role": "DRIVER",
  "audio_payload": "base64_encoded_audio_string",
  "resolved_intent": {
    "action": "SKIP_STOP",
    "target_node": "Eymen Altunel",
    "confidence_score": 0.98
  },
  "timestamp": 1784876123
}
```

### 7.3. WebSocket Canlı Etkinlik Formatı (WebSocket Event Frames)

```json
{
  "event": "ABSENCE_FLAGGED_WARNING",
  "tenant_id": "e30129a4-2309-4112-b211-89ccaa112233",
  "payload": {
    "route_id": "route_uuid_002",
    "node_id": "c8a11b22-99cc-44dd-aa77-88eeddff0011",
    "student_name": "Eymen Altunel",
    "sequence_number": 4,
    "badge_status": "ALERT_ORANGE",
    "timestamp": 1784878100
  }
}
```

---

## 8. Akıllı Doküman İşleme (OCR/VLM) ve Çift Yönlü Sesli Asistan (Voice AI)

### 8.1. Multi-Modal Doküman Yapay Zekası Mimarisi
* **Desteklenen Formatlar:** JPEG, PNG, HEIC (El yazısı kâğıt fotoğrafları, WhatsApp ekran görüntüleri), PDF, DOCX, CSV.
* **NER & Adres Anlamlandırma:** LLM/VLM katmanı düzensiz metinden Öğrenci İsmi, Sokak, Mahalle, Kapı No ve Telefon bilgilerini çıkarır.
* **Geocoding Fallback Engine:** Google Geocoding API ile eksik adresler bağlama göre (il/ilçe) koordinata çevrilir. Belirsiz durumlarda doğrulama paneline 2 olası konum önerisi düşer.

### 8.2. Çift Yönlü Voice AI Sürücü ve Veli Deneyimi
1. **Hands-Free Sürücü HUD:** Wake-Word ("ShuttleX") ile dinleme açılır.
   * *TTS Anons:* "Sıradaki durak: Eymen Altunel. 300 metre kaldı."
   * *STT Komut:* "ShuttleX, Eymen'in durağını atla." -> Algoritma `EXECUTE_PRUNE` tetikler.
   * *SOS Komut:* "ShuttleX, kaza yaptık acil durum bildir." -> GPS, hız ve son telemetry anında merkeze kırmızı alarm olarak iletilir.
2. **Veli & Planlayıcı Kısayolları:** iOS Siri Shortcuts ve Android Assistant API ile "Hey Siri, ShuttleX'e Eymen'in bugün servise binmeyeceğini söyle" komutu işlenir.

---

## 9. Hukuki İzlenebilirlik, Denetim (Audit Log) ve KVKK/GDPR Uyum Katmanı

### 9.1. 2 Dakikalık Yasal Bekleme ve İzleme Akışı (Audit Trace Log)

| UTC Zamanı | Tetikleyen Modül | Kayıt Detayı (Audit Message) | Telemetri / GPS Verisi |
| :--- | :--- | :--- | :--- |
| `07:12:01` | Geofence Broker | Araç Durak-12 (Eymen Altunel) coğrafi sınırına girdi. | 40.2231 N, 28.9645 E \| Hız: 12 km/s |
| `07:12:15` | Driver HUD App | Şoför "Durağa Vardım - Kronometre Başlat" butonuna bastı / sesli onay verdi. Veliye Push iletildi. | 40.2231 N, 28.9645 E \| Hız: 0 km/s |
| `07:14:15` | System Core Logic | **2 dakikalık (120 sn) yasal bekleme süresi doldu.** Çocuk gelmedi olarak işaretlendi. Log kilitlendi. | 40.2232 N, 28.9645 E \| Hız: 0 km/s |
| `07:14:22` | Routing Optimization | Sürücü "Atla" komutunu onayladı. Durak SKIPPED işaretlenerek rota bir sonraki düğüme kırıldı. | 40.2235 N, 28.9648 E \| Hız: 24 km/s |

### 9.2. KVKK / GDPR Madde 17 (Unutulma Hakkı) Otomasyonu
Veli veya öğrenci sistemden silindiğinde PII (Kişisel Veri) alanları `anonymized_user_id` ile maskelenir; coğrafi telemetri logları anonim anonimleşmiş istatistiki veri olarak kalır.

---

## 10. DevOps, Kubernetes (K8s) Altyapısı ve Felaket Kurtarma (Disaster Recovery)

### 10.1. Kubernetes Deployment Spec Örneği (`telemetry-deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telemetry-ingestion-deployment
  namespace: shuttlex-core
spec:
  replicas: 5
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
        - containerPort: 50051 # gRPC
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
        - name: REDIS_HOST
          value: "redis-cluster:6379"
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
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
```

### 10.2. Felaket Kurtarma ve Metrik Hedefleri (SLA)
* **RPO (Recovery Point Objective):** < 1 saniye (Kafka ve PostgreSQL Streaming Replication ile).
* **RTO (Recovery Time Objective):** < 5 dakika (Multi-region Kubernetes Failover ile).
* **Target Latency:** Real-time WebSocket telemetri iletim gecikmesi < 150 ms.

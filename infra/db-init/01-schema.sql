-- ShuttleX Enterprise Suite v5.0 Master Schema DDL
-- Otomatik olarak Docker üzerinden ayağa kalktığında çalıştırılacaktır.

-- PostGIS Eklentisinin (Coğrafi Hesaplamalar) Aktif Edilmesi
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() için

-- 1. Kurumlar (Tenants)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    country_code VARCHAR(5) DEFAULT 'TR',
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Kullanıcılar ve Kavramsal Roller (RBAC)
CREATE TABLE IF NOT EXISTS users (
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

-- 3. Araç Envanteri (Fiziksel / Simgesel Donanımlar)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50),
    model_year INT,
    total_capacity INT NOT NULL,
    insurance_expiry_date DATE NOT NULL,
    inspection_expiry_date DATE NOT NULL,
    is_operational BOOLEAN DEFAULT TRUE
);

-- 4. Dinamik Vardiya Takvimi
CREATE TABLE IF NOT EXISTS vehicle_driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES users(id),
    shift_start TIME,
    shift_end TIME,
    active_days INT[], 
    valid_until DATE
);

-- 5. Öğrenciler (IoT / NFC Destekli)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    school_number VARCHAR(50),
    qr_nfc_code VARCHAR(255) UNIQUE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Rota Üst Verisi (Master Object)
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    route_name VARCHAR(100) NOT NULL,
    schedule_type VARCHAR(30) DEFAULT 'MORNING_PICKUP',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Rota Durakları (Spatial Indeksli v4.1 Hibrit Budama Uyumlu)
CREATE TABLE IF NOT EXISTS route_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    stop_sequence_number INT NOT NULL,
    geo_location GEOMETRY(Point, 4326) NOT NULL,
    node_status VARCHAR(30) DEFAULT 'ACTIVE',
    
    parent_absence_reported BOOLEAN DEFAULT FALSE,
    absence_note VARCHAR(255) DEFAULT NULL,
    driver_acknowledgment_status VARCHAR(30) DEFAULT 'PENDING_REVIEW', 
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kütlesel Veri Performansı İçin Coğrafi R-Tree Indexing (Saniyede 50k okuma)
CREATE INDEX IF NOT EXISTS idx_route_nodes_geo ON route_nodes USING GIST(geo_location);
CREATE INDEX IF NOT EXISTS idx_route_nodes_tenant ON route_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_route_nodes_absence ON route_nodes(parent_absence_reported) WHERE parent_absence_reported = TRUE;

-- 8. Row-Level Security (Premium Kurumsal İzolasyon Duvarı)
ALTER TABLE route_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy_nodes ON route_nodes
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    
-- (Not: Uygulama backend'i, her Auth Token okuyuşunda veritabanı oturumuna set_config('app.current_tenant_id', 'ilgili_uuid') şeklinde tenant kimliği basmalıdır.)

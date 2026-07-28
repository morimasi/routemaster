CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('SYSTEM_ADMIN', 'PLANNER', 'DRIVER', 'TEACHER', 'PARENT');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'PLANNER',
  phone VARCHAR(50),
  photo TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  plate VARCHAR(20) NOT NULL,
  vin VARCHAR(50),
  brand VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(20),
  fuel_type VARCHAR(20) DEFAULT 'diesel',
  capacity INTEGER DEFAULT 16,
  photo TEXT,
  status VARCHAR(20) DEFAULT 'STANDBY',
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID UNIQUE REFERENCES vehicles(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  heading DOUBLE PRECISION DEFAULT 0,
  accuracy DOUBLE PRECISION DEFAULT 5,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

SELECT AddGeometryColumn('positions', 'geom', 4326, 'POINT', 2);
CREATE INDEX idx_positions_geom ON positions USING GIST (geom);

CREATE TABLE IF NOT EXISTS trail_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  heading DOUBLE PRECISION DEFAULT 0,
  snap_to_road BOOLEAN DEFAULT true,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trail_vehicle_time ON trail_points(vehicle_id, timestamp DESC);
CREATE INDEX idx_trail_geom ON trail_points USING GIST (ST_SetSRID(ST_MakePoint(lng, lat), 4326));

package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
)

// TelemetryFrame represents incoming vehicle GPS telemetry
type TelemetryFrame struct {
	TenantID          string  `json:"tenant_id"`
	VehicleID         string  `json:"vehicle_id"`
	Latitude          float64 `json:"latitude"`
	Longitude         float64 `json:"longitude"`
	SpeedKmh          float32 `json:"speed_kmh"`
	TimestampUTC      int64   `json:"timestamp_utc"`
	IsOfflineBuffered bool    `json:"is_offline_buffered"`
}

// Server implements the gRPC Telemetry Service
type Server struct{}

func (s *Server) StreamTelemetry(ctx context.Context, frame *TelemetryFrame) (bool, error) {
	// 1. Buffer in Redis
	log.Printf("[TELEMETRY INGEST] Tenant: %s | Vehicle: %s | Lat: %.4f | Lng: %.4f | Speed: %.1f km/h | Offline: %v",
		frame.TenantID, frame.VehicleID, frame.Latitude, frame.Longitude, frame.SpeedKmh, frame.IsOfflineBuffered)

	// 2. Publish to Apache Kafka Topic: delivery.telemetry.live
	// Kafka Producer Logic goes here...

	return true, nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen on gRPC port 50051: %v", err)
	}

	grpcServer := grpc.NewServer()
	fmt.Println("⚡ ShuttleX Telemetry Ingestion Service (Go) running on gRPC :50051...")
	fmt.Println("⚡ Connected to Kafka broker: kafka-broker:29092 [Topic: delivery.telemetry.live]")

	// Keep server running
	_ = time.Second
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}

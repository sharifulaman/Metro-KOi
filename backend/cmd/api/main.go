// Metro Koi API server: REST + WebSocket + fusion engine.
//
//	go run ./cmd/api            # in-memory, no infrastructure needed
//	DATABASE_URL=... REDIS_URL=... go run ./cmd/api
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/metrokoi/backend/internal/app"
	"github.com/metrokoi/backend/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config", "err", err)
		os.Exit(1)
	}
	level := slog.LevelInfo
	if cfg.LogLevel == "debug" {
		level = slog.LevelDebug
	}
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	a, err := app.New(ctx, cfg, log)
	if err != nil {
		log.Error("startup", "err", err)
		os.Exit(1)
	}
	defer a.Close()
	go a.Run(ctx)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: a.Handler, ReadHeaderTimeout: 10 * time.Second}
	go func() {
		log.Info("listening", "addr", srv.Addr, "stations", len(a.Data.Run.StationIDs), "lineM", int(a.Data.Run.LengthM))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("http", "err", err)
			stop()
		}
	}()
	<-ctx.Done()
	shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdown)
	log.Info("stopped")
}

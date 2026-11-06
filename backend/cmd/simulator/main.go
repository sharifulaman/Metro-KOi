// simulator replays fake riders against a running API over WebSocket
// (spec §11 tools/simulator, §14.3): trains along the real polyline with GPS
// noise, plus optional "bus below the viaduct" decoys.
//
//	go run ./cmd/simulator -url ws://localhost:8080/v1/ws -trains 2 -riders 3 -decoys 1
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand/v2"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/coder/websocket"

	"github.com/metrokoi/backend/data"
	"github.com/metrokoi/backend/internal/geo"
	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/schedule"
	"github.com/metrokoi/backend/internal/sim"
)

func main() {
	url := flag.String("url", "ws://localhost:8080/v1/ws", "API WebSocket URL")
	trains := flag.Int("trains", 2, "simulated trains (alternating SB/NB)")
	riders := flag.Int("riders", 3, "riders per train")
	decoys := flag.Int("decoys", 1, "bus decoys under the viaduct")
	every := flag.Duration("every", 3*time.Second, "fix interval per rider")
	sigma := flag.Float64("sigma", 8, "GPS noise σ in metres")
	flag.Parse()

	var lf model.LineFeature
	var sf model.StationsFile
	var tt model.Timetable
	must(json.Unmarshal(data.Line, &lf))
	must(json.Unmarshal(data.Stations, &sf))
	must(json.Unmarshal(data.Timetable, &tt))
	line := geo.NewLine(lf.Geometry.Coordinates)
	run := schedule.BuildRunModel(sf.Stations, tt.EndToEndMin, tt.DwellSec, nil)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	rng := rand.New(rand.NewPCG(uint64(time.Now().UnixNano()), 1))
	start := time.Now()
	var all []*sim.Rider
	for i := range *trains {
		dir := model.SB
		if i%2 == 1 {
			dir = model.NB
		}
		tr := sim.NewTrain(run, dir, 19.4, 0.9, 30, rng)
		t0 := start.Add(-time.Duration(i/2) * 4 * time.Minute) // spread trains along the line
		for r := range *riders {
			all = append(all, sim.NewRider(fmt.Sprintf("sim-%d-%d-%d", start.Unix(), i, r), tr, t0, 0, *sigma, rng))
		}
	}
	for i := range *decoys {
		bus := sim.NewBus(run.Chainage[4]+float64(i)*500, run.Chainage[10], 5+rng.Float64()*3, rng)
		all = append(all, sim.NewRider(fmt.Sprintf("sim-%d-bus-%d", start.Unix(), i), bus, start, 18, *sigma, rng))
	}
	log.Printf("simulating %d riders (%d trains × %d, %d decoys) → %s", len(all), *trains, *riders, *decoys, *url)

	var wg sync.WaitGroup
	for i, r := range all {
		wg.Add(1)
		go func() {
			defer wg.Done()
			time.Sleep(time.Duration(i) * 150 * time.Millisecond)
			if err := ride(ctx, *url, r, line, *every); err != nil && ctx.Err() == nil {
				log.Printf("%s: %v", r.SessionID, err)
			}
		}()
	}
	wg.Wait()
	log.Print("all simulated rides finished")
}

func ride(ctx context.Context, url string, r *sim.Rider, line *geo.Line, every time.Duration) error {
	c, _, err := websocket.Dial(ctx, url, nil)
	if err != nil {
		return err
	}
	defer c.CloseNow()
	go func() { // drain server messages (snapshots/updates)
		for {
			if _, _, err := c.Read(ctx); err != nil {
				return
			}
		}
	}()
	send := func(v any) error { return c.Write(ctx, websocket.MessageText, model.MustJSON(v)) }
	if err := send(model.HelloMsg{T: "hello", DeviceID: r.DeviceID, V: 1, Lang: "en"}); err != nil {
		return err
	}
	if err := send(model.RiderStartMsg{T: "rider.start", SessionID: r.SessionID, Score: 4}); err != nil {
		return err
	}
	t := time.NewTicker(every)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			_ = send(model.RiderStopMsg{T: "rider.stop", SessionID: r.SessionID})
			return nil
		case now := <-t.C:
			f, _, ok := r.FixAt(line, now)
			if !ok {
				_ = send(model.RiderStopMsg{T: "rider.stop", SessionID: r.SessionID})
				return nil
			}
			if err := send(model.RiderFixMsg{T: "rider.fix", Fix: f}); err != nil {
				return err
			}
		}
	}
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

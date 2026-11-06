// admin loads and updates data in Postgres — data changes, not code (spec §4.2, §13).
//
//	admin seed                          # load embedded stations, line, gates, timetable
//	admin import-timetable timetable.json
//	admin import-fares fares.json       # {"amounts": {"uttara-north|agargaon": 60, …}}
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/metrokoi/backend/internal/model"
	"github.com/metrokoi/backend/internal/schedule"
	"github.com/metrokoi/backend/internal/store"
)

func main() {
	if len(os.Args) < 2 {
		usage()
	}
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		log.Fatal("DATABASE_URL is required")
	}
	ctx := context.Background()
	pg, err := store.NewPostgres(ctx, url)
	if err != nil {
		log.Fatal(err)
	}
	defer pg.Close()

	switch os.Args[1] {
	case "seed":
		must(pg.Seed(ctx))
		fmt.Println("seeded stations, line, gates, timetable (and fares if present)")
	case "import-timetable":
		var tt model.Timetable
		readJSON(arg(2), &tt)
		for _, d := range []model.DayType{model.SunThu, model.Fri, model.Sat} {
			for _, dir := range []model.Direction{model.SB, model.NB} {
				if n := len(schedule.TerminalDepartures(&tt, d, dir)); n == 0 {
					log.Fatalf("timetable has no departures for %s/%s", d, dir)
				}
			}
		}
		must(pg.ImportTimetable(ctx, &tt))
		fmt.Println("timetable imported, version", tt.Version, "— restart the API to serve it")
	case "import-fares":
		var f model.FaresFile
		readJSON(arg(2), &f)
		if len(f.Amounts) == 0 {
			log.Fatal("fares file has no amounts")
		}
		st, err := pg.Stations(ctx)
		must(err)
		known := map[string]bool{}
		for _, s := range st {
			known[s.ID] = true
		}
		for k, v := range f.Amounts {
			var a, b string
			for i := range k {
				if k[i] == '|' {
					a, b = k[:i], k[i+1:]
				}
			}
			if !known[a] || !known[b] || v <= 0 {
				log.Fatalf("bad fare entry %q = %d", k, v)
			}
		}
		must(pg.ImportFares(ctx, f.Amounts))
		fmt.Printf("imported %d fares — restart the API to serve them\n", len(f.Amounts))
	default:
		usage()
	}
}

func arg(i int) string {
	if len(os.Args) <= i {
		usage()
	}
	return os.Args[i]
}

func readJSON(path string, v any) {
	b, err := os.ReadFile(path)
	must(err)
	must(json.Unmarshal(b, v))
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: admin seed | import-timetable FILE | import-fares FILE")
	os.Exit(2)
}

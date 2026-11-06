// Package config reads environment variables (spec §13).
package config

import (
	"strings"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Port           string  `envconfig:"PORT" default:"8080"`
	DatabaseURL    string  `envconfig:"DATABASE_URL"` // empty → in-memory store from embedded data
	RedisURL       string  `envconfig:"REDIS_URL"`    // empty → in-process pub/sub
	EndToEndMin    float64 `envconfig:"END_TO_END_MIN" default:"40"`
	DwellSec       float64 `envconfig:"DWELL_SEC" default:"30"`
	HolidayAs      string  `envconfig:"HOLIDAY_AS" default:"fri"`
	Holidays       string  `envconfig:"HOLIDAYS"` // comma-separated YYYY-MM-DD (Dhaka dates)
	AllowedOrigins string  `envconfig:"ALLOWED_ORIGINS" default:"*"`
	SessionSalt    string  `envconfig:"SESSION_SALT"` // mixed with the date; random if empty
	LogLevel       string  `envconfig:"LOG_LEVEL" default:"info"`
}

func Load() (Config, error) {
	var c Config
	err := envconfig.Process("", &c)
	return c, err
}

func (c Config) HolidaySet() map[string]bool {
	out := map[string]bool{}
	for _, d := range strings.Split(c.Holidays, ",") {
		if d = strings.TrimSpace(d); d != "" {
			out[d] = true
		}
	}
	return out
}

func (c Config) Origins() []string {
	var out []string
	for _, o := range strings.Split(c.AllowedOrigins, ",") {
		if o = strings.TrimSpace(o); o != "" {
			out = append(out, o)
		}
	}
	return out
}

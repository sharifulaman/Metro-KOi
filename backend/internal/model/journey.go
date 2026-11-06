package model

// FaresFile is data/fares.json (spec §4.5). Amounts are nil until the
// official DMTCL chart is imported with `admin import-fares`.
type FaresFile struct {
	Source              string         `json:"source"`
	Status              string         `json:"status"` // "official" | "TO_FETCH"
	Currency            string         `json:"currency"`
	RapidPassMultiplier float64        `json:"rapidPassMultiplier"`
	Amounts             map[string]int `json:"amounts"` // "from|to" → BDT
}

// Fare is one row of table `fares`.
type Fare struct {
	FromStation string `json:"fromStation"`
	ToStation   string `json:"toStation"`
	AmountBDT   int    `json:"amountBdt"`
}

// JourneyOption is one train for From → To (GET /journey).
type JourneyOption struct {
	TrainID          string    `json:"trainId"`
	Direction        Direction `json:"direction"`
	DepartSec        int       `json:"departSec"`
	ArriveSec        int       `json:"arriveSec"`
	DurationSec      int       `json:"durationSec"`
	WaitSec          int       `json:"waitSec"`
	FareBDT          *int      `json:"fareBdt"`
	FareRapidPassBDT *int      `json:"fareRapidPassBdt"`
	Source           Source    `json:"source"`
}

type JourneyResponse struct {
	From    string          `json:"from"`
	To      string          `json:"to"`
	Options []JourneyOption `json:"options"`
}

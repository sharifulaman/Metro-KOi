// Package pubsub fans out train deltas: Redis channel `trains` in production
// (spec §5, §13), an in-process broadcaster when REDIS_URL is empty.
package pubsub

import (
	"context"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

const Channel = "trains"
const snapshotKey = "trains:snapshot"

type PubSub interface {
	Publish(ctx context.Context, msg []byte) error
	Subscribe(ctx context.Context) <-chan []byte
	// SaveSnapshot stores the latest full snapshot (Redis live state).
	SaveSnapshot(ctx context.Context, msg []byte) error
	Close() error
}

// ---- in-process ----

type Memory struct {
	mu   sync.Mutex
	subs map[chan []byte]struct{}
}

func NewMemory() *Memory { return &Memory{subs: map[chan []byte]struct{}{}} }

func (m *Memory) Publish(_ context.Context, msg []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for ch := range m.subs {
		select {
		case ch <- msg:
		default: // slow subscriber: drop
		}
	}
	return nil
}

func (m *Memory) Subscribe(ctx context.Context) <-chan []byte {
	ch := make(chan []byte, 256)
	m.mu.Lock()
	m.subs[ch] = struct{}{}
	m.mu.Unlock()
	go func() {
		<-ctx.Done()
		m.mu.Lock()
		delete(m.subs, ch)
		m.mu.Unlock()
		close(ch)
	}()
	return ch
}

func (m *Memory) SaveSnapshot(context.Context, []byte) error { return nil }
func (m *Memory) Close() error                               { return nil }

// ---- Redis ----

type Redis struct{ c *redis.Client }

func NewRedis(url string) (*Redis, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	c := redis.NewClient(opt)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := c.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	return &Redis{c: c}, nil
}

func (r *Redis) Publish(ctx context.Context, msg []byte) error {
	return r.c.Publish(ctx, Channel, msg).Err()
}

func (r *Redis) Subscribe(ctx context.Context) <-chan []byte {
	out := make(chan []byte, 256)
	sub := r.c.Subscribe(ctx, Channel)
	go func() {
		defer close(out)
		defer sub.Close()
		ch := sub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case m, ok := <-ch:
				if !ok {
					return
				}
				select {
				case out <- []byte(m.Payload):
				default:
				}
			}
		}
	}()
	return out
}

func (r *Redis) SaveSnapshot(ctx context.Context, msg []byte) error {
	return r.c.Set(ctx, snapshotKey, msg, 10*time.Second).Err()
}

func (r *Redis) Close() error { return r.c.Close() }

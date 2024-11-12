// File: backend/middleware/rate_limit.go
package middleware

import (
	"golang.org/x/time/rate"
	"net/http"
	"sync"
	"time"
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	clients         = make(map[string]*client)
	mutex           sync.Mutex
	rateLimit       = rate.Every(time.Hour / 5) // 5 requests per hour
	burst           = 5                         // Burst size
	cleanupInterval = time.Minute * 10          // Cleanup every 10 minutes
)

// RateLimitMiddleware limits the number of requests per client.
func RateLimitMiddleware(next http.Handler) http.Handler {
	go cleanupClients()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)

		mutex.Lock()
		c, exists := clients[ip]
		if !exists {
			limiter := rate.NewLimiter(rateLimit, burst)
			clients[ip] = &client{limiter, time.Now()}
			c = clients[ip]
		}
		c.lastSeen = time.Now()
		mutex.Unlock()

		if !c.limiter.Allow() {
			http.Error(w, "Too many requests. Please try again later.", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// getIP extracts the client's real IP address from the request.
func getIP(r *http.Request) string {
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		// X-Forwarded-For can contain multiple IPs; the first is the client
		return xff
	}
	return r.RemoteAddr
}

// cleanupClients removes clients that haven't been seen for a while.
func cleanupClients() {
	for {
		time.Sleep(cleanupInterval)
		mutex.Lock()
		for ip, c := range clients {
			if time.Since(c.lastSeen) > cleanupInterval {
				delete(clients, ip)
			}
		}
		mutex.Unlock()
	}
}

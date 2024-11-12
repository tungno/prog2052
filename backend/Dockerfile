# backend/Dockerfile

# Stage 1: Build the Go application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy dependency files and download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code to the container
COPY . .

# Build the Go application binary from the cmd directory
RUN go build -o main ./cmd

# Stage 2: Set up the final runtime environment
FROM alpine:latest

WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/main .

# Copy Firebase credentials into the container
COPY ./db/prog2052-project-firebase-adminsdk-hfyvm-bb27e2ade7.json /app/db/prog2052-project-firebase-adminsdk-hfyvm-bb27e2ade7.json

# Expose the port the application listens on
EXPOSE 8080

# Run the Go application
CMD ["./main", "-host", "0.0.0.0"]
# Ensure the backend is accessible from other containers and hosts


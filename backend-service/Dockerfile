FROM rust:1.92 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release -p backend-service

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/backend-service /usr/local/bin/
EXPOSE 3000
CMD ["backend-service"]

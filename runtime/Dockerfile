# Build stage
FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Rust nightly via rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain nightly
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

# Copy only dependency files first for better caching
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release && rm -rf src target/release/zkpruntime target/release/deps/zkpruntime*

# Copy source and build the real binary
COPY src ./src
RUN cargo build --release && \
    ls -lh target/release/zkpruntime

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    git \
    binutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/zkpruntime ./

# Make sure the binary is executable
RUN chmod +x ./zkpruntime

# Verify the binary exists and check its dependencies
RUN ls -la ./zkpruntime && file ./zkpruntime && ldd ./zkpruntime 2>&1 || echo "Checking dependencies..."

EXPOSE 3000

# Run with all output visible
CMD ./zkpruntime

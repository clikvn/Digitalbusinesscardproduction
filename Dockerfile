# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for environment variables (Vite needs these at build time)
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_ANON_KEY

# Set as environment variables for Vite build
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the application (env vars are now available during build)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only (express, @supabase/supabase-js)
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/build ./build

# Copy server file
COPY server.js ./

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set environment variables (will be overridden by Cloud Run)
ENV PORT=8080
ENV VITE_SUPABASE_PROJECT_ID=""
ENV VITE_SUPABASE_ANON_KEY=""

# Start Node.js server
CMD ["node", "server.js"]


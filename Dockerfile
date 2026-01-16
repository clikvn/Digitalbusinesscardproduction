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

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

# Copy built files from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Node.js OG handler
COPY server/og-handler.js /app/server/og-handler.js

# Copy package.json for dependencies
COPY package.json /app/package.json

# Install only production dependencies needed for OG handler
WORKDIR /app
RUN npm ci --production --ignore-scripts

# Create supervisor config
RUN mkdir -p /etc/supervisor.d
RUN echo '[supervisord]' > /etc/supervisor.d/supervisord.ini && \
    echo 'nodaemon=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'user=root' >> /etc/supervisor.d/supervisord.ini && \
    echo '' >> /etc/supervisor.d/supervisord.ini && \
    echo '[program:nginx]' >> /etc/supervisor.d/supervisord.ini && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autostart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo '' >> /etc/supervisor.d/supervisord.ini && \
    echo '[program:og-handler]' >> /etc/supervisor.d/supervisord.ini && \
    echo 'command=node /app/server/og-handler.js' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autostart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo 'environment=SUPABASE_URL="",SUPABASE_ANON_KEY="",VITE_SUPABASE_PROJECT_ID="",VITE_SUPABASE_ANON_KEY=""' >> /etc/supervisor.d/supervisord.ini

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start supervisor (runs both nginx and Node.js server)
# Environment variables from Cloud Run will be available to both processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

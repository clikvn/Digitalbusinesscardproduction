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

# Create nginx directories
RUN mkdir -p /var/log/nginx /var/lib/nginx /run/nginx

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
RUN mkdir -p /etc/supervisor.d && \
    echo '[supervisord]' > /etc/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisord.conf && \
    echo 'user=root' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[include]' >> /etc/supervisord.conf && \
    echo 'files = /etc/supervisor.d/*.ini' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[program:nginx]' > /etc/supervisor.d/nginx.ini && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisor.d/nginx.ini && \
    echo 'autostart=true' >> /etc/supervisor.d/nginx.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/nginx.ini && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor.d/nginx.ini && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor.d/nginx.ini && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor.d/nginx.ini && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor.d/nginx.ini && \
    echo '' >> /etc/supervisor.d/nginx.ini && \
    echo '[program:og-handler]' > /etc/supervisor.d/og-handler.ini && \
    echo 'command=node /app/server/og-handler.js' >> /etc/supervisor.d/og-handler.ini && \
    echo 'autostart=true' >> /etc/supervisor.d/og-handler.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/og-handler.ini && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor.d/og-handler.ini && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor.d/og-handler.ini && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor.d/og-handler.ini && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor.d/og-handler.ini

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start supervisor (runs both nginx and Node.js server)
# Environment variables from Cloud Run will be available to both processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

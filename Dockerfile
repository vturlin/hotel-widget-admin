# syntax=docker/dockerfile:1.6

# ───── Stage 1: install & build ─────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifest first for better layer caching
COPY package.json ./
RUN npm install

# Copy the rest and build the Vite frontend into ./dist
COPY . .
RUN npm run build

# ───── Stage 2: runtime ─────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install ONLY production deps (no Vite, no plugin-react)
COPY package.json ./
RUN npm install --omit=dev

# Copy the server and the built frontend from the builder stage
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Non-root for security
RUN addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs appuser
USER appuser

EXPOSE 8080
CMD ["node", "server.js"]
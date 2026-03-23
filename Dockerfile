FROM node:20-alpine AS builder

# Set up the shared workspace
WORKDIR /app
COPY ./shared ./shared

# Set up the backend workspace
WORKDIR /app/backend
COPY ./backend/package*.json ./
RUN npm ci --only=production
COPY ./backend ./

# Final runtime image
FROM node:20-alpine
WORKDIR /app

# Copy shared logic so TS compiler can find it
COPY --from=builder /app/shared ./shared

# Copy backend files
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/src ./backend/src
COPY --from=builder /app/backend/tsconfig.json ./backend/

RUN npm install -g ts-node

EXPOSE 2567
WORKDIR /app/backend
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]

FROM node:20-alpine

# Set up the shared workspace
WORKDIR /app
COPY ./shared ./shared

# Set up the backend workspace
WORKDIR /app/backend
COPY ./backend/package*.json ./
RUN npm ci --only=production

# Globally install tsx to completely bypass ts-node compilation errors
RUN npm install -g tsx

# Copy the rest of the backend files
COPY ./backend ./

EXPOSE 2567
CMD ["tsx", "src/index.ts"]

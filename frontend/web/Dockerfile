# FridgeWise Landing Page - Simplified Docker build
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
COPY package-lock.json ./

# Verify files are copied and install dependencies
RUN ls -la && \
    if [ -f package-lock.json ]; then \
        echo "Using npm ci with lock file" && npm ci; \
    else \
        echo "No lock file found, using npm install" && npm install; \
    fi

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
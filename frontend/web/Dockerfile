# FridgeWise Landing Page - Simplified Docker build
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
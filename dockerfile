# Stage 1: Build the TypeScript code
FROM node:20 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if exists) to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Serve the built app
FROM node:20 AS runtime

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts/start.sh ./scripts/start.sh

# Install only production dependencies
RUN npm install --production && \
    chmod +x ./scripts/start.sh

# Set performance-related environment variables
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV UV_THREADPOOL_SIZE=32

# Expose the application port
EXPOSE 3000

# Set the default command to start the app
CMD ["./scripts/start.sh"]

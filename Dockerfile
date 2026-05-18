# Production Dockerfile for YouTube Creator Backend
FROM node:22-slim

# 1. Install python3 and certificates needed by youtube-dl-exec / yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Inject build-time env flags
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1
ENV NODE_ENV=production

# 4. Copy package manifests first to leverage Docker build cache
COPY package*.json ./

# 5. Perform clean production-only dependency install
RUN npm ci

# 6. Copy the rest of the application files
COPY . .

# 7. Compile TypeScript into JavaScript
RUN npm run build

# 8. Expose the server port
EXPOSE 5000

# 9. Launch the backend server
CMD ["npm", "start"]

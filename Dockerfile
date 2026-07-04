FROM node:20-slim

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package*.json ./

# Install ALL deps (dev too — tsx and drizzle-kit are needed at runtime)
RUN npm ci

# Copy the rest of the source
COPY . .

EXPOSE 8080

# Migrations run at container start (not during image build),
# so DATABASE_URL is available from Dokploy env vars.
CMD ["npm", "run", "start"]

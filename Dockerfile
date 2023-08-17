FROM node:16.13.2-alpine AS base

WORKDIR /app

FROM base AS builder

# Copy package.json
COPY package.json package.json

# Install dependencies 
RUN npm install 

# Copy source code
COPY . .

# Build the app
RUN npm run build

FROM base as runtime

# Copy package.json and install production dependencies
COPY package.json /app/package.json
RUN npm install --production

# Copy built artifacts from build image
COPY --from=builder /app/dist ./dist

# Write .env file even though it's not used in production (except by a package)
RUN touch /app/.env

CMD ["npm", "start"]

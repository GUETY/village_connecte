# ---- Stage 1: Build ----
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .

# Vite inlines env vars at build time — pass them via --build-arg / ARG
ARG VITE_API_URL
ARG VITE_API_BASE_URL

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

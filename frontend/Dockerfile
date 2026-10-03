# ==========================================
# Stage 1: Build the React + Vite Frontend
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Serve with Lightweight Nginx
# ==========================================
FROM nginx:alpine

# Copy built static files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy and SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

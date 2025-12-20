# --- Tahap 1: Build React ---
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# MENERIMA VARIABEL DARI DOCKER-COMPOSE
# Agar axios tahu kemana harus menembak API
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build React menjadi file statis (HTML/CSS/JS)
RUN npm run build

# --- Tahap 2: Serve dengan Nginx Kecil ---
FROM nginx:stable-alpine as production-stage

# Hapus config default bawaan
RUN rm /etc/nginx/conf.d/default.conf

# Copy konfigurasi nginx internal kita (yang menangani React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ambil hasil build dari Tahap 1, taruh di folder web Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
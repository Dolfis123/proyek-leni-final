# --- Dockerfile untuk BACKEND (API) ---
FROM node:18-alpine

WORKDIR /app

# Copy package.json dulu
COPY package*.json ./

# Install dependency
RUN npm install

# Copy sisa kode
COPY . .

# Expose port 5000
EXPOSE 5000

# Jalankan server
CMD ["npm", "start"]
# Gunakan versi Node.js yang ringan (Alpine)
FROM node:18-alpine

# Buat folder kerja di dalam container
WORKDIR /app

# Copy daftar dependency dulu (biar cache efisien)
COPY package*.json ./

# Install dependency
RUN npm install

# Copy seluruh sisa kode program
COPY . .

# Buka port 5000 (Internal Container)
EXPOSE 5000

# Jalankan server
CMD ["npm", "start"]

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Bygg TS og generer Prisma-klient
RUN npm run build || true
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Kjør migreringer før serverstart
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

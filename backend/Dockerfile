FROM node:20-alpine
WORKDIR /app

# 1) Install deps
COPY package*.json ./
RUN npm install

# 2) Copy the rest (ts, prisma schema, tsconfigs, etc.)
COPY . .

# 3) Generate Prisma client (types available for tsc)
RUN npx prisma generate

# 4) Build TS and prove dist exists
RUN npm run build
RUN ls -la dist && ls -la dist/routes || (echo "dist not found" && exit 1)

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# 5) Run migrations, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
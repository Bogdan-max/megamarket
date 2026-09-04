FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json backend/
WORKDIR /app/backend
RUN npm install
COPY backend/prisma ./prisma/
RUN npx prisma generate
COPY backend/src ./src/
COPY backend/tsconfig.json backend/nest-cli.json ./
RUN npm run build
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
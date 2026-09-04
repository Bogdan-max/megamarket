FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json backend/.npmrc ./
COPY backend/src ./src/

RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
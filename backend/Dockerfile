FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json nest-cli.json ./
RUN npx prisma generate
RUN npx nest build
RUN npx ts-node prisma/seed.ts

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist/
COPY --from=build /app/node_modules ./node_modules/
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma/
RUN npx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

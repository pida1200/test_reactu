# Fáze 1: build React frontendu
FROM node:20-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Fáze 2: běh (Node server + statický frontend)
FROM node:20-alpine
WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/*.js ./server/
COPY --from=frontend-build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
ENV PUBLIC_DIR=/app/dist

EXPOSE 3000

CMD ["node", "server/server.js"]

FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src/ src/
RUN mkdir -p /app/data
VOLUME /app/data
ENTRYPOINT ["node", "src/index.js"]

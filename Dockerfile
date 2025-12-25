# Single-service deploy: builds the React frontend and serves it from the Node/Express backend

FROM node:20-alpine AS build
WORKDIR /app

# Backend deps
COPY package.json package-lock.json ./
RUN npm ci

# Frontend deps + build
COPY FRONTEND/package.json FRONTEND/package-lock.json ./FRONTEND/
RUN npm ci --prefix FRONTEND

COPY . .
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install backend production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY src ./src
COPY scripts ./scripts
COPY supabase ./supabase
COPY README.md ./README.md

# Copy built frontend
COPY --from=build /app/FRONTEND/build ./FRONTEND/build

EXPOSE 3000
CMD ["node", "src/server.js"]

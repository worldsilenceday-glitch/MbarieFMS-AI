# ===== Backend Build Stage =====
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server .
RUN npm run build

# ===== Frontend Build Stage =====
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client .
RUN npm run build

# ===== Production Stage =====
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for server
COPY --from=server-build /app/server/package*.json ./
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/prisma ./prisma

# Copy built client files
COPY --from=client-build /app/client/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Install Prisma client and generate
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]

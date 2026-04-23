FROM node:22-alpine

WORKDIR /app

# Copy only dependency files first (for caching)
COPY package.json package-lock.json* ./

RUN npm ci

# Copy the rest of the code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

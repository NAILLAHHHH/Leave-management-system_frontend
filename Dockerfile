FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Expose port 3000 (Vite's default port)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev", "--", "--host"]
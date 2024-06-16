FROM node:16


WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port 
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
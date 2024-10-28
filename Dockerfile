# Use Node 18 as base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Remove the build step for development
# RUN npm run build  

# Expose port 3001
EXPOSE 3001

# Use development mode
CMD ["sh", "-c", "npm run dev -- -p 3001"]

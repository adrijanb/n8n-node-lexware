# Use the official n8n image as base
FROM n8nio/n8n:latest

# Switch to root user to install dependencies
USER root

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Install TypeScript and Gulp globally as root
RUN npm install -g typescript gulp-cli

# Switch back to node user
USER node

# Set working directory
WORKDIR /home/node

# Copy the custom node files
COPY --chown=node:node . /home/node/n8n-node-lexware/

# Change to the custom node directory
WORKDIR /home/node/n8n-node-lexware

# Install dependencies and build the node
RUN npm install && \
    npm run build

# Link the custom node globally
RUN npm link

# Change to n8n directory and link the custom node
WORKDIR /usr/local/lib/node_modules/n8n
RUN npm link n8n-node-lexware

# Set the working directory back to n8n home
WORKDIR /home/node

# Start n8n
CMD ["n8n", "start"]

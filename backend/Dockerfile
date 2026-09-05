FROM node:22-alpine
USER root
WORKDIR /app
RUN apk add --no-cache git
# Ensure development process managers are baked straight into the system layer
RUN npm install -g nodemon pino-pretty
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

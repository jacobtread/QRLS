FROM node:alpine

WORKDIR /usr/src/qrls

COPY package*.json ./
COPY data ./data
COPY .env ./.env
RUN npm install

# FOR PRODUCTION
# RUN npm install --only=production

COPY . .

# APPLICATION PORT
EXPOSE 8080
ENV PORT 8080


CMD ["node", "./bin/www"]
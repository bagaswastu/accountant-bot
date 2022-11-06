FROM node:16-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn prisma db push
EXPOSE 80
CMD ["yarn", "start"]
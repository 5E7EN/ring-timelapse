FROM node:16.13.2 AS BUILD_IMAGE

# Install node-prune
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

WORKDIR /work

COPY . /work/

# Install dependencies 
RUN npm install 

# Build the app
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Run node prune
RUN /usr/local/bin/node-prune

FROM node:16.13.2-alpine

# Install ffmpeg
RUN apk add  --no-cache ffmpeg

ENV TOKEN=$TOKEN 
# ENV CRON_SCHEDULE="*/1 * * * *"
ENV CRON_SCHEDULE="*/15 * * * *"
ENV CRON_SCHEDULE_TIMELAPSE="0 7 * * *"

WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /work/dist ./dist
COPY --from=BUILD_IMAGE /work/node_modules ./node_modules
COPY --from=BUILD_IMAGE /work/package.json .

# Setup the cron job to 
RUN echo "$CRON_SCHEDULE cd /app && npm run snapshot" >> /etc/crontabs/root
RUN echo "$CRON_SCHEDULE_TIMELAPSE cd /app && npm run timelapse" >> /etc/crontabs/root

# Create the cron log
RUN touch /var/log/cron.log

# Setup our start file
COPY ./cron/run.sh /tmp/run.sh
RUN chmod +x /tmp/run.sh 

CMD ["/tmp/run.sh"]

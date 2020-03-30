# base image node 
FROM node:10.16.1


## ALl this section comes from documentation for PUPPERTEER
## https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

## Prevent freezing container by pupperteer
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Run everything after as non-privileged user.
USER pptruser

## Continue as usual for any Dockerfile for NodeJS App
RUN mkdir /home/pptruser/app
WORKDIR /home/pptruser/app

# add '/usr/src/app/node_modules/.bin' to $PATH
ENV PATH /home/pptruser/app/node_modules/.bin:$PATH

COPY WebScraping/package*.json ./
COPY WebScraping/* ./

# Install puppeteer so it's available in the container.
RUN npm install puppeteer
RUN npm install

EXPOSE 8000

## This comes from documentation, to prevent freezing on container by puppeteer
## https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "verificar.js"]
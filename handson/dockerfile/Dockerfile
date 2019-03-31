FROM node

ENV NODE_ENV=production

WORKDIR /scripts

COPY . .

RUN npm install \
 && groupadd app \
 && useradd -g app -m app \
 && mv /root/.config /home/app/ \
 && chown -R app:app /scripts /home/app/.config

USER app

CMD ["npm", "start"]

FROM ubuntu

RUN DEBIAN_FRONTEND=noninteractive apt update -y
RUN DEBIAN_FRONTEND=noninteractive apt upgrade -y
RUN DEBIAN_FRONTEND=noninteractive apt install curl -y
RUN DEBIAN_FRONTEND=noninteractive apt install net-tools -y
RUN DEBIAN_FRONTEND=noninteractive apt install nodejs -y
RUN DEBIAN_FRONTEND=noninteractive apt install npm -y
RUN DEBIAN_FRONTEND=noninteractive apt install vim -y


RUN mkdir /pxlsweb

WORKDIR /pxlsweb

#copy the dirs
COPY po/ /pxlsweb/po/
COPY public/ /pxlsweb/public/
COPY scripts/ /pxlsweb/scripts/
COPY views/ /pxlsweb/views/

#copy the files
COPY config.example.json5 /pxlsweb/
COPY config.json5 /pxlsweb/
COPY gulpfile.js /pxlsweb/
COPY index.js /pxlsweb/
COPY LICENSE.md /pxlsweb/
COPY package.json /pxlsweb/
COPY package-lock.json /pxlsweb/
COPY README.md /pxlsweb/
COPY utils.js /pxlsweb/

EXPOSE 80
EXPOSE 443

RUN npm install
RUN npm run-script build

CMD ["npm", "start"]

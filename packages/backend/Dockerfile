###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine As build

WORKDIR /var/webrtc-p2p

COPY --chown=node:node package.json ./

RUN npm config set registry https://registry.npm.taobao.org/

RUN npm cache clean --force && npm i

# 复制安装后的依赖包到当前目录下
COPY --chown=node:node . .

# 执行打包命令
RUN npm run build

# 设置生产环境变量
ENV NODE_ENV production

# 运行' npm ci '会删除现有的node_modules目录，并传入——only=production确保只安装了生产依赖项。这确保node_modules目录尽可能优化
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

# 将生产依赖和打包后的文件复制到指定目录下
COPY --chown=node:node --from=build /var/webrtc-p2p/node_modules ./node_modules
COPY --chown=node:node --from=build /var/webrtc-p2p/dist ./dist

COPY --chown=node:node /html ./html

# 启动服务
CMD [ "node", "dist/main.js" ]

EXPOSE 3000
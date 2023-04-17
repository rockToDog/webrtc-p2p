# webrtc-p2p

**这是一个简单的webrtc文件传输工具，你可以在任何安装了浏览器的设备之前进行文件传输。     
前端使用vue3，后端使用nestjs。   
使用socket.io提供信令服务，使用webrtc进行p2p数据传输。   
使用monorepo、pnpm组织管理项目。**

### 启动程序
1. 安装依赖
```
pnpm install
```

2. 启动前端
```
pnpm dev:front
```

3. 启动后端
```
pnpm dev:back
```

**如果只启动后端，需要build前端**

```
pnpm build:front
```

**也可以使用docker部署**
```
cd ./packages/backend
npm run build:docker
npm run start:docker
```


### 如何使用
局域网下打开127.0.0.1:5173就能使用

<!-- [![p9PQhAU.png](https://s1.ax1x.com/2023/04/17/p9PQhAU.png)](https://imgse.com/i/p9PQhAU) -->
<img src="https://s1.ax1x.com/2023/04/17/p9PQhAU.png" width="200px" />

也可以将网站保存到桌面使用
<!-- [![p9PQ5h4.png](https://s1.ax1x.com/2023/04/17/p9PQ5h4.png)](https://imgse.com/i/p9PQ5h4)
[![p9PQ7cR.png](https://s1.ax1x.com/2023/04/17/p9PQ7cR.png)](https://imgse.com/i/p9PQ7cR) -->
<div style="display: flex; gap: 20px">
<img src="https://s1.ax1x.com/2023/04/17/p9PQ5h4.png" width="200px" />
<img src="https://s1.ax1x.com/2023/04/17/p9PQ7cR.png" width="200px" />
</div>

传输结果
<!-- [![p9PQ4NF.png](https://s1.ax1x.com/2023/04/17/p9PQ4NF.png)](https://imgse.com/i/p9PQ4NF) -->
<!-- [![p9PQW7T.png](https://s1.ax1x.com/2023/04/17/p9PQW7T.png)](https://imgse.com/i/p9PQW7T) -->
<div style="display: flex; gap: 20px">
<img src="https://s1.ax1x.com/2023/04/17/p9PQ4NF.png" width="200px" />
<img src="https://s1.ax1x.com/2023/04/17/p9PQW7T.png" width="200px" />
</div>






# Resume Studio

本项目是一个本地优先的简历编辑器，前端使用 React + Vite，后端使用 Express 提供本地 API。

## 启动项目

1. 安装依赖

```bash
npm install
```

2. 开发模式启动

```bash
npm run dev
```

- 该命令会同时启动本地 API 和 Vite 开发服务器。
- 默认情况下，API 监听 `http://localhost:4174`，Vite 监听 `http://localhost:5173`。
- 如果端口被占用，Vite 会自动尝试下一个可用端口。

3. 生产模式构建

```bash
npm run build
```

4. 生产模式运行

```bash
npm start
```

## 测试

运行所有测试：

```bash
npm test
```

## 简历信息保存位置

简历数据保存在仓库中的本地文件：

```text
data/resume.json
```

- 该文件由本地 API 读取和写入。
- 项目设计为单用户、本地存储，不依赖云端或外部 API。
- 请不要删除或覆盖该文件，除非您明确要重置简历内容。

## 目录说明

- `src/`：前端源码
- `server/`：本地 API 服务代码
- `shared/`：前端与后端共享的数据模型和校验逻辑
- `data/`：用户简历数据文件

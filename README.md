# Notes（笔记）

一款运行在 Xiaomi Vela 快应用平台上的多功能笔记应用，专为小米手环 9 Pro 与红米手表 5 等方形形可穿戴设备设计。支持富文本样式、Emoji 表情、粗/细体输入、完整标题预览与笔记管理等功能。

---

## 使用项目

本项目在开发过程中使用了以下优秀的开源项目与技术栈：

| 项目 | 说明 | 协议 / 地址 |
|---|---|---|
| **ResonaUI** | 基于 Xiaomi Vela 的可穿戴设备 UI 框架，提供页面动画、路由、存储与组件支持 | [AGPL-3.0](https://github.com/B4QAQ/ResonaUI) |
| **Vela_input_method** | 可穿戴设备输入法组件 | [B4QAQ/Vela_input_method](https://github.com/B4QAQ/Vela_input_method) |
| **Xiaomi Vela JS framework** | 小米 Vela 快应用开发框架 | [官方文档](https://iot.mi.com/vela/quickapp/zh/) |

---

## 开发

### 环境要求

- Node.js >= 8.10
- npm（或 pnpm）
- Xiaomi Vela 快应用 IDE（推荐）

### 安装依赖

```bash
npm install
```

### 启动开发模式

```bash
npm start
```

### 构建调试包

```bash
npm run build
```

构建产物位于 `dist/` 目录下，生成的 `.rpk` 文件可用于调试安装。

### 目录说明

```
src/
├── app.ux                        # 应用入口
├── manifest.json                 # 应用配置
├── common/                       # 公共资源
│   ├── js/                       # 公共 JS 模块（uiAdm、storage、notesStore 等）
│   ├── css/                      # 公共样式
│   ├── emoji/                    # Emoji 图片资源
│   └── others/                   # 其他静态资源
├── components/                   # 可复用组件
│   └── InputMethod/              # 输入法组件
└── pages/                        # 页面
    ├── index/                    # 主页/笔记列表
    ├── edit/                     # 笔记编辑/详情页
    └── menu/                     # 设置/菜单页
```

### 继续开发

1. 使用 Vela 快应用 IDE 打开本项目根目录。
2. 在 `src/` 目录下修改页面 `.ux` 文件、公共脚本或样式。
3. 运行 `npm start` 开启热更新调试，或运行 `npm run build` 生成安装包。
4. 在真机或模拟器上安装 `.rpk` 文件进行测试。

---

## 开源协议

本项目采用 [AGPL-3.0](LICENSE) 开源协议。

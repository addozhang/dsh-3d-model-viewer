# DSH 3D Model Viewer

**默认英文文档：[README.md](README.md)**

DeepSeek Harness Web GUI 的本地交互式 STL / 3MF 预览插件。模型可直接在侧边栏文档预览中查看，无需外部工具；同时为活动会话提供实时预览抽屉。

## 功能

- **侧边栏原生文档预览**：在「文件」面板点击 `.stl` / `.3mf`，右侧文档标签页像打开 Markdown / PDF / 图片一样打开 3D 视图（通过公开的 `documentPreviews` + `sidebar.right.tab.document` 扩展点接入）
- **会话实时抽屉**：当前会话引用了模型时，会话标题栏出现 `3D 预览 (N)` 按钮，打开带搜索列表的预览抽屉；文件在磁盘上变化后约 1.5 秒自动重新解析
- **CAD 式导航**：左键拖动旋转（真轨迹球，无万向锁）、右键 / 中键 / Shift 拖动平移、滚轮缩放（透视与正交通用）、双击复位
- **视角预设**：前/后/左/右/顶/底使用正交相机并显示包围盒三向尺寸标签（毫米）；等轴测为经典透视。画布聚焦时快捷键 `1-7` 切视角、`R` 复位
- **模型颜色**：七个预置色板（含白色）+ 原生取色器；STL 单色渲染，3MF 的部件颜色（`basematerials`）按顶点多色显示
- **打印检查**（当前由 `PRINT_INSIGHTS_ENABLED` 开关关闭）：打印机体积适配（默认 X2D）、封闭网格体积、耗材重量估算
- **截图导出**：一键保存当前视图为 PNG
- **跟随系统主题**：浅色/深色平面背景（`prefers-color-scheme`），附淡网格线

所有解析都在浏览器本地完成，模型文件不会离开本机（抽屉仅从本地插件端点拉取文件）。

## 安装

```bash
dsh plugin --profile web add /path/to/dsh-3d-model-viewer
```

然后在 `$DSH_HOME/profiles/web/cordis.patch.yml` 中插入：

```yaml
- insert:
    - id: 3d-model-viewer
      name: '@local/dsh-3d-model-viewer'
```

刷新 Web GUI；若客户端 roster 未更新，重启 `dsh web` 后再刷新。

## 开发

```bash
npm install
npm run build    # esbuild：src/ -> lib/client.js
npm test         # 单测 + 构建产物冒烟测试（node --test）
npm run test:e2e # 起私有 dsh web 实例 + Playwright 驱动真实 GUI（仅本机）
```

`src/` 模块划分：`core`（React 注入与状态存储）、`styles`、`parse`（STL 二进制/ASCII、3MF zip + basematerials、网格体积）、`viewer`（WebGL 渲染器、预设、拾取数学）、`ui`（文档预览体、抽屉、打印检查面板）、`app`（注册）、`entry-client`。

e2e 脚本依赖本机 python3 + playwright + Chrome，从 `~/.dsh/.credentials.yaml` 读取签名密钥为私有实例铸造会话 cookie。环境变量：`E2E_WORKSPACE`、`E2E_WORKSPACE_DIR`、`E2E_SESSION_SUBSTR`。

## 当前限制

- 3MF 支持网格几何 + `basematerials` 颜色；build-item 变换、组件级覆盖与切片器私有元数据不还原
- 单文件限制 250 MB / 500 万三角面；超过 40 万三角面的网格拾取只用包围盒（按键式拖动模式下影响甚微）
- 这是几何预览器：不做切片，不做可制造性分析

## 许可

MIT

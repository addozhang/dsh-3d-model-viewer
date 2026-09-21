# DSH 3D Model Viewer

DeepSeek Harness Web GUI 的本地交互式 STL / 3MF 预览插件。

## 功能

- 自动扫描当前 DSH 工作区中的 `.stl`、`.3mf`
- 工作区存在模型时，在当前会话标题栏显示“3D 预览”入口
- 点击后从右侧打开独立预览抽屉，聊天内容保持可见
- 每 1.5 秒检查模型修改时间，变化后自动重新加载
- 右侧抽屉采用双栏布局：左侧是可搜索、可滚动的模型列表，右侧是 3D 画布
- 文件列表显示 STL/3MF 类型、文件大小和更新时间，点击即可切换模型
- 浏览器本地打开或拖放其他 `.stl`、`.3mf`
- 鼠标/触控拖动旋转
- 滚轮缩放
- 自动居中与适配视图
- 显示模型尺寸、三角面和顶点数量

## 安装

```bash
dsh plugin --profile web add /Users/addo/workspaces/private_w/dsh-3d-model-viewer
```

然后在 `$DSH_HOME/profiles/web/cordis.patch.yml` 中插入：

```yaml
- insert:
    - id: 3d-model-viewer
      name: '@local/dsh-3d-model-viewer'
```

刷新现有 Web GUI；如客户端 roster 没有更新，则重启 `dsh web` 后刷新。

## 使用

如果当前工作区中存在 STL/3MF，会话标题栏会自动出现“3D 预览 (N)”按钮。点击后在右侧打开实时预览抽屉。也可以点击左侧栏底部的“3D 模型预览”，手动选择或拖入任意本地模型。

## 当前限制

- 3MF 支持标准 mesh 资源；复杂 component/build transform、颜色和切片器专属元数据暂不还原。
- 单文件限制为 250 MB、500 万三角面。
- 这是几何预览器，不执行切片或打印可制造性分析。

## 侧边栏原生文档预览（v0.2 新增）

除抽屉式预览外，本插件还把 `.stl` / `.3mf` 注册为侧边栏「文件」面板的原生文档预览：

- 在侧边栏文件树中直接点击 STL / 3MF 文件，右侧文档标签页像打开 PDF 一样打开 3D 视图
- 通过公开扩展点接入：`ctx.documentPreviews.register()` 声明 `extensions: ["stl","3mf"]`、`priority: "extension"`（优先于内置实现）
- body 组件注册在 keyed slot `sidebar.right.tab.document`，key 为 `@local/dsh-3d-model-viewer/model3d`
- 文件内容以 `content.kind === "bytes"` 完整字节到达后，在浏览器本地解析（复用同一套 STL/3MF 解析器）
- 画布支持拖动旋转、滚轮缩放，左下角显示文件名、三角面数与包围盒尺寸（mm）
- `binaryExtensions` 声明后，STL/3MF 不再落入纯文本回退预览

## v0.2：源码化重构 + 打印检查

- 仓库改为 `src/` 多文件源码（core / styles / parse / viewer / ui / app），`npm run build` 用 esbuild 生成 `lib/client.js`
- 轴向视角（前/后/左/右/顶/底）自动切换正交投影，正交视图下显示包围盒三向尺寸标签（X 红 / Y 绿 / Z 蓝，毫米）；手动拖拽旋转自动回到透视
- `npm test`：解析与体积数学单测 + 构建产物冒烟测试
- 打印检查面板（文档预览底部 / 抽屉底部）：
  - 打印机适配：H2D 350×320×325 / X1C·P1 256³ / A1 256×210×210 / A1 mini 180³，超出当前所选幅面时红色告警
  - 网格封闭体积（cm³，符号四面体法）
  - 耗材估算：材料（PLA/PETG/PC/ABS/TPU）× 填充率（10–100%），壁壳开销按非填充部分 25% 近似

## v0.3：轨迹球旋转 + 平移 + 快捷键 + 截图

- **真 3D 轨迹球旋转**：拖动模型时用屏幕空间增量旋转矩阵替代欧拉角，无万向锁、无俯仰夹角，上下拖到任何角度都自然
- **拖动分区**：pointerdown 时对模型做射线拾取（包围盒粗测 + Möller–Trumbore 三角测试）——光标在模型上→旋转（抓取光标），在背景上→平移模型位置（移动光标）
- **键盘快捷键**（画布获得焦点后）：`1-7` 切换预设视角，`R` 复位默认视角
- **截图导出**：工具栏「截图」按钮，当前视图存为 PNG（文件名取模型名 + 时间戳）

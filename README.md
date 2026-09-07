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

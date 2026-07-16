## MODIFIED Requirements

### Requirement: 下拉菜单归属

工具栏 SHALL 包含两个下拉菜单，按操作语义归属：

1. **导出 ▾**：文件生成操作
   - 导出图片（ExportImageIcon：图框 + 下载箭头）
   - 导出 PPTX（ExportPptxIcon：演示屏幕 + 折线图）
   - 含图例（checkbox，keepOpen）

2. **工作区 ▾**：状态管理操作
   - 导出工作区（ExportWorkspaceIcon：下载箭头 + 托盘）
   - 导入工作区（ImportWorkspaceIcon：上传箭头 + 托盘）
   - 新建工作区（NewWorkspaceIcon：文件 + 加号，danger 样式）

#### Scenario: 导出下拉仅含文件生成操作

- **WHEN** 用户点击"导出"下拉菜单
- **THEN** 菜单项为：导出图片、导出 PPTX、含图例（checkbox）
- **THEN** 菜单中不包含导出工作区或导入工作区

#### Scenario: 工作区下拉含状态管理操作

- **WHEN** 用户点击"工作区"下拉菜单
- **THEN** 菜单项为：导出工作区、导入工作区、新建工作区

#### Scenario: 下拉菜单不被渲染区遮挡

- **WHEN** 用户点击任一下拉菜单
- **THEN** 下拉菜单完整显示在图表渲染区之上（z-index 高于图表区域）
- **THEN** 下拉菜单不被垂直方向裁切

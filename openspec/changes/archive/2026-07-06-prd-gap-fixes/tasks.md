## 1. Store & Types Foundation

- [ ] 1.1 扩展 `CurveData` 类型：新增 `displayName?: string` 和 `metadata?: Record<string, string>` 字段
- [ ] 1.2 curveStore 新增 `stagingOrder: string[]` 状态和 `setStagingOrder` action
- [ ] 1.3 uiStore 新增 `selectedCurveId: string | null` 状态和 `setSelectedCurveId` action
- [ ] 1.4 `toggleCurveVisibility` 同步更新 `stagingOrder`（可见时追加，不可见时移除）
- [ ] 1.5 `removeCurve` 和 `removeSelectedCurves` 同步清理 `stagingOrder`

## 2. Parser Metadata Pass-through

- [ ] 2.1 `parseFileContent` 将 `ParsedFile.metadata` 传递到每条 `CurveData.metadata` 中

## 3. Left Panel: 叠图区/未叠图区分区 + 拖拽

- [ ] 3.1 CurveList 拆分为两个区域："叠图区"（stagingOrder 中的曲线）和"未叠图数据区"（其余曲线）
- [ ] 3.2 各区域显示标题和曲线数量统计
- [ ] 3.3 叠图区曲线支持 HTML5 拖拽排序（draggable + onDragStart/onDragOver/onDrop）
- [ ] 3.4 拖拽结束后调用 `setStagingOrder` 更新排序

## 4. Left Panel: 基准线标识

- [ ] 4.1 基准线所在行显示 ★ 星标标识（在曲线名称左侧）
- [ ] 4.2 切换基准线后 ★ 实时更新

## 5. Left Panel: 右键菜单

- [ ] 5.1 曲线行绑定 `onContextMenu` 事件，阻止默认行为
- [ ] 5.2 实现 ContextMenu 组件：含"设为对齐基准线"和"删除曲线"选项
- [ ] 5.3 点击菜单外部或按 Escape 关闭菜单
- [ ] 5.4 已是基准线的曲线显示"设为对齐基准线"为禁用状态

## 6. Left Panel: 曲线别名

- [ ] 6.1 曲线名称显示逻辑：优先使用 `displayName`，回退到 `name`
- [ ] 6.2 双击曲线名称进入编辑模式（inline input），Enter 确认、Escape 取消
- [ ] 6.3 确认后更新 `displayName`，图表图例同步更新

## 7. Left Panel: 搜索/筛选

- [ ] 7.1 左栏顶部添加搜索输入框
- [ ] 7.2 实现客户端过滤逻辑（不区分大小写，匹配 `name` 和 `displayName`）
- [ ] 7.3 无匹配时显示"无匹配结果"提示
- [ ] 7.4 无曲线时搜索框隐藏

## 8. Brace Tool: 修复 + 工具按钮

- [ ] 8.1 移除 BraceOverlay 的 `pointer-events-none` CSS 类和 Shift+拖拽交互
- [ ] 8.2 工具栏新增"插入大括号"按钮，点击进入放置模式（uiStore 管理 `bracePlacementMode`）
- [ ] 8.3 放置模式下：第一次点击图表设置起点，第二次点击设置终点
- [ ] 8.4 终点设置后弹出标签输入对话框，确认后创建大括号，自动退出放置模式
- [ ] 8.5 保留大括号的点击编辑（标签修改/删除）和 dataZoom 联动功能
- [ ] 8.6 大括号坐标转换改用 ECharts `convertToPixel` API

## 9. Right Panel: 元数据展示

- [ ] 9.1 创建 MetadataPanel 组件，显示在右侧栏顶部
- [ ] 9.2 默认显示占位提示"点击曲线查看元数据"
- [ ] 9.3 点击曲线行选中曲线（`setSelectedCurveId`），显示对应的 metadata 键值对
- [ ] 9.4 无 metadata 时显示"该曲线无元数据"
- [ ] 9.5 再次点击已选中曲线取消选中

## 10. WaterfallChart: 渲染顺序

- [ ] 10.1 图表 series 顺序按 `stagingOrder` 排列（而不是 `Object.keys(curves)`）
- [ ] 10.2 基准线始终使用 `layerYOffset = 0`（图表最下侧），其他曲线按 `stagingOrder` 依次叠加

## 11. Persistence: 扩展持久化字段

- [ ] 11.1 persist 快照新增 `stagingOrder`、`visibleCurves`、`displayName` 映射
- [ ] 11.2 restore 时恢复 `stagingOrder`、`visibleCurves`、`displayName`

## 12. Verification

- [ ] 12.1 验证右键菜单：设为基准线、删除曲线功能正常
- [ ] 12.2 验证叠图区/未叠图区分区：勾选进入叠图区，取消勾选回到未叠图区
- [ ] 12.3 验证拖拽排序：拖拽后图表渲染顺序同步更新
- [ ] 12.4 验证基准线 ★ 标识和渲染位置（最下侧）
- [ ] 12.5 验证大括号创建：工具按钮 → 两次点击图表 → 输入标签 → 创建成功
- [ ] 12.6 验证曲线别名：双击编辑 → 显示名称在图表和列表中生效
- [ ] 12.7 验证搜索筛选：输入文字过滤，清空恢复
- [ ] 12.8 验证元数据展示：选中曲线后右侧栏显示 metadata
- [ ] 12.9 验证持久化：刷新后叠图区状态、显示名称、可见性恢复
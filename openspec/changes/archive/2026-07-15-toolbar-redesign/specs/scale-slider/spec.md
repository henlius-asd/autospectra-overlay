## MODIFIED Requirements

### Requirement: 两个独立缩放按钮

工具栏 SHALL 提供两个独立图标按钮：「全局缩放」和「单曲线缩放」，各自独立开关，不互斥。按钮 SHALL 使用内联 SVG 图标，激活时显示填充图标 + `bg-blue-500 text-white`，未激活时显示描边图标 + `text-gray-600 hover:bg-gray-200`。按 Esc 键 SHALL 取消选中曲线但不退出缩放模式。

#### Scenario: 独立开关

- **WHEN** 用户点击「全局缩放」图标按钮
- **THEN** `globalScaleMode` 切换 on/off，不影响 `perCurveScaleMode`

#### Scenario: 两者同时激活

- **WHEN** 用户先激活「全局缩放」，再激活「单曲线缩放」
- **THEN** 两者都为 on，滚轮优先作用于选中曲线

#### Scenario: 按钮视觉区分

- **WHEN** 全局缩放激活而单曲线缩放未激活
- **THEN** 全局缩放按钮显示填充图标 + 蓝色背景，单曲线缩放按钮显示描边图标
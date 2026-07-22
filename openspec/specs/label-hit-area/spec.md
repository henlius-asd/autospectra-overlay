# label-hit-area Specification

## Purpose
TBD - created by archiving change label-ux-improvements. Update Purpose after archive.
## Requirements
### Requirement: 区间标签命中区域

区间标签的括号路径 SHALL 在可见描边（2px）下方叠加一条 16px 宽透明描边命中区域，使鼠标在括号周围 8px 范围内均可命中拖拽。标签文字 SHALL 在文本下方叠加透明矩形命中区域。命中区域 SHALL 不改变视觉效果。

#### Scenario: 鼠标靠近括号即可拖拽

- **WHEN** 鼠标指针位于括号路径 8px 范围内
- **THEN** 光标变为 `grab`，按住可拖拽区间标签，无需精确命中 2px 描边

#### Scenario: 标签文字区域可命中

- **WHEN** 鼠标指针位于标签文字周围
- **THEN** 双击弹出编辑浮层，可拖拽移动标签

### Requirement: 点标签命中区域

点标签 SHALL 在文字下方叠加透明矩形命中区域，宽度为 `textW + 8px`，高度为 `fontSize * 1.4`，使鼠标在文字周围均可命中拖拽或双击编辑。

#### Scenario: 鼠标靠近文字即可拖拽

- **WHEN** 鼠标指针位于点标签文字 4px 范围内
- **THEN** 光标变为 `move`，按住可拖拽点标签


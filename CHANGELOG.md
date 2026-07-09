# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Release workflow: see [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

## [0.3.1] - 2026-07-09

### Fixed
- 修复 Y 轴层间距滑块在部分机器上轨道高度塌缩为圆点、无法拖动的问题：将百分比高度 `h-3/5` 从 `<input>` 移到包裹层 div（absolutely positioned，百分比解析到确定高度的定位祖先），input 改用 `flex-1` 填充剩余空间。

## [0.3.0] - 2026-07-09

### Added
- 点标签贴近最高曲线上方（`getTopCurvePixelYAtX` 基线 + 默认 `yOffset = -10`），去除外框 / 对齐原点 / 虚线，仅保留文字。
- 区域标签（brace）整段横向拖拽平移（宽度不变，5px 阈值区分点击 / 拖拽），Y 基线改为最高曲线峰值上方约 14px。
- PNG 导出跟随 `showAxes` 开关：去除图例与 x 轴预览条、保留当前缩放视图、try/finally 还原线上 option。
- 共享纯函数 helper `labelClamp.ts` / `labelGeometry.ts`，保证屏幕与导出标注位置一致。
- `updateBrace` store action（参与 undo/redo）。
- 构建时注入 `__APP_VERSION__`（来自 `package.json`），工具栏显示版本号。

### Changed
- `deploy.yml` 触发条件由 `push: branches: [master]` 改为 `push: tags: ['v*']`，推 master 不再自动部署。

## [0.2.0] - 2026-07-07

### Changed
- 移除过时的 `gh-pages` 分支依赖，改用 GitHub Actions 制品部署（`actions/deploy-pages`）。

## [0.1.0] - 2026-07-07

### Added
- 首个 GitHub Pages 自动部署工作流（push to master 触发构建并发布）。

[Unreleased]: https://github.com/henlius-asd/autospectra-overlay/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.3.1
[0.3.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.3.0
[0.2.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.2.0
[0.1.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/history-v0.1.0

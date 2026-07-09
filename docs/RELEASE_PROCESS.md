# 发布流程完整指南

本文档详细说明 AutoSpectraOverlay 项目的完整发布流程。

---

## 📋 发布前检查清单

### 1. 代码质量验证

```bash
# 确保工作树干净
rtk git status

# 类型检查
rtk tsc

# 构建测试
npm run build

# 如果有测试脚本
# rtk vitest
```

### 2. 版本号一致性检查

发布前必须确认以下三者一致：

- [ ] `package.json` 的 `version` 字段
- [ ] 即将推送的 git tag `v<version>`
- [ ] `CHANGELOG.md` 顶部对应版本小节 + 日期

### 3. CHANGELOG 更新

```markdown
## [Unreleased]

## [0.3.0] - 2026-07-09

### Added
- 新功能描述

### Changed
- 变更描述

### Fixed
- 修复描述
```

底部链接更新：
```markdown
[Unreleased]: https://github.com/henlius-asd/autospectra-overlay/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.3.0
[0.2.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.2.0
```

---

## 🚀 标准发布流程

### 方式 A：使用 npm version（推荐）

```bash
# 1. 确保在 master 分支且代码最新
git checkout master
git pull origin master

# 2. 运行检查
rtk tsc
npm run build

# 3. 更新 CHANGELOG（手动编辑）

# 4. 使用 npm version 自动完成版本更新、提交、打标签
npm version minor  # 0.2.0 → 0.3.0（新功能）
# 或
npm version patch  # 0.3.0 → 0.3.1（bug 修复）

# 5. 推送代码和标签（标签推送触发部署）
git push origin master --follow-tags

# 6. 验证部署
# 等待 2-3 分钟后检查
gh run list --limit 3
```

### 方式 B：手动步骤

```bash
# 1. 更新 package.json 版本号
# 手动编辑 package.json 中的 "version" 字段

# 2. 更新 CHANGELOG.md
# 手动编辑，将 [Unreleased] 改为正式版本

# 3. 提交更改
git add package.json CHANGELOG.md
git commit -m "chore: update version to 0.3.0"

# 4. 打标签
git tag -a v0.3.0 -m "Release v0.3.0"

# 5. 推送
git push origin master --follow-tags
```

---

## ✅ 发布后验证清单

### 1. GitHub Actions 部署

```bash
# 查看最近的 workflow 运行
gh run list --limit 3

# 查看具体运行状态
gh run view <run-id>

# 预期结果：
# - status: completed
# - conclusion: success
# - headBranch: v0.3.0
```

### 2. 线上版本验证

访问 https://henlius-asd.github.io/autospectra-overlay/

- [ ] 页面正常加载
- [ ] 工具栏右下角显示 `v0.3.0`
- [ ] 核心功能正常工作（文件上传、图表显示、对齐等）

### 3. GitHub Release（可选但推荐）

```bash
# 创建 Release（包含变更说明）
gh release create v0.3.0 \
  --title "v0.3.0 - 版本标题" \
  --notes "## 变更内容

### Added
- 新功能

### Changed
- 改进

### Fixed
- 修复"

# 或基于 tag 创建后编辑
gh release create v0.3.0 --generate-notes
```

---

## 🔧 特殊场景处理

### 场景 1：发布后发现严重 bug

```bash
# 不要删除已发布的 tag！

# 方式 A：快速修复
git checkout master
# 修复 bug
git commit -m "fix: 修复严重问题"
npm version patch  # 0.3.0 → 0.3.1
git push origin master --follow-tags

# 方式 B：手动 dispatch 部署指定 commit（不引入新 tag）
# GitHub Actions → Deploy to GitHub Pages → Run workflow
```

### 场景 2：版本号不一致需要修正

```bash
# 1. 更新 package.json 和 CHANGELOG
# 2. 提交
git add package.json CHANGELOG.md
git commit -m "chore: fix version number"

# 3. 删除旧 tag（本地 + 远程）
git tag -d v0.3.0
git push origin :refs/tags/v0.3.0

# 4. 重新打 tag
git tag -a v0.3.0 -m "Release v0.3.0"

# 5. 推送
git push origin master --follow-tags
```

### 场景 3：需要回滚到旧版本

```bash
# ❌ 不要直接推旧版本的 v* tag（会触发部署导致回退）

# ✅ 正确方式：使用 workflow_dispatch
# GitHub Actions → Deploy to GitHub Pages → Run workflow
# 选择要部署的分支/commit

# 或创建回滚 tag（更高版本号）
git tag -a v0.3.1 <稳定版本的commit> -m "rollback to 0.2.0"
git push origin v0.3.1
```

---

## 📊 版本号语义（SemVer）

当前项目处于 `0.x` 开发阶段：

| 变更类型 | 版本变化 | 示例 |
|---------|---------|------|
| 新功能 / 行为变化 | minor | `0.2.0` → `0.3.0` |
| Bug 修复 | patch | `0.3.0` → `0.3.1` |
| 重大重写 / API 破坏 | major | `0.x` → `1.0.0`（稳定后） |

> **注意**：0.x 阶段允许 minor 版本间存在不兼容变更。到 `1.0.0` 后才严格遵循 SemVer 兼容性承诺。

---

## 🔄 自动化流程说明

### GitHub Actions 触发条件

```yaml
on:
  push:
    tags: ['v*']  # 仅推送 v* 标签时部署
  workflow_dispatch:  # 支持手动触发
```

**关键点**：
- 推送 `master` 分支 **不会** 触发部署
- 推送 `v*` 标签 **会** 触发部署
- 手动触发会部署当前 `master` HEAD

### 构建流程

1. 检出代码
2. 安装依赖 (`npm ci`)
3. 类型检查 + 构建 (`npm run build`)
4. 上传到 GitHub Pages

### 版本注入

`vite.config.ts` 在构建时从 `package.json` 读取版本号并注入：

```typescript
define: {
  __APP_VERSION__: JSON.stringify(pkg.version),
}
```

工具栏组件使用：
```typescript
<span>v{__APP_VERSION__}</span>
```

---

## 📝 历史发布记录

| 版本 | 日期 | Commit | 说明 |
|------|------|--------|------|
| v0.3.1 | 2026-07-09 | - | 修复层间距滑块轨道塌缩为圆点、无法拖动的问题 |
| v0.3.0 | 2026-07-09 | `180cc33` | 标注/导出优化，ScaleSlider 交互改进 |
| v0.2.0 | 2026-07-07 | `ed50887` | 移除 gh-pages 分支依赖，改用 Actions 部署 |
| v0.1.0 | 2026-07-07 | `0922261` | 首个 Pages 自动部署版本 |

---

## 🎯 快速参考卡片

### 日常发布（最常用）

```bash
# 1. 检查
rtk git status && rtk tsc && npm run build

# 2. 更新 CHANGELOG（手动）

# 3. 发布
npm version minor  # 或 patch
git push origin master --follow-tags

# 4. 验证
gh run list --limit 1
```

### 紧急修复

```bash
# 修复 → 提交 → patch 版本 → 推送
git commit -m "fix: urgent fix"
npm version patch
git push origin master --follow-tags
```

### 手动部署（不创建 tag）

```
GitHub → Actions → Deploy to GitHub Pages → Run workflow
```

---

## 📚 相关文档

- [VERSIONING.md](./VERSIONING.md) - 版本管理规范
- [CHANGELOG.md](../CHANGELOG.md) - 变更日志
- [deploy.yml](../.github/workflows/deploy.yml) - 部署工作流配置

---

**最后更新**：2026-07-09  
**维护者**：AutoSpectraOverlay 团队

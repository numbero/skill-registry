# 自定义 Skills 存储路径指南

## 概述

Skill Registry 支持自定义 skills 存储路径，让你可以将 skills 存储在任何位置（例如：外部硬盘、云同步目录等）。

---

## 快速开始

### 1. 设置自定义路径

```bash
# 使用绝对路径
skill-registry global set-registry-path /path/to/custom/location

# 使用 ~ (家目录)
skill-registry global set-registry-path ~/my-skills

# 使用相对路径 (相对于 ~/.skill-registry/)
skill-registry global set-registry-path ../my-skills
```

### 2. 查看当前配置

```bash
skill-registry global show
```

输出示例：
```
Registry:
  Skills path: /Users/numbero/my-custom-skills
  Custom path: /Users/numbero/my-custom-skills
```

### 3. 重置为默认路径

```bash
skill-registry global reset-registry-path
```

---

## 详细说明

### 配置文件

自定义路径存储在 `~/.skill-registry/global.yaml` 中：

```yaml
registry:
  path: ~/my-custom-skills

defaults:
  targets:
    claude-code:
      path: .claude/skills

groups: {}

settings:
  default_target: claude-code
```

### 路径类型

#### 1. 绝对路径
```bash
skill-registry global set-registry-path /Users/numbero/skills
# Skills 存储位置: /Users/numbero/skills/
```

#### 2. 家目录路径 (~)
```bash
skill-registry global set-registry-path ~/Documents/skills
# Skills 存储位置: /Users/numbero/Documents/skills/
```

#### 3. 相对路径
```bash
skill-registry global set-registry-path ../skills
# Skills 存储位置: ~/.skill-registry/../skills/
# 即: /Users/numbero/skills/
```

---

## 使用场景

### 场景 1：存储到云同步目录

```bash
# iCloud
skill-registry global set-registry-path ~/Library/Mobile\ Documents/com~apple~CloudDocs/skills

# Dropbox
skill-registry global set-registry-path ~/Dropbox/skills

# Google Drive
skill-registry global set-registry-path ~/Google\ Drive/skills
```

**优点**：
- ✅ 多设备同步
- ✅ 自动备份
- ✅ 版本历史

**注意**：
- ⚠️ Git skills 包含 `.git` 目录，可能占用大量空间
- ⚠️ 确保云服务支持软链接

### 场景 2：存储到外部硬盘

```bash
skill-registry global set-registry-path /Volumes/External/skills
```

**优点**：
- ✅ 节省本地存储
- ✅ 便于备份
- ✅ 可携带

**注意**：
- ⚠️ 外部硬盘必须挂载才能使用
- ⚠️ 命令会失败如果硬盘未连接

### 场景 3：存储到项目特定的位置

```bash
skill-registry global set-registry-path ~/work/skills
```

**优点**：
- ✅ 与项目分离
- ✅ 易于管理
- ✅ 可以备份整个工作目录

---

## 迁移现有 Skills

### 方法 1：手动移动

```bash
# 1. 设置新路径
skill-registry global set-registry-path ~/my-custom-skills

# 2. 移动现有 skills
mv ~/.skill-registry/skills/* ~/my-custom-skills/

# 3. 验证
skill-registry skill list
```

### 方法 2：重新注册

```bash
# 1. 设置新路径
skill-registry global set-registry-path ~/my-custom-skills

# 2. 重新注册 skills
skill-registry skill add git+https://github.com/user/skills.git#drawio
skill-registry skill add /path/to/local/skill

# 3. 删除旧 skills（可选）
rm -rf ~/.skill-registry/skills/*
```

---

## 验证和测试

### 1. 检查配置

```bash
# 查看配置
skill-registry global show

# 查看配置文件
cat ~/.skill-registry/global.yaml
```

### 2. 测试新路径

```bash
# 创建测试 skill
mkdir -p ~/test-skill
cat > ~/test-skill/SKILL.md << 'EOF'
---
name: test-skill
description: Test skill
---
# Test
EOF

# 注册
skill-registry skill add ~/test-skill

# 验证位置
ls -la ~/my-custom-skills/test-skill
```

### 3. 测试拉取

```bash
# 在项目中测试
mkdir -p ~/test-project
cd ~/test-project
skill-registry project init
skill-registry add test-skill
skill-registry pull

# 验证软链接
ls -la .claude/skills/test-skill
```

---

## 常见问题

### Q1: 设置后 skills 不见了？

**原因**：设置自定义路径只影响新注册的 skills，现有 skills 仍在旧位置。

**解决**：手动移动或重新注册。

```bash
# 方法 1：移动
mv ~/.skill-registry/skills/* ~/my-custom-skills/

# 方法 2：重新注册
skill-registry skill add <source>
```

### Q2: 如何知道当前使用哪个路径？

```bash
skill-registry global show
```

查看 "Skills path" 行。

### Q3: 可以在不同项目使用不同路径吗？

**不推荐**。Skills 存储路径是全局配置，所有项目共享同一个中央仓库。

如果需要不同的 skills 集合，建议：
- 使用不同的 skill 名称
- 使用 groups 管理
- 使用不同的用户/环境

### Q4: 路径中有空格怎么办？

使用引号或转义：

```bash
# 方法 1：引号
skill-registry global set-registry-path "~/My Documents/skills"

# 方法 2：转义
skill-registry global set-registry-path ~/My\ Documents/skills
```

### Q5: 如何恢复默认？

```bash
skill-registry global reset-registry-path
```

### Q6: 云同步的 skills 是否可以在多台机器共享？

可以！但是：
- 确保 `~/.skill-registry/global.yaml` 也同步
- 或者在每台机器上设置相同的自定义路径
- 注意 Git skills 的 `.git` 目录可能很大

---

## 最佳实践

### 1. 版本控制

如果使用云同步，建议：
```bash
# 在自定义路径初始化 git
cd ~/my-custom-skills
git init
git add .
git commit -m "Initial commit"
```

### 2. 备份

定期备份配置和 skills：
```bash
# 备份配置
cp ~/.skill-registry/global.yaml ~/backup/

# 备份 skills
tar -czf ~/backup/skills.tar.gz ~/my-custom-skills/
```

### 3. 路径选择建议

- ✅ 使用绝对路径或 `~` 开头的路径
- ✅ 确保路径有足够空间
- ✅ 避免使用需要权限的路径
- ❌ 避免使用临时路径（如 `/tmp`）
- ❌ 避免使用网络路径（除非稳定）

### 4. 测试流程

修改路径后，建议测试：
```bash
# 1. 查看配置
skill-registry global show

# 2. 测试注册
skill-registry skill add <test-source>

# 3. 测试列表
skill-registry skill list

# 4. 测试拉取
skill-registry pull
```

---

## 示例配置

### iCloud 配置示例

```yaml
registry:
  path: ~/Library/Mobile Documents/com~apple~CloudDocs/skills

defaults:
  targets:
    claude-code:
      path: .claude/skills
      description: Claude Code CLI

groups:
  productivity:
    description: Productivity skills
    skills:
      - pua
      - handoff

settings:
  default_target: claude-code
```

### 外部硬盘配置示例

```yaml
registry:
  path: /Volumes/MyExternal/skills

defaults:
  targets:
    claude-code:
      path: .claude/skills

groups: {}

settings:
  default_target: claude-code
```

---

## 相关命令

```bash
# 设置自定义路径
skill-registry global set-registry-path <path>

# 查看当前配置
skill-registry global show

# 重置为默认
skill-registry global reset-registry-path

# 编辑配置文件
skill-registry global edit

# 查看 skills 列表
skill-registry skill list

# 查看 status
skill-registry status
```

---

**相关文档**：
- [README.md](./README.md) - 项目概述
- [TESTING.md](./TESTING.md) - 测试指南
- [docs/](./docs/) - 设计文档
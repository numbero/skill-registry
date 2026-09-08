# Skill Registry

> 统一管理 AI Agent Skills 的 CLI 工具

---

## 简介

Skill Registry 是一个专业的命令行工具，用于统一管理来自 Git 仓库和本地目录的 AI Agent Skills，实现跨项目的 Skill 拉取与部署。

---

## ✅ 实现状态

**当前版本**: v1.0.0

**已实现功能**:
- ✅ 核心架构（纯文件系统，无数据库）
- ✅ Skill 注册（Git 和本地源）
- ✅ Skill 管理（添加、移除、列表、更新）
- ✅ Group 管理（创建、添加、删除、列表）
- ✅ Target 管理（全局预定义、自定义）
- ✅ 项目管理（初始化、配置、拉取）
- ✅ 单向增量拉取（只添加，不删除）
- ✅ 自动 Git 检测
- ✅ 全局配置管理
- ✅ 状态查看

**技术栈**:
- TypeScript
- Node.js
- Commander.js (CLI)
- simple-git (Git 操作)
- js-yaml (YAML 解析)
- chalk (终端输出)

---

## 核心特性

- 📦 **集中管理**：统一管理散落在各处的 Skills
- 🌐 **全局预定义**：预定义所有智能体，项目自动继承
- 🎯 **项目级管理**：项目中所有智能体使用相同的 Skill 集合
- 🔄 **单向增量拉取**：只添加不删除，保护动态创建的 Skills
- 🏷️ **Skill Groups**：按场景组织和管理 Skills
- 🏠 **统一管理**：项目和家目录使用同一套机制

---

## 安装

### 从 npm 安装（即将发布）

```bash
npm install -g skill-registry
```

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/user/skill-registry.git
cd skill-registry

# 安装依赖
npm install

# 构建
npm run build

# 全局链接（开发模式）
npm link
```

---

## 快速开始

### 新项目快速启动

```bash
# 1. 初始化项目
cd my-project
skill-registry project init

# 2. 注册 Skills
skill-registry skill add git+https://github.com/user/skills.git#drawio
skill-registry skill add /path/to/local/skill

# 3. 添加到项目
skill-registry add drawio
skill-registry add my-local-skill

# 4. 拉取
skill-registry pull
```

---

## 核心概念

### Skill
AI Agent 的技能包，包含 SKILL.md 文件和可选的资源文件。

### Target
Skill 的部署目标，定义了同步路径。例如：
- `claude-code`: `.claude/skills`
- `cursor`: `.cursor/rules`

### Group
一组相关 Skills 的集合，用于快速应用多个 Skills。

### Project
用户的工作项目，或家目录（用于管理全局 Skills）。

---

## 主要命令

### Skill 管理命令（全局）

```bash
skill-registry skill add <source>     # 注册 Skill
skill-registry skill list             # 列出所有 Skills
skill-registry skill update [name]    # 更新 Skill
```

### Target 管理命令（全局）

```bash
skill-registry target list            # 列出全局预定义 Targets
skill-registry target add <name>      # 添加全局 Target
```

### Group 管理命令（全局）

```bash
skill-registry group add <name>       # 创建 Group
skill-registry group list             # 列出所有 Groups
```

### 项目管理命令

```bash
skill-registry project init           # 初始化项目
skill-registry add <skill>            # 添加 Skill
skill-registry project target add <name>  # 添加 Target
skill-registry project group add <name>   # 添加 Group
skill-registry pull                   # 拉取 Skills
```

---

## 使用示例

### 示例 1：管理全局 Skills

```bash
# 1. 在家目录初始化
cd ~
skill-registry project init

# 2. 添加全局 Skills
skill-registry add pua
skill-registry add handoff

# 3. 拉取
skill-registry pull

# 结果：~/.claude/skills/pua, ~/.claude/skills/handoff
```

---

### 示例 2：多智能体项目

```bash
# 1. 初始化项目
cd my-project
skill-registry project init

# 2. 为不同智能体添加 Targets
skill-registry project target add claude-code
skill-registry project target add cursor
skill-registry project target add codex

# 3. 添加 Skills
skill-registry add drawio
skill-registry add pua

# 4. 拉取
skill-registry pull

# 结果：所有 Skills 同步到所有 Targets
```

---

### 示例 3：使用 Group

```bash
# 1. 创建 Group
skill-registry group add web-dev
skill-registry group add web-dev drawio,theme-factory

# 2. 应用到项目
cd my-project
skill-registry project group add web-dev

# 3. 拉取
skill-registry pull

# 结果：Group 中的所有 Skills 都被拉取
```

---

### 示例 4：添加新的智能体

```bash
# 1. 在全局添加新 Target
skill-registry target add windsurf --path .windsurf/rules

# 2. 在项目中使用
cd my-project
skill-registry project target add windsurf

# 3. 拉取
skill-registry pull

# 所有 Skills 自动拉取到新的 windsurf target
```

---

## 配置文件

### 全局配置（~/.skill-registry/global.yaml）

```yaml
# 预定义智能体
defaults:
  targets:
    claude-code:
      path: .claude/skills
    cursor:
      path: .cursor/rules

# 全局 Groups
groups:
  web-dev:
    skills: [drawio, theme-factory]

# 全局设置
settings:
  default_target: claude-code
```

---

### 项目配置（.skill-registry/config.yaml）

```yaml
# 项目 Targets（可选）
targets:
  claude-code: {}
  cursor: {}

# 项目 Skills
skills:
  - drawio
  - pua
```

---

## 设计文档

详细的设计文档请参阅：[docs/README.md](./docs/README.md)

---

## 技术栈

- TypeScript/Node.js
- SQLite (better-sqlite3)
- Commander.js
- Inquirer.js

---

## 许可证

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

## 联系方式

- GitHub: [skill-registry](https://github.com/user/skill-registry)
- 文档: [https://skill-registry.dev](https://skill-registry.dev)
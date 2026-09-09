# Skill Registry

> 统一管理 AI Agent Skills 的 CLI 工具

---

## 简介

Skill Registry 是一个专业的命令行工具，用于统一管理来自 Git 仓库和本地目录的 AI Agent Skills，实现跨项目的 Skill 拉取与部署。

---

## ✅ 实现状态

**当前版本**: v2.0.0

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
- ✅ 项目优先命令设计

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
- ⚡ **项目优先设计**：默认操作在项目级，全局操作需显式指定

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

### 1. 全局初始化

```bash
# 使用默认路径初始化
skill-registry init -g

# 使用自定义路径初始化
skill-registry init -g --path /custom/skills/path
```

### 2. 项目初始化

```bash
cd my-project
skill-registry init
```

### 3. 注册 Skills

```bash
# 从 Git 注册到全局 registry
skill-registry skill add -g git+https://github.com/user/skills.git#drawio

# 从本地目录注册
skill-registry skill add -g /path/to/local/skill
```

### 4. 添加到项目

```bash
# 添加已注册的 skill
skill-registry skill add drawio

# 或使用 Group
skill-registry group add web-dev
```

### 5. 拉取到 Targets

```bash
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

## 🎯 Target 自动识别

`pull` 时会自动扫描当前项目目录，将命中"探测标记"的全局预设 Target 纳入部署范围，**无需手动添加**。

仅识别项目根目录下的**隐藏目录**（如 `.claude/`），不依据 `CLAUDE.md`、`AGENTS.md` 等文件判断，避免误报。

| Target | 探测标记目录 |
|---|---|
| `claude-code` | `.claude/` |
| `cursor` | `.cursor/` |
| `codex` | `.codex/` |
| `kiro-steering` | `.kiro/` |
| `windsurf` | `.windsurf/` |
| `agent-generic` | `.agents/` |
| `qoder` | `.qoder/` |

规则说明：
- **并集语义**：最终 Target = 项目显式配置 ∪ 自动探测结果（同名时显式配置优先）
- **兜底**：两者都为空时，回退到全局 `settings.default_target`
- **例外**：`claude-code-home` 不参与自动探测，必须显式添加
- **自定义标记**：全局 Target 可通过 `detect` 字段自定义标记

---

## 命令体系

### 设计理念

**项目优先，-g 切换全局**

- 默认操作作用域为项目级别
- 全局操作需要显式指定 `-g` (或 `--global`) 标志
- 符合 90% 使用场景都在项目内的实际情况

---

### 初始化命令

```bash
# 项目初始化
init                            # 在当前目录创建 .skill-registry/config.yaml

# 全局初始化
init -g                         # 使用默认路径
init -g --path <path>           # 使用自定义路径
```

---

### Skill 命令

```bash
# 项目级（默认）
skill add <source>              # 添加 Skill 到项目
skill list                      # 列出项目 Skills
skill remove <skill>            # 从项目移除
skill update                    # 更新项目 Skills

# 全局级（需要 -g）
skill add -g <source>           # 注册到全局 registry
skill list -g                   # 列出全局 Skills
skill remove -g <skill>         # 从全局删除
skill update -g [name]          # 更新全局 Skill(s)
```

---

### Target 命令

```bash
# 项目级（默认）
target list                     # 列出项目 Targets
target add <name>               # 添加 Target 到项目
target remove <name>            # 从项目移除

# 全局级（需要 -g）
target list -g                  # 列出全局预设
target add -g <name>            # 添加全局预设
target remove -g <name>         # 删除全局预设
target restore -g [name]        # 恢复默认预设
target default -g <name>        # 设置默认 Target
```

---

### Group 命令

```bash
# 项目级（默认）
group list                      # 列出项目 Groups
group add <group>               # 添加 Group 到项目
group remove <group>            # 从项目移除

# 全局级（需要 -g）
group list -g                   # 列出全局 Groups
group add -g <name>             # 创建全局 Group
group remove -g <name>          # 删除全局 Group
group skill add -g <group> <skill>      # 添加 Skill 到 Group
group skill remove -g <group> <skill>   # 从 Group 移除 Skill
```

---

### 核心操作

```bash
pull                            # 拉取 Skills 到 Targets
show                            # 显示项目配置
status                          # 显示完整状态（项目 + 全局）
```

---

### 全局配置

```bash
global show                     # 显示全局配置
global set-path <path>          # 设置自定义 registry 路径
global reset-path               # 重置 registry 路径
global edit                     # 编辑全局配置文件
```

---

## 使用示例

### 示例 1：管理全局 Skills

```bash
# 1. 初始化全局配置
skill-registry init -g

# 2. 注册 Skills
skill-registry skill add -g git+https://github.com/user/skills.git#pua
skill-registry skill add -g /path/to/local/handoff

# 3. 在家目录初始化
cd ~
skill-registry init

# 4. 添加全局 Skills
skill-registry skill add pua
skill-registry skill add handoff

# 5. 拉取
skill-registry pull

# 结果：~/.claude/skills/pua, ~/.claude/skills/handoff
```

---

### 示例 2：多智能体项目

```bash
# 1. 初始化项目
cd my-project
skill-registry init

# 2. 添加已注册的 Skills
skill-registry skill add drawio
skill-registry skill add pua

# 3. Targets 自动检测（无需手动添加）
# .claude/ 存在 → claude-code target 自动启用
# .cursor/ 存在 → cursor target 自动启用

# 4. 拉取
skill-registry pull

# 结果：所有 Skills 同步到所有 Targets
```

---

### 示例 3：使用 Group

```bash
# 1. 创建全局 Group
skill-registry group add -g web-dev
skill-registry group skill add -g web-dev drawio
skill-registry group skill add -g web-dev theme-factory

# 2. 应用到项目
cd my-project
skill-registry group add web-dev

# 3. 拉取
skill-registry pull

# 结果：Group 中的所有 Skills 都被拉取
```

---

### 示例 4：恢复误删的 Target

```bash
# 1. 误删预设
skill-registry target remove -g claude-code

# 2. 恢复
skill-registry target restore -g claude-code

# 或恢复所有
skill-registry target restore -g
```

---

### 示例 5：添加新的智能体

```bash
# 1. 在全局添加新 Target
skill-registry target add -g windsurf --path .windsurf/rules

# 2. 项目中自动检测
# 创建 .windsurf/ 目录
mkdir -p .windsurf

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
      description: Claude Code CLI
    cursor:
      path: .cursor/rules
      description: Cursor IDE

# 全局 Groups
groups:
  web-dev:
    skills: [drawio, theme-factory]

# 全局设置
settings:
  default_target: claude-code

# 可选：自定义 skills 存储路径
# registry:
#   path: /custom/path/to/skills
```

---

### 项目配置（.skill-registry/config.yaml）

```yaml
# 项目 Skills
skills:
  - drawio
  - pua

# 项目 Targets（可选）
targets:
  claude-code: {}
  cursor: {}
```

---

## 错误处理

### 未初始化全局配置

```bash
$ skill-registry skill list -g

Error: Global skill-registry not initialized.

Run: skill-registry init -g
Or: skill-registry init -g --path <custom-path>
```

### 非项目目录

```bash
$ skill-registry skill add my-skill

Error: Not a skill-registry project.

Options:
  1. Initialize: skill-registry init
  2. Use global: skill-registry <command> -g
```

---

## 设计文档

详细的设计文档请参阅：[docs/README.md](./docs/README.md)

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
# Skill Router - 完整设计文档

## 文档信息
- **项目名称**: skill-registry
- **版本**: v1.0.0
- **创建日期**: 2026-09-08
- **最后更新**: 2026-09-08
- **状态**: 设计完成，待实施

---

## 目录

1. [产品概述](#1-产品概述)
2. [核心概念](#2-核心概念)
3. [数据模型](#3-数据模型)
4. [CLI 命令体系](#4-cli-命令体系)
5. [核心功能流程](#5-核心功能流程)
6. [技术架构](#6-技术架构)
7. [已确认的设计决策](#7-已确认的设计决策)
8. [产品边界](#8-产品边界)
9. [实现路线图](#9-实现路线图)
10. [非功能性需求](#10-非功能性需求)

---

## 1. 产品概述

### 1.1 产品定位

Skill Router 是一个专业的命令行工具，用于统一管理来自不同来源（Git 仓库、本地目录）的 AI Agent Skills，并实现跨项目的 Skill 同步与部署。

### 1.2 核心价值

- 📦 **集中管理**：统一管理散落在各处的 Skills
- 🔄 **版本控制**：跟踪 Skill 的版本和来源
- 🔗 **智能同步**：通过软链接方式将 Skills 部署到项目
- 🎯 **标准化**：遵循 Agent Skills 开放标准
- 🌐 **多目标同步**：一个 Skill 可同步到多个智能体
- 🏠 **统一管理**：所有项目使用同一套机制，家目录也是项目

### 1.3 目标用户

- AI Agent 开发者
- 使用 Claude Code、Codex CLI 等工具的开发者
- 需要在多个项目中复用 Skills 的团队

---

## 2. 核心概念

### 2.1 Skill（技能）

一个 Skill 是一个独立的技能包，包含：
- **SKILL.md**：技能定义文件（必需）
- **资源文件**：可选的辅助文件（如主题、模板等）

**Skill 来源类型**：
1. **Git 仓库**：远程 Git 仓库中的 Skill
2. **本地目录**：本地文件系统中的 Skill

### 2.2 Registry（注册表）

中央 Skill 仓库，存储在 `~/.skill-registry/`，包含：
- Skill 元数据库（SQLite）
- Skill 内容缓存

### 2.3 Project（项目）

用户的工作项目，通过配置文件 `.skill-registry/config.yaml` 声明所需的 Skills。

**重要**：家目录 `~` 也是一个项目，与一般项目使用完全相同的管理机制，唯一区别是项目根路径不同。

### 2.4 Skill Group（技能组）

一组 Skills 的命名集合，用于快速应用多个相关的 Skills。

**Group 特性**：
- 🎯 **一键应用**：将整个 group 添加到项目
- 📊 **状态追踪**：显示 group 中哪些 Skills 已应用
- 🔄 **批量管理**：统一更新 group 中的所有 Skills
- 🏷️ **场景化组织**：按开发场景组织 Skills

### 2.5 Target（目标）

Skill 的部署目标，定义了 Skill 应该同步到哪个路径。

**Target 特性**：
- 🎯 **自定义路径**：用户可定义任意智能体的 skill 路径
- 🌐 **多目标同步**：一个 Skill 可同步到多个智能体
- 🏠 **统一管理**：所有项目使用同一套机制
- 📝 **标准格式**：完全支持 Claude 标准

**预定义 Targets**：
- `claude-code`: `.claude/skills`
- `codex`: `.codex/skills`
- `cursor`: `.cursor/rules`
- `kiro-steering`: `.kiro/steering`
- `claude-code-home`: `~/.claude/skills`

---

## 3. 数据模型

### 3.1 Skill 元数据

```typescript
interface Skill {
  id: string;                    // UUID
  name: string;                  // Skill 名称
  description: string;           // 描述
  source_type: 'git' | 'local';  // 来源类型

  // Git 来源
  source_url?: string;           // Git URL
  source_path?: string;          // Git 仓库内的子路径

  // 本地来源
  local_source_path?: string;    // 本地源路径

  // 中心仓库路径
  cached_path: string;           // 缓存路径

  // 更新追踪
  version: string;               // 版本号（Git commit hash 或 'latest'）
  installed_at: Date;            // 注册时间
  updated_at: Date;              // 最后更新时间

  // 源文件快照（用于检测变更）
  source_snapshot?: {
    file_count: number;
    total_size: number;
    checksum: string;
    files: {
      path: string;
      mtime: number;
      size: number;
      checksum: string;
    }[];
  };

  metadata: {                    // SKILL.md frontmatter
    license?: string;
    allowed_tools?: string[];
    [key: string]: any;
  };
}
```

### 3.2 Target 数据模型

```yaml
# ~/.skill-registry/targets.yaml

targets:
  # 相对路径 → 相对于当前项目目录
  claude-code:
    description: "Claude Code CLI"
    path: .claude/skills

  # ~ 开头 → 家目录路径
  claude-code-home:
    description: "Claude Code (home)"
    path: ~/.claude/skills

  # 其他常用智能体
  codex:
    description: "OpenAI Codex CLI"
    path: .codex/skills

  cursor:
    description: "Cursor IDE"
    path: .cursor/rules

  # 用户自定义 Target
  my-custom-agent:
    description: "My Custom Agent"
    path: .my-agent/skills

  # 绝对路径示例
  shared-skills:
    description: "Shared Skills Directory"
    path: /opt/shared-skills
```

**路径解析规则**：
- 相对路径（如 `.claude/skills`）：相对于**当前项目目录**
- `~` 开头（如 `~/.claude/skills`）：相对于**用户家目录**
- 绝对路径（如 `/opt/shared-skills`）：直接使用

### 3.3 项目配置

```yaml
# .skill-registry/config.yaml

# 项目名称
project: my-awesome-project

# 使用的 Skills
skills:
  - name: drawio
    targets: [claude-code]  # 只同步到 Claude Code

  - name: theme-factory
    targets: [claude-code, cursor]  # 同步到多个目标

  - name: pua
    targets: [claude-code, codex]

# 使用的 Groups
groups:
  - name: web-dev
    targets: [claude-code]

# 默认 targets（可选）
default_targets:
  - claude-code

# Target 路径覆盖（可选）
target_overrides:
  claude-code:
    path: .claude/skills-custom
```

### 3.4 Skill Group 数据模型

```yaml
# ~/.skill-registry/groups.yaml

groups:
  # Web 开发组
  web-dev:
    description: "Web development essentials"
    skills:
      - drawio
      - theme-factory
      - code-review
    metadata:
      created_at: 2026-09-08T10:00:00Z
      updated_at: 2026-09-08T10:00:00Z

  # 数据科学组
  data-science:
    description: "Data analysis and visualization"
    skills:
      - dataviz
      - python-analysis
      - jupyter-helper
```

### 3.5 家目录项目配置

```yaml
# ~/.skill-registry/config.yaml
# 家目录也是一个项目

project: home

# 全局 Skills
skills:
  - name: pua
    targets: [claude-code-home]

  - name: handoff
    targets: [claude-code-home]

  - name: research
    targets: [claude-code-home]

# 全局 Groups
groups:
  - name: productivity
    targets: [claude-code-home]

# 默认 target
default_target: claude-code-home
```

### 3.6 数据库 Schema

```sql
-- Targets 表
CREATE TABLE targets (
  name TEXT PRIMARY KEY,
  description TEXT,
  path TEXT NOT NULL,
  created_at DATETIME NOT NULL
);

-- Skills 表
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  source_type TEXT NOT NULL CHECK(source_type IN ('git', 'local')),
  source_url TEXT,
  source_path TEXT,
  local_source_path TEXT,
  cached_path TEXT NOT NULL,
  version TEXT NOT NULL,
  installed_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  source_snapshot TEXT,  -- JSON 字符串
  metadata TEXT
);

-- Project Skills 关联表
CREATE TABLE project_skills (
  id TEXT PRIMARY KEY,
  project_path TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  targets TEXT NOT NULL,  -- JSON 数组
  synced_at DATETIME,
  status TEXT NOT NULL,
  FOREIGN KEY (skill_name) REFERENCES skills(name)
);

-- Groups 表
CREATE TABLE groups (
  name TEXT PRIMARY KEY,
  description TEXT,
  skills TEXT NOT NULL,  -- JSON 数组
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- Sync History 表
CREATE TABLE sync_history (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  project_path TEXT NOT NULL,
  target TEXT NOT NULL,
  synced_at DATETIME NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);
```

---

## 4. CLI 命令体系

### 4.1 完整命令树

```
skill-registry
├── registry              # 注册表管理
│   ├── add <source>      # 注册新 Skill
│   ├── remove <name>     # 移除 Skill
│   ├── list              # 列出所有已注册的 Skills
│   ├── update [name]     # 更新 Skill（全部或指定）
│   ├── status            # 查看 Skill 状态
│   └── info <name>       # 查看 Skill 详情
│
├── target                # Target 管理
│   ├── list              # 列出所有 Targets
│   ├── add <name>        # 添加新 Target
│   ├── remove <name>     # 移除 Target
│   ├── info <name>       # 查看 Target 详情
│   └── set-default <name># 设置默认 Target
│
├── group                 # Skill Group 管理
│   ├── create <name>     # 创建新 Group
│   ├── add <group> <skill>   # 添加 Skill 到 Group
│   ├── remove <group> <skill> # 从 Group 移除 Skill
│   ├── list              # 列出所有 Groups
│   ├── info <name>       # 查看 Group 详情
│   ├── update <name>     # 更新 Group 中的所有 Skills
│   └── delete <name>     # 删除 Group
│
├── project               # 项目管理
│   ├── init              # 在当前目录初始化项目配置
│   ├── add <skill|group> # 添加 Skill 或 Group 到项目
│   ├── remove <skill|group> # 从项目移除 Skill 或 Group
│   ├── list              # 列出项目使用的 Skills 和 Groups
│   ├── status            # 查看应用状态
│   └── sync              # 同步 Skills 到项目
│
└── config                # 配置管理
    ├── get <key>         # 获取配置项
    ├── set <key> <value> # 设置配置项
    └── list              # 列出所有配置
```

### 4.2 命令详细说明

#### Registry 命令

```bash
# 注册 Git Skill
skill-registry registry add git+https://github.com/user/skills.git#path/to/skill

# 注册本地 Skill
skill-registry registry add /path/to/local/skill

# 交互式注册
skill-registry registry add

# 更新 Skill
skill-registry registry update drawio        # 更新指定
skill-registry registry update --all        # 更新所有
skill-registry registry update --local-only # 只更新本地 Skill

# 查看 Skill 状态
skill-registry registry status

# 查看 Skill 详情
skill-registry registry info drawio
```

#### Target 命令

```bash
# 列出所有 Targets
skill-registry target list

# 添加自定义 Target
skill-registry target add my-agent --path .my-agent/skills

# 查看 Target 详情
skill-registry target info claude-code

# 设置默认 Target
skill-registry target set-default claude-code
```

#### Project 命令

```bash
# 初始化项目
skill-registry project init

# 添加 Skill 到指定 Target
skill-registry project add drawio --target claude-code

# 添加 Skill 到多个 Target
skill-registry project add drawio --target claude-code,cursor

# 使用默认 Target
skill-registry project add drawio

# 添加 Group
skill-registry project add web-dev

# 同步 Skills
skill-registry project sync
skill-registry project sync --target claude-code  # 同步到指定 Target

# 查看状态
skill-registry project status
```

---

## 5. 核心功能流程

### 5.1 注册 Skill

#### Git Skill 注册
```
开始
  ↓
解析 Git URL 和路径
  ↓
克隆仓库（浅克隆 depth=1）
  ↓
提取指定 Skill
  ↓
复制到中心仓库
  ↓
写入数据库
  ↓
显示成功消息
```

#### 本地 Skill 注册
```
开始
  ↓
验证路径存在
  ↓
验证 SKILL.md 存在
  ↓
计算源文件快照
  ↓
复制到中心仓库
  ↓
写入数据库（记录源路径）
  ↓
显示成功消息
```

### 5.2 更新 Skill

#### Git Skill 更新
```bash
skill-registry registry update drawio

流程：
  检查缓存目录
  → git pull
  → 更新数据库
  → 提示项目重新同步
```

#### 本地 Skill 更新
```bash
skill-registry registry update drawio

流程（Phase 1）：
  读取源路径
  → 检查源是否存在
  → 删除旧缓存
  → 重新复制
  → 更新快照
  → 提示项目重新同步

流程（Phase 2）：
  读取源路径
  → 扫描源文件
  → 对比快照检测变更
  → 显示变更报告
  → 增量更新
  → 更新快照
  → 提示项目重新同步
```

### 5.3 同步到项目

```
开始
  ↓
读取项目配置
  ↓
解析所有 Skills 和 Groups
  ↓
对每个 Skill：
  ├─ 解析 Target 路径
  ├─ 创建父目录
  ├─ 创建软链接
  │  项目路径 → ~/.skill-registry/skills/{source}-{hash}/{skill}
  └─ 记录同步历史
  ↓
报告同步结果
```

**关键点**：
- 只有一层软链接，清晰可靠
- 链接指向中心仓库的缓存目录
- 支持多 Target 同步

---

## 6. 技术架构

### 6.1 技术选型

| 技术栈 | 选择 | 理由 |
|--------|------|------|
| **语言** | TypeScript/Node.js | 开发快速，生态丰富，可用 npx 运行 |
| **CLI 框架** | Commander.js | Node.js 最流行的 CLI 框架 |
| **配置解析** | yaml | YAML 格式支持，人类可读性好 |
| **数据库** | better-sqlite3 | 纯 JS SQLite 实现，无需编译 |
| **Git 操作** | simple-git | Node.js Git 客户端 |
| **文件操作** | fs-extra | Node.js fs 的增强版本 |
| **终端 UI** | chalk + inquirer | 彩色输出和交互式提示 |
| **文件扫描** | fast-glob | 快速文件扫描 |

### 6.2 目录结构

```
~/.skill-registry/
├── registry.db          # SQLite 数据库
├── skills/              # Skill 内容缓存
│   ├── git-{hash}/      # Git 来源的 Skill
│   │   ├── SKILL.md
│   │   └── ...
│   └── local-{hash}/    # 本地来源的 Skill
│       ├── SKILL.md
│       └── ...
├── groups.yaml          # Skill Groups 定义
├── targets.yaml         # Targets 定义
└── config.yaml          # 默认配置

任意项目目录/（包括家目录 ~）
├── .skill-registry/
│   └── config.yaml      # 项目配置
└── {智能体skill路径}/   # 根据配置的 Target 决定
    └── {skill-name}/SKILL.md → ~/.skill-registry/skills/{...}/SKILL.md
```

### 6.3 核心模块

```
skill-registry/
├── src/
│   ├── commands/        # CLI 命令实现
│   │   ├── registry.ts
│   │   ├── target.ts
│   │   ├── group.ts
│   │   ├── project.ts
│   │   └── config.ts
│   ├── core/            # 核心功能
│   │   ├── skill-manager.ts      # Skill 管理
│   │   ├── target-manager.ts     # Target 管理
│   │   ├── group-manager.ts      # Group 管理
│   │   ├── project-manager.ts    # 项目管理
│   │   └── sync-manager.ts       # 同步管理
│   ├── models/          # 数据模型
│   │   ├── skill.ts
│   │   ├── target.ts
│   │   ├── group.ts
│   │   └── project.ts
│   ├── utils/           # 工具函数
│   │   ├── path.ts              # 路径解析
│   │   ├── git.ts               # Git 操作
│   │   ├── file.ts              # 文件操作
│   │   └── snapshot.ts          # 快照管理
│   ├── db/              # 数据库
│   │   ├── database.ts          # 数据库连接
│   │   └── migrations/          # 数据库迁移
│   └── index.ts         # 入口文件
├── package.json
├── tsconfig.json
└── README.md
```

---

## 7. 已确认的设计决策

### 7.1 多目标同步
**状态**：✅ 已确认支持

**决策**：
- 一个 Skill 可以同时同步到多个 Target
- 实现方式：`--target` 参数支持多个值，逗号分隔
- 同步机制：创建多个软链接指向同一个 Skill 缓存

**示例**：
```bash
skill-registry project add drawio --target claude-code,cursor
```

### 7.2 统一项目管理
**状态**：✅ 已确认

**决策**：
- 全局项目（家目录）与一般项目使用完全相同的管理机制
- 唯一区别：项目根路径不同
- 所有项目使用相同的命令和工作流程

**实现**：
- 家目录也是项目，可以执行 `skill-registry project init`
- 通过特定 Target（如 `claude-code-home`）同步到 `~/.claude/skills`

### 7.3 Skill 格式标准
**状态**：✅ 已确认

**决策**：
- 完全支持 Claude Code 的 Skill 标准（SKILL.md）
- 遵循业界通用的 Agent Skills 开放标准
- **不做个性化格式转换**（如 Cursor 的 .mdc 等）

**实现**：
- 同步时直接复制/链接 SKILL.md 文件
- 不做任何格式转换
- 如果某个智能体需要不同格式，用户需自行准备对应格式的 Skill

### 7.4 注册机制
**状态**：✅ 已确认

**决策**：
- **Git Skill**：克隆到中心仓库
- **本地 Skill**：复制到中心仓库
- 记录源路径和快照信息

**更新机制**：
- Phase 1：手动全量更新
- Phase 2：智能检测 + 增量更新

### 7.5 链接策略
**状态**：✅ 已确认

**决策**：
- 项目中只创建**单层软链接**
- 链接指向中心仓库的缓存目录
- 避免多层软链接混乱

**示例**：
```
项目：   .claude/skills/drawio
         ↓ 软链接
中心仓库：~/.skill-registry/skills/local-abc/drawio/
         (实际文件)
```

---

## 8. 产品边界

### 8.1 明确支持的功能

- ✅ Git 和本地 Skill 源管理
- ✅ 多目标同步
- ✅ 自定义 Target 路径
- ✅ 家目录作为项目统一管理
- ✅ Skill Groups 机制
- ✅ 完全支持 Claude Code 标准
- ✅ 遵循 Agent Skills 开放标准
- ✅ 手动更新机制

### 8.2 明确不支持的功能（Phase 1）

- ❌ Skill 格式转换（如 .mdc）
- ❌ 个性化格式适配
- ❌ Skill 在线市场
- ❌ Skill 发布和分享
- ❌ 团队协作功能
- ❌ Skill 依赖管理
- ❌ GUI 界面
- ❌ 自动文件监控（Phase 2）
- ❌ Skill 测试和验证

---

## 9. 实现路线图

### Phase 1: MVP（Week 1-2）

**目标**：实现核心功能

**功能清单**：
- [ ] CLI 框架搭建
- [ ] 数据库初始化
- [ ] `registry add/remove/list/info/update/status`
- [ ] `target list/add/remove/info/set-default`
- [ ] `group create/add/remove/list/info/delete`
- [ ] `project init/add/remove/list/status`
- [ ] `project add <skill|group> --target <targets>`
- [ ] `project sync`（支持多 Target 同步）
- [ ] 错误处理和友好提示

**验收标准**：
- 能够注册 Git 和本地 Skill
- 能够创建和管理 Targets
- 能够创建和管理 Skill Groups
- 能够在项目中添加 Skill 到指定 Target
- 能够同时同步 Skill 到多个 Target
- Group 应用状态正确显示
- 软链接正确指向缓存目录
- 家目录可以作为项目使用

### Phase 2: 增强（Week 3-4）

**目标**：提升用户体验

**功能清单**：
- [ ] 智能检测变更（对比快照）
- [ ] 增量更新机制
- [ ] 变更报告
- [ ] 交互式命令（inquirer）
- [ ] 彩色输出和表格展示
- [ ] `--dry-run` 预览模式
- [ ] 版本锁定功能
- [ ] Group 导入/导出功能
- [ ] 批量操作优化

### Phase 3: 扩展（Future）

**目标**：高级功能和生态建设

**功能清单**：
- [ ] 文件监控（可选）
- [ ] 自动更新机制
- [ ] 开发模式支持
- [ ] Skill 验证工具
- [ ] 配置迁移工具
- [ ] 性能优化（大规模场景）

---

## 10. 非功能性需求

### 10.1 性能要求

- 命令响应时间 < 100ms（不涉及网络操作）
- Git 克隆和更新操作应有进度提示
- 支持并发注册多个 Skills
- 支持管理 500+ Skills 和 50+ 项目

### 10.2 安全性

- 不存储敏感信息（如 Git 凭据）
- 使用 SSH 进行 Git 操作（优先于 HTTPS）
- 验证 Skill 来源路径的合法性

### 10.3 兼容性

- Node.js >= 18.0.0
- 支持 macOS、Linux、Windows（WSL）
- 兼容 Claude Code 最新版本

### 10.4 可维护性

- 代码注释覆盖率 > 30%
- 单元测试覆盖率 > 60%
- 提供完整的用户文档
- 提供开发者文档

---

## 11. 错误处理

### 11.1 常见错误场景

| 错误场景 | 错误消息 | 解决方案 |
|---------|---------|---------|
| SKILL.md 不存在 | `Error: SKILL.md not found in {path}` | 检查路径或 Git 仓库结构 |
| 同名 Skill 已存在 | `Error: Skill '{name}' already exists` | 使用 `--force` 覆盖或先移除 |
| 项目未初始化 | `Error: Not a skill-registry project` | 运行 `project init` |
| Git 克隆失败 | `Error: Failed to clone repository` | 检查网络和 URL |
| 软链接创建失败 | `Error: Failed to create symlink` | 检查权限或使用管理员模式 |
| 配置文件损坏 | `Error: Invalid config.yaml` | 检查 YAML 语法 |
| 源文件不存在 | `Error: Source path not found` | 检查源路径是否存在 |
| Target 路径冲突 | `Warning: Path already exists` | 使用 `--force` 覆盖 |

### 11.2 回滚机制

- **注册失败**：自动清理已创建的缓存文件
- **同步失败**：保留已同步的 Skills，报告失败的项
- **配置错误**：提供 `--repair` 命令修复配置

---

## 12. 开源计划

### 12.1 许可证

MIT License

### 12.2 发布方式

1. **NPM 包**：`npm install -g skill-registry`
2. **NPX 运行**：`npx skill-registry`
3. **独立二进制**：使用 `pkg` 打包（可选）

### 12.3 文档

- README.md：快速开始指南
- docs/：详细文档
  - installation.md
  - commands.md
  - configuration.md
  - best-practices.md
  - faq.md

---

## 13. 成功指标

### 13.1 MVP 阶段

- ✅ 能够成功注册 10+ 个 Skills
- ✅ 能够创建和管理 5+ 个 Skill Groups
- ✅ 能够创建和管理自定义 Targets
- ✅ 能够在 3+ 个项目中同步 Skills 和 Groups
- ✅ 能够同时同步 Skill 到多个 Targets
- ✅ Group 应用状态正确显示
- ✅ 软链接正确指向缓存目录
- ✅ 全局项目支持（家目录）

### 13.2 增强阶段

- 用户主动更新率 > 50%
- 错误率 < 5%
- 用户满意度 > 4.0/5.0
- Group 使用率 > 60%
- 自定义 Target 使用率 > 30%

---

## 14. 参考资料

- [Agent Skills 标准](https://github.com/anthropics/agent-skills)
- [Claude Code 文档](https://docs.anthropic.com/claude-code)
- [Skills Manager](https://github.com/xingkongliang/skills-manager)
- [PUA Skill](https://github.com/tanweai/pua)

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| Skill | AI Agent 的技能包，包含 SKILL.md 和可选资源文件 |
| Registry | 中央 Skill 仓库，存储在 ~/.skill-registry/ |
| Target | Skill 的部署目标，定义同步路径 |
| Group | 一组 Skills 的命名集合 |
| Project | 用户的工作项目，或家目录 |

### B. 配置文件模板

#### targets.yaml 模板
```yaml
targets:
  claude-code:
    description: "Claude Code CLI"
    path: .claude/skills

  claude-code-home:
    description: "Claude Code (home)"
    path: ~/.claude/skills
```

#### config.yaml 模板（项目）
```yaml
project: my-project

skills:
  - name: example-skill
    targets: [claude-code]

default_targets:
  - claude-code
```

#### groups.yaml 模板
```yaml
groups:
  example-group:
    description: "Example group"
    skills:
      - skill1
      - skill2
```

---

**文档结束**

最后更新：2026-09-08
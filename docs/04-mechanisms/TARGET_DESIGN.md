# Skill Router - 核心设计改进：Target 机制

## 问题背景

原设计的限制：
1. **硬编码智能体路径**：只支持预定义的 Claude Code、Codex 等
2. **全局和项目分离**：两套不同的管理机制
3. **扩展性差**：新增智能体需要修改代码

## 解决方案：Target 机制

### 核心理念

**"以不变应万变"**：
- 通过配置定义目标路径，而非硬编码
- 用同一套机制管理用户级和项目级 Skills
- 用户自定义，支持任意智能体

---

## 新的数据模型

### 1. Target（目标）定义

```yaml
# ~/.skill-registry/targets.yaml

targets:
  # 预定义的常用智能体
  claude-code:
    description: "Claude Code CLI"
    path: .claude/skills
    type: project  # project | global

  claude-code-global:
    description: "Claude Code Global Skills"
    path: ~/.claude/skills
    type: global

  codex:
    description: "OpenAI Codex CLI"
    path: .codex/skills
    type: project

  cursor:
    description: "Cursor IDE"
    path: .cursor/rules
    type: project
    format: mdc  # 文件格式：md | mdc | custom

  kiro-steering:
    description: "Kiro Steering"
    path: .kiro/steering
    type: project

  # 用户自定义目标
  my-custom-agent:
    description: "My Custom Agent"
    path: .my-agent/skills
    type: project

  # 家目录作为全局项目
  home-claude:
    description: "Home Directory Claude Skills"
    path: ~/.claude/skills
    type: global
```

### 2. 项目配置（支持多目标）

```yaml
# .skill-registry/config.yaml

project: my-awesome-project

# 使用的 Skills
skills:
  - name: drawio
    targets: [claude-code]  # 只同步到 Claude Code

  - name: theme-factory
    targets: [claude-code, cursor]  # 同步到多个目标

  - name: pua
    targets: [claude-code, codex]  # 跨智能体使用

# 使用的 Groups
groups:
  - name: web-dev
    targets: [claude-code]  # Group 级别指定目标

# 默认目标（可选，省略时使用）
default_targets:
  - claude-code

# 目标覆盖（可选）
target_overrides:
  claude-code:
    path: .claude/skills-custom  # 覆盖默认路径
```

### 3. 全局项目配置

```yaml
# ~/.skill-registry/config.yaml (全局项目配置)

# 全局项目就是用户家目录
project: global

# 全局 Skills（应用到所有项目）
skills:
  - name: pua
    targets: [claude-code-global]  # 安装到 ~/.claude/skills

  - name: handoff
    targets: [claude-code-global]

# 全局 Groups
groups:
  - name: productivity
    targets: [claude-code-global]
```

---

## 新的 CLI 命令

### Target 管理

```bash
# Target 命令组
skill-registry target
├── list                    # 列出所有可用 targets
├── add <name>              # 添加新 target
├── remove <name>           # 移除 target
├── info <name>             # 查看 target 详情
└── set-default <name>      # 设置默认 target

# 示例
skill-registry target list
skill-registry target add my-agent --path .my-agent/skills --type project
skill-registry target set-default claude-code
```

### 项目管理（增强）

```bash
# 添加 Skill 到指定目标
skill-registry project add drawio --target claude-code
skill-registry project add drawio --target claude-code,cursor
skill-registry project add drawio  # 使用默认 target

# 添加 Group 到指定目标
skill-registry project add web-dev --target claude-code

# 同步到指定目标
skill-registry project sync --target claude-code
skill-registry project sync  # 同步所有目标
```

### 全局项目管理

```bash
# 在家目录初始化全局项目
cd ~
skill-registry project init --global

# 添加全局 Skill
skill-registry project add pua --target claude-code-global

# 同步全局 Skills
skill-registry project sync --global
```

---

## 核心工作流程

### 流程 1：初始化全局项目

```bash
# 1. 在家目录初始化
cd ~
skill-registry project init --global

# 这会创建 ~/.skill-registry/config.yaml
# 其中 project: global

# 2. 添加全局 Skills
skill-registry project add pua --target claude-code-global

# 3. 同步
skill-registry project sync

# 结果：~/.claude/skills/pua -> ~/.skill-registry/skills/git-xxx/pua
```

### 流程 2：项目级 Skill 同步到多目标

```bash
# 1. 在项目目录初始化
cd ~/my-project
skill-registry project init

# 2. 添加 Skill 到多个目标
skill-registry project add drawio --target claude-code,cursor

# 3. 同步
skill-registry project sync

# 结果：
# .claude/skills/drawio -> ~/.skill-registry/skills/git-xxx/drawio
# .cursor/rules/drawio.mdc -> ~/.skill-registry/skills/git-xxx/drawio
```

### 流程 3：自定义智能体支持

```bash
# 1. 添加自定义 target
skill-registry target add my-custom-agent \
  --path .my-agent/skills \
  --type project

# 2. 在项目中使用
skill-registry project add my-skill --target my-custom-agent

# 3. 同步
skill-registry project sync

# 结果：.my-agent/skills/my-skill -> ~/.skill-registry/skills/xxx/my-skill
```

---

## 数据库 Schema 更新

```sql
-- Targets 表
CREATE TABLE targets (
  name TEXT PRIMARY KEY,
  description TEXT,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('project', 'global')),
  format TEXT DEFAULT 'md',
  created_at DATETIME NOT NULL
);

-- Skills 表（移除 source 字段）
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  source_type TEXT NOT NULL CHECK(source_type IN ('git', 'local')),
  source_url TEXT NOT NULL,
  source_path TEXT,
  version TEXT NOT NULL,
  installed_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  metadata TEXT
);

-- Project Skills 关联表（新增 targets）
CREATE TABLE project_skills (
  id TEXT PRIMARY KEY,
  project_path TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  targets TEXT NOT NULL,  -- JSON 数组
  synced_at DATETIME,
  status TEXT,
  FOREIGN KEY (skill_name) REFERENCES skills(name)
);

-- Groups 表（新增 targets）
CREATE TABLE groups (
  name TEXT PRIMARY KEY,
  description TEXT,
  skills TEXT NOT NULL,  -- JSON 数组
  targets TEXT,  -- JSON 数组（可选的默认 targets）
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

---

## Target 优先级规则

当 Skill 在多个地方指定了 target 时，优先级如下：

1. **命令行参数**（最高优先级）
   ```bash
   skill-registry project add drawio --target cursor
   ```

2. **项目配置中的 targets**
   ```yaml
   skills:
     - name: drawio
       targets: [claude-code]
   ```

3. **Group 的 targets**
   ```yaml
   groups:
     - name: web-dev
       targets: [claude-code]
   ```

4. **项目默认 targets**
   ```yaml
   default_targets: [claude-code]
   ```

5. **全局默认 target**（最低优先级）
   ```yaml
   # ~/.skill-registry/config.yaml
   default_target: claude-code
   ```

---

## 格式转换支持

### 问题
不同智能体可能需要不同的文件格式：
- Claude Code: `SKILL.md`
- Cursor: `.mdc` 文件（Markdown + YAML frontmatter）
- 其他: 可能是 `.txt`, `.json` 等

### 解决方案

#### 方案 A：源文件优先（推荐）
- Skill 源文件保持 `SKILL.md` 格式
- 同步时直接复制/链接，不做格式转换
- 让智能体自己兼容 Agent Skills 标准

**优点**：简单，不引入转换复杂度
**缺点**：部分智能体可能不支持

#### 方案 B：自动格式转换
```yaml
# Target 定义
targets:
  cursor:
    path: .cursor/rules
    format: mdc
    transform:
      from: md
      to: mdc
```

同步时自动转换格式。

**优点**：自动适配各种智能体
**缺点**：需要实现转换逻辑，可能丢失格式细节

#### 方案 C：多源文件支持
```yaml
# Skill 源结构
skill/
├── SKILL.md       # Claude Code
├── SKILL.mdc      # Cursor
└── SKILL.json     # 其他格式

# 同步时根据 target 选择对应文件
```

**优点**：完全兼容，不丢失格式
**缺点**：Skill 维护成本高

---

## 使用场景

### 场景 1：Claude Code 用户（默认）

```bash
# 1. 全局安装常用 Skills
cd ~
skill-registry project init --global
skill-registry project add pua handoff research --target claude-code-global
skill-registry project sync

# 2. 项目级使用
cd ~/my-project
skill-registry project init
skill-registry project add drawio theme-factory
skill-registry project sync
```

### 场景 2：多智能体用户

```bash
# 1. 初始化项目
skill-registry project init

# 2. 为不同智能体添加不同的 Skills
skill-registry project add drawio --target claude-code
skill-registry project add cursor-helpers --target cursor
skill-registry project add codex-optimizer --target codex

# 3. 某些 Skill 跨智能体使用
skill-registry project add pua --target claude-code,codex

# 4. 同步所有
skill-registry project sync
```

### 场景 3：自定义智能体

```bash
# 1. 定义自己的智能体 target
skill-registry target add my-agent \
  --path .my-agent/skills \
  --type project \
  --description "My custom AI agent"

# 2. 使用
skill-registry project add my-custom-skill --target my-agent
skill-registry project sync

# 同步结果：.my-agent/skills/my-custom-skill -> ...
```

### 场景 4：团队标准化

```yaml
# 团队共享配置（提交到 Git）
# .skill-registry/config.yaml

project: team-standard-project

skills:
  - name: drawio
  - name: theme-factory
  - name: team-linter

default_targets:
  - claude-code

# 团队成员只需：
# 1. git clone 项目
# 2. skill-registry project sync
```

---

## 与原设计的对比

| 特性 | 原设计 | 新设计 |
|------|--------|--------|
| 智能体支持 | 硬编码 Claude/Codex | 自定义 Target |
| 全局 Skills | 单独机制 | 家目录即项目 |
| 多目标同步 | 不支持 | 原生支持 |
| 扩展性 | 需修改代码 | 配置即可 |
| 格式转换 | 不支持 | 可选支持 |

---

## 实现优先级

### Phase 1 (MVP)
- [ ] Target 定义和管理
- [ ] 项目级多 Target 同步
- [ ] 全局项目支持（家目录）
- [ ] 预定义常用 Targets

### Phase 2
- [ ] Target 格式转换（可选）
- [ ] Target 验证和测试
- [ ] Target 模板和分享

### Phase 3
- [ ] 智能体自动检测
- [ ] Target 市场

---

## 总结

这个设计的核心优势：

1. **通用性**：一套机制适应所有智能体
2. **灵活性**：用户自定义路径和目标
3. **简洁性**：全局和项目统一管理
4. **扩展性**：无需修改代码即可支持新智能体
5. **实用性**：预定义常用配置，开箱即用

"以不变应万变" —— 通过配置而非代码，实现最大的灵活性。
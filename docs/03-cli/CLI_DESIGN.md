# Skill Router - CLI 命令设计

> CLI 命令体系设计文档

---

## 🎯 设计原则

### 1. 对象-动作模式

```
skill-registry <object> <action> [args]
```

**优点**：
- 符合自然语言习惯
- 结构清晰，易于记忆
- 支持命令补全

---

### 2. 全局 vs 项目命令分离

- **全局命令**：管理中央仓库、全局配置
- **项目命令**：管理项目配置、拉取操作

---

### 3. 渐进式披露

- 简单场景：零配置，直接执行
- 高级场景：可选参数，明确指定

---

### 4. 智能默认值

- 自动继承全局配置
- 提供合理的默认行为

---

## 📋 命令体系

### 顶层结构

```
skill-registry
├── skill        # Skill 管理（全局）
├── group        # Group 管理（全局）
├── target       # Target 管理（全局）
├── global       # 全局配置管理
├── project      # 项目管理
└── status       # 状态查看（混合）
```

---

## 完整命令树

```
skill-registry
│
├── skill                    # 全局：Skill 管理
│   ├── add <source>         # 注册 Skill
│   ├── remove <name>        # 移除 Skill
│   ├── list                 # 列出所有 Skills
│   └── update [name]        # 更新 Skill
│
├── group                    # 全局：Group 管理
│   ├── add <name> [skill]   # 创建 Group 或添加 Skill
│   ├── remove <name> [skill] # 移除 Skill 或删除 Group
│   └── list                 # 列出所有 Groups
│
├── target                   # 全局：Target 管理
│   ├── add <name>           # 添加全局 Target
│   ├── remove <name>        # 删除全局 Target
│   └── list                 # 列出全局预定义 Targets
│
├── global                   # 全局：配置管理
│   ├── show                 # 显示全局配置
│   ├── edit                 # 编辑全局配置文件
│   └── set <key> <value>    # 设置配置项
│
├── project                  # 项目：项目管理
│   ├── init                 # 初始化项目
│   │
│   ├── add <skill>          # Skill 管理
│   ├── remove <skill>
│   │
│   ├── group add <name>     # Group 管理
│   ├── group remove <name>
│   │
│   ├── target add <name>    # Target 管理
│   ├── target remove <name>
│   ├── target list
│   │
│   ├── pull                 # 拉取 Skills（单向增量）
│   └── show                 # 显示项目配置
│
└── status                   # 混合：状态查看
```

---

## 一、Skill 管理命令（全局）

### `skill add` - 注册 Skill

```bash
# 从 Git 注册
skill-registry skill add git+https://github.com/user/skills.git#drawio

# 从本地目录注册
skill-registry skill add /path/to/local/skill

# 交互式注册
skill-registry skill add

# 选项
--name <name>           # 指定 Skill 名称
--description <desc>    # 指定描述
--force                 # 强制覆盖
```

**输出示例**：
```bash
$ skill-registry skill add git+https://github.com/user/skills.git#drawio

✓ Registered skill 'drawio'
  Source: git+https://github.com/user/skills.git#drawio
  Path: ~/.skill-registry/skills/git-abc123/drawio

Available actions:
  • Add to project: skill-registry project add drawio
  • View details: skill-registry skill list
```

---

### `skill list` - 列出 Skills

```bash
skill-registry skill list
```

**输出示例**：
```bash
$ skill-registry skill list

Skills (5):

┌──────────────┬────────┬───────────────────────┬──────────┐
│ Name         │ Type   │ Source                │ Updated  │
├──────────────┼────────┼───────────────────────┼──────────┤
│ drawio       │ git    │ github/user/skills    │ 2 days   │
│ pua          │ git    │ github/tanweai/pua    │ 1 week   │
│ theme-fac... │ local  │ ~/dev/theme-factory   │ today    │
└──────────────┴────────┴───────────────────────┴──────────┘

3 git, 2 local
```

---

### `skill update` - 更新 Skill

```bash
# 更新指定 Skill
skill-registry skill update drawio

# 更新所有 Skills
skill-registry skill update

# 选项
--git-only              # 只更新 Git Skills
--local-only            # 只更新本地 Skills
--check                 # 只检查，不更新
```

---

## 二、Group 管理命令（全局）

### `group add` - 创建/添加

```bash
# 创建 Group
skill-registry group add web-dev

# 添加 Skill 到 Group
skill-registry group add web-dev drawio
skill-registry group add web-dev drawio,theme-factory

# 选项
--description <desc>    # 指定描述
```

**输出示例**：
```bash
$ skill-registry group add web-dev
? Description: Web development essentials

✓ Created group 'web-dev'

$ skill-registry group add web-dev drawio,theme-factory
✓ Added 2 skills to group 'web-dev'
  Skills: [drawio, theme-factory]

Run 'skill-registry project group add web-dev' to apply this group.
```

---

### `group list` - 列出 Groups

```bash
skill-registry group list
```

**输出示例**：
```bash
$ skill-registry group list

Groups (3):

┌──────────────┬────────────────────────────┬─────────┐
│ Name         │ Description                │ Skills  │
├──────────────┼────────────────────────────┼─────────┤
│ web-dev      │ Web development essentials │ 3       │
│ productivity │ AI productivity            │ 5       │
└──────────────┴────────────────────────────┴─────────┘
```

---

## 三、Target 管理命令（全局）

### `target list` - 列出全局 Targets

```bash
skill-registry target list
```

**输出示例**：
```bash
$ skill-registry target list

Global Predefined Targets (6):

┌────────────────────┬─────────────────────────┬─────────────┐
│ Name               │ Path                    │ Description │
├────────────────────┼─────────────────────────┼─────────────┤
│ claude-code        │ .claude/skills          │ Claude...   │
│ claude-code-home   │ ~/.claude/skills        │ Claude...   │
│ cursor             │ .cursor/rules           │ Cursor IDE  │
│ codex              │ .codex/skills           │ Codex CLI   │
└────────────────────┴─────────────────────────┴─────────────┘

Default target: claude-code
```

---

### `target add` - 添加全局 Target

```bash
skill-registry target add <name> --path <path>

# 示例
skill-registry target add windsurf --path .windsurf/rules
skill-registry target add my-agent --path .my-agent/skills
```

**选项**：
```bash
--path <path>           # 必需：Target 路径
--description <desc>    # 可选：描述
```

**输出示例**：
```bash
$ skill-registry target add windsurf --path .windsurf/rules
? Description: Windsurf IDE

✓ Added target 'windsurf' to global configuration
  Path: .windsurf/rules

All projects can now use this target.
```

---

### `target remove` - 删除全局 Target

```bash
skill-registry target remove <name>

# 选项
--force                 # 跳过确认
```

---

## 四、全局配置管理命令

### `global show` - 显示配置

```bash
skill-registry global show
```

**输出示例**：
```bash
$ skill-registry global show

Global Configuration:

Default Targets (6):
  • claude-code      → .claude/skills
  • cursor           → .cursor/rules
  • codex            → .codex/skills

Groups (2):
  • web-dev      → 3 skills
  • productivity → 3 skills

Settings:
  default_target: claude-code

Config file: ~/.skill-registry/global.yaml
```

---

### `global edit` - 编辑配置

```bash
skill-registry global edit
```

**行为**：使用系统编辑器打开 `~/.skill-registry/global.yaml`

---

## 五、项目管理命令

### `project init` - 初始化

```bash
# 在当前目录初始化
skill-registry project init

# 在家目录初始化
cd ~
skill-registry project init
```

**输出示例**：
```bash
$ skill-registry project init

✓ Created .skill-registry/config.yaml
✓ Project initialized

Current configuration:
  Targets: Using global default (claude-code)
  Skills: (none)

Next steps:
  1. Add skills: skill-registry project add <skill>
  2. Add targets (optional): skill-registry project target add <name>
  3. Pull: skill-registry project pull
```

---

### `project add` - 添加 Skill

```bash
# 添加单个 Skill
skill-registry project add drawio

# 添加多个 Skills
skill-registry project add drawio,theme-factory,pua

# 交互式选择
skill-registry project add
```

**输出示例**：
```bash
$ skill-registry project add drawio

✓ Added skill 'drawio' to project
  Current skills: [drawio]

Note: Using default target 'claude-code' from global configuration.
      Run 'skill-registry project target add <name>' to add more targets.

Tip: Run 'skill-registry project pull' to pull to targets.
```

---

### `project remove` - 移除 Skill

```bash
skill-registry project remove drawio
```

**输出示例**：
```bash
$ skill-registry project remove drawio

✓ Removed skill 'drawio' from project configuration
  Current skills: [theme-factory, pua]

Note: The skill links remain in target directories.
      Next pull will not create new links for this skill.
```

---

### `project group add` - 添加 Group

```bash
# 添加 Group
skill-registry project group add web-dev

# 交互式选择
skill-registry project group add
```

**输出示例**：
```bash
$ skill-registry project group add web-dev

✓ Added group 'web-dev' to project
  Skills added: [drawio, theme-factory, code-review]

Current skills (6):
  • drawio
  • theme-factory
  • code-review
  • pua
  • handoff
  • research

Run 'skill-registry project pull' to pull all skills to all targets.
```

---

### `project target add` - 添加 Target

```bash
# 使用全局预定义
skill-registry project target add cursor

# 自定义路径
skill-registry project target add my-agent --path .my-agent/skills
```

**输出示例**：
```bash
$ skill-registry project target add cursor

✓ Added target 'cursor' to project
  Using global predefined path: .cursor/rules

Current targets:
  • claude-code (inherited from global default)
  • cursor (added)

Run 'skill-registry project pull' to pull all skills to all targets.
```

---

### `project target list` - 列出项目 Targets

```bash
skill-registry project target list
```

**输出示例**：
```bash
$ skill-registry project target list

Project Targets (3):

┌──────────────┬─────────────────────┬─────────────────┐
│ Target       │ Path                │ Source          │
├──────────────┼─────────────────────┼─────────────────┤
│ claude-code  │ .claude/skills      │ global default  │
│ cursor       │ .cursor/rules       │ global preset   │
│ my-agent     │ .my-agent/skills    │ custom          │
└──────────────┴─────────────────────┴─────────────────┘

Skills will be pulled to all 3 targets.
```

---

### `project pull` - 拉取 Skills

**关键特性**：单向增量拉取

```bash
skill-registry project pull

# 选项
--dry-run               # 预览模式
--force                 # 强制覆盖已存在的链接
--target <name>         # 只拉取到指定 Target
```

**输出示例**：
```bash
$ skill-registry project pull

Pulling 5 skills to 3 targets...

✓ drawio → claude-code
✓ drawio → cursor
✓ drawio → my-agent

✓ theme-factory → claude-code
✓ theme-factory → cursor
✓ theme-factory → my-agent

✓ pua → claude-code (already exists, skipped)
✓ pua → cursor (already exists, skipped)
✓ pua → my-agent (already exists, skipped)

...

Pulled 5 skills to 3 targets (12 new links, 3 skipped)
```

**核心特性**：
- ✅ 只做增量，不删除已存在的链接
- ✅ 保护动态创建的 Skills
- ✅ 配置和实际分离

---

### `project show` - 显示配置

```bash
skill-registry project show
```

**输出示例**：
```bash
$ skill-registry project show

Project Configuration:

Targets (3):
  • claude-code  → .claude/skills       (inherited from global default)
  • cursor       → .cursor/rules        (inherited from global preset)
  • my-agent     → .my-agent/skills     (custom)

Groups (1):
  • web-dev → 3 skills

Skills (6):
  From groups:
    • drawio (web-dev)
    • theme-factory (web-dev)
    • code-review (web-dev)
  
  Directly added:
    • pua
    • handoff
    • research

Pull status: Ready to pull
Last pulled: 2 hours ago

Config file: .skill-registry/config.yaml
```

---

## 六、状态查看命令

### `status` - 查看整体状态

```bash
skill-registry status
```

**行为**：
- 显示全局仓库信息
- 如果在项目目录，显示项目状态

**输出示例**：
```bash
# 在非项目目录
$ skill-registry status

Global Registry:
  Skills: 5 (3 git, 2 local)
  Groups: 2
  Targets: 6 predefined

# 在项目目录
$ skill-registry status

Global Registry:
  Skills: 5 (3 git, 2 local)
  Groups: 2
  Targets: 6 predefined

Current Project: my-project
  Path: ~/my-project
  Skills: 3
  Targets: 2 (claude-code, cursor)
  Status: Pulled 2 hours ago
```

---

## 七、快捷命令

### 常见操作的快捷方式

```bash
# 等同于 project add
skill-registry add <skill>

# 等同于 project pull
skill-registry pull

# 等同于 skill update
skill-registry update

# 等同于 skill list
skill-registry list
```

---

## 八、命令分类总结

### 全局命令（任意目录可执行）

| 命令 | 作用 | 操作对象 |
|------|------|----------|
| `skill add/remove/list/update` | 管理 Skills | `~/.skill-registry/registry.db` |
| `group add/remove/list` | 管理 Groups | `~/.skill-registry/global.yaml` |
| `target add/remove/list` | 管理 Targets | `~/.skill-registry/global.yaml` |
| `global show/edit/set` | 管理全局配置 | `~/.skill-registry/global.yaml` |
| `status` | 查看状态 | 全局 + 项目（如果在项目目录） |

---

### 项目命令（必须在项目目录）

| 命令 | 作用 | 操作对象 |
|------|------|----------|
| `project init` | 初始化项目 | `.skill-registry/config.yaml` |
| `project add/remove` | 管理 Skills | `.skill-registry/config.yaml` |
| `project group add/remove` | 管理 Groups | `.skill-registry/config.yaml` |
| `project target add/remove/list` | 管理 Targets | `.skill-registry/config.yaml` |
| `project pull` | 拉取 Skills | 项目目录 + 软链接 |
| `project show` | 显示配置 | `.skill-registry/config.yaml` |

---

## 九、典型工作流

### 工作流 1：新项目快速启动

```bash
# 1. 进入项目目录
cd ~/my-new-project

# 2. 初始化
skill-registry project init

# 3. 添加 Skills
skill-registry add drawio
skill-registry add pua

# 4. 拉取
skill-registry pull
```

---

### 工作流 2：多智能体项目

```bash
# 1. 初始化项目
cd ~/multi-agent-project
skill-registry project init

# 2. 添加多个 Targets
skill-registry project target add claude-code
skill-registry project target add cursor
skill-registry project target add codex

# 3. 添加 Skills
skill-registry add drawio
skill-registry add pua

# 4. 拉取到所有 Targets
skill-registry pull
```

---

### 工作流 3：使用 Group

```bash
# 1. 创建 Group（全局，任意目录）
skill-registry group add web-dev
skill-registry group add web-dev drawio,theme-factory

# 2. 在项目中应用 Group
cd ~/my-project
skill-registry project group add web-dev

# 3. 拉取
skill-registry pull
```

---

### 工作流 4：添加新的智能体

```bash
# 1. 在全局添加新 Target（任意目录）
skill-registry target add windsurf --path .windsurf/rules

# 2. 在项目中使用
cd ~/my-project
skill-registry project target add windsurf

# 3. 拉取
skill-registry pull

# 所有 Skills 自动拉取到新的 windsurf target
```

---

## 十、错误提示设计

### 友好的错误提示

```bash
# 项目未初始化
$ skill-registry project add drawio

Error: Not a skill-registry project.

Current directory: /tmp/test
No '.skill-registry/config.yaml' found.

To initialize a project here:
  skill-registry project init

# Skill 未注册
$ skill-registry project add unknown-skill

Error: Skill 'unknown-skill' not found in registry.

Available skills:
  • drawio
  • pua
  • theme-factory

To register a new skill:
  skill-registry skill add <source>
```

---

## 十一、命令行参数

### 通用参数

```bash
--help, -h              # 显示帮助
--version, -v           # 显示版本
--verbose               # 详细输出
--quiet, -q             # 静默模式
```

---

## ✅ 设计总结

### 核心特点

1. **清晰的命令分类**
   - 全局命令：管理中央仓库和全局配置
   - 项目命令：管理项目配置和拉取

2. **对象-动作模式**
   - 一致的命名风格
   - 符合直觉的结构

3. **智能默认值**
   - 项目自动继承全局配置
   - 最少配置即可使用

4. **单向增量拉取**
   - 只添加，不删除
   - 保护动态创建的文件

---

最后更新：2026-09-08
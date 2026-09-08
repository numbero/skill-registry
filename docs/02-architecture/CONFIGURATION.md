# Skill Router - 配置文件设计

> 配置文件结构、规则和使用方法

---

## 📁 配置文件位置

```
~/.skill-registry/
├── global.yaml          # 全局配置
├── config.yaml          # 家目录项目配置
├── registry.db          # Skill 注册表数据库
└── skills/              # Skill 缓存目录

~/my-project/
└── .skill-registry/
    └── config.yaml      # 项目配置
```

---

## 一、全局配置文件 (global.yaml)

### 文件位置
```
~/.skill-registry/global.yaml
```

### 配置结构

```yaml
# ===== 全局预定义 Targets =====
# 定义所有可用的智能体及其默认路径
# 项目自动继承，无需显式声明
defaults:
  targets:
    # Claude Code
    claude-code:
      description: "Claude Code CLI"
      path: .claude/skills
    
    # Claude Code (家目录)
    claude-code-home:
      description: "Claude Code (home)"
      path: ~/.claude/skills
    
    # Cursor IDE
    cursor:
      description: "Cursor IDE"
      path: .cursor/rules
    
    # OpenAI Codex CLI
    codex:
      description: "OpenAI Codex CLI"
      path: .codex/skills
    
    # Kiro Steering
    kiro-steering:
      description: "Kiro Steering"
      path: .kiro/steering
    
    # Windsurf IDE
    windsurf:
      description: "Windsurf IDE"
      path: .windsurf/rules
    
    # 用户自定义智能体
    my-agent:
      description: "My Custom Agent"
      path: .my-agent/skills

# ===== 全局 Skill Groups =====
# 批量添加 Skills 的快捷方式
# 作用：在项目中快速添加一组相关 Skills
groups:
  web-dev:
    description: "Web development essentials"
    skills:
      - drawio
      - theme-factory
      - code-review
  
  productivity:
    description: "AI productivity"
    skills:
      - pua
      - handoff
      - research

# ===== 全局设置 =====
settings:
  # 默认 Target（项目未声明 targets 时自动使用）
  default_target: claude-code
```

### 字段说明

#### `defaults.targets`

预定义的智能体目录，所有项目自动继承。

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `<name>` | string | - | Target 名称（键） |
| `description` | string | 否 | 智能体描述 |
| `path` | string | 是 | Skill 存放路径 |

**路径格式**：
- 相对路径：`.claude/skills` → 相对于项目目录
- 家目录：`~/.claude/skills` → 相对于用户家目录
- 绝对路径：`/opt/skills` → 直接使用

---

#### `groups`

全局 Skill Groups，批量添加工具。

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `<name>` | string | - | Group 名称（键） |
| `description` | string | 否 | Group 描述 |
| `skills` | array | 是 | Group 包含的 Skills |

---

#### `settings`

全局设置。

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `default_target` | string | 是 | 默认 Target 名称 |

---

## 二、项目配置文件 (config.yaml)

### 文件位置

- **家目录项目**: `~/.skill-registry/config.yaml`
- **普通项目**: `<project-root>/.skill-registry/config.yaml`

---

### 配置格式

#### 形式 1：最简形式（使用默认）

```yaml
# 项目只声明 Skills
# 自动使用 global.yaml 中的 settings.default_target

skills:
  - drawio
  - pua
  - handoff
```

**适用场景**：
- 单一智能体项目
- 使用全局默认 target
- 最简化配置

---

#### 形式 2：多智能体项目

```yaml
# 显式声明要使用的 targets
# 使用全局预定义的路径

targets:
  claude-code: {}
  cursor: {}
  codex: {}

skills:
  - drawio
  - theme-factory
  - pua
```

**适用场景**：
- 多智能体项目
- 使用全局预定义的 targets
- 所有智能体使用相同 Skills

---

#### 形式 3：自定义项目

```yaml
# 混合使用全局预定义和自定义

targets:
  # 使用全局预定义
  claude-code: {}
  
  # 使用全局预定义
  cursor: {}
  
  # 覆盖全局的路径
  codex:
    path: .codex/skills-custom
    description: "Codex with custom path"
  
  # 项目自定义智能体
  my-custom-agent:
    path: .my-agent/skills
    description: "My Custom Agent"

skills:
  - drawio
  - theme-factory
  - pua
```

**适用场景**：
- 需要自定义路径
- 需要自定义智能体
- 灵活定制

---

### 字段说明

#### `targets`（可选）

项目级 Targets 定义。

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `<name>` | string | - | Target 名称（键） |
| `path` | string | 否 | 自定义路径（不指定则使用全局预定义） |
| `description` | string | 否 | Target 描述 |

**继承规则**：
- 如果不指定 `path`，使用全局预定义
- 如果指定 `path`，覆盖全局预定义
- 如果全局不存在，必须指定 `path`

---

#### `skills`（必需）

项目需要的 Skills。

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `<name>` | string | - | Skill 名称 |

**关键点**：
- ✅ Skills 只需声明名称
- ❌ 不支持 `targets` 字段
- ✅ 所有 Skills 统一分发到所有 Targets

---

## 三、配置继承逻辑

### Target 解析优先级

```
1. 检查项目是否定义了 targets
   ↓
┌─────────────────┬─────────────────┐
│  未定义 targets  │  定义了 targets  │
├─────────────────┼─────────────────┤
│                 │                 │
│  使用全局       │  只使用项目     │
│  default_target │  声明的 targets │
│                 │                 │
└─────────────────┴─────────────────┘
```

---

### Target 路径解析

```
项目 targets 配置
    ↓
检查是否有 path 字段
    ↓
┌────────────────┬────────────────┐
│ 有 path        │ 无 path        │
├────────────────┼────────────────┤
│ 使用项目的     │ 使用全局       │
│ 自定义路径     │ 预定义路径     │
└────────────────┴────────────────┘
```

---

### 示例解析

**项目配置**：
```yaml
targets:
  claude-code: {}
  cursor:
    path: .cursor/rules-custom
  my-agent:
    path: .my-agent/skills
```

**解析结果**：
```yaml
claude-code:
  path: .claude/skills  # 来自全局预定义

cursor:
  path: .cursor/rules-custom  # 来自项目自定义

my-agent:
  path: .my-agent/skills  # 来自项目自定义
```

---

## 四、完整示例

### 示例 1：家目录项目

```yaml
# ~/.skill-registry/config.yaml

# 家目录使用特殊的 target
targets:
  claude-code-home: {}

# 全局 Skills
skills:
  - pua
  - handoff
  - research
```

---

### 示例 2：简单项目

```yaml
# ~/my-simple-project/.skill-registry/config.yaml

# 不定义 targets，使用全局默认
skills:
  - drawio
  - pua
```

**行为**：自动使用 `claude-code` target

---

### 示例 3：多智能体项目

```yaml
# ~/my-multi-agent-project/.skill-registry/config.yaml

targets:
  claude-code: {}
  cursor: {}
  codex: {}

skills:
  - drawio
  - theme-factory
  - pua
```

**行为**：同步到 3 个 targets

---

### 示例 4：自定义项目

```yaml
# ~/my-custom-project/.skill-registry/config.yaml

targets:
  # 全局预定义
  claude-code: {}
  
  # 自定义路径
  cursor:
    path: .cursor/rules-special
  
  # 自定义智能体
  my-agent:
    path: .my-agent/skills

skills:
  - drawio
  - theme-factory
  - pua
```

---

## 五、配置操作命令

### 全局配置操作

```bash
# 查看全局配置
skill-registry global show

# 添加全局 Target
skill-registry target add windsurf --path .windsurf/rules

# 删除全局 Target
skill-registry target remove windsurf

# 编辑全局配置
skill-registry global edit
```

---

### 项目配置操作

```bash
# 查看项目配置
skill-registry project show

# 添加 Skill
skill-registry project add drawio

# 移除 Skill
skill-registry project remove drawio

# 添加 Target
skill-registry project target add cursor

# 移除 Target
skill-registry project target remove cursor
```

---

## 六、配置验证

### 必需字段检查

**global.yaml**:
- ✅ `defaults.targets` 必需
- ✅ `settings.default_target` 必需

**config.yaml**:
- ✅ `skills` 必需
- ⚠️ `targets` 可选

---

### 一致性检查

- Target 名称在全局预定义中存在（如果项目未指定 path）
- Skill 名称在注册表中存在
- 路径格式正确

---

## 七、配置迁移

### 从旧版本迁移

如果存在旧版本的配置文件，提供迁移工具：

```bash
skill-registry config migrate
```

---

## 八、配置最佳实践

### 1. 全局配置

- ✅ 预定义所有可能使用的智能体
- ✅ 设置合理的 default_target
- ✅ 创建常用的 Skill Groups

---

### 2. 项目配置

- ✅ 简单项目使用默认 target
- ✅ 多智能体项目显式声明 targets
- ✅ 只在需要时自定义路径

---

### 3. 管理建议

- ✅ 使用版本控制管理项目配置
- ✅ 定期更新全局 Targets
- ✅ 合理组织 Skill Groups

---

最后更新：2026-09-08
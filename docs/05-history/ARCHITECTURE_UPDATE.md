# Skill Router - 架构改进总结

## 核心改进：Target 机制

### 问题
原设计存在以下限制：
1. **硬编码智能体路径**：只支持预定义的 Claude Code、Codex 等
2. **全局和项目分离**：两套不同的管理机制
3. **扩展性差**：新增智能体需要修改代码

### 解决方案
**"以不变应万变"**：通过 Target 配置实现通用性

---

## 关键变化

### 1. 新增 Target 概念

**定义**：Target 是 Skill 的部署目标，定义了同步路径和格式。

**特性**：
- 🎯 自定义路径：用户可定义任意智能体的 skill 路径
- 🌐 多目标同步：一个 Skill 可同时同步到多个智能体
- 🏠 全局项目管理：用户家目录也视为标准项目
- 🔧 格式适配：支持不同智能体的文件格式

### 2. 配置文件变化

#### 原 design（硬编码）
```yaml
# 项目配置
sync:
  default_agent: claude
  agents:
    claude:
      path: .claude/skills
      enabled: true
```

#### 新 design（灵活配置）
```yaml
# Target 定义（全局）
targets:
  claude-code:
    path: .claude/skills
    type: project

  cursor:
    path: .cursor/rules
    type: project
    format: mdc

# 项目配置
skills:
  - name: drawio
    targets: [claude-code, cursor]  # 多目标支持
```

### 3. CLI 命令变化

#### 新增命令组
```bash
skill-registry target
├── list              # 列出所有 Targets
├── add <name>        # 添加自定义 Target
├── remove <name>     # 移除 Target
├── info <name>       # 查看 Target 详情
└── set-default <name># 设置默认 Target
```

#### 增强命令
```bash
# 支持多 Target
skill-registry project add drawio --target claude-code,cursor
skill-registry project sync --target claude-code
```

### 4. 全局项目管理

**概念**：将用户家目录 `~` 视为一个标准项目。

**优势**：
- 统一管理：全局和项目级 Skills 使用同一套机制
- 简化操作：无需两套不同的命令
- 灵活配置：可以为全局 Skills 指定不同的 Targets

**实现**：
```bash
# 在家目录初始化全局项目
cd ~
skill-registry project init --global

# 添加全局 Skills
skill-registry project add pua --target claude-code-global

# 同步
skill-registry project sync
# 结果：~/.claude/skills/pua -> ~/.skill-registry/skills/xxx/pua
```

---

## 核心优势

### 1. 通用性
- 支持任意智能体，无需修改代码
- 用户自定义路径和格式
- 适应未来新智能体

### 2. 灵活性
- 一个 Skill 可同步到多个目标
- 支持项目级和全局级 Targets
- 支持自定义格式

### 3. 简洁性
- 全局和项目统一管理
- 一套机制，多种用途
- 配置简单直观

### 4. 扩展性
- 新增智能体：添加 Target 配置即可
- 新增格式：在 Target 中指定 format
- 支持未来需求

---

## 使用场景示例

### 场景 1：单智能体用户（Claude Code）

```bash
# 全局安装
cd ~
skill-registry project init --global
skill-registry project add pua handoff research

# 项目级使用
cd ~/my-project
skill-registry project init
skill-registry project add drawio theme-factory
skill-registry project sync
```

### 场景 2：多智能体用户

```bash
# 在项目中为不同智能体配置不同 Skills
skill-registry project init

skill-registry project add drawio --target claude-code
skill-registry project add cursor-helpers --target cursor
skill-registry project add codex-optimizer --target codex

# 某些 Skill 跨智能体使用
skill-registry project add pua --target claude-code,codex

skill-registry project sync
```

### 场景 3：自定义智能体

```bash
# 定义自己的智能体 Target
skill-registry target add my-agent \
  --path .my-agent/skills \
  --type project

# 使用
skill-registry project add my-custom-skill --target my-agent
skill-registry project sync

# 同步结果：.my-agent/skills/my-custom-skill
```

### 场景 4：团队标准化

```yaml
# 项目配置提交到 Git
skills:
  - name: drawio
    targets: [claude-code]
  - name: team-linter
    targets: [claude-code]

default_targets: [claude-code]

# 团队成员只需：
# 1. git clone
# 2. skill-registry project sync
```

---

## 数据模型对比

### 原 design
```typescript
// 项目配置
interface ProjectConfig {
  skills: Skill[];
  groups?: string[];
  sync: {
    default_agent: string;
    agents: {
      [key: string]: {
        path: string;
        enabled: boolean;
      }
    }
  }
}
```

### 新 design
```typescript
// Target 定义
interface Target {
  name: string;
  description?: string;
  path: string;  // 支持 ~ 和相对路径
  type: 'project' | 'global';
  format?: 'md' | 'mdc' | 'custom';
}

// 项目配置
interface ProjectConfig {
  project: string;
  skills: {
    name: string;
    targets?: string[];  // 多目标支持
  }[];
  groups?: {
    name: string;
    targets?: string[];
  }[];
  default_targets?: string[];
  target_overrides?: {
    [target: string]: {
      path?: string;
    }
  }
}
```

---

## 实现影响

### Phase 1 变化
- **新增**：Target 管理功能
- **增强**：`project add` 支持 `--target` 参数
- **增强**：`project sync` 支持多目标同步
- **新增**：全局项目支持

### 技术栈影响
- 无需新增依赖
- 数据库新增 `targets` 表
- 配置文件格式保持 YAML

### 兼容性
- **向后兼容**：如果项目配置中没有指定 `targets`，使用 `default_targets` 或全局默认
- **迁移简单**：无破坏性变更

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 用户不熟悉 Target 概念 | 提供预定义的常用 Targets，文档清晰说明 |
| 配置复杂度增加 | 提供合理的默认值，简化常见场景 |
| 多目标同步可能冲突 | 提供状态报告，清晰展示同步结果 |
| 格式转换可能丢失细节 | Phase 1 不实现转换，让智能体自己兼容 |

---

## 下一步

1. **决策确认**：确认 Target 机制的设计
2. **更新文档**：完善用户文档和开发文档
3. **开始实施**：按照新的架构实现 Phase 1 功能

**关键决策点**：
- ✅ 是否采用 Target 机制？（推荐：是）
- ✅ 是否支持多目标同步？（推荐：是）
- ✅ 是否支持全局项目？（推荐：是）
- ✅ Phase 1 是否实现格式转换？（推荐：否，保持简单）
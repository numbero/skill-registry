# Skill Registry - 设计概览

> 统一管理 AI Agent Skills 的 CLI 工具

---

## 🎯 项目定位

Skill Router 是一个专业的命令行工具，用于统一管理来自不同来源（Git 仓库、本地目录）的 AI Agent Skills，并实现跨项目的 Skill 拉取与部署。

---

## 💡 核心理念

### 1. 全局预定义，项目自动继承

```
全局预定义 Targets（智能体目录）
    ↓
项目自动继承（无需显式声明）
    ↓
只有需要定制时才在项目中声明
```

**价值**：
- 新智能体出现时，只需在全局添加一次
- 所有项目立即可用
- 避免重复配置

---

### 2. 项目级 Skill 集合管理

```
项目中所有智能体使用相同的 Skill 集合
    ↓
添加 Skill = 声明需求
    ↓
拉取 Skill = 分发到所有 Targets
```

**核心理念**：
- 一个项目的所有智能体应该使用相同的 Skills
- Skills 只需声明，无需指定 targets
- 同步时全量分发到所有 targets

---

### 3. 单向增量拉取

```
pull 操作只做增量
    ↓
添加新的链接
    ↓
不删除已存在的链接
```

**安全保障**：
- 保护智能体动态创建的 Skills
- 配置错误不会导致数据丢失
- 用户可以灵活管理实际文件

---

## 🔑 关键设计

### 配置文件结构

```
~/.skill-registry/
├── global.yaml          # 全局配置
│   ├── defaults.targets # 预定义智能体
│   ├── groups           # 全局 Skill Groups
│   └── settings         # 全局设置
│
├── config.yaml          # 家目录项目配置
│   ├── targets          # 项目 Targets
│   └── skills           # 项目 Skills
│
├── registry.db          # Skill 注册表
└── skills/              # Skill 缓存

~/my-project/
└── .skill-registry/
    └── config.yaml      # 项目配置
        ├── targets      # 项目 Targets（可选）
        └── skills       # 项目 Skills
```

---

### 配置继承规则

```
项目未定义 targets
    ↓
使用 global.yaml 中的 settings.default_target
    ↓
项目定义了 targets
    ↓
只使用项目声明的 targets
    ↓
项目可使用全局预定义的，也可自定义
```

---

### CLI 命令体系

```
skill-registry
├── skill        # Skill 管理（全局）
├── group        # Group 管理（全局）
├── target       # Target 管理（全局）
├── global       # 全局配置管理
├── project      # 项目管理
└── status       # 状态查看
```

**命令模式**：
- `skill-registry <object> <action>` - 全局命令
- `skill-registry project <action>` - 项目操作
- `skill-registry project <type> <action>` - 项目子操作

---

## 🎨 核心特性

### 1. 集中管理
- ✅ 统一管理散落在各处的 Skills
- ✅ Git 和本地 Skill 源管理
- ✅ 版本控制和来源跟踪

### 2. 全局预定义
- ✅ 预定义所有可用智能体
- ✅ 项目自动继承配置
- ✅ 新智能体一次配置全局受益

### 3. 灵活定制
- ✅ 项目可选择使用哪些 Targets
- ✅ 项目可覆盖全局配置
- ✅ 支持自定义路径

### 4. 安全可靠
- ✅ 单向增量拉取
- ✅ 保护动态创建的 Skills
- ✅ 配置和实际分离

### 5. 标准化
- ✅ 遵循 Agent Skills 开放标准
- ✅ 完全支持 Claude 标准
- ✅ 不做格式转换

---

## 📊 数据模型

### Skill 元数据
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  source_type: 'git' | 'local';
  source_url?: string;
  source_path?: string;
  cached_path: string;
  version: string;
  installed_at: Date;
  updated_at: Date;
}
```

### Target 定义
```yaml
targets:
  claude-code:
    description: "Claude Code CLI"
    path: .claude/skills
```

### 项目配置
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

## 🚀 工作流程

### 新项目快速启动

```bash
# 1. 初始化项目
cd ~/my-project
skill-registry project init

# 2. 添加 Skills（使用默认 target）
skill-registry add drawio
skill-registry add pua

# 3. 拉取
skill-registry project pull
```

---

### 多智能体项目

```bash
# 1. 初始化
skill-registry project init

# 2. 添加 Targets
skill-registry project target add claude-code
skill-registry project target add cursor

# 3. 添加 Skills
skill-registry add drawio
skill-registry add pua

# 4. 拉取
skill-registry project pull
# → 所有 Skills 同步到所有 Targets
```

---

### 使用 Group

```bash
# 1. 创建 Group（全局）
skill-registry group add web-dev
skill-registry group add web-dev drawio,theme-factory

# 2. 在项目中应用
skill-registry project group add web-dev

# 3. 拉取
skill-registry project pull
```

---

## 🎯 设计决策

详见: [已确认决策](./DECISIONS.md)

核心决策：
- ✅ 多目标同步
- ✅ 全局预定义 Targets
- ✅ 单向增量拉取
- ✅ 项目级 Skill 集合管理
- ✅ 遵循 Agent Skills 标准

---

## 📈 实现路线

### Phase 1: MVP
- CLI 框架
- 核心命令实现
- 基本配置管理
- Skill 拉取功能

### Phase 2: 增强
- 智能检测变更
- 增量更新
- 交互式引导
- 友好提示

### Phase 3: 扩展
- 文件监控（可选）
- 自动更新
- 性能优化

---

## 🔗 相关链接

- [Agent Skills 标准](https://github.com/anthropics/agent-skills)
- [Claude Code 文档](https://docs.anthropic.com/claude-code)
- [Skills Manager](https://github.com/xingkongliang/skills-manager)
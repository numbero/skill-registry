# Skill Registry - 最终设计方案

> 经过充分讨论确定的最终设计方案

---

## 🎯 核心设计原则

### 1. 简单即真理
- 最少的依赖（无数据库）
- 最少的配置文件
- 最少的元数据

### 2. 透明可理解
- 所有信息都是文件
- 用户可以直接查看和修改
- 无隐藏状态

### 3. 自动检测
- 自动识别 Git 仓库
- 自动检测远程仓库
- 智能更新逻辑

---

## 📁 目录结构

### 中央仓库结构

```
~/.skill-registry/
├── global.yaml              # 全局配置（唯一配置文件）
└── skills/                  # Skills 目录
    ├── drawio/              # Skill 目录（名称唯一）
    │   ├── SKILL.md         # Skill 定义（必需）
    │   ├── .git/            # Git 信息（可选）
    │   └── templates/       # 其他资源文件
    │
    ├── my-skill/            # 本地 Skill
    │   ├── SKILL.md
    │   └── ...
    │
    └── pua/                 # Git Skill
        ├── SKILL.md
        ├── .git/
        └── prompts/
```

### 项目目录结构

```
~/my-project/
├── .skill-registry/
│   └── config.yaml          # 项目配置
└── .claude/skills/          # Target 目录
    └── drawio -> ~/.skill-registry/skills/drawio/
```

---

## 🔑 关键设计决策

### 决策 1：无数据库

**状态**: ✅ 已确认

**理由**：
- Skills 数量有限（通常几十个）
- 文件系统性能足够
- 简化架构，减少依赖
- 透明可理解

**实现**：
- 所有信息从文件系统获取
- Git 信息从 `.git/` 目录获取
- Skill 信息从 SKILL.md 读取

---

### 决策 2：扁平目录结构

**状态**: ✅ 已确认

**理由**：
- 路径简洁
- 易于理解
- 名称唯一，无冲突

**实现**：
```
skills/
├── drawio/
├── my-skill/
└── pua/
```

**规则**：
- Skill 名称必须唯一
- 冲突时使用 `--name` 指定不同名称
- 或使用 `--force` 覆盖

---

### 决策 3：无额外元数据文件

**状态**: ✅ 已确认

**理由**：
- 元数据可从现有资源获取
- 避免同步问题
- 减少维护负担

**信息来源**：
- **Skill 信息**：SKILL.md frontmatter
- **Git 信息**：`.git/` 目录（git remote, git log）
- **时间信息**：文件系统（birthtime, mtime）

---

### 决策 4：注册机制简化

**状态**: ✅ 已确认

**`skill add` 命令职责**：
1. 验证 Skill 格式（SKILL.md 存在）
2. 复制/克隆到中央仓库
3. 完成

**不做的事**：
- ❌ 不替换软链接
- ❌ 不修改原位置
- ❌ 不创建额外元数据文件

---

### 决策 5：自动检测更新

**状态**: ✅ 已确认

**更新逻辑**：
```
skill update
    ↓
检查 .git 目录
    ├─ 不存在 → 跳过（本地 Skill）
    └─ 存在 → 检查远程仓库
                ├─ 无远程 → 跳过（本地 Git）
                └─ 有远程 → git pull
```

**自动检测**：
- 是否是 Git 仓库：检查 `.git/` 目录
- 是否有远程：`git remote -v`
- 版本信息：`git log -1`

---

### 决策 6：全局预定义 Targets

**状态**: ✅ 已确认

**理由**：
- 新智能体只需添加一次
- 所有项目自动继承
- 统一管理智能体路径

**实现**：
```yaml
# global.yaml
defaults:
  targets:
    claude-code:
      path: .claude/skills
    cursor:
      path: .cursor/rules
```

---

### 决策 7：项目级 Skill 集合

**状态**: ✅ 已确认

**理念**：
- 项目中所有智能体使用相同的 Skills
- Skills 只需声明，不指定 targets
- 拉取时全量分发

**实现**：
```yaml
# config.yaml
skills:
  - drawio
  - pua
```

---

### 决策 8：单向增量拉取

**状态**: ✅ 已确认

**理念**：
- `pull` 只做增量
- 不删除已存在的链接
- 保护动态创建的文件

**理由**：
- 避免误删智能体创建的 Skills
- 配置错误不会导致数据丢失
- 更安全可靠

---

## 📋 配置文件设计

### global.yaml

```yaml
# ===== 中央仓库配置 =====
registry:
  path: ~/.skill-registry/skills

# ===== 全局预定义 Targets =====
defaults:
  targets:
    claude-code:
      description: "Claude Code CLI"
      path: .claude/skills
    
    claude-code-home:
      description: "Claude Code (home)"
      path: ~/.claude/skills
    
    cursor:
      description: "Cursor IDE"
      path: .cursor/rules
    
    codex:
      description: "OpenAI Codex CLI"
      path: .codex/skills

# ===== 全局 Skill Groups =====
groups:
  web-dev:
    description: "Web development essentials"
    skills:
      - drawio
      - theme-factory
      - code-review
  
  productivity:
    description: "AI productivity tools"
    skills:
      - pua
      - handoff
      - research

# ===== 全局设置 =====
settings:
  default_target: claude-code
```

---

### 项目 config.yaml

```yaml
# ===== 项目 Targets（可选） =====
targets:
  claude-code: {}
  cursor: {}
  my-agent:
    path: .my-agent/skills

# ===== 项目 Skills =====
skills:
  - drawio
  - theme-factory
  - pua
```

**继承规则**：
- 未定义 targets → 使用 `settings.default_target`
- 定义 targets → 只使用声明的
- 无 path → 使用全局预定义
- 有 path → 覆盖全局预定义

---

## 🎨 CLI 命令设计

### 命令树

```
skill-registry
│
├── skill                    # Skill 管理（全局）
│   ├── add <source>         # 注册 Skill
│   ├── remove <name>        # 移除 Skill
│   ├── list                 # 列出所有 Skills
│   ├── update [name]        # 更新 Skill
│   └── status [name]        # 查看 Skill 状态
│
├── group                    # Group 管理（全局）
│   ├── add <name> [skill]
│   ├── remove <name> [skill]
│   └── list
│
├── target                   # Target 管理（全局）
│   ├── add <name>
│   ├── remove <name>
│   └── list
│
├── global                   # 全局配置管理
│   ├── show
│   └── edit
│
├── project                  # 项目管理
│   ├── init
│   ├── add <skill>
│   ├── remove <skill>
│   ├── group add <name>
│   ├── target add <name>
│   ├── target remove <name>
│   ├── target list
│   ├── pull
│   └── show
│
└── status                   # 状态查看
```

---

## 💻 核心实现

### 1. Skill 信息获取

```typescript
async function getSkillInfo(skillDir: string): Promise<SkillInfo> {
  // 读取 SKILL.md
  const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
  const { frontmatter } = parseFrontmatter(skillMd);
  
  // 检查 Git
  const isGit = fs.existsSync(path.join(skillDir, '.git'));
  
  // 获取 Git 信息
  let source: string | undefined;
  let version: string | undefined;
  
  if (isGit) {
    const git = simpleGit(skillDir);
    const remotes = await git.getRemotes(true);
    source = remotes[0]?.fetchUrl;
    
    const log = await git.log(['-1']);
    version = log.latest?.hash;
  }
  
  // 获取时间
  const stats = fs.statSync(skillDir);
  
  return {
    name: frontmatter.name || path.basename(skillDir),
    description: frontmatter.description || '',
    cached_path: skillDir,
    is_git: isGit,
    source: source,
    version: version,
    installed_at: stats.birthtime,
    updated_at: stats.mtime,
    metadata: frontmatter
  };
}
```

---

### 2. 注册 Skill

```typescript
async function addSkill(source: string, options: AddOptions): Promise<void> {
  const name = options.name || await extractSkillName(source);
  
  // 检查唯一性
  const skillDir = path.join(getRegistryPath(), name);
  if (fs.existsSync(skillDir) && !options.force) {
    throw new Error(`Skill '${name}' already exists.`);
  }
  
  // 获取 Skill
  if (isGitSource(source)) {
    await cloneGitSkill(source, skillDir);
  } else {
    await copyLocalSkill(source, skillDir);
  }
  
  console.log(`✓ Registered skill '${name}'`);
}
```

---

### 3. 更新 Skill

```typescript
async function updateSkill(name?: string): Promise<void> {
  const skills = name ? [await getSkillByName(name)] : await listSkills();
  
  for (const skill of skills) {
    if (!skill.is_git) {
      console.log(`${skill.name}: Skipped (not a git repo)`);
      continue;
    }
    
    if (!skill.source) {
      console.log(`${skill.name}: Skipped (no remote)`);
      continue;
    }
    
    const git = simpleGit(skill.cached_path);
    await git.pull();
    console.log(`${skill.name}: Updated`);
  }
}
```

---

## 🔄 完整工作流

### 工作流 1：注册和使用 Skill

```bash
# 1. 注册 Git Skill
skill-registry skill add git+https://github.com/user/skills.git#drawio

# 2. 在项目中使用
cd ~/my-project
skill-registry project init
skill-registry add drawio
skill-registry pull

# 结果：drawio 同步到项目的所有 Targets
```

---

### 工作流 2：注册本地 Skill

```bash
# 1. 注册本地 Skill
skill-registry skill add ~/dev/my-skill

# 2. 后续演进
cd ~/.skill-registry/skills/my-skill
vim SKILL.md
# 可选：初始化 Git
git init
git remote add origin https://github.com/user/my-skill.git

# 3. 之后可以自动更新
skill-registry skill update my-skill
```

---

### 工作流 3：多智能体项目

```bash
# 1. 初始化项目
skill-registry project init

# 2. 添加多个 Targets
skill-registry project target add claude-code
skill-registry project target add cursor

# 3. 添加 Skills
skill-registry add drawio
skill-registry add pua

# 4. 拉取
skill-registry pull

# 结果：所有 Skills 同步到所有 Targets
```

---

### 工作流 4：使用 Groups

```bash
# 1. 创建 Group
skill-registry group add web-dev
skill-registry group add web-dev drawio,theme-factory

# 2. 在项目中应用
skill-registry project group add web-dev

# 3. 拉取
skill-registry pull
```

---

## 🎯 设计优势总结

### 1. 极简架构
- ✅ 无数据库
- ✅ 无额外元数据
- ✅ 最少的依赖

### 2. 透明可靠
- ✅ 所有信息都是文件
- ✅ 用户可直接查看修改
- ✅ 无隐藏状态

### 3. 自动智能
- ✅ 自动检测 Git 仓库
- ✅ 自动更新逻辑
- ✅ 最少的手动操作

### 4. 灵活演进
- ✅ 本地 Skill 可随时初始化 Git
- ✅ 支持 Git 和本地混合
- ✅ 支持各种工作流

---

## 📊 技术栈

- **语言**: TypeScript/Node.js
- **CLI 框架**: Commander.js
- **配置解析**: yaml
- **Git 操作**: simple-git
- **文件操作**: fs-extra
- **终端 UI**: chalk + inquirer

---

## 📝 实现优先级

### Phase 1: MVP
- [ ] `skill add/remove/list/update/status`
- [ ] `group add/remove/list`
- [ ] `target add/remove/list`
- [ ] `project init/add/remove/pull/show`
- [ ] 配置文件解析
- [ ] 基本的错误处理

### Phase 2: 增强
- [ ] 交互式命令
- [ ] 彩色输出
- [ ] `--dry-run` 预览
- [ ] 友好的错误提示

### Phase 3: 扩展
- [ ] Tab 补全
- [ ] 快捷命令
- [ ] 性能优化

---

最后更新：2026-09-08
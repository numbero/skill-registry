# Skill Registry - 快速参考

> 开发实现时的快速参考

---

## 📁 存储结构

```
~/.skill-registry/
├── global.yaml              # 全局配置（唯一）
└── skills/                  # Skills 目录
    ├── <skill-name>/        # Skill（名称唯一）
    │   ├── SKILL.md         # Skill 定义（必需）
    │   ├── .git/            # Git 仓库（可选）
    │   └── ...              # 资源文件
    └── ...
```

---

## 🔑 配置文件

### global.yaml

```yaml
registry:
  path: ~/.skill-registry/skills

defaults:
  targets:
    claude-code:
      path: .claude/skills

groups:
  web-dev:
    skills: [drawio, theme-factory]

settings:
  default_target: claude-code
```

---

### config.yaml（项目）

```yaml
targets:
  claude-code: {}

skills:
  - drawio
  - pua
```

---

## 🎯 核心决策

### 1. 无数据库
- ✅ 所有信息从文件获取
- ✅ Git 信息从 `.git/` 获取
- ✅ Skill 信息从 SKILL.md 读取

### 2. 扁平目录
- ✅ `skills/<skill-name>/`
- ✅ 名称唯一
- ✅ 无随机 ID

### 3. 无额外元数据
- ✅ 不需要 .skill-meta.yaml
- ✅ 不需要数据库表
- ✅ 自动检测 Git

### 4. 单向增量拉取
- ✅ pull 只添加链接
- ✅ 不删除已存在链接
- ✅ 保护动态创建文件

---

## 💻 核心 API

### 获取 Skill 信息

```typescript
async function getSkillInfo(skillDir: string): Promise<SkillInfo> {
  // 1. 读取 SKILL.md
  const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
  const { frontmatter } = parseFrontmatter(skillMd);
  
  // 2. 检查 Git
  const isGit = fs.existsSync(path.join(skillDir, '.git'));
  
  // 3. 获取 Git 信息
  let source, version;
  if (isGit) {
    const git = simpleGit(skillDir);
    source = (await git.getRemotes(true))[0]?.fetchUrl;
    version = (await git.log(['-1'])).latest?.hash;
  }
  
  // 4. 获取时间
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

### 注册 Skill

```typescript
async function addSkill(source: string, options: AddOptions): Promise<void> {
  const name = options.name || await extractSkillName(source);
  
  // 检查唯一性
  const targetPath = path.join(getRegistryPath(), name);
  if (fs.existsSync(targetPath) && !options.force) {
    throw new Error(`Skill '${name}' already exists.`);
  }
  
  // 获取 Skill
  if (isGitSource(source)) {
    await git.clone(parseGitUrl(source).repoUrl, targetPath, ['--depth', '1']);
  } else {
    await fs.copy(source, targetPath);
  }
  
  console.log(`✓ Registered skill '${name}'`);
}
```

---

### 更新 Skill

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

## 🔄 关键流程

### 注册 Git Skill

```
skill add git+url
    ↓
克隆到中央仓库
    ↓
完成（.git 目录保留）
```

---

### 注册本地 Skill

```
skill add /path
    ↓
复制到中央仓库
    ↓
完成（原位置保留）
```

---

### 更新 Skill

```
skill update
    ↓
遍历 skills 目录
    ↓
读取每个 Skill 的 SKILL.md
    ↓
检查 .git 目录
    ├─ 无 → 跳过
    └─ 有 → 检查 remote
                ├─ 无 → 跳过
                └─ 有 → git pull
```

---

### 项目拉取

```
project pull
    ↓
读取项目 Skills
    ↓
读取项目 Targets
    ↓
对每个 Skill + 每个 Target
    ├─ 创建软链接
    └─ 已存在 → 跳过（或 --force）
```

---

## 📋 命令速查

### Skill 管理

```bash
skill add <source>              # 注册
skill remove <name>             # 移除
skill list                      # 列出
skill update [name]             # 更新
skill status [name]             # 状态
```

---

### Group 管理

```bash
group add <name> [skill]        # 创建/添加
group remove <name> [skill]     # 移除/删除
group list                      # 列出
```

---

### Target 管理

```bash
target add <name>               # 添加
target remove <name>            # 删除
target list                     # 列出
```

---

### 项目管理

```bash
project init                    # 初始化
project add <skill>             # 添加 Skill
project remove <skill>          # 移除 Skill
project group add <name>        # 添加 Group
project target add <name>       # 添加 Target
project pull                    # 拉取
project show                    # 显示
```

---

## 🎨 文件格式

### SKILL.md

```markdown
---
name: drawio
description: "Draw.io skill"
allowed_tools:
  - read_file
  - write_file
---

# Draw.io Skill

This skill helps create diagrams...
```

---

### global.yaml

```yaml
registry:
  path: ~/.skill-registry/skills

defaults:
  targets:
    <name>:
      description: "..."
      path: .claude/skills

groups:
  <name>:
    description: "..."
    skills: [list]

settings:
  default_target: claude-code
```

---

### config.yaml

```yaml
targets:
  <name>: {}
  <name>:
    path: custom/path

skills:
  - <name>
```

---

## ⚠️ 注意事项

### 唯一性
- Skill 名称必须唯一
- 冲突时用 `--name` 或 `--force`

### 单向拉取
- pull 只添加链接
- 不会删除已存在链接
- remove 只更新配置

### 自动检测
- Git 信息自动检测
- 从 `.git/` 目录获取
- 无需手动维护

---

## 🚀 快速开始

### 新项目

```bash
cd project
skill-registry project init
skill-registry add drawio
skill-registry pull
```

---

### 多智能体

```bash
skill-registry project init
skill-registry project target add claude-code
skill-registry project target add cursor
skill-registry add drawio
skill-registry pull
```

---

### 新智能体

```bash
skill-registry target add windsurf --path .windsurf/rules
skill-registry project target add windsurf
skill-registry pull
```

---

最后更新：2026-09-08
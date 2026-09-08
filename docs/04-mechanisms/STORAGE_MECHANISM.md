# Skill Router - 存储机制

> 基于文件系统的存储设计（无数据库）

---

## 一、设计理念

### 核心原则

1. **无数据库**
   - 所有信息都是文件
   - 使用文件系统存储
   - 透明可理解

2. **信息来源**
   - SKILL.md：Skill 定义信息
   - .git/：Git 仓库信息
   - 文件系统：时间信息

3. **自动检测**
   - 自动识别 Git 仓库
   - 自动获取远程信息
   - 无需手动维护

---

## 二、存储结构

### 中央仓库

```
~/.skill-registry/
├── global.yaml              # 全局配置
└── skills/                  # Skills 目录
    ├── drawio/
    │   ├── SKILL.md         # Skill 定义（必需）
    │   ├── .git/            # Git 仓库（可选）
    │   └── templates/       # 资源文件
    │
    ├── my-skill/
    │   ├── SKILL.md
    │   └── ...
    │
    └── pua/
        ├── SKILL.md
        ├── .git/
        └── prompts/
```

---

### 配置文件

**global.yaml**（唯一配置文件）：
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

## 三、信息获取

### Skill 基本信息

**来源**：SKILL.md frontmatter

```yaml
---
name: drawio
description: "Draw.io diagram skill"
allowed_tools: [read_file, write_file]
---

# Skill Content
...
```

**读取方式**：
```typescript
const skillMd = fs.readFileSync('SKILL.md', 'utf-8');
const { frontmatter, content } = parseFrontmatter(skillMd);

const name = frontmatter.name;
const description = frontmatter.description;
const metadata = frontmatter;
```

---

### Git 信息

**来源**：`.git/` 目录

#### 是否是 Git 仓库

```typescript
function isGitRepo(dir: string): boolean {
  return fs.existsSync(path.join(dir, '.git'));
}
```

---

#### 远程仓库信息

```typescript
async function getGitRemote(dir: string): Promise<string | undefined> {
  if (!isGitRepo(dir)) return undefined;
  
  try {
    const git = simpleGit(dir);
    const remotes = await git.getRemotes(true);
    return remotes[0]?.fetchUrl;
  } catch {
    return undefined;
  }
}
```

---

#### 版本信息（Commit Hash）

```typescript
async function getGitVersion(dir: string): Promise<string | undefined> {
  if (!isGitRepo(dir)) return undefined;
  
  try {
    const git = simpleGit(dir);
    const log = await git.log(['-1']);
    return log.latest?.hash;
  } catch {
    return undefined;
  }
}
```

---

#### 分支信息

```typescript
async function getGitBranch(dir: string): Promise<string | undefined> {
  if (!isGitRepo(dir)) return undefined;
  
  try {
    const git = simpleGit(dir);
    const status = await git.status();
    return status.current;
  } catch {
    return undefined;
  }
}
```

---

### 时间信息

**来源**：文件系统

```typescript
const stats = fs.statSync(skillDir);

const installedAt = stats.birthtime;  // 创建时间
const updatedAt = stats.mtime;        // 修改时间
```

---

## 四、完整信息获取

### getSkillInfo 函数

```typescript
interface SkillInfo {
  name: string;
  description: string;
  cached_path: string;
  
  is_git: boolean;
  source?: string;
  version?: string;
  branch?: string;
  
  installed_at: Date;
  updated_at: Date;
  
  metadata: any;
}

async function getSkillInfo(skillDir: string): Promise<SkillInfo | null> {
  // 1. 检查 SKILL.md
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }
  
  // 2. 读取 SKILL.md
  const skillMd = fs.readFileSync(skillMdPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(skillMd);
  
  // 3. 检查 Git
  const isGit = isGitRepo(skillDir);
  
  // 4. 获取 Git 信息
  let source: string | undefined;
  let version: string | undefined;
  let branch: string | undefined;
  
  if (isGit) {
    source = await getGitRemote(skillDir);
    version = await getGitVersion(skillDir);
    branch = await getGitBranch(skillDir);
  }
  
  // 5. 获取时间
  const stats = fs.statSync(skillDir);
  
  return {
    name: frontmatter.name || path.basename(skillDir),
    description: frontmatter.description || '',
    cached_path: skillDir,
    
    is_git: isGit,
    source: source,
    version: version,
    branch: branch,
    
    installed_at: stats.birthtime,
    updated_at: stats.mtime,
    
    metadata: frontmatter
  };
}
```

---

## 五、核心操作

### 列出所有 Skills

```typescript
async function listSkills(): Promise<SkillInfo[]> {
  const registryPath = getRegistryPath();
  const skills: SkillInfo[] = [];
  
  // 遍历 skills 目录
  const entries = fs.readdirSync(registryPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const skillDir = path.join(registryPath, entry.name);
    const skillInfo = await getSkillInfo(skillDir);
    
    if (skillInfo) {
      skills.push(skillInfo);
    }
  }
  
  return skills;
}
```

---

### 查询单个 Skill

```typescript
async function getSkillByName(name: string): Promise<SkillInfo | null> {
  const skillDir = path.join(getRegistryPath(), name);
  
  if (!fs.existsSync(skillDir)) {
    return null;
  }
  
  return await getSkillInfo(skillDir);
}
```

---

### 检查 Skill 是否存在

```typescript
function skillExists(name: string): boolean {
  const skillDir = path.join(getRegistryPath(), name);
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  
  return fs.existsSync(skillDir) && fs.existsSync(skillMdPath);
}
```

---

### 移除 Skill

```typescript
async function removeSkill(name: string): Promise<void> {
  const skillDir = path.join(getRegistryPath(), name);
  
  if (!fs.existsSync(skillDir)) {
    throw new Error(`Skill '${name}' not found.`);
  }
  
  fs.rmSync(skillDir, { recursive: true });
  
  console.log(`✓ Removed skill '${name}'`);
}
```

---

## 六、性能考虑

### 文件系统操作次数

| 操作 | 操作次数 | 时间复杂度 |
|------|---------|-----------|
| 列出所有 Skills | N 个目录 + N 个文件读取 | O(N) |
| 查询单个 Skill | 1 个文件读取 | O(1) |
| 检查存在 | 2 个文件检查 | O(1) |
| 移除 Skill | 1 次目录删除 | O(M)* |

*M = 文件数量

---

### 适用规模

- **适合**：< 100 个 Skills
- **适中**：100-500 个 Skills
- **不适合**：> 500 个 Skills

**建议**：
- 如果 Skills 数量超过 100，考虑添加索引文件（可选）
- 但通常个人/团队管理的 Skills 数量不会超过 50 个

---

## 七、可选优化

### 索引文件（可选）

如果需要提高性能，可以添加索引文件：

```yaml
# ~/.skill-registry/index.yaml

skills:
  drawio:
    is_git: true
    source: https://github.com/user/skills.git
    version: abc123
  
  my-skill:
    is_git: false

last_updated: 2026-09-08T12:00:00Z
```

**更新策略**：
- 每次添加/移除/更新 Skill 时，同步更新索引
- 查询时优先读取索引
- 索引损坏时，从目录重建

**注意**：索引是可选的优化，不是必需的。

---

## 八、优势总结

### 1. 极简设计
- ✅ 无数据库依赖
- ✅ 无额外元数据文件
- ✅ 最少的配置

### 2. 透明可理解
- ✅ 所有信息都是文件
- ✅ 用户可以直接查看
- ✅ 无隐藏状态

### 3. 自动智能
- ✅ 自动检测 Git 仓库
- ✅ 自动获取版本信息
- ✅ 无需手动维护

### 4. 可靠性
- ✅ 文件系统稳定
- ✅ 无数据库损坏风险
- ✅ 易于备份恢复

### 5. 易于维护
- ✅ 无需数据库迁移
- ✅ 无需数据一致性检查
- ✅ 简单的备份和恢复

---

## 九、备份和迁移

### 备份

```bash
# 备份整个 skill-registry
tar -czf skill-registry-backup.tar.gz ~/.skill-registry/

# 包含：
# - global.yaml
# - skills/
#   - drawio/SKILL.md
#   - drawio/.git/
#   - ...
```

---

### 迁移

```bash
# 复制到新机器
scp -r ~/.skill-registry/ new-machine:~/.skill-registry/

# 或者修改路径
# 编辑 global.yaml
registry:
  path: /new/path/skills
```

---

### 恢复

```bash
# 恢复备份
tar -xzf skill-registry-backup.tar.gz -C ~/

# 验证
skill-registry skill list
```

---

## 十、设计决策

### 为什么不用数据库？

1. **Skills 数量有限**
   - 通常几十个 Skills
   - 文件系统足够快

2. **操作频率低**
   - 不是高频查询场景
   - 文件系统可以满足

3. **透明性**
   - 用户可以直接查看
   - 易于理解和调试

4. **简单性**
   - 减少依赖
   - 减少出错可能

---

### 为什么不用 .skill-meta.yaml？

1. **信息冗余**
   - 所有信息都可以从其他地方获取
   - 避免同步问题

2. **维护负担**
   - 需要保持元数据与实际一致
   - 增加复杂性

3. **Git 提供了足够的信息**
   - Git remote
   - Git log
   - 文件系统时间

---

最后更新：2026-09-08
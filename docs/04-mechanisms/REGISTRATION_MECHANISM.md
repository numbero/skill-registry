# Skill Router - 注册机制

> Skill 注册到中央仓库的机制

---

## 一、核心操作

### `skill add` - 注册 Skill

**唯一职责**：
- 将 Skill 目录复制/克隆到中央仓库
- 完成

**不做的事**：
- ❌ 不替换软链接
- ❌ 不修改原位置
- ❌ 不创建额外元数据文件
- ❌ 不自动添加到项目

---

## 二、命令设计

### 命令格式

```bash
skill-registry skill add <source> [options]

# Git 来源
skill-registry skill add git+https://github.com/user/skills.git#drawio
skill-registry skill add git+https://github.com/user/repo.git#path/to/skill

# 本地来源
skill-registry skill add /path/to/local/skill
skill-registry skill add ~/dev/my-skill
skill-registry skill add ./relative/skill

# 自定义名称
skill-registry skill add <source> --name <custom-name>

# 选项
--name <name>           # 指定 Skill 名称（默认从 SKILL.md 提取）
--description <desc>    # 指定描述（默认从 SKILL.md 提取）
--force                 # 强制覆盖已存在的 Skill
```

---

## 三、注册流程

### Git Skill 注册

```
开始
  ↓
解析 Git URL 和路径
  ↓
验证 Skill 格式
  ├─ 克隆到临时目录
  ├─ 检查 SKILL.md 存在
  └─ 读取 Skill 信息
  ↓
确定 Skill 名称
  ├─ --name 参数指定
  ├─ SKILL.md frontmatter.name
  └─ 目录名称
  ↓
检查唯一性
  ├─ 已存在 + 无 --force → 报错
  └─ 已存在 + --force → 删除旧的
  ↓
克隆到中央仓库
  ↓
完成
```

---

### 本地 Skill 注册

```
开始
  ↓
验证本地路径
  ├─ 路径存在
  ├─ 是目录
  └─ SKILL.md 存在
  ↓
确定 Skill 名称
  ├─ --name 参数指定
  ├─ SKILL.md frontmatter.name
  └─ 目录名称
  ↓
检查唯一性
  ↓
复制到中央仓库
  ↓
完成（原位置保留）
```

---

## 四、实现细节

### Git Skill 注册

```typescript
async function addGitSkill(gitUrl: string, options: AddOptions): Promise<void> {
  // 1. 解析 Git URL
  // 格式: git+https://github.com/user/repo.git#path/to/skill
  const { repoUrl, skillPath } = parseGitUrl(gitUrl);
  
  // 2. 克隆到临时目录
  const tempDir = await cloneToTemp(repoUrl);
  const skillDir = path.join(tempDir, skillPath || '');
  
  // 3. 验证 SKILL.md
  if (!fs.existsSync(path.join(skillDir, 'SKILL.md'))) {
    throw new Error(`SKILL.md not found in ${skillPath || 'root'}`);
  }
  
  // 4. 确定名称
  const name = options.name || await extractSkillName(skillDir);
  
  // 5. 检查唯一性
  const targetPath = path.join(getRegistryPath(), name);
  if (fs.existsSync(targetPath)) {
    if (!options.force) {
      throw new Error(`Skill '${name}' already exists.`);
    }
    fs.rmSync(targetPath, { recursive: true });
  }
  
  // 6. 克隆到中央仓库
  await git.clone(repoUrl, targetPath, ['--depth', '1']);
  
  // 7. 如果指定了子路径，调整内容
  if (skillPath) {
    // 将子目录内容移到根目录
    const subDir = path.join(targetPath, skillPath);
    // ... 移动文件
  }
  
  console.log(`✓ Registered skill '${name}'`);
}

// 解析 Git URL
function parseGitUrl(url: string): { repoUrl: string; skillPath: string } {
  // git+https://github.com/user/repo.git#path/to/skill
  const [repoUrl, skillPath] = url.replace('git+', '').split('#');
  return { repoUrl, skillPath: skillPath || '' };
}
```

---

### 本地 Skill 注册

```typescript
async function addLocalSkill(localPath: string, options: AddOptions): Promise<void> {
  // 1. 验证路径
  if (!fs.existsSync(localPath)) {
    throw new Error(`Path not found: ${localPath}`);
  }
  
  if (!fs.statSync(localPath).isDirectory()) {
    throw new Error(`Not a directory: ${localPath}`);
  }
  
  if (!fs.existsSync(path.join(localPath, 'SKILL.md'))) {
    throw new Error(`SKILL.md not found in ${localPath}`);
  }
  
  // 2. 确定名称
  const name = options.name || await extractSkillName(localPath);
  
  // 3. 检查唯一性
  const targetPath = path.join(getRegistryPath(), name);
  if (fs.existsSync(targetPath)) {
    if (!options.force) {
      throw new Error(`Skill '${name}' already exists.`);
    }
    fs.rmSync(targetPath, { recursive: true });
  }
  
  // 4. 复制到中央仓库
  await fs.copy(localPath, targetPath, {
    overwrite: true,
    preserveTimestamps: true
  });
  
  console.log(`✓ Registered skill '${name}'`);
  console.log(`  Registry: ${targetPath}`);
  console.log(`  Original: ${localPath} (preserved)`);
}
```

---

## 五、辅助函数

### 提取 Skill 名称

```typescript
async function extractSkillName(skillDir: string): Promise<string> {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  const skillMd = fs.readFileSync(skillMdPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(skillMd);
  
  // 优先级：
  // 1. SKILL.md frontmatter.name
  // 2. 目录名称
  return frontmatter.name || path.basename(skillDir);
}
```

---

### 解析 Frontmatter

```typescript
function parseFrontmatter(content: string): { frontmatter: any; content: string } {
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  
  if (!match) {
    return { frontmatter: {}, content: content };
  }
  
  const frontmatter = yaml.load(match[1]) || {};
  const body = match[2];
  
  return { frontmatter, content: body };
}
```

---

## 六、错误处理

### 常见错误

```bash
# 路径不存在
Error: Path not found: /invalid/path

# 不是目录
Error: Not a directory: /path/to/file

# SKILL.md 不存在
Error: SKILL.md not found in /path/to/skill

# Skill 已存在
Error: Skill 'drawio' already exists.

Current registry: ~/.skill-registry/skills/drawio/
Options:
  • Use different name: --name drawio-v2
  • Remove existing: skill-registry skill remove drawio
  • Force overwrite: --force

# Git URL 格式错误
Error: Invalid Git URL: invalid-url

Expected format:
  git+https://github.com/user/repo.git
  git+https://github.com/user/repo.git#path/to/skill
```

---

## 七、使用示例

### 示例 1：注册 Git Skill

```bash
$ skill-registry skill add git+https://github.com/user/skills.git#drawio

Cloning repository...
✓ Cloned to temporary directory

Validating skill...
✓ Found SKILL.md
✓ Skill name: drawio

Checking uniqueness...
✓ Name is available

Copying to central registry...
✓ Copied to ~/.skill-registry/skills/drawio/

✓ Registered skill 'drawio'
  Registry: ~/.skill-registry/skills/drawio/

Available actions:
  • Add to project: skill-registry project add drawio
  • View details: skill-registry skill status drawio
```

---

### 示例 2：注册本地 Skill

```bash
$ skill-registry skill add ~/dev/my-skill

Validating skill...
✓ Found SKILL.md
✓ Skill name: my-skill

Checking uniqueness...
✓ Name is available

Copying to central registry...
✓ Copied to ~/.skill-registry/skills/my-skill/

✓ Registered skill 'my-skill'
  Registry: ~/.skill-registry/skills/my-skill/
  Original: ~/dev/my-skill (preserved)
```

---

### 示例 3：自定义名称

```bash
$ skill-registry skill add ~/dev/skill-v1 --name my-awesome-skill

✓ Registered skill 'my-awesome-skill'
  Registry: ~/.skill-registry/skills/my-awesome-skill/
  Original: ~/dev/skill-v1 (preserved)
```

---

### 示例 4：强制覆盖

```bash
$ skill-registry skill add ~/dev/drawio --force

Removing existing skill 'drawio'...
✓ Removed

Copying to central registry...
✓ Copied to ~/.skill-registry/skills/drawio/

✓ Registered skill 'drawio'
```

---

## 八、设计要点

### 1. 简单直接
- ✅ 只做一件事：复制到中央仓库
- ✅ 不做额外操作
- ✅ 流程清晰

### 2. 保持原位置
- ✅ 本地 Skill 原位置保留
- ✅ 不影响原有工作流
- ✅ 可以继续在原位置开发

### 3. 名称唯一
- ✅ 扁平目录结构
- ✅ 名称必须唯一
- ✅ 支持自定义名称

### 4. 友好提示
- ✅ 清晰的错误信息
- ✅ 可操作的建议
- ✅ 完成后的操作指引

---

最后更新：2026-09-08
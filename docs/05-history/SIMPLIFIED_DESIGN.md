# Skill Router - 简化设计总结

## 核心理念

**"所有都是项目"**：
- 家目录 ~ 也是一个项目
- 项目级和全局级没有区别
- 统一使用同一套管理机制

---

## Target 配置（极简版）

```yaml
# ~/.skill-registry/targets.yaml

targets:
  # 相对路径 → 相对于当前项目目录
  claude-code:
    description: "Claude Code CLI"
    path: .claude/skills
    format: md

  # ~ 开头 → 家目录路径
  claude-code-home:
    description: "Claude Code (home)"
    path: ~/.claude/skills
    format: md

  # 绝对路径 → 直接使用
  shared-skills:
    description: "Shared Skills"
    path: /opt/shared-skills
    format: md
```

**只需 3 个字段**：
- `description`（可选）：描述
- `path`（必需）：路径
- `format`（可选）：文件格式，默认 `md`

---

## 路径解析规则

```javascript
function resolveTargetPath(targetPath, currentDir) {
  if (targetPath.startsWith('~')) {
    // ~ 开头 → 家目录
    return targetPath.replace('~', os.homedir());
  } else if (path.isAbsolute(targetPath)) {
    // 绝对路径 → 直接使用
    return targetPath;
  } else {
    // 相对路径 → 相对于当前目录
    return path.join(currentDir, targetPath);
  }
}
```

---

## 使用示例

### 场景 1：项目目录

```bash
# 当前目录：/Users/numbero/my-project
cd ~/my-project

skill-registry project add drawio --target claude-code
skill-registry project sync

# 同步到：/Users/numbero/my-project/.claude/skills/drawio
```

### 场景 2：家目录项目

```bash
# 当前目录：~ (家目录)
cd ~

skill-registry project add pua --target claude-code-home
skill-registry project sync

# 同步到：/Users/numbero/.claude/skills/pua
```

### 场景 3：共享目录

```bash
# 使用绝对路径 Target
skill-registry project add shared-skill --target shared-skills
skill-registry project sync

# 同步到：/opt/shared-skills/shared-skill
```

---

## 数据模型对比

### 简化前
```typescript
interface Target {
  name: string;
  description?: string;
  path: string;
  type: 'project' | 'global';  // ❌ 需要手动指定
  format?: 'md' | 'mdc';
}
```

### 简化后
```typescript
interface Target {
  name: string;
  description?: string;
  path: string;
  format?: 'md' | 'mdc' | 'custom';
  // ✅ 无需 type，自动判断
}
```

---

## 关键变化

### 1. 移除 `type` 字段
- 相对路径自动识别为项目级
- `~` 开头自动识别为家目录
- 绝对路径直接使用

### 2. 统一项目管理
- 家目录 `~` 也是一个项目
- 在家目录执行 `skill-registry project init`
- 在家目录管理全局 Skills

### 3. 简化配置
- 减少用户配置项
- 路径格式自解释
- 降低学习成本

---

## 预定义 Targets

```yaml
targets:
  # 常用项目级 Targets
  claude-code:
    path: .claude/skills

  codex:
    path: .codex/skills

  cursor:
    path: .cursor/rules
    format: mdc

  kiro-steering:
    path: .kiro/steering

  # 家目录 Target
  claude-code-home:
    path: ~/.claude/skills
```

---

## CLI 命令示例

```bash
# 查看所有 Targets
skill-registry target list

# 添加自定义 Target
skill-registry target add my-agent --path .my-agent/skills

# 添加 Skill 到指定 Target
skill-registry project add drawio --target claude-code

# 同步到多个 Targets
skill-registry project add pua --target claude-code,claude-code-home

# 在家目录管理全局 Skills
cd ~
skill-registry project add pua --target claude-code-home
skill-registry project sync
```

---

## 优势总结

### ✅ 简洁性
- 减少配置项
- 路径格式自解释
- 无需区分项目/全局

### ✅ 统一性
- 一套机制管理所有
- 家目录即项目
- 概念清晰

### ✅ 灵活性
- 支持相对/绝对/~ 三种路径
- 自动适配使用场景
- 易于扩展

---

## 实现要点

### 路径解析
```typescript
function parsePath(path: string): {
  type: 'relative' | 'home' | 'absolute';
  resolved: string;
} {
  if (path.startsWith('~')) {
    return {
      type: 'home',
      resolved: path.replace('~', os.homedir())
    };
  } else if (path.isAbsolute(path)) {
    return {
      type: 'absolute',
      resolved: path
    };
  } else {
    return {
      type: 'relative',
      resolved: path  // 稍后相对于项目目录解析
    };
  }
}
```

### 项目目录检测
```typescript
function findProjectDir(): string {
  let dir = process.cwd();

  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, '.skill-registry', 'config.yaml'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  throw new Error('Not a skill-registry project');
}
```

---

## 总结

**核心改进**：移除 `type` 字段，通过路径格式自动判断。

**设计理念**：所有都是项目，家目录也是项目，统一管理。

**实现效果**：配置更简洁，概念更清晰，使用更灵活。
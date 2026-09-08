# CLI 命令作用域分析

## 命令作用域分类

Skill Router 的命令分为两大类：
1. **全局命令**：操作中央仓库，不依赖项目
2. **项目命令**：操作项目配置，依赖项目目录

---

## 一、全局命令（操作中央仓库）

### 作用域
- 操作目录：`~/.skill-registry/`
- 执行位置：**任意目录**
- 配置依赖：无

### 命令清单

#### 1. Skill 管理命令（4 个）

```bash
# 注册 Skill 到中央仓库
skill-registry skill add <source>
skill-registry skill add git+https://github.com/user/skills.git#drawio
skill-registry skill add /path/to/local/drawio

# 作用：添加到 ~/.skill-registry/skills/
# 执行：可在任意目录

# 从中央仓库移除 Skill
skill-registry skill remove <name>
skill-registry skill remove drawio

# 作用：删除 ~/.skill-registry/skills/xxx/drawio
# 执行：可在任意目录

# 列出中央仓库中的 Skills
skill-registry skill list

# 作用：查询 ~/.skill-registry/registry.db
# 执行：可在任意目录

# 更新中央仓库中的 Skill
skill-registry skill update [name]

# 作用：更新 ~/.skill-registry/skills/xxx/ 中的内容
# 执行：可在任意目录
```

#### 2. Target 管理命令（3 个）

```bash
# 添加自定义 Target
skill-registry target add <name>
skill-registry target add my-agent --path .my-agent/skills

# 作用：添加到 ~/.skill-registry/targets.yaml
# 执行：可在任意目录

# 列出所有 Targets
skill-registry target list

# 作用：读取 ~/.skill-registry/targets.yaml
# 执行：可在任意目录

# 设置默认 Target
skill-registry target default [name]

# 作用：修改 ~/.skill-registry/config.yaml
# 执行：可在任意目录
```

#### 3. Group 管理命令（3 个）

```bash
# 创建 Group 或添加 Skill 到 Group
skill-registry group add <name> [skill]
skill-registry group add web-dev
skill-registry group add web-dev drawio

# 作用：修改 ~/.skill-registry/groups.yaml
# 执行：可在任意目录

# 列出所有 Groups
skill-registry group list

# 作用：读取 ~/.skill-registry/groups.yaml
# 执行：可在任意目录

# 从 Group 移除 Skill 或删除 Group
skill-registry group remove <name> [skill]
skill-registry group remove web-dev drawio
skill-registry group remove web-dev --delete

# 作用：修改 ~/.skill-registry/groups.yaml
# 执行：可在任意目录
```

---

## 二、项目命令（操作项目配置）

### 作用域
- 操作目录：当前项目目录
- 执行位置：**必须在项目根目录**（或家目录 `~`）
- 配置依赖：`.skill-registry/config.yaml`

### 命令清单

#### 1. 项目初始化命令（1 个）

```bash
# 初始化项目配置
skill-registry project init

# 作用：创建 .skill-registry/config.yaml
# 执行：必须在目标项目目录

# 示例
cd ~/my-project
skill-registry project init
# → 创建 ~/my-project/.skill-registry/config.yaml

cd ~
skill-registry project init
# → 创建 ~/.skill-registry/config.yaml（家目录项目）
```

#### 2. 项目 Skill 管理命令（2 个）

```bash
# 添加 Skill 或 Group 到项目
skill-registry project add <skill|group>
skill-registry project add drawio --target claude-code
skill-registry project add web-dev

# 作用：修改 .skill-registry/config.yaml
# 执行：必须在项目目录
# 前置条件：project init 已执行

# 同步 Skills 到项目
skill-registry project sync

# 作用：在项目中创建软链接
# 执行：必须在项目目录
# 前置条件：
#   1. project init 已执行
#   2. .skill-registry/config.yaml 中有 skills/groups
```

---

## 三、全局状态命令（跨作用域）

### 命令清单

```bash
# 查看全局状态
skill-registry status

# 作用：
#   - 显示中央仓库信息（全局）
#   - 如果在项目目录，显示项目状态（项目）
# 执行：任意目录（但项目信息只在项目目录有效）

# 统一列表命令
skill-registry list [object]
skill-registry list skills    # 全局：中央仓库
skill-registry list targets   # 全局：Targets
skill-registry list groups    # 全局：Groups
skill-registry list           # 全局：所有

# 作用：查询中央仓库
# 执行：任意目录
```

---

## 四、命令作用域可视化

```
┌─────────────────────────────────────────────────────────────┐
│                    ~/.skill-registry/                          │
│  （中央仓库）                                                │
│                                                              │
│  ┌──────────────────────────────────────┐                   │
│  │ 全局命令（任意目录可执行）            │                   │
│  │                                      │                   │
│  │ • skill add/remove/list/update       │                   │
│  │ • target add/list/default            │                   │
│  │ • group add/list/remove              │                   │
│  │ • list                               │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  registry.db                                                │
│  skills/                                                    │
│  groups.yaml                                                │
│  targets.yaml                                               │
│  config.yaml（默认配置）                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ~/my-project/                             │
│  （项目目录）                                                │
│                                                              │
│  ┌──────────────────────────────────────┐                   │
│  │ 项目命令（必须在项目目录执行）        │                   │
│  │                                      │                   │
│  │ • project init                       │                   │
│  │ • project add                        │                   │
│  │ • project sync                       │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  .skill-registry/                                             │
│    config.yaml                                              │
│  .claude/skills/                                            │
│    drawio → ~/.skill-registry/skills/xxx/drawio               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ~ （家目录）                               │
│  （全局项目）                                                │
│                                                              │
│  ┌──────────────────────────────────────┐                   │
│  │ 项目命令（在家目录执行）              │                   │
│  │                                      │                   │
│  │ • project init                       │                   │
│  │ • project add                        │                   │
│  │ • project sync                       │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  .skill-registry/                                             │
│    config.yaml                                              │
│  .claude/skills/                                            │
│    pua → ~/.skill-registry/skills/xxx/pua                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、命令执行前置条件检查

### 全局命令
```bash
skill-registry skill add <source>
# 检查：
#   ✓ ~/.skill-registry/ 是否存在（不存在则创建）
#   ✓ 数据库是否初始化（未初始化则初始化）

# 无需其他前置条件
```

### 项目命令

#### project init
```bash
skill-registry project init
# 检查：
#   ✓ 当前目录是否已是项目
#     （已存在 .skill-registry/config.yaml → 提示已初始化）

# 无需其他前置条件
```

#### project add
```bash
skill-registry project add <skill>
# 检查：
#   ✓ 当前目录是否是项目
#     （不存在 .skill-registry/config.yaml → 提示先运行 init）
#   ✓ Skill 是否在中央仓库中
#     （不存在 → 提示先运行 skill add）

# 前置条件：
#   1. 项目已初始化
#   2. Skill 已注册到中央仓库
```

#### project sync
```bash
skill-registry project sync
# 检查：
#   ✓ 当前目录是否是项目
#     （不存在 .skill-registry/config.yaml → 提示先运行 init）
#   ✓ 配置文件中是否有 skills 或 groups
#     （为空 → 提示先运行 project add）

# 前置条件：
#   1. 项目已初始化
#   2. 配置中有 skills 或 groups
```

---

## 六、错误提示设计

### 在非项目目录执行项目命令

```bash
$ cd /tmp
$ skill-registry project add drawio

Error: Not a skill-registry project.

Current directory: /tmp
No '.skill-registry/config.yaml' found.

To initialize a project here:
  skill-registry project init

Or navigate to an existing project.
```

### 在项目目录执行全局命令

```bash
$ cd ~/my-project
$ skill-registry skill add /path/to/skill

✓ Skill 'my-skill' added to central registry
  ~/.skill-registry/skills/local-xxx/my-skill

This is a global command.
You can run it from any directory.
```

### 项目未初始化

```bash
$ cd ~/my-project
$ skill-registry project sync

Error: Not a skill-registry project.

Missing: .skill-registry/config.yaml

Run 'skill-registry project init' to initialize.
```

### Skill 未注册

```bash
$ cd ~/my-project
$ skill-registry project add unknown-skill

Error: Skill 'unknown-skill' not found in central registry.

Available skills:
  • drawio
  • pua
  • theme-factory

To register a new skill:
  skill-registry skill add <source>
```

---

## 七、命令优先级和冲突处理

### 场景：在项目目录执行全局命令

```bash
$ cd ~/my-project
$ skill-registry skill list

# 全局命令，显示中央仓库中的所有 Skills
# 不受项目配置影响
```

### 场景：项目目录和家目录冲突

```bash
# 如果在项目目录执行 project init
cd ~/my-project
skill-registry project init
# → 创建 ~/my-project/.skill-registry/config.yaml

# 如果在家目录执行 project init
cd ~
skill-registry project init
# → 创建 ~/.skill-registry/config.yaml
# 注意：这是全局项目配置，不影响其他项目
```

---

## 八、命令分类总结表

| 命令 | 作用域 | 执行位置 | 依赖文件 | 操作对象 |
|------|--------|----------|----------|----------|
| **skill add** | 全局 | 任意 | 无 | `~/.skill-registry/skills/` |
| **skill remove** | 全局 | 任意 | 无 | `~/.skill-registry/skills/` |
| **skill list** | 全局 | 任意 | 无 | `~/.skill-registry/registry.db` |
| **skill update** | 全局 | 任意 | 无 | `~/.skill-registry/skills/` |
| **target add** | 全局 | 任意 | 无 | `~/.skill-registry/targets.yaml` |
| **target list** | 全局 | 任意 | 无 | `~/.skill-registry/targets.yaml` |
| **target default** | 全局 | 任意 | 无 | `~/.skill-registry/config.yaml` |
| **group add** | 全局 | 任意 | 无 | `~/.skill-registry/groups.yaml` |
| **group list** | 全局 | 任意 | 无 | `~/.skill-registry/groups.yaml` |
| **group remove** | 全局 | 任意 | 无 | `~/.skill-registry/groups.yaml` |
| **project init** | 项目 | 项目目录 | 无 | `.skill-registry/config.yaml` |
| **project add** | 项目 | 项目目录 | `.skill-registry/config.yaml` | `.skill-registry/config.yaml` |
| **project sync** | 项目 | 项目目录 | `.skill-registry/config.yaml` | 项目 skill 目录 |
| **list** | 全局 | 任意 | 无 | 中央仓库 |
| **status** | 混合 | 任意 | 可选 | 中央仓库 + 项目 |

---

## 九、实现建议

### 命令执行器设计

```typescript
abstract class Command {
  abstract scope: 'global' | 'project';
  abstract execute(args: string[], options: Options): Promise<void>;

  // 检查前置条件
  async checkPrerequisites(): Promise<boolean> {
    if (this.scope === 'project') {
      return this.checkProjectConfig();
    }
    return this.checkGlobalConfig();
  }

  async checkProjectConfig(): Promise<boolean> {
    const projectDir = this.findProjectDir();
    if (!projectDir) {
      throw new Error('Not a skill-registry project');
    }
    return true;
  }

  async checkGlobalConfig(): Promise<boolean> {
    const registryPath = path.join(os.homedir(), '.skill-registry');
    if (!fs.existsSync(registryPath)) {
      await this.initRegistry();
    }
    return true;
  }
}
```

### 命令注册

```typescript
class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(name: string, command: Command) {
    this.commands.set(name, command);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  // 获取指定作用域的命令
  getByScope(scope: 'global' | 'project'): Command[] {
    return Array.from(this.commands.values())
      .filter(cmd => cmd.scope === scope);
  }
}

// 注册命令
registry.register('skill add', new SkillAddCommand()); // global
registry.register('project add', new ProjectAddCommand()); // project
```

---

## 十、用户文档建议

### 快速参考

```
┌─────────────────────────────────────────────────────────┐
│            Skill Router 命令快速参考                     │
├─────────────────────────────────────────────────────────┤
│ 全局命令（任意目录可执行）                               │
│                                                          │
│   skill add/remove/list/update    管理 Skills           │
│   target add/list/default         管理 Targets          │
│   group add/list/remove           管理 Groups           │
│   list                            列出所有              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 项目命令（必须在项目目录执行）                           │
│                                                          │
│   project init                    初始化项目            │
│   project add                     添加 Skill/Group      │
│   project sync                    同步 Skills           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 混合命令                                                 │
│                                                          │
│   status                          查看状态              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 典型工作流

```bash
# 1. 注册 Skill（全局命令，任意目录）
skill-registry skill add git+https://github.com/user/skills.git#drawio

# 2. 初始化项目（项目命令，项目目录）
cd ~/my-project
skill-registry project init

# 3. 添加 Skill 到项目（项目命令，项目目录）
skill-registry project add drawio --target claude-code

# 4. 同步（项目命令，项目目录）
skill-registry project sync
```

---

## 总结

### 全局命令（10 个）
- 操作中央仓库
- 任意目录可执行
- 无项目依赖

**命令**：
- `skill add/remove/list/update`
- `target add/list/default`
- `group add/list/remove`
- `list`

### 项目命令（3 个）
- 操作项目配置
- 必须在项目目录执行
- 依赖项目配置文件

**命令**：
- `project init`
- `project add`
- `project sync`

### 混合命令（1 个）
- `status`：全局信息 + 项目信息（如果在项目目录）

---

这个分类清晰吗？还有需要调整的地方吗？
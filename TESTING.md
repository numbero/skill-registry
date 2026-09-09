# Skill Registry - 本机测试指南

## 快速测试

### 1. 全局安装（推荐）

```bash
cd /Users/numbero/Documents/Project/personal-project/skill-router_cc
npm run build
npm link
```

现在可以在任意目录使用 `skill-registry` 命令。

### 2. 初始化全局配置

```bash
# 使用默认路径
skill-registry init -g

# 查看全局配置
skill-registry global show

# 查看状态
skill-registry status
```

### 3. 创建测试 Skill

```bash
# 创建目录
mkdir -p ~/test-skills/my-skill

# 创建 SKILL.md
cat > ~/test-skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: My test skill
allowed_tools:
  - read_file
  - write_file
---

# My Skill

This is my test skill.
EOF

# 注册 skill 到全局 registry
skill-registry skill add -g ~/test-skills/my-skill

# 列出所有全局 skills
skill-registry skill list -g
```

### 4. 项目测试

```bash
# 创建测试项目
mkdir -p ~/test-project
cd ~/test-project

# 初始化项目
skill-registry init

# 添加 skill（从全局 registry）
skill-registry skill add my-skill

# 查看项目配置
skill-registry show

# 拉取
skill-registry pull

# 验证
ls -la .claude/skills/
```

### 5. 多 Target 测试

```bash
# 创建 target 目录
mkdir -p ~/test-project/.cursor
mkdir -p ~/test-project/.codex

# 自动检测 targets
skill-registry target list

# 或手动添加
skill-registry target add cursor
skill-registry target add codex

# 查看所有 targets
skill-registry target list

# 拉取到所有 targets
skill-registry pull

# 验证
ls -la .claude/skills/
ls -la .cursor/rules/
ls -la .codex/skills/
```

### 6. Group 测试

```bash
# 创建全局 group
skill-registry group add -g web-dev --description "Web development skills"

# 添加 skills 到 group
skill-registry group skill add -g web-dev my-skill

# 列出所有全局 groups
skill-registry group list -g

# 在项目中使用 group
cd ~/test-project
skill-registry group add web-dev
skill-registry pull
```

### 7. Target 恢复测试

```bash
# 删除全局预设
skill-registry target remove -g claude-code

# 恢复指定预设
skill-registry target restore -g claude-code

# 或恢复所有
skill-registry target restore -g
```

### 8. Git Skill 测试

```bash
# 从 Git 注册到全局（示例）
skill-registry skill add -g git+https://github.com/user/skills.git#drawio

# 更新全局 Git skill
skill-registry skill update -g drawio
```

## 测试检查清单

- [ ] 全局安装成功
- [ ] `init -g` 初始化全局配置
- [ ] `global show` 显示配置
- [ ] `status` 显示完整状态
- [ ] 本地 skill 注册到全局成功
- [ ] `skill list -g` 显示全局 skills
- [ ] 项目初始化成功
- [ ] Skill 添加到项目（项目级）
- [ ] `show` 显示项目配置
- [ ] 拉取成功创建软链接
- [ ] 多 Target 支持（自动检测）
- [ ] Group 创建和管理（全局）
- [ ] Target 删除和恢复
- [ ] Git skill 注册（可选）

## 常见问题

### Q: 如何卸载全局链接？

```bash
npm unlink -g skill-registry
```

### Q: 如何重置所有数据？

```bash
rm -rf ~/.skill-registry/
```

### Q: 未初始化全局配置时的错误？

```bash
$ skill-registry skill list -g

Error: Global skill-registry not initialized.

Run: skill-registry init -g
Or: skill-registry init -g --path <custom-path>
```

### Q: 非项目目录执行项目命令？

```bash
$ skill-registry skill add my-skill

Error: Not a skill-registry project.

Options:
  1. Initialize: skill-registry init
  2. Use global: skill-registry <command> -g
```

### Q: 如何查看配置文件？

```bash
# 全局配置
cat ~/.skill-registry/global.yaml

# 项目配置
cat .skill-registry/config.yaml
```

### Q: 如何调试？

```bash
# 直接运行编译文件
node /Users/numbero/Documents/Project/personal-project/skill-router_cc/dist/cli.js

# 或者重新构建
npm run build
```

## 目录结构说明

```
~/.skill-registry/
├── global.yaml              # 全局配置
└── skills/                  # 中央仓库
    ├── demo-skill/          # Skill 目录
    │   ├── SKILL.md
    │   └── ...
    └── my-skill/
        ├── SKILL.md
        └── ...

项目目录/
├── .skill-registry/
│   └── config.yaml          # 项目配置
├── .claude/skills/          # Target 目录
│   └── demo-skill -> ~/.skill-registry/skills/demo-skill
└── .cursor/rules/
    └── demo-skill -> ~/.skill-registry/skills/demo-skill
```

## 命令速查表

### 全局操作（需要 -g）

```bash
init -g                           # 初始化全局配置
skill add -g <source>             # 注册到全局 registry
skill list -g                     # 列出全局 skills
skill remove -g <skill>           # 从全局删除
skill update -g [name]            # 更新全局 skills

target list -g                    # 列出全局预设
target add -g <name>              # 添加全局预设
target remove -g <name>           # 删除全局预设
target restore -g [name]          # 恢复默认预设
target default -g <name>          # 设置默认 target

group list -g                     # 列出全局 groups
group add -g <name>               # 创建全局 group
group remove -g <name>            # 删除全局 group
group skill add -g <group> <skill>    # 添加到全局 group
group skill remove -g <group> <skill> # 从全局 group 移除

global show                       # 显示全局配置
global set-path <path>            # 设置自定义路径
global reset-path                 # 重置路径
global edit                       # 编辑配置
```

### 项目操作（默认）

```bash
init                              # 初始化项目
skill add <skill>                 # 添加到项目
skill list                        # 列出项目 skills
skill remove <skill>              # 从项目移除
skill update                      # 更新项目 skills

target list                       # 列出项目 targets
target add <name>                 # 添加 target 到项目
target remove <name>              # 从项目移除

group list                        # 列出项目 groups
group add <group>                 # 添加 group 到项目
group remove <group>              # 从项目移除

pull                              # 拉取 skills 到 targets
show                              # 显示项目配置
status                            # 显示完整状态
```

---

**测试位置**:
- 项目: `/Users/numbero/Documents/Project/personal-project/skill-router_cc`
- 全局配置: `~/.skill-registry/`
- 测试项目: `/tmp/test-sr-demo/`
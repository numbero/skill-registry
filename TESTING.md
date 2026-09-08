# Skill Registry - 本机测试指南

## 快速测试

### 1. 全局安装（推荐）

```bash
cd /Users/numbero/Documents/Project/personal-project/skill-router_cc
npm link
```

现在可以在任意目录使用 `skill-registry` 命令。

### 2. 基本命令测试

```bash
# 查看版本
skill-registry --version

# 查看帮助
skill-registry --help

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

# 注册 skill
skill-registry skill add ~/test-skills/my-skill

# 列出所有 skills
skill-registry skill list
```

### 4. 项目测试

```bash
# 创建测试项目
mkdir -p ~/test-project
cd ~/test-project

# 初始化
skill-registry project init

# 添加 skill
skill-registry add my-skill

# 查看配置
skill-registry project show

# 拉取
skill-registry pull

# 验证
ls -la .claude/skills/
```

### 5. 多 Target 测试

```bash
# 添加多个 targets
skill-registry project target add cursor
skill-registry project target add codex

# 查看所有 targets
skill-registry project target list

# 拉取到所有 targets
skill-registry pull

# 验证
ls -la .claude/skills/
ls -la .cursor/rules/
ls -la .codex/skills/
```

### 6. Group 测试

```bash
# 创建 group
skill-registry group add web-dev --description "Web development skills"

# 添加 skills 到 group
skill-registry group add web-dev my-skill

# 列出所有 groups
skill-registry group list

# 在项目中使用 group
cd ~/test-project
skill-registry project group add web-dev
skill-registry pull
```

### 7. Git Skill 测试

```bash
# 从 Git 注册（示例）
skill-registry skill add git+https://github.com/user/skills.git#drawio

# 更新 Git skill
skill-registry skill update drawio
```

## 测试检查清单

- [ ] 全局安装成功
- [ ] `--version` 显示正确
- [ ] `global show` 显示预定义 targets
- [ ] `status` 显示全局和项目信息
- [ ] 本地 skill 注册成功
- [ ] `skill list` 显示已注册 skills
- [ ] 项目初始化成功
- [ ] Skill 添加到项目
- [ ] `project show` 显示配置
- [ ] 拉取成功创建软链接
- [ ] 多 Target 支持
- [ ] Group 创建和管理
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

---

**测试位置**:
- 项目: `/Users/numbero/Documents/Project/personal-project/skill-router_cc`
- 全局配置: `~/.skill-registry/`
- 测试项目: `/tmp/test-sr-demo/`
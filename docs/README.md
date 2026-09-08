# Skill Router 设计文档

> 统一管理 AI Agent Skills 的 CLI 工具

---

## 📚 文档导航

### 🚀 快速开始

- [README.md](../README.md) - 项目简介和快速开始指南
- [**最终设计方案**](./FINAL_DESIGN.md) - 经过充分讨论确定的最终设计
- [**快速参考**](./QUICK_REFERENCE.md) - 开发实现时的快速参考

### 📖 核心文档

#### 1. 概览 (01-overview)

- **[设计概览](./01-overview/README.md)** - 项目定位、核心理念、关键设计
- **[已确认决策](./01-overview/DECISIONS.md)** - 所有关键设计决策

#### 2. 架构设计 (02-architecture)

- **[配置文件设计](./02-architecture/CONFIGURATION.md)** - 配置文件结构和规则
- **[完整设计文档](./02-architecture/DESIGN_DOCUMENT.md)** - 完整的产品设计规格（旧版）

#### 3. CLI 命令设计 (03-cli)

- **[CLI 命令设计](./03-cli/CLI_DESIGN.md)** - CLI 命令体系设计
- **[命令作用域](./03-cli/CLI_SCOPE.md)** - 全局命令 vs 项目命令

#### 4. 核心机制 (04-mechanisms)

- **[注册机制](./04-mechanisms/REGISTRATION_MECHANISM.md)** - Skill 注册流程
- **[存储机制](./04-mechanisms/STORAGE_MECHANISM.md)** - 基于文件系统的存储设计
- **[更新机制](./04-mechanisms/UPDATE_MECHANISM.md)** - Skill 更新流程
- **[Target 机制](./04-mechanisms/TARGET_DESIGN.md)** - Target 定义和使用

#### 5. 设计历史 (05-history)

- **[设计决策过程](./05-history/DESIGN_DECISIONS.md)** - 设计演进历史
- **[架构更新记录](./05-history/ARCHITECTURE_UPDATE.md)** - 架构变更历史

---

## 🎯 推荐阅读顺序

### 快速上手

1. [README.md](../README.md) - 了解基本概念
2. [设计概览](./01-overview/README.md) - 理解核心理念
3. 开始使用

### 深入理解

1. [完整设计文档](./02-architecture/DESIGN_DOCUMENT.md) - 详细设计规格
2. [配置文件设计](./02-architecture/CONFIGURATION.md) - 配置规则
3. [CLI 命令设计](./03-cli/CLI_DESIGN.md) - 命令体系
4. 各个机制文档 - 实现细节

### 开发实现

1. 完整设计文档
2. 已确认决策
3. 各个机制文档
4. 开始编码

---

## 🔍 按主题查找

### 配置管理
- [配置文件设计](./02-architecture/CONFIGURATION.md)
- [Target 机制](./04-mechanisms/TARGET_DESIGN.md)

### CLI 命令
- [CLI 命令设计](./03-cli/CLI_DESIGN.md)
- [命令作用域](./03-cli/CLI_SCOPE.md)

### 核心机制
- [注册机制](./04-mechanisms/REGISTRATION_MECHANISM.md)
- [更新机制](./04-mechanisms/UPDATE_MECHANISM.md)
- [Target 机制](./04-mechanisms/TARGET_DESIGN.md)

---

## 📝 文档维护

- **更新频率**: 随设计变化及时更新
- **最后更新**: 2026-09-08
- **文档版本**: v2.0

---

## 📊 项目状态

- ✅ 设计完成
- 🔄 待实施开发
- 📖 文档完善

---

## 📞 获取帮助

- GitHub Issues: 提交问题和建议
- 文档网站: 在线文档（待建设）
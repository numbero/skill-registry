# 本地 Skill 更新机制设计

## 问题

当本地 Skill 通过**复制**方式注册到中心仓库后，如何更新？

---

## 更新流程设计

### 核心机制

```typescript
interface Skill {
  id: string;
  name: string;
  source_type: 'git' | 'local';

  // 本地源路径
  local_source_path?: string;  // 如：/Users/numbero/dev/drawio

  // 中心仓库路径
  cached_path: string;  // 如：~/.skill-registry/skills/local-abc/drawio

  // 更新追踪
  last_updated: Date;
  source_snapshot: {
    file_count: number;
    total_size: number;
    checksum: string;  // 整个目录的 checksum
    files: {
      path: string;
      mtime: number;
      size: number;
      checksum: string;
    }[];
  };
}
```

---

## 更新方案对比

### 方案 A：手动全量更新（推荐 Phase 1）

```bash
skill-registry registry update drawio
```

**流程**：
1. 检查源路径是否存在
2. 删除中心仓库的旧副本
3. 重新复制整个目录
4. 更新数据库记录

**优点**：
- ✅ 简单可靠
- ✅ 保证数据一致性
- ✅ 不需要复杂的变更检测

**缺点**：
- ❌ 大文件复制慢
- ❌ 即使没有变更也会重新复制

---

### 方案 B：智能检测 + 增量更新（推荐 Phase 2）

```bash
skill-registry registry update drawio
```

**流程**：
1. 扫描源目录，计算 checksum
2. 对比存储的 snapshot
3. 如果有变更：
   - 删除中心仓库中不存在的新文件
   - 复制新增或修改的文件
   - 更新 snapshot

**优点**：
- ✅ 更高效
- ✅ 只更新变更部分
- ✅ 提供详细的变更报告

**缺点**：
- ❌ 实现复杂
- ❌ 需要精确的文件追踪

---

### 方案 C：自动检测 + 提示

```bash
skill-registry project add drawio
```

**流程**：
1. 检测源文件是否有更新（对比 checksum）
2. 如果有更新：
   - 提示用户：`Source has changed. Update now? (Y/n)`
   - 用户确认后自动更新

**优点**：
- ✅ 自动提醒，无需记忆
- ✅ 用户可控

**缺点**：
- ❌ 每次操作都检测，可能影响性能
- ❌ 频繁提示可能打扰用户

---

### 方案 D：文件监控（Phase 2+）

```bash
skill-registry watch start
```

**流程**：
1. 启动后台监控进程
2. 使用 `chokidar` 监控本地 Skill 源目录
3. 检测到变更自动更新中心仓库

**优点**：
- ✅ 完全自动
- ✅ 实时更新

**缺点**：
- ❌ 实现复杂
- ❌ 占用系统资源
- ❌ 可能不符合用户预期

---

## 推荐方案：分阶段实现

### Phase 1：手动全量更新

```bash
# 命令
skill-registry registry update [name]  # 更新指定 Skill
skill-registry registry update --all   # 更新所有本地 Skill

# 流程
$ skill-registry registry update drawio

Checking source: /Users/numbero/dev/drawio

✓ Source exists
✓ Deleting old version...
✓ Copying new version...
✓ Updated 3 files, 156 KB

Source: /Users/numbero/dev/drawio
Cached: ~/.skill-registry/skills/local-abc/drawio
Updated: 2026-09-08 15:30:00
```

---

### Phase 2：智能检测 + 增量更新

```bash
$ skill-registry registry update drawio

Scanning source: /Users/numbero/dev/drawio

Changes detected:
  Modified: SKILL.md (+120 bytes)
  New:      templates/flowchart.md (3.2 KB)
  Deleted:  old-template.md

? Apply changes? (Y/n)

✓ Updated 2 files
✓ Deleted 1 file
✓ Total: +3.3 KB

Tip: Projects using this skill may need to re-sync.
```

---

### Phase 3：自动检测 + 监控（可选）

```bash
# 启动监控
$ skill-registry watch start

Watching 3 local skills:
  • drawio → /Users/numbero/dev/drawio
  • theme-factory → /Users/numbero/dev/theme-factory
  • my-skill → /Users/numbero/dev/my-skill

Monitoring for changes...

# 检测到变更自动更新
[15:30:45] drawio: SKILL.md modified, updating...
[15:30:46] ✓ drawio updated
```

---

## CLI 命令设计

```bash
# 查看哪些 Skill 有更新
skill-registry registry status

Local Skills Status:
  drawio:
    Source: /Users/numbero/dev/drawio
    Last synced: 2 hours ago
    Status: ✓ Up to date

  theme-factory:
    Source: /Users/numbero/dev/theme-factory
    Last synced: 3 days ago
    Status: ⚠ Source has changed (3 files modified)
    Run: skill-registry registry update theme-factory

# 更新命令
skill-registry registry update <name>        # 更新指定 Skill
skill-registry registry update --all         # 更新所有本地 Skill
skill-registry registry update --local-only  # 只更新本地 Skill
skill-registry registry update --check       # 只检查，不更新

# 强制更新
skill-registry registry update <name> --force  # 强制重新复制，即使没有变更
```

---

## 技术实现细节

### 检测变更（Phase 2）

```typescript
async function detectChanges(skill: Skill): Promise<ChangeSet> {
  const sourceFiles = await scanDirectory(skill.local_source_path);
  const cachedFiles = skill.source_snapshot.files;

  const changes = {
    added: [],
    modified: [],
    deleted: []
  };

  // 检测新增和修改
  for (const file of sourceFiles) {
    const cached = cachedFiles.find(f => f.path === file.path);
    if (!cached) {
      changes.added.push(file);
    } else if (file.mtime > cached.mtime || file.checksum !== cached.checksum) {
      changes.modified.push(file);
    }
  }

  // 检测删除
  for (const cached of cachedFiles) {
    if (!sourceFiles.find(f => f.path === cached.path)) {
      changes.deleted.push(cached);
    }
  }

  return changes;
}
```

### 增量更新（Phase 2）

```typescript
async function incrementalUpdate(skill: Skill, changes: ChangeSet) {
  const cachePath = skill.cached_path;

  // 删除已删除的文件
  for (const file of changes.deleted) {
    await fs.remove(path.join(cachePath, file.path));
  }

  // 复制新增和修改的文件
  for (const file of [...changes.added, ...changes.modified]) {
    const source = path.join(skill.local_source_path, file.path);
    const target = path.join(cachePath, file.path);
    await fs.copy(source, target);
  }

  // 更新 snapshot
  await updateSnapshot(skill);
}
```

---

## 性能优化

### 文件扫描优化
- 使用 `fast-glob` 快速扫描
- 并行计算 checksum
- 使用流式读取大文件

### 大文件处理
```bash
# 如果文件超过 10MB，提示用户
$ skill-registry registry update large-skill

Warning: Found large files:
  • assets/video.mp4 (45 MB)
  • assets/model.bin (120 MB)

? Skip large files? (Y/n)
```

### 更新策略
```yaml
# ~/.skill-registry/config.yaml
update_strategy:
  auto_check: true       # 自动检查更新
  check_interval: 3600   # 检查间隔（秒）
  skip_large_files: true # 跳过大文件（>10MB）
```

---

## 错误处理

### 源文件被删除
```bash
$ skill-registry registry update drawio

Error: Source path not found: /Users/numbero/dev/drawio

The source directory has been moved or deleted.
Options:
  1. Remove this skill from registry: skill-registry registry remove drawio
  2. Update source path: skill-registry registry edit drawio --source /new/path
```

### 权限问题
```bash
$ skill-registry registry update drawio

Error: Permission denied: /Users/numbero/dev/drawio/SKILL.md

Cannot read source files. Please check permissions.
```

---

## 最佳实践建议

### 开发工作流
```bash
# 1. 开发本地 Skill
cd ~/dev/drawio
vim SKILL.md
# ... 开发 ...

# 2. 测试前更新
skill-registry registry update drawio

# 3. 在测试项目中同步
cd ~/test-project
skill-registry project sync

# 4. 测试效果
# ... 使用 Skill ...
```

### 定期更新
```bash
# 每天开始工作时，批量更新所有本地 Skill
skill-registry registry update --all --local-only

# 或者添加到 cron job（可选）
# 每天早上 9 点自动检查
0 9 * * * skill-registry registry update --check
```

---

## 总结

### 推荐方案

**Phase 1**：
- ✅ 手动全量更新
- ✅ 简单可靠
- ✅ 命令：`skill-registry registry update <name>`

**Phase 2**：
- ✅ 智能检测 + 增量更新
- ✅ 变更报告
- ✅ 更高效

**Phase 3**（可选）：
- ✅ 自动监控
- ✅ 实时更新
- ✅ 开发模式支持

---

## 需要确认的决策

1. **Phase 1 采用全量更新？**
   - ✅ 推荐：是，简单可靠

2. **是否记录源文件 snapshot？**
   - ✅ 推荐：是，用于后续检测变更

3. **更新后是否自动提示项目重新同步？**
   - ✅ 推荐：是，提示用户

4. **是否提供批量更新命令？**
   - ✅ 推荐：是，`--all` 参数

你觉得这个设计如何？
## 1. Purpose of This Guide
This guide defines how you should read, reference, and update documentation files.
The goals are:
- **Token Efficiency:** Minimize unnecessary conversational turns.
- **Strict Adherence:** Follow rules exactly to allow autonomous execution.
- **Consistent Behavior:** Predictable updates without rewriting.
- **Controlled Scope:** Minimal-diff updates only.

---

## 2. Documentation Structure
**`guidelines/`**
- `Guidelines.md` → (this file)
- `version.md` → Versioning rules, breaking changes log
- `project_structure.md` → **Directory tree & file placement rules.**
- `tech_stack.md` → **Hard constraints & custom implementation strategy.**
- `component_map.md` → **Business logic per page & component hierarchy.**
- `api_contract.md` → API rules, naming, endpoints.
- `db_design.md` → Schema, tables, migrations.
- `ui_rules.md` → Generic UI patterns (Colors, Spacing).
- `coding_standards.md` → Code style, patterns.
- `workflows.md` → System workflows.
- `libraries.md` → **List of dependencies with short purpose.**

### 2.1 Documentation Style (Token Optimization)
1. **No Prose:** Use bullet points or tables.
2. **No Narrative:** No "We decided to..." text.
3. **Strict Formatting:** Maintain rigid structure.
4. **Clean Diffs:** Remove old rules immediately when updating.

---

## 3. How You Should Use These Files

### 3.1 Read only what is needed
Load only the `.md` files strictly relevant to the current prompt.

### 3.2 Never rewrite entire files
Only modify specific, necessary sections.

### 3.3 Preserve file structure
Always maintain headings, indentation, and formatting.

---

## 4. Rules for Updating Documentation

### 4.1 Implicit Approval (Token Saving Mode)
If the user's prompt explicitly requests a change (e.g., "Add a Markdown Viewer" or "Create a new 'Services' folder"), you have **implicit authority** to update:
1. The Code / Directory Structure.
2. The Documentation (e.g., `libraries.md`, `project_structure.md`).

You must:
1. Implement the code/structure.
2. Generate the documentation update in **diff format**.
3. Present both in the same response.

### 4.2 When to Ask for Confirmation (Exceptions)
1. Ambiguous requests.
2. Conflicts defined in **Section 9**.
3. High-risk security implications.

---

## 5. Versioning Rules (Connected to version.md)

### A. Major / Breaking — Update version.md
*Action: Perform update, highlight "BREAKING CHANGE".*
- Schema breaking changes.
- **Removing** core libraries.
- Major Framework upgrades.
- Breaking changes to `globals.css` (or equivalent).

### B. Minor — Do not update version.md
*Action: Update specific docs only.*
- Small UI/Color changes.
- Typo fixes / Comments.
- Simple code refactors.

### C. Medium — Update version.md
*Action: Update version.md with "Medium" tag.*
- **Adding new libraries.**
- **Creating NEW Directories (Must update `project_structure.md`).**
- Adding new UI components or Business logic (Update `component_map.md`).
- Adding new API endpoints/Tables.

---

## 6. Execution Format

When performing a task:
1. **State Plan:** "I will add `react-markdown`, create `/utils/markdown`, and update `project_structure.md`."
2. **Execute Code:** Provide solution.
3. **Execute Docs:** Provide updates in **diff format**.

Example Output:

```markdown
### Implementation
[Code Block Here]

### Documentation Updates
**File: guidelines/libraries.md**
+++ After
| react-markdown | ^9.0 | Renders markdown string to HTML |
```

---

## 9. Conflict Resolution
If documentation conflicts:
1. `version.md`
2. `project_structure.md` (Highest authority for File Locations)
3. `tech_stack.md`
4. `api_contract.md` / `db_design.md`

---
_End of Guidelines.md_
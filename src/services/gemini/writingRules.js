export const MERMAID_RULES = `STRICT MERMAID RULES (if you include a diagram):
- ONLY graph TD or graph LR
- Node IDs: letters A‑Z only (no numbers, no special chars)
- Labels: plain text, no punctuation except spaces, max 30 characters
- Arrows: A --> B or A -->|label| B
- NO fill, stroke, style, or CSS
- Maximum 10 nodes and 10 arrows
- Keep the diagram under 12 lines total
- If you cannot follow every rule, do NOT include a diagram`;

export const TABLE_RULES = `STRICT TABLE RULES:
- Use EXACT markdown table format with header row AND separator row
- Header row: | Column 1 | Column 2 | Column 3 |
- Separator row: |----------|----------|----------|
- Data rows: | Value 1 | Value 2 | Value 3 |
- NO brackets, asterisks, or special formatting inside cells
- Keep all cell content as plain text only
- Place ALL interpretation text BELOW the table, never inside it`;

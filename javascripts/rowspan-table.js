// 表格单元格合并（横纵通用）：
// 1. 纵向合并(rowspan)：同一纵列中，上方有内容的单元格下方的连续空单元格，合并到该单元格。
//    | A |      | A(跨4行) |
//    |   |
//    |   |
// 2. 横向合并(colspan)：整行末尾的空段，若其行方向延伸 ≥ 列方向延伸，合并到左侧有内容的单元格。
//    | A |  |  |  →  | A(跨4列) |
//
// 冲突消解（hLen/vLen 段级比较）：
// 一个空段既能横向又能纵向时，比较整段的行方向长度(hLen) 与列方向高度(vLen)。
// 行方向更长 → 横向；列方向更长 → 纵向。
// 这能正确区分"相似性列"（列方向更长，纵向）与"卤素单质行"（行方向更长，横向）。
//
// 空单元格判定：既无文本、也无子元素。
// 注意：<img> 是 void 元素，textContent 恒为空字符串，不能误判为空单元格。
//
// 实现：所有合并基于初始 DOM 快照计算，最后统一删除被合并的空单元格。
document.addEventListener('DOMContentLoaded', function() {
  function isEmptyCell(td) {
    return td.textContent.trim() === '' && td.children.length === 0;
  }

  document.querySelectorAll('table').forEach(function(table) {
    var rows = Array.from(table.rows);
    if (!rows.length) return;

    // 从表头之后开始处理（markdown 表格第一行总是渲染为 thead）
    var startRow = table.tHead ? table.tHead.rows.length : 0;
    if (startRow >= rows.length) return;

    // 初始快照：所有真实单元格（无 rowspan/colspan 干扰）
    var rowCells = rows.map(function(r) {
      return Array.from(r.cells);
    });
    var numCols = 0;
    rowCells.forEach(function(cells) {
      if (cells.length > numCols) numCols = cells.length;
    });
    if (!numCols) return;

    function cellAt(r, c) {
      return (rowCells[r] && rowCells[r][c]) || null;
    }
    function emptyAt(r, c) {
      var td = cellAt(r, c);
      return td ? isEmptyCell(td) : false;
    }

    // 计算每个空单元格所属纵向空段的高度 colSeg[r][c]
    // （该列中从该空单元格向上/向下连续空单元格的总数）
    var colSeg = {};
    function colSegKey(r, c) { return r + '_' + c; }
    for (var c = 0; c < numCols; c++) {
      var r = startRow;
      while (r < rows.length) {
        if (emptyAt(r, c)) {
          var top = r;
          while (r < rows.length && emptyAt(r, c)) r++;
          var bottom = r - 1;
          var h = bottom - top + 1;
          for (var k = top; k <= bottom; k++) {
            colSeg[colSegKey(k, c)] = h;
          }
        } else {
          r++;
        }
      }
    }

    var merged = new Set(); // 被合并的空单元格

    // ===== 横向合并 (colspan) =====
    for (var r = startRow; r < rows.length; r++) {
      var hAnchor = null; // { cell: <td>, col: 快照列索引 }
      var cells = rowCells[r];
      var c = 0;
      while (c < cells.length) {
        var td = cells[c];
        if (!td) { c++; continue; }

        if (isEmptyCell(td)) {
          // 连续空段 [c..end]
          var end = c;
          while (end + 1 < cells.length && cells[end + 1] && isEmptyCell(cells[end + 1])) {
            end++;
          }
          // 空段延伸到行尾且左侧有内容 → 横向候选
          if (hAnchor && end === cells.length - 1) {
            var hLen = end - c + 1;                 // 行方向长度
            var vLen = 0;                           // 列方向最大高度
            for (var k = c; k <= end; k++) {
              var segH = colSeg[colSegKey(r, k)] || 0;
              if (segH > vLen) vLen = segH;
            }
            if (hLen >= vLen) {
              // 行方向更长 → 横向合并整个空段到左侧
              hAnchor.cell.colSpan = (end - hAnchor.col) + 1;
              for (var k2 = c; k2 <= end; k2++) merged.add(cells[k2]);
              c = end + 1;
              continue;
            }
          }
          // 不横向：空段留给纵向合并
          c = end + 1;
        } else {
          hAnchor = { cell: td, col: c };
          c++;
        }
      }
    }

    // ===== 纵向合并 (rowspan)：处理剩余空单元格 =====
    for (var c = 0; c < numCols; c++) {
      var vAnchor = null; // { cell: <td>, row: 行号 }
      for (var r = startRow; r < rows.length; r++) {
        var td = cellAt(r, c);
        if (!td) continue;
        if (isEmptyCell(td) && !merged.has(td)) {
          if (vAnchor) {
            vAnchor.cell.rowSpan = (r - vAnchor.row) + 1;
            merged.add(td);
          }
          // 无上方 anchor（行首空）→ 跳过，不作为 anchor
        } else {
          vAnchor = { cell: td, row: r };
        }
      }
    }

    // ===== 删除所有被合并的空单元格 =====
    merged.forEach(function(td) {
      td.remove();
    });
  });
});

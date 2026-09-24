/* MathJax 3 配置（网页端与 PDF 导出共用）
 *
 * 本笔记用到的高中化学公式依赖这些扩展，缺一不可：
 *   - mhchem      : \ce{...}      化学式/方程式（笔记里出现 500+ 次）
 *   - cancel      : \cancel{...}  氧化还原电子转移的划线
 *   - ams         : \overset / \underset / \xrightarrow 等
 *   - configmacros: 配合下面的 macros 定义自定义箭头
 *   - textmacros  : \text{} 在部分写法下的支持
 */
window.MathJax = {
  loader: {
    // 关键：强制在**开始排版之前**把扩展加载好。
    // MathJax 默认是按需加载（遇到 \ce 才去异步取 mhchem），而排版往往在
    // 扩展返回之前就结束了，于是 \ce{...} 会以红色 "Undefined control sequence"
    // 留在页面上。这个现象在第一次打开页面（无缓存）时最容易出现。
    load: ['[tex]/mhchem', '[tex]/cancel', '[tex]/ams', '[tex]/configmacros', '[tex]/textmacros'],
  },

  // 仅处理 .arithmatex 内的内容（pymdownx.arithmatex 的输出），
  // 避免正文里出现的 $ 符号被误判为公式。
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEnvironments: true,
    processEscapes: true,
    // 必须用 { "[+]": [...] } 形式（在默认宏包基础上追加）。
    // 若写成数组会替换掉默认宏包，mhchem 拿不到依赖，所有 \ce 都会报未定义。
    packages: { "[+]": ["mhchem", "cancel", "ams", "configmacros", "textmacros"] },
    macros: {
      // 长等号：既是箭头又是等号，用于配平步骤
      xlongequal: ["\\;{\\Longrightarrow}\\;", 0],
    },
  },

  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex",
  },

  chtml: {
    // 保持 1：试过 0.97 想让高箭头不撑高行框，但公式变矮会让分页位置整体偏移，
    // 反而在别的页面制造出新的行框重叠，得不偿失。
    scale: 1,
    matchFontHeight: false,
  },

  startup: {
    typeset: true,
  },
};

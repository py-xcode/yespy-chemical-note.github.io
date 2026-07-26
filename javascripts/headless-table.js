// 隐藏空表头的 <thead>，实现无表头表格效果
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('table thead').forEach(function(thead) {
    var hasContent = false;
    thead.querySelectorAll('th').forEach(function(th) {
      if (th.textContent.trim() !== '') {
        hasContent = true;
      }
    });
    if (!hasContent) {
      thead.style.display = 'none';
    }
  });
});

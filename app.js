/* ============================================================
   NC Differentiation — Numerical Differentiation Calculator
   Methods: Newton Forward/Backward, Stirling, Finite Difference
   ============================================================ */

(function () {
  'use strict';

  // ===== CONSTANTS =====
  var METHOD_NAMES = {
    'newton-forward': "Newton's Forward Difference",
    'newton-backward': "Newton's Backward Difference",
    'stirling': "Stirling's Central Difference",
    'finite-forward': 'Finite Difference (Forward)',
    'finite-backward': 'Finite Difference (Backward)',
    'finite-central': 'Finite Difference (Central)'
  };

  // ===== DOM REFERENCES =====
  var $ = function (id) { return document.getElementById(id); };
  var modeTableBtn = $('mode-table');
  var modeFuncBtn = $('mode-function');
  var tableSection = $('table-input-section');
  var funcSection = $('function-input-section');
  var methodSelect = $('method-select');
  var numPointsSelect = $('num-points');
  var derivativeOrder = $('derivative-order');
  var compareToggle = $('compare-toggle');
  var compareWrapper = $('compare-method-wrapper');
  var compareSelect = $('compare-method-select');
  var calcBtn = $('calculate-btn');
  var exampleBtn = $('example-btn');
  var clearBtn = $('clear-btn');
  var importToggle = $('import-toggle-btn');
  var importSection = $('import-section');
  var importText = $('import-text');
  var importBtn = $('import-btn');
  var output = $('output');
  var themeToggle = $('theme-toggle');
  var historyToggle = $('history-toggle-btn');
  var historyPanel = $('history-panel');
  var historyList = $('history-list');
  var clearHistoryBtn = $('clear-history-btn');
  var dataTableBody = $('data-table-body');
  var diffAtX = $('diff-at-x');
  var funcExpr = $('func-expr');
  var funcX0 = $('func-x0');
  var funcH = $('func-h');
  var funcDiffAt = $('func-diff-at');

  var inputMode = 'table'; // 'table' or 'function'

  // ===== THEME =====
  function initTheme() {
    var saved = localStorage.getItem('nc-diff-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀️';
    }
  }

  themeToggle.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('nc-diff-theme', isDark ? 'light' : 'dark');
  });

  // ===== INPUT MODE TOGGLE =====
  modeTableBtn.addEventListener('click', function () {
    inputMode = 'table';
    modeTableBtn.classList.add('active');
    modeFuncBtn.classList.remove('active');
    tableSection.style.display = '';
    funcSection.style.display = 'none';
    $('num-points-group').style.display = '';
  });

  modeFuncBtn.addEventListener('click', function () {
    inputMode = 'function';
    modeFuncBtn.classList.add('active');
    modeTableBtn.classList.remove('active');
    funcSection.style.display = '';
    tableSection.style.display = 'none';
    $('num-points-group').style.display = 'none';
  });

  // ===== DATA TABLE MANAGEMENT =====
  function buildDataTable() {
    var n = parseInt(numPointsSelect.value);
    var oldValues = readTableValues();
    dataTableBody.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var tr = document.createElement('tr');
      var tdI = document.createElement('td');
      tdI.textContent = i;
      tr.appendChild(tdI);

      var tdX = document.createElement('td');
      var inpX = document.createElement('input');
      inpX.type = 'text';
      inpX.className = 'data-input x-input';
      inpX.setAttribute('data-index', i);
      if (oldValues[i]) inpX.value = oldValues[i].x;
      tdX.appendChild(inpX);
      tr.appendChild(tdX);

      var tdY = document.createElement('td');
      var inpY = document.createElement('input');
      inpY.type = 'text';
      inpY.className = 'data-input y-input';
      inpY.setAttribute('data-index', i);
      if (oldValues[i]) inpY.value = oldValues[i].y;
      tdY.appendChild(inpY);
      tr.appendChild(tdY);

      dataTableBody.appendChild(tr);
    }
  }

  function readTableValues() {
    var rows = dataTableBody.querySelectorAll('tr');
    var vals = [];
    rows.forEach(function (tr, i) {
      var xInp = tr.querySelector('.x-input');
      var yInp = tr.querySelector('.y-input');
      if (xInp && yInp) {
        vals.push({ x: xInp.value, y: yInp.value });
      }
    });
    return vals;
  }

  numPointsSelect.addEventListener('change', buildDataTable);

  // ===== METHOD NOTES =====
  function updateMethodNote() {
    document.querySelectorAll('.method-note').forEach(function (el) { el.classList.remove('visible'); });
    var method = methodSelect.value;
    if (method === 'newton-forward') $('method-note-forward').classList.add('visible');
    else if (method === 'newton-backward') $('method-note-backward').classList.add('visible');
    else if (method === 'stirling') $('method-note-stirling').classList.add('visible');
    else $('method-note-finite').classList.add('visible');
  }

  methodSelect.addEventListener('change', updateMethodNote);

  // ===== COMPARE TOGGLE =====
  compareToggle.addEventListener('change', function () {
    compareWrapper.style.display = compareToggle.checked ? '' : 'none';
  });

  // ===== IMPORT =====
  importToggle.addEventListener('click', function () {
    importSection.style.display = importSection.style.display === 'none' || !importSection.style.display ? 'block' : 'none';
  });

  importBtn.addEventListener('click', function () {
    var text = importText.value.trim();
    if (!text) return;
    var lines = text.split(/\n/).filter(function (l) { return l.trim(); });
    var n = lines.length;
    if (n < 2) return;
    numPointsSelect.value = Math.min(Math.max(n, 3), 8);
    buildDataTable();
    lines.forEach(function (line, i) {
      if (i >= parseInt(numPointsSelect.value)) return;
      var parts = line.trim().split(/[\s,\t]+/);
      var xInp = dataTableBody.querySelector('.x-input[data-index="' + i + '"]');
      var yInp = dataTableBody.querySelector('.y-input[data-index="' + i + '"]');
      if (xInp && parts[0]) xInp.value = parts[0];
      if (yInp && parts[1]) yInp.value = parts[1];
    });
    importSection.style.display = 'none';
    importText.value = '';
  });

  // ===== EXAMPLE DATA =====
  exampleBtn.addEventListener('click', function () {
    if (inputMode === 'function') {
      funcExpr.value = 'sin(x)';
      funcX0.value = '0';
      funcH.value = '0.2';
      funcDiffAt.value = '0.4';
      numPointsSelect.value = '5';
    } else {
      numPointsSelect.value = '5';
      buildDataTable();
      var exData = [
        { x: '1.0', y: '2.7183' },
        { x: '1.1', y: '3.0042' },
        { x: '1.2', y: '3.3201' },
        { x: '1.3', y: '3.6693' },
        { x: '1.4', y: '4.0552' }
      ];
      exData.forEach(function (d, i) {
        var xInp = dataTableBody.querySelector('.x-input[data-index="' + i + '"]');
        var yInp = dataTableBody.querySelector('.y-input[data-index="' + i + '"]');
        if (xInp) xInp.value = d.x;
        if (yInp) yInp.value = d.y;
      });
      diffAtX.value = '1.2';
    }
  });

  // ===== CLEAR =====
  clearBtn.addEventListener('click', function () {
    output.innerHTML = '';
  });

  // ===== HISTORY =====
  var historyData = [];
  function loadHistory() {
    try {
      historyData = JSON.parse(localStorage.getItem('nc-diff-history') || '[]');
    } catch (e) { historyData = []; }
    renderHistory();
  }

  function saveHistory() {
    localStorage.setItem('nc-diff-history', JSON.stringify(historyData.slice(0, 50)));
  }

  function addToHistory(entry) {
    historyData.unshift(entry);
    if (historyData.length > 50) historyData.length = 50;
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (!historyData.length) {
      historyList.innerHTML = '<div class="history-empty">No history yet</div>';
      return;
    }
    historyData.forEach(function (item, idx) {
      var div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = '<div class="history-meta">' +
        '<span class="history-method">' + (METHOD_NAMES[item.method] || item.method) + '</span>' +
        '<span class="history-size">' + item.numPoints + ' pts</span>' +
        '<span class="history-date">' + (item.date || '') + '</span>' +
        '</div>' +
        '<div class="history-preview">at x=' + item.diffAt + '</div>';
      div.addEventListener('click', function () { restoreHistory(idx); });
      historyList.appendChild(div);
    });
  }

  function restoreHistory(idx) {
    var item = historyData[idx];
    if (!item) return;
    methodSelect.value = item.method;
    derivativeOrder.value = item.order || 'both';
    if (item.mode === 'function') {
      modeFuncBtn.click();
      funcExpr.value = item.funcExpr || '';
      funcX0.value = item.funcX0 || '';
      funcH.value = item.funcH || '';
      funcDiffAt.value = item.diffAt || '';
      numPointsSelect.value = item.numPoints || '5';
    } else {
      modeTableBtn.click();
      numPointsSelect.value = item.numPoints || '5';
      buildDataTable();
      if (item.data) {
        item.data.forEach(function (d, i) {
          var xInp = dataTableBody.querySelector('.x-input[data-index="' + i + '"]');
          var yInp = dataTableBody.querySelector('.y-input[data-index="' + i + '"]');
          if (xInp) xInp.value = d.x;
          if (yInp) yInp.value = d.y;
        });
      }
      diffAtX.value = item.diffAt || '';
    }
    updateMethodNote();
  }

  clearHistoryBtn.addEventListener('click', function () {
    historyData = [];
    saveHistory();
    renderHistory();
  });

  // ===== HISTORY PANEL TOGGLE (mobile) =====
  historyToggle.addEventListener('click', function () {
    historyPanel.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (historyPanel.classList.contains('open') && !historyPanel.contains(e.target) && e.target !== historyToggle) {
      historyPanel.classList.remove('open');
    }
  });

  // ===== KEYBOARD SHORTCUT =====
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      calculate();
    }
  });

  // ===== CORE: GATHER INPUT DATA =====
  function gatherInput() {
    var method = methodSelect.value;
    var order = derivativeOrder.value;
    var xArr = [], yArr = [], h, diffAt;

    if (inputMode === 'function') {
      var expr = funcExpr.value.trim();
      var x0 = parseFloat(funcX0.value);
      h = parseFloat(funcH.value);
      diffAt = parseFloat(funcDiffAt.value);
      var n = parseInt(numPointsSelect.value);

      if (!expr) throw new Error('Please enter a function f(x).');
      if (isNaN(x0) || isNaN(h) || h === 0) throw new Error('Please enter valid x₀ and step size h.');
      if (isNaN(diffAt)) throw new Error('Please enter the point to differentiate at.');

      for (var i = 0; i < n; i++) {
        var xi = roundSig(x0 + i * h, 12);
        xArr.push(xi);
        try {
          yArr.push(math.evaluate(expr, { x: xi }));
        } catch (e) {
          throw new Error('Error evaluating f(' + xi + '): ' + e.message);
        }
      }
    } else {
      var rows = dataTableBody.querySelectorAll('tr');
      rows.forEach(function (tr) {
        var xInp = tr.querySelector('.x-input');
        var yInp = tr.querySelector('.y-input');
        var xv = parseFloat(xInp.value);
        var yv = parseFloat(yInp.value);
        if (isNaN(xv) || isNaN(yv)) {
          xInp.classList.add('input-error');
          yInp.classList.add('input-error');
          setTimeout(function () { xInp.classList.remove('input-error'); yInp.classList.remove('input-error'); }, 600);
          throw new Error('Please fill in all data points with valid numbers.');
        }
        xArr.push(xv);
        yArr.push(yv);
      });

      diffAt = parseFloat(diffAtX.value);
      if (isNaN(diffAt)) throw new Error('Please enter the point x to differentiate at.');

      // Check equally spaced
      h = roundSig(xArr[1] - xArr[0], 10);
      for (var j = 2; j < xArr.length; j++) {
        var hj = roundSig(xArr[j] - xArr[j - 1], 10);
        if (Math.abs(hj - h) > 1e-8) {
          throw new Error('Data points must be equally spaced. h varies: ' + h + ' vs ' + hj);
        }
      }
    }

    return { method: method, order: order, x: xArr, y: yArr, h: h, diffAt: diffAt };
  }

  function roundSig(val, digits) {
    return parseFloat(val.toPrecision(digits));
  }

  // ===== FORWARD DIFFERENCE TABLE =====
  function buildForwardDiffTable(y) {
    var n = y.length;
    var table = [y.slice()];
    for (var k = 1; k < n; k++) {
      var col = [];
      for (var i = 0; i < n - k; i++) {
        col.push(table[k - 1][i + 1] - table[k - 1][i]);
      }
      table.push(col);
    }
    return table;
  }

  // ===== BACKWARD DIFFERENCE TABLE =====
  function buildBackwardDiffTable(y) {
    // Same structure as forward, but we use from the end
    return buildForwardDiffTable(y);
  }

  // ===== HTML: RENDER DIFFERENCE TABLE =====
  function renderDiffTableHTML(x, diffTable, type) {
    var n = x.length;
    var html = '<div class="diff-table-container"><table class="diff-table"><thead><tr>';
    html += '<th>i</th><th>x<sub>i</sub></th><th>y<sub>i</sub></th>';
    for (var k = 1; k < n; k++) {
      if (type === 'forward') html += '<th>Δ' + (k > 1 ? '<sup>' + k + '</sup>' : '') + 'y</th>';
      else if (type === 'backward') html += '<th>∇' + (k > 1 ? '<sup>' + k + '</sup>' : '') + 'y</th>';
      else html += '<th>δ' + (k > 1 ? '<sup>' + k + '</sup>' : '') + 'y</th>';
    }
    html += '</tr></thead><tbody>';

    for (var i = 0; i < n; i++) {
      html += '<tr>';
      html += '<td>' + i + '</td>';
      html += '<td>' + fmt(x[i]) + '</td>';
      for (var k = 0; k < n; k++) {
        if (k < n - i && diffTable[k] && i < diffTable[k].length) {
          html += '<td>' + fmt(diffTable[k][i]) + '</td>';
        } else {
          html += '<td></td>';
        }
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    return html;
  }

  function fmt(val) {
    if (typeof val !== 'number') return val;
    if (Number.isInteger(val)) return '' + val;
    // Show up to 8 decimal places, trimming trailing zeros
    var s = val.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  // ===== NEWTON'S FORWARD DIFFERENCE =====
  function newtonForward(data) {
    var x = data.x, y = data.y, h = data.h, xVal = data.diffAt, order = data.order;
    var n = x.length;
    var diffTable = buildForwardDiffTable(y);

    // Find nearest x0 (beginning)
    var idx = 0;
    for (var i = 0; i < n; i++) {
      if (x[i] <= xVal) idx = i;
    }
    if (idx > n - 3) idx = Math.max(0, n - 3);
    var x0 = x[idx];
    var s = (xVal - x0) / h;

    var steps = [];
    var results = {};

    steps.push({ type: 'info', html: '<p>Using x₀ = ' + fmt(x0) + ' (index ' + idx + '), h = ' + fmt(h) + ', s = (x − x₀)/h = (' + fmt(xVal) + ' − ' + fmt(x0) + ')/' + fmt(h) + ' = <strong>' + fmt(s) + '</strong></p>' });

    // First derivative
    if (order === '1' || order === 'both') {
      steps.push({ type: 'heading', text: 'First Derivative f\'(' + fmt(xVal) + ')' });
      steps.push({ type: 'info', html: '<p>Formula: f\'(x) = (1/h)[Δy₀ + ((2s−1)/2!)Δ²y₀ + ((3s²−6s+2)/3!)Δ³y₀ + ...]</p>' });

      var f1 = 0;
      var terms = [];
      var termSteps = [];

      // Δy₀
      if (diffTable[1] && diffTable[1][idx] !== undefined) {
        var t = diffTable[1][idx];
        terms.push(t);
        f1 += t;
        termSteps.push('Δy₀ = ' + fmt(t));
      }

      // (2s-1)/2! * Δ²y₀
      if (diffTable[2] && diffTable[2][idx] !== undefined) {
        var coeff = (2 * s - 1) / 2;
        var t2 = coeff * diffTable[2][idx];
        terms.push(t2);
        f1 += t2;
        termSteps.push('((2s−1)/2!)Δ²y₀ = ((' + fmt(2 * s) + '−1)/2) × ' + fmt(diffTable[2][idx]) + ' = ' + fmt(coeff) + ' × ' + fmt(diffTable[2][idx]) + ' = ' + fmt(t2));
      }

      // (3s²-6s+2)/3! * Δ³y₀
      if (diffTable[3] && diffTable[3][idx] !== undefined) {
        var coeff3 = (3 * s * s - 6 * s + 2) / 6;
        var t3 = coeff3 * diffTable[3][idx];
        terms.push(t3);
        f1 += t3;
        termSteps.push('((3s²−6s+2)/3!)Δ³y₀ = ' + fmt(coeff3) + ' × ' + fmt(diffTable[3][idx]) + ' = ' + fmt(t3));
      }

      // (4s³-18s²+22s-6)/4! * Δ⁴y₀
      if (diffTable[4] && diffTable[4][idx] !== undefined) {
        var coeff4 = (4 * s * s * s - 18 * s * s + 22 * s - 6) / 24;
        var t4 = coeff4 * diffTable[4][idx];
        terms.push(t4);
        f1 += t4;
        termSteps.push('((4s³−18s²+22s−6)/4!)Δ⁴y₀ = ' + fmt(coeff4) + ' × ' + fmt(diffTable[4][idx]) + ' = ' + fmt(t4));
      }

      f1 = f1 / h;

      termSteps.forEach(function (s) {
        steps.push({ type: 'step', substeps: [s] });
      });

      steps.push({ type: 'step', substeps: [
        'f\'(' + fmt(xVal) + ') = (1/' + fmt(h) + ') × [' + terms.map(fmt).join(' + ') + ']',
        'f\'(' + fmt(xVal) + ') = (1/' + fmt(h) + ') × ' + fmt(f1 * h),
        '<strong>f\'(' + fmt(xVal) + ') = ' + fmt(f1) + '</strong>'
      ]});

      results.f1 = f1;
    }

    // Second derivative
    if (order === '2' || order === 'both') {
      steps.push({ type: 'heading', text: 'Second Derivative f\'\'(' + fmt(xVal) + ')' });
      steps.push({ type: 'info', html: '<p>Formula: f\'\'(x) = (1/h²)[Δ²y₀ + (s−1)Δ³y₀ + ((6s²−18s+11)/12)Δ⁴y₀ + ...]</p>' });

      var f2 = 0;
      var terms2 = [];
      var termSteps2 = [];

      // Δ²y₀
      if (diffTable[2] && diffTable[2][idx] !== undefined) {
        f2 += diffTable[2][idx];
        terms2.push(diffTable[2][idx]);
        termSteps2.push('Δ²y₀ = ' + fmt(diffTable[2][idx]));
      }

      // (s-1) * Δ³y₀
      if (diffTable[3] && diffTable[3][idx] !== undefined) {
        var c3 = s - 1;
        var v3 = c3 * diffTable[3][idx];
        f2 += v3;
        terms2.push(v3);
        termSteps2.push('(s−1)Δ³y₀ = ' + fmt(c3) + ' × ' + fmt(diffTable[3][idx]) + ' = ' + fmt(v3));
      }

      // (6s²-18s+11)/12 * Δ⁴y₀
      if (diffTable[4] && diffTable[4][idx] !== undefined) {
        var c4 = (6 * s * s - 18 * s + 11) / 12;
        var v4 = c4 * diffTable[4][idx];
        f2 += v4;
        terms2.push(v4);
        termSteps2.push('((6s²−18s+11)/12)Δ⁴y₀ = ' + fmt(c4) + ' × ' + fmt(diffTable[4][idx]) + ' = ' + fmt(v4));
      }

      f2 = f2 / (h * h);

      termSteps2.forEach(function (s) {
        steps.push({ type: 'step', substeps: [s] });
      });

      steps.push({ type: 'step', substeps: [
        'f\'\'(' + fmt(xVal) + ') = (1/' + fmt(h) + '²) × [' + terms2.map(fmt).join(' + ') + ']',
        '<strong>f\'\'(' + fmt(xVal) + ') = ' + fmt(f2) + '</strong>'
      ]});

      results.f2 = f2;
    }

    return {
      method: 'newton-forward',
      diffTable: diffTable,
      tableType: 'forward',
      x: x, h: h, s: s, x0: x0, xVal: xVal,
      results: results,
      steps: steps,
      idx: idx
    };
  }

  // ===== NEWTON'S BACKWARD DIFFERENCE =====
  function newtonBackward(data) {
    var x = data.x, y = data.y, h = data.h, xVal = data.diffAt, order = data.order;
    var n = x.length;
    var diffTable = buildForwardDiffTable(y); // same table, indexed differently

    // Use last point as xn
    var idx = n - 1;
    for (var i = n - 1; i >= 0; i--) {
      if (x[i] >= xVal) idx = i;
    }
    if (idx < 2) idx = Math.min(n - 1, 2);
    var xn = x[idx];
    var s = (xVal - xn) / h; // s is typically negative or zero

    var steps = [];
    var results = {};

    steps.push({ type: 'info', html: '<p>Using xₙ = ' + fmt(xn) + ' (index ' + idx + '), h = ' + fmt(h) + ', s = (x − xₙ)/h = (' + fmt(xVal) + ' − ' + fmt(xn) + ')/' + fmt(h) + ' = <strong>' + fmt(s) + '</strong></p>' });

    // Backward differences: ∇y_n = y_n - y_{n-1} = Δy_{n-1}
    // ∇²y_n = Δ²y_{n-2}, etc.
    // ∇^k y_n = diffTable[k][idx - k]

    function nabla(k) {
      var i = idx - k;
      if (i >= 0 && diffTable[k] && diffTable[k][i] !== undefined) return diffTable[k][i];
      return undefined;
    }

    // First derivative
    if (order === '1' || order === 'both') {
      steps.push({ type: 'heading', text: 'First Derivative f\'(' + fmt(xVal) + ')' });
      steps.push({ type: 'info', html: '<p>Formula: f\'(x) = (1/h)[∇yₙ + ((2s+1)/2!)∇²yₙ + ((3s²+6s+2)/3!)∇³yₙ + ...]</p>' });

      var f1 = 0;
      var terms = [];
      var termSteps = [];

      var v1 = nabla(1);
      if (v1 !== undefined) {
        f1 += v1;
        terms.push(v1);
        termSteps.push('∇yₙ = ' + fmt(v1));
      }

      var v2 = nabla(2);
      if (v2 !== undefined) {
        var c2 = (2 * s + 1) / 2;
        var t2 = c2 * v2;
        f1 += t2;
        terms.push(t2);
        termSteps.push('((2s+1)/2!)∇²yₙ = ' + fmt(c2) + ' × ' + fmt(v2) + ' = ' + fmt(t2));
      }

      var v3 = nabla(3);
      if (v3 !== undefined) {
        var c3 = (3 * s * s + 6 * s + 2) / 6;
        var t3 = c3 * v3;
        f1 += t3;
        terms.push(t3);
        termSteps.push('((3s²+6s+2)/3!)∇³yₙ = ' + fmt(c3) + ' × ' + fmt(v3) + ' = ' + fmt(t3));
      }

      var v4 = nabla(4);
      if (v4 !== undefined) {
        var c4 = (4 * s * s * s + 18 * s * s + 22 * s + 6) / 24;
        var t4 = c4 * v4;
        f1 += t4;
        terms.push(t4);
        termSteps.push('((4s³+18s²+22s+6)/4!)∇⁴yₙ = ' + fmt(c4) + ' × ' + fmt(v4) + ' = ' + fmt(t4));
      }

      f1 = f1 / h;

      termSteps.forEach(function (s) { steps.push({ type: 'step', substeps: [s] }); });
      steps.push({ type: 'step', substeps: [
        'f\'(' + fmt(xVal) + ') = (1/' + fmt(h) + ') × [' + terms.map(fmt).join(' + ') + ']',
        '<strong>f\'(' + fmt(xVal) + ') = ' + fmt(f1) + '</strong>'
      ]});
      results.f1 = f1;
    }

    // Second derivative
    if (order === '2' || order === 'both') {
      steps.push({ type: 'heading', text: 'Second Derivative f\'\'(' + fmt(xVal) + ')' });
      steps.push({ type: 'info', html: '<p>Formula: f\'\'(x) = (1/h²)[∇²yₙ + (s+1)∇³yₙ + ((6s²+18s+11)/12)∇⁴yₙ + ...]</p>' });

      var f2 = 0;
      var terms2 = [];
      var termSteps2 = [];

      var w2 = nabla(2);
      if (w2 !== undefined) {
        f2 += w2;
        terms2.push(w2);
        termSteps2.push('∇²yₙ = ' + fmt(w2));
      }

      var w3 = nabla(3);
      if (w3 !== undefined) {
        var cc3 = s + 1;
        var wv3 = cc3 * w3;
        f2 += wv3;
        terms2.push(wv3);
        termSteps2.push('(s+1)∇³yₙ = ' + fmt(cc3) + ' × ' + fmt(w3) + ' = ' + fmt(wv3));
      }

      var w4 = nabla(4);
      if (w4 !== undefined) {
        var cc4 = (6 * s * s + 18 * s + 11) / 12;
        var wv4 = cc4 * w4;
        f2 += wv4;
        terms2.push(wv4);
        termSteps2.push('((6s²+18s+11)/12)∇⁴yₙ = ' + fmt(cc4) + ' × ' + fmt(w4) + ' = ' + fmt(wv4));
      }

      f2 = f2 / (h * h);

      termSteps2.forEach(function (s) { steps.push({ type: 'step', substeps: [s] }); });
      steps.push({ type: 'step', substeps: [
        'f\'\'(' + fmt(xVal) + ') = (1/' + fmt(h) + '²) × [' + terms2.map(fmt).join(' + ') + ']',
        '<strong>f\'\'(' + fmt(xVal) + ') = ' + fmt(f2) + '</strong>'
      ]});
      results.f2 = f2;
    }

    return {
      method: 'newton-backward',
      diffTable: diffTable,
      tableType: 'backward',
      x: x, h: h, s: s, x0: xn, xVal: xVal,
      results: results,
      steps: steps,
      idx: idx
    };
  }

  // ===== STIRLING'S FORMULA =====
  function stirling(data) {
    var x = data.x, y = data.y, h = data.h, xVal = data.diffAt, order = data.order;
    var n = x.length;
    var diffTable = buildForwardDiffTable(y);

    // Find central point closest to xVal
    var midIdx = 0;
    var minDist = Infinity;
    for (var i = 0; i < n; i++) {
      var d = Math.abs(x[i] - xVal);
      if (d < minDist) { minDist = d; midIdx = i; }
    }

    var x0 = x[midIdx];
    var s = (xVal - x0) / h;

    var steps = [];
    var results = {};

    steps.push({ type: 'info', html: '<p>Central point x₀ = ' + fmt(x0) + ' (index ' + midIdx + '), h = ' + fmt(h) + ', s = (x − x₀)/h = (' + fmt(xVal) + ' − ' + fmt(x0) + ')/' + fmt(h) + ' = <strong>' + fmt(s) + '</strong></p>' });

    // Central differences from forward table:
    // δy_{i+1/2} = Δy_i = diffTable[1][i]
    // δ²y_i = Δ²y_{i-1} = diffTable[2][i-1]
    // δ³y_{i+1/2} = Δ³y_{i-1} = diffTable[3][i-1]
    // etc.

    function getDiff(k, center) {
      // For even k: centered at center
      // For odd k: mean of two central values
      if (k === 0) return y[center];
      if (k % 2 === 1) {
        // Odd order: average of two adjacent
        var half = Math.floor(k / 2);
        var i1 = center - half - 1;
        var i2 = center - half;
        var a = (diffTable[k] && i1 >= 0 && diffTable[k][i1] !== undefined) ? diffTable[k][i1] : undefined;
        var b = (diffTable[k] && i2 >= 0 && diffTable[k][i2] !== undefined) ? diffTable[k][i2] : undefined;
        if (a !== undefined && b !== undefined) return (a + b) / 2;
        if (b !== undefined) return b;
        if (a !== undefined) return a;
        return undefined;
      } else {
        // Even order: directly at center
        var half2 = k / 2;
        var idx2 = center - half2;
        if (diffTable[k] && idx2 >= 0 && diffTable[k][idx2] !== undefined) return diffTable[k][idx2];
        return undefined;
      }
    }

    function getDiffOddPair(k, center) {
      var half = Math.floor(k / 2);
      var i1 = center - half - 1;
      var i2 = center - half;
      var a = (diffTable[k] && i1 >= 0 && diffTable[k][i1] !== undefined) ? diffTable[k][i1] : undefined;
      var b = (diffTable[k] && i2 >= 0 && diffTable[k][i2] !== undefined) ? diffTable[k][i2] : undefined;
      return { upper: a, lower: b };
    }

    // First derivative: Stirling's
    // f'(x) = (1/h)[ μδy₀ + s·δ²y₀ + ((3s²-1)/6)μδ³y₀ + ((2s³-s)/6)·δ⁴y₀/2 + ...]
    // where μδy₀ = (Δy₋₁ + Δy₀)/2, δ²y₀ = Δ²y₋₁
    if (order === '1' || order === 'both') {
      steps.push({ type: 'heading', text: 'First Derivative f\'(' + fmt(xVal) + ')' });
      steps.push({ type: 'info', html: '<p>Stirling\'s formula for first derivative:<br>f\'(x) = (1/h)[μδy₀ + s·δ²y₀ + ((3s²−1)/3!)·μδ³y₀ + ((s²−1)s/3)·¼·δ⁴y₀ + ...]</p>' });

      var f1 = 0;
      var termSteps = [];

      // μδy₀ = average of Δy at (midIdx-1) and Δy at midIdx
      var pair1 = getDiffOddPair(1, midIdx);
      if (pair1.upper !== undefined && pair1.lower !== undefined) {
        var mudelta1 = (pair1.upper + pair1.lower) / 2;
        f1 += mudelta1;
        termSteps.push('μδy₀ = (Δy₋₁ + Δy₀)/2 = (' + fmt(pair1.upper) + ' + ' + fmt(pair1.lower) + ')/2 = ' + fmt(mudelta1));
      } else if (pair1.lower !== undefined) {
        f1 += pair1.lower;
        termSteps.push('μδy₀ ≈ Δy₀ = ' + fmt(pair1.lower));
      }

      // s * δ²y₀
      var d2 = getDiff(2, midIdx);
      if (d2 !== undefined) {
        var t2 = s * d2;
        f1 += t2;
        termSteps.push('s·δ²y₀ = ' + fmt(s) + ' × ' + fmt(d2) + ' = ' + fmt(t2));
      }

      // (3s²-1)/6 * μδ³y₀
      var pair3 = getDiffOddPair(3, midIdx);
      if (pair3.upper !== undefined && pair3.lower !== undefined) {
        var mudelta3 = (pair3.upper + pair3.lower) / 2;
        var c3 = (3 * s * s - 1) / 6;
        var t3 = c3 * mudelta3;
        f1 += t3;
        termSteps.push('((3s²−1)/3!)·μδ³y₀ = ' + fmt(c3) + ' × ' + fmt(mudelta3) + ' = ' + fmt(t3));
      }

      // (s³-s)/6 * δ⁴y₀ -> actually (2s³-s)/6 half form... let me use standard form:
      // (s²(s²-1))/... simplification varies by textbook
      // Standard: next term = s(s²-1)/6 * δ⁴y₀ / 2 ... Let's use a common form:
      // t4 coeff for 1st deriv = (s²-1)*s / 6 half of δ⁴y₀
      var d4 = getDiff(4, midIdx);
      if (d4 !== undefined) {
        var c4 = s * (s * s - 1) / 6;
        var t4v = c4 * d4;
        f1 += t4v;
        termSteps.push('(s(s²−1)/3!) · δ⁴y₀ = ' + fmt(c4) + ' × ' + fmt(d4) + ' = ' + fmt(t4v));
      }

      f1 = f1 / h;

      termSteps.forEach(function (ss) { steps.push({ type: 'step', substeps: [ss] }); });
      steps.push({ type: 'step', substeps: ['<strong>f\'(' + fmt(xVal) + ') = ' + fmt(f1) + '</strong>'] });
      results.f1 = f1;
    }

    // Second derivative
    if (order === '2' || order === 'both') {
      steps.push({ type: 'heading', text: 'Second Derivative f\'\'(' + fmt(xVal) + ')' });
      steps.push({ type: 'info', html: '<p>Stirling\'s formula for second derivative:<br>f\'\'(x) = (1/h²)[δ²y₀ + s·μδ³y₀ + ((6s²−6)/4!)·δ⁴y₀ + ...]</p>' });

      var f2 = 0;
      var termSteps2 = [];

      var dd2 = getDiff(2, midIdx);
      if (dd2 !== undefined) {
        f2 += dd2;
        termSteps2.push('δ²y₀ = ' + fmt(dd2));
      }

      var ppair3 = getDiffOddPair(3, midIdx);
      if (ppair3.upper !== undefined && ppair3.lower !== undefined) {
        var mmudelta3 = (ppair3.upper + ppair3.lower) / 2;
        var vv3 = s * mmudelta3;
        f2 += vv3;
        termSteps2.push('s·μδ³y₀ = ' + fmt(s) + ' × ' + fmt(mmudelta3) + ' = ' + fmt(vv3));
      }

      var dd4 = getDiff(4, midIdx);
      if (dd4 !== undefined) {
        var cc4 = (6 * s * s - 6) / 24;
        var vv4 = cc4 * dd4;
        f2 += vv4;
        termSteps2.push('((6s²−6)/4!)·δ⁴y₀ = ' + fmt(cc4) + ' × ' + fmt(dd4) + ' = ' + fmt(vv4));
      }

      f2 = f2 / (h * h);

      termSteps2.forEach(function (ss) { steps.push({ type: 'step', substeps: [ss] }); });
      steps.push({ type: 'step', substeps: ['<strong>f\'\'(' + fmt(xVal) + ') = ' + fmt(f2) + '</strong>'] });
      results.f2 = f2;
    }

    return {
      method: 'stirling',
      diffTable: diffTable,
      tableType: 'forward',
      x: x, h: h, s: s, x0: x0, xVal: xVal,
      results: results,
      steps: steps,
      idx: midIdx
    };
  }

  // ===== FINITE DIFFERENCE METHODS =====
  function finiteDifference(data, subtype) {
    var x = data.x, y = data.y, h = data.h, xVal = data.diffAt, order = data.order;
    var n = x.length;

    // Find index closest to xVal
    var idx = 0;
    var minDist = Infinity;
    for (var i = 0; i < n; i++) {
      var d = Math.abs(x[i] - xVal);
      if (d < minDist) { minDist = d; idx = i; }
    }

    var steps = [];
    var results = {};

    steps.push({ type: 'info', html: '<p>Using point x = ' + fmt(x[idx]) + ' (index ' + idx + '), h = ' + fmt(h) + '</p>' });

    if (subtype === 'forward') {
      // First derivative: f'(x) ≈ (f(x+h) - f(x)) / h
      // or 3-point: f'(x) ≈ (-3f(x) + 4f(x+h) - f(x+2h)) / (2h)
      if (order === '1' || order === 'both') {
        steps.push({ type: 'heading', text: 'First Derivative (Forward Difference)' });
        if (idx + 2 < n) {
          // 3-point forward
          var f1 = (-3 * y[idx] + 4 * y[idx + 1] - y[idx + 2]) / (2 * h);
          steps.push({ type: 'step', substeps: [
            'Using 3-point forward formula:',
            'f\'(x) = (−3f(x) + 4f(x+h) − f(x+2h)) / (2h)',
            '= (−3×' + fmt(y[idx]) + ' + 4×' + fmt(y[idx + 1]) + ' − ' + fmt(y[idx + 2]) + ') / (2×' + fmt(h) + ')',
            '= ' + fmt(-3 * y[idx] + 4 * y[idx + 1] - y[idx + 2]) + ' / ' + fmt(2 * h),
            '<strong>f\'(' + fmt(xVal) + ') ≈ ' + fmt(f1) + '</strong>'
          ]});
          results.f1 = f1;
        } else if (idx + 1 < n) {
          var f1s = (y[idx + 1] - y[idx]) / h;
          steps.push({ type: 'step', substeps: [
            'Using 2-point forward formula: f\'(x) = (f(x+h) − f(x)) / h',
            '= (' + fmt(y[idx + 1]) + ' − ' + fmt(y[idx]) + ') / ' + fmt(h),
            '<strong>f\'(' + fmt(xVal) + ') ≈ ' + fmt(f1s) + '</strong>'
          ]});
          results.f1 = f1s;
        }
      }
      if (order === '2' || order === 'both') {
        steps.push({ type: 'heading', text: 'Second Derivative (Forward Difference)' });
        if (idx + 2 < n) {
          var f2 = (y[idx] - 2 * y[idx + 1] + y[idx + 2]) / (h * h);
          steps.push({ type: 'step', substeps: [
            'f\'\'(x) = (f(x) − 2f(x+h) + f(x+2h)) / h²',
            '= (' + fmt(y[idx]) + ' − 2×' + fmt(y[idx + 1]) + ' + ' + fmt(y[idx + 2]) + ') / ' + fmt(h * h),
            '<strong>f\'\'(' + fmt(xVal) + ') ≈ ' + fmt(f2) + '</strong>'
          ]});
          results.f2 = f2;
        }
      }
    } else if (subtype === 'backward') {
      if (order === '1' || order === 'both') {
        steps.push({ type: 'heading', text: 'First Derivative (Backward Difference)' });
        if (idx - 2 >= 0) {
          var f1b = (3 * y[idx] - 4 * y[idx - 1] + y[idx - 2]) / (2 * h);
          steps.push({ type: 'step', substeps: [
            'Using 3-point backward formula:',
            'f\'(x) = (3f(x) − 4f(x−h) + f(x−2h)) / (2h)',
            '= (3×' + fmt(y[idx]) + ' − 4×' + fmt(y[idx - 1]) + ' + ' + fmt(y[idx - 2]) + ') / (2×' + fmt(h) + ')',
            '<strong>f\'(' + fmt(xVal) + ') ≈ ' + fmt(f1b) + '</strong>'
          ]});
          results.f1 = f1b;
        } else if (idx - 1 >= 0) {
          var f1bs = (y[idx] - y[idx - 1]) / h;
          steps.push({ type: 'step', substeps: [
            'f\'(x) = (f(x) − f(x−h)) / h',
            '= (' + fmt(y[idx]) + ' − ' + fmt(y[idx - 1]) + ') / ' + fmt(h),
            '<strong>f\'(' + fmt(xVal) + ') ≈ ' + fmt(f1bs) + '</strong>'
          ]});
          results.f1 = f1bs;
        }
      }
      if (order === '2' || order === 'both') {
        steps.push({ type: 'heading', text: 'Second Derivative (Backward Difference)' });
        if (idx - 2 >= 0) {
          var f2b = (y[idx] - 2 * y[idx - 1] + y[idx - 2]) / (h * h);
          steps.push({ type: 'step', substeps: [
            'f\'\'(x) = (f(x) − 2f(x−h) + f(x−2h)) / h²',
            '= (' + fmt(y[idx]) + ' − 2×' + fmt(y[idx - 1]) + ' + ' + fmt(y[idx - 2]) + ') / ' + fmt(h * h),
            '<strong>f\'\'(' + fmt(xVal) + ') ≈ ' + fmt(f2b) + '</strong>'
          ]});
          results.f2 = f2b;
        }
      }
    } else {
      // Central
      if (order === '1' || order === 'both') {
        steps.push({ type: 'heading', text: 'First Derivative (Central Difference)' });
        if (idx - 1 >= 0 && idx + 1 < n) {
          var f1c = (y[idx + 1] - y[idx - 1]) / (2 * h);
          steps.push({ type: 'step', substeps: [
            'f\'(x) = (f(x+h) − f(x−h)) / (2h)',
            '= (' + fmt(y[idx + 1]) + ' − ' + fmt(y[idx - 1]) + ') / (2×' + fmt(h) + ')',
            '= ' + fmt(y[idx + 1] - y[idx - 1]) + ' / ' + fmt(2 * h),
            '<strong>f\'(' + fmt(xVal) + ') ≈ ' + fmt(f1c) + '</strong>'
          ]});
          results.f1 = f1c;

          // 5-point if available
          if (idx - 2 >= 0 && idx + 2 < n) {
            var f1c5 = (-y[idx + 2] + 8 * y[idx + 1] - 8 * y[idx - 1] + y[idx - 2]) / (12 * h);
            steps.push({ type: 'step', substeps: [
              'Also: 5-point central formula:',
              'f\'(x) = (−f(x+2h) + 8f(x+h) − 8f(x−h) + f(x−2h)) / (12h)',
              '<strong>f\'₅ₚₜ(' + fmt(xVal) + ') ≈ ' + fmt(f1c5) + '</strong> (more accurate)'
            ]});
          }
        }
      }
      if (order === '2' || order === 'both') {
        steps.push({ type: 'heading', text: 'Second Derivative (Central Difference)' });
        if (idx - 1 >= 0 && idx + 1 < n) {
          var f2c = (y[idx + 1] - 2 * y[idx] + y[idx - 1]) / (h * h);
          steps.push({ type: 'step', substeps: [
            'f\'\'(x) = (f(x+h) − 2f(x) + f(x−h)) / h²',
            '= (' + fmt(y[idx + 1]) + ' − 2×' + fmt(y[idx]) + ' + ' + fmt(y[idx - 1]) + ') / ' + fmt(h * h),
            '<strong>f\'\'(' + fmt(xVal) + ') ≈ ' + fmt(f2c) + '</strong>'
          ]});
          results.f2 = f2c;

          if (idx - 2 >= 0 && idx + 2 < n) {
            var f2c5 = (-y[idx + 2] + 16 * y[idx + 1] - 30 * y[idx] + 16 * y[idx - 1] - y[idx - 2]) / (12 * h * h);
            steps.push({ type: 'step', substeps: [
              'Also: 5-point central formula:',
              'f\'\'(x) = (−f(x+2h) + 16f(x+h) − 30f(x) + 16f(x−h) − f(x−2h)) / (12h²)',
              '<strong>f\'\'₅ₚₜ(' + fmt(xVal) + ') ≈ ' + fmt(f2c5) + '</strong> (more accurate)'
            ]});
          }
        }
      }
    }

    return {
      method: data.method,
      diffTable: buildForwardDiffTable(y),
      tableType: 'forward',
      x: x, h: h, xVal: xVal,
      results: results,
      steps: steps,
      idx: idx
    };
  }

  // ===== ERROR ESTIMATION =====
  function estimateError(result, data) {
    var h = data.h;
    var method = result.method;
    var html = '';

    if (method === 'finite-central') {
      html += '<div class="error-estimation">';
      html += '<strong>Error Estimation:</strong><br>';
      html += 'Central difference 1st derivative: O(h²) = O(' + fmt(h * h) + ')<br>';
      html += 'Central difference 2nd derivative: O(h²) = O(' + fmt(h * h) + ')<br>';
      html += '5-point formulas (if shown): O(h⁴) = O(' + fmt(h * h * h * h) + ')';
      html += '</div>';
    } else if (method === 'finite-forward' || method === 'finite-backward') {
      html += '<div class="error-estimation">';
      html += '<strong>Error Estimation:</strong><br>';
      html += '2-point formula: O(h) = O(' + fmt(h) + ')<br>';
      html += '3-point formula: O(h²) = O(' + fmt(h * h) + ')';
      html += '</div>';
    } else {
      // Newton / Stirling — error from truncation
      var diffTable = result.diffTable;
      var n = data.x.length;
      // Use last available difference as error indicator
      html += '<div class="error-estimation">';
      html += '<strong>Error Estimation:</strong><br>';
      html += 'Truncation error depends on higher-order differences.<br>';
      if (diffTable[n - 1] && diffTable[n - 1][0] !== undefined) {
        html += 'Highest difference Δ' + (n - 1) + 'y = ' + fmt(diffTable[n - 1][0]) + '<br>';
      }
      html += 'More data points → better accuracy. Using ' + n + ' points.';
      html += '</div>';
    }

    return html;
  }

  // ===== LATEX EXPORT =====
  function generateLaTeX(result) {
    var lines = [];
    var m = result.method;
    var xVal = result.xVal;
    var res = result.results;

    lines.push('% Numerical Differentiation — ' + METHOD_NAMES[m]);
    lines.push('% Generated by NC Differentiation Calculator');
    lines.push('');

    // Difference table
    var x = result.x;
    var dt = result.diffTable;
    var n = x.length;
    lines.push('\\begin{array}{' + 'c'.repeat(n + 2) + '}');
    var header = 'i & x_i & y_i';
    for (var k = 1; k < n; k++) {
      header += ' & \\Delta' + (k > 1 ? '^{' + k + '}' : '') + ' y';
    }
    lines.push(header + ' \\\\');
    lines.push('\\hline');
    for (var i = 0; i < n; i++) {
      var row = i + ' & ' + fmt(x[i]) + ' & ' + fmt(dt[0][i]);
      for (var kk = 1; kk < n; kk++) {
        if (dt[kk] && i < dt[kk].length) {
          row += ' & ' + fmt(dt[kk][i]);
        } else {
          row += ' & ';
        }
      }
      lines.push(row + ' \\\\');
    }
    lines.push('\\end{array}');
    lines.push('');

    if (res.f1 !== undefined) {
      lines.push("f'(" + fmt(xVal) + ') = ' + fmt(res.f1));
    }
    if (res.f2 !== undefined) {
      lines.push("f''(" + fmt(xVal) + ') = ' + fmt(res.f2));
    }

    return lines.join('\n');
  }

  // ===== SHARE LINK =====
  function generateShareLink(data) {
    var params = new URLSearchParams();
    params.set('m', data.method);
    params.set('o', data.order);
    params.set('at', data.diffAt);
    params.set('h', data.h);
    if (inputMode === 'function') {
      params.set('mode', 'func');
      params.set('expr', funcExpr.value);
      params.set('x0', funcX0.value);
    } else {
      params.set('mode', 'table');
      params.set('x', data.x.join(','));
      params.set('y', data.y.join(','));
    }
    return window.location.origin + window.location.pathname + '?' + params.toString();
  }

  // ===== RENDER OUTPUT =====
  function renderResult(result, data) {
    var html = '<div class="result-panel">';

    // Title
    html += '<div class="result-title">' + METHOD_NAMES[result.method] + '</div>';

    // Derivative results
    if (result.results.f1 !== undefined) {
      html += '<div class="derivative-result">';
      html += '<strong>f\'(' + fmt(result.xVal) + ')</strong> = <span class="big-value">' + fmt(result.results.f1) + '</span>';
      html += '</div>';
    }
    if (result.results.f2 !== undefined) {
      html += '<div class="derivative-result">';
      html += '<strong>f\'\'(' + fmt(result.xVal) + ')</strong> = <span class="big-value">' + fmt(result.results.f2) + '</span>';
      html += '</div>';
    }

    // Difference table
    if (result.diffTable) {
      html += '<div class="result-section">';
      html += '<h3>Difference Table</h3>';
      html += renderDiffTableHTML(result.x, result.diffTable, result.tableType);
      html += '</div>';
    }

    // Error estimation
    html += estimateError(result, data);

    // Step-by-step
    if (result.steps && result.steps.length) {
      html += '<details class="steps-details"><summary>Step-by-Step Solution</summary>';
      html += '<div class="steps-content">';
      result.steps.forEach(function (step) {
        if (step.type === 'heading') {
          html += '<div class="step-heading">' + step.text + '</div>';
        } else if (step.type === 'subheading') {
          html += '<div class="step-subheading">' + step.text + '</div>';
        } else if (step.type === 'info') {
          html += step.html;
        } else if (step.type === 'step') {
          html += '<div class="step-block">';
          step.substeps.forEach(function (s) {
            html += '<div class="step-line">' + s + '</div>';
          });
          html += '</div>';
        }
      });
      html += '</div></details>';
    }

    // LaTeX
    var latex = generateLaTeX(result);
    html += '<details class="latex-details"><summary>LaTeX Export</summary>';
    html += '<div class="latex-content">';
    html += '<pre class="latex-code">' + escHTML(latex) + '</pre>';
    html += '<button class="btn btn-small btn-copy" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(function(){}).catch(function(){})">Copy LaTeX</button>';
    html += '</div></details>';

    // Share
    var shareUrl = generateShareLink(data);
    html += '<div class="share-section">';
    html += '<input class="share-url" readonly value="' + escHTML(shareUrl) + '">';
    html += '<button class="btn btn-small btn-share" onclick="navigator.clipboard.writeText(this.previousElementSibling.value)">Copy Link</button>';
    html += '<button class="btn btn-small btn-secondary" onclick="window.print()">Print</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function escHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ===== CALCULATE =====
  function calculate() {
    output.innerHTML = '';
    try {
      var data = gatherInput();
      var result;
      var method = data.method;

      if (method === 'newton-forward') result = newtonForward(data);
      else if (method === 'newton-backward') result = newtonBackward(data);
      else if (method === 'stirling') result = stirling(data);
      else if (method === 'finite-forward') result = finiteDifference(data, 'forward');
      else if (method === 'finite-backward') result = finiteDifference(data, 'backward');
      else if (method === 'finite-central') result = finiteDifference(data, 'central');
      else throw new Error('Unknown method: ' + method);

      // Compare mode
      if (compareToggle.checked) {
        var compMethod = compareSelect.value;
        if (compMethod !== method) {
          var data2 = Object.assign({}, data, { method: compMethod });
          var result2;
          if (compMethod === 'newton-forward') result2 = newtonForward(data2);
          else if (compMethod === 'newton-backward') result2 = newtonBackward(data2);
          else if (compMethod === 'stirling') result2 = stirling(data2);
          else if (compMethod === 'finite-forward') result2 = finiteDifference(data2, 'forward');
          else if (compMethod === 'finite-backward') result2 = finiteDifference(data2, 'backward');
          else if (compMethod === 'finite-central') result2 = finiteDifference(data2, 'central');

          if (result2) {
            output.innerHTML = '<div class="compare-wrapper">' +
              renderResult(result, data) +
              renderResult(result2, data2) +
              '</div>';

            // Comparison summary
            var compHtml = '<div class="result-panel"><div class="result-title">Comparison Summary</div>';
            if (result.results.f1 !== undefined && result2.results.f1 !== undefined) {
              var diff1 = Math.abs(result.results.f1 - result2.results.f1);
              compHtml += '<p class="result-info">f\' difference: |' + fmt(result.results.f1) + ' − ' + fmt(result2.results.f1) + '| = <strong>' + fmt(diff1) + '</strong></p>';
            }
            if (result.results.f2 !== undefined && result2.results.f2 !== undefined) {
              var diff2 = Math.abs(result.results.f2 - result2.results.f2);
              compHtml += '<p class="result-info">f\'\' difference: |' + fmt(result.results.f2) + ' − ' + fmt(result2.results.f2) + '| = <strong>' + fmt(diff2) + '</strong></p>';
            }
            compHtml += '</div>';
            output.innerHTML += compHtml;
          }
        } else {
          output.innerHTML = renderResult(result, data);
        }
      } else {
        output.innerHTML = renderResult(result, data);
      }

      // History
      var histEntry = {
        method: method,
        order: data.order,
        numPoints: data.x.length,
        diffAt: data.diffAt,
        mode: inputMode,
        date: new Date().toLocaleString(),
        data: data.x.map(function (xi, i) { return { x: '' + xi, y: '' + data.y[i] }; })
      };
      if (inputMode === 'function') {
        histEntry.funcExpr = funcExpr.value;
        histEntry.funcX0 = funcX0.value;
        histEntry.funcH = funcH.value;
      }
      addToHistory(histEntry);

    } catch (e) {
      output.innerHTML = '<div class="error-message">' + escHTML(e.message) + '</div>';
    }
  }

  calcBtn.addEventListener('click', calculate);

  // ===== LOAD FROM URL PARAMS =====
  function loadFromURL() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has('m')) return;

    methodSelect.value = params.get('m') || 'newton-forward';
    derivativeOrder.value = params.get('o') || 'both';

    if (params.get('mode') === 'func') {
      modeFuncBtn.click();
      funcExpr.value = params.get('expr') || '';
      funcX0.value = params.get('x0') || '';
      funcH.value = params.get('h') || '';
      funcDiffAt.value = params.get('at') || '';
      if (params.has('x')) {
        numPointsSelect.value = params.get('x').split(',').length;
      }
    } else {
      modeTableBtn.click();
      var xs = (params.get('x') || '').split(',');
      var ys = (params.get('y') || '').split(',');
      var np = xs.length;
      numPointsSelect.value = Math.min(Math.max(np, 3), 8);
      buildDataTable();
      xs.forEach(function (xv, i) {
        var xInp = dataTableBody.querySelector('.x-input[data-index="' + i + '"]');
        var yInp = dataTableBody.querySelector('.y-input[data-index="' + i + '"]');
        if (xInp) xInp.value = xv;
        if (yInp && ys[i]) yInp.value = ys[i];
      });
      diffAtX.value = params.get('at') || '';
    }

    updateMethodNote();

    // Auto-calculate if we have data
    setTimeout(calculate, 200);
  }

  // ===== INIT =====
  initTheme();
  buildDataTable();
  updateMethodNote();
  loadHistory();
  loadFromURL();

})();

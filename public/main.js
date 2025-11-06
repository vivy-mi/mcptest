let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Form elements
  const form = document.getElementById('job-form');
  const companyEl = document.getElementById('company');
  const titleEl = document.getElementById('title');
  const salaryEl = document.getElementById('salary');
  const requirementsEl = document.getElementById('requirements');
  const submitBtn = document.getElementById('submit-btn');
  const resetBtn = document.getElementById('reset-btn');
  const formTitle = document.getElementById('form-title');

  // Filters
  const qEl = document.getElementById('q');
  const companyFilterEl = document.getElementById('companyFilter');
  const titleFilterEl = document.getElementById('titleFilter');
  const filterBtn = document.getElementById('filter-btn');
  const clearFilterBtn = document.getElementById('clear-filter-btn');

  // Table
  const tbody = document.getElementById('jobs-tbody');
  const jobCountEl = document.getElementById('job-count');
  const loadingEl = document.getElementById('loading');
  const companyChartCanvas = document.getElementById('companyChart');
  const salaryChartCanvas = document.getElementById('salaryChart');
  let companyChart = null;
  let salaryChart = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      company: companyEl.value.trim(),
      title: titleEl.value.trim(),
      salary: salaryEl.value.trim(),
      requirements: requirementsEl.value.trim(),
    };

    if (!payload.company || !payload.title) {
      alert('企业名称与岗位名称为必填');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateJob(editingId, payload);
        alert('已更新岗位');
      } else {
        await addJob(payload);
        alert('已添加岗位');
      }
      resetForm();
      await fetchJobs();
    } catch (err) {
      alert('操作失败：' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  });

  resetBtn.addEventListener('click', () => resetForm());

  filterBtn.addEventListener('click', () => fetchJobs());
  clearFilterBtn.addEventListener('click', () => {
    qEl.value = '';
    companyFilterEl.value = '';
    titleFilterEl.value = '';
    fetchJobs();
  });

  fetchJobs();

  function resetForm() {
    form.reset();
    editingId = null;
    submitBtn.textContent = '添加岗位';
    formTitle.textContent = '添加岗位';
  }

  async function fetchJobs() {
    showLoading();
    const params = new URLSearchParams();
    if (qEl.value.trim()) params.set('q', qEl.value.trim());
    if (companyFilterEl.value.trim()) params.set('company', companyFilterEl.value.trim());
    if (titleFilterEl.value.trim()) params.set('title', titleFilterEl.value.trim());

    const res = await fetch(`/api/jobs?${params.toString()}`);
    const data = await res.json();
    renderTable(data);
    jobCountEl.textContent = Array.isArray(data) ? data.length : 0;
    renderStats(data);
    hideLoading();
  }

  async function addJob(payload) {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function updateJob(id, payload) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function deleteJob(id) {
    if (!confirm('确认删除该岗位？')) return;
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('删除失败');
      return;
    }
    await fetchJobs();
  }

  function startEdit(job) {
    editingId = job.id;
    companyEl.value = job.company || '';
    titleEl.value = job.title || '';
    salaryEl.value = job.salary || '';
    requirementsEl.value = job.requirements || '';
    submitBtn.textContent = '保存修改';
    formTitle.textContent = '编辑岗位';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderTable(rows) {
    tbody.innerHTML = '';
    if (!rows || rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = '暂无数据';
      td.className = 'empty';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${escapeHtml(row.company)}</td>
        <td>${escapeHtml(row.title)}</td>
        <td>${escapeHtml(row.salary || '')}</td>
        <td class="requirements" title="${escapeHtml(row.requirements || '')}">${escapeHtml(row.requirements || '')}</td>
        <td>${formatDate(row.created_at)}</td>
        <td class="cell-actions">
          <button class="link" data-action="edit" data-id="${row.id}">编辑</button>
          <button class="link danger" data-action="delete" data-id="${row.id}">删除</button>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.getAttribute('data-action');
        const id = target.getAttribute('data-id');
        if (!action || !id) return;
        const job = rows.find((r) => String(r.id) === String(id));
        if (action === 'edit') startEdit(job);
        if (action === 'delete') deleteJob(id);
      });

      tbody.appendChild(tr);
    });
  }

  function renderStats(rows) {
    updateCompanyChart(rows || []);
    updateSalaryChart(rows || []);
  }

  function updateCompanyChart(rows) {
    if (!companyChartCanvas || typeof Chart === 'undefined') return;
    const counts = {};
    rows.forEach(r => {
      const key = (r.company || '未知').trim() || '未知';
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    const total = rows.length || 1;
    const top = entries.slice(0,5);
    const othersCount = entries.slice(5).reduce((sum, [,c]) => sum + c, 0);
    if (othersCount > 0) top.push(['其他', othersCount]);

    const labels = top.map(([name]) => name);
    const data = top.map(([,count]) => count);
    const palette = ['#0969da','#0ea5e9','#22c55e','#f59e0b','#ef4444','#6b7280'];

    if (!companyChart) {
      companyChart = new Chart(companyChartCanvas.getContext('2d'), {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: palette }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const pct = Math.round((val / total) * 100);
                  return `${ctx.label}: ${val}（${pct}%）`;
                }
              }
            }
          }
        }
      });
    } else {
      companyChart.data.labels = labels;
      companyChart.data.datasets[0].data = data;
      companyChart.update();
    }
  }

  function updateSalaryChart(rows) {
    if (!salaryChartCanvas || typeof Chart === 'undefined') return;
    const buckets = {
      '≤8K': 0,
      '8-12K': 0,
      '12-15K': 0,
      '15-20K': 0,
      '>20K': 0,
      '未知': 0,
    };
    rows.forEach(r => {
      const mid = parseSalaryK(r.salary || '');
      if (mid == null) { buckets['未知']++; return; }
      if (mid <= 8) buckets['≤8K']++;
      else if (mid <= 12) buckets['8-12K']++;
      else if (mid <= 15) buckets['12-15K']++;
      else if (mid <= 20) buckets['15-20K']++;
      else buckets['>20K']++;
    });

    const labels = Object.keys(buckets);
    const data = Object.values(buckets);

    if (!salaryChart) {
      salaryChart = new Chart(salaryChartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: '薪资区间岗位数',
            data,
            backgroundColor: '#22c55e'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    } else {
      salaryChart.data.labels = labels;
      salaryChart.data.datasets[0].data = data;
      salaryChart.update();
    }
  }

  function parseSalaryK(str) {
    const s = String(str || '').toUpperCase();
    const m = s.match(/(\d+(?:\.\d+)?)\s*(?:-|~|到|至|\/)?\s*(\d+(?:\.\d+)?)?\s*K/);
    if (!m) {
      const m2 = s.match(/(\d+(?:\.\d+)?)\s*K/);
      if (!m2) return null;
      return parseFloat(m2[1]);
    }
    const a = parseFloat(m[1]);
    const b = m[2] ? parseFloat(m[2]) : a;
    return Math.round(((a + b) / 2) * 10) / 10;
  }

  function showLoading() { loadingEl.classList.remove('hidden'); }
  function hideLoading() { loadingEl.classList.add('hidden'); }
  function setSubmitting(flag) { submitBtn.disabled = !!flag; }

  function formatDate(dt) {
    if (!dt) return '';
    try {
      const d = new Date(dt);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      return `${y}-${m}-${day} ${hh}:${mm}`;
    } catch {
      return String(dt);
    }
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});

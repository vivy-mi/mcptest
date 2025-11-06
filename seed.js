const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

const jobs = [
  { company: '华为', title: '前端开发工程师', salary: '12-15K', requirements: 'Vue/React，熟悉ES6，掌握Webpack，计算机相关专业' },
  { company: '阿里巴巴', title: '后端开发工程师', salary: '15-20K', requirements: 'Java/Spring，MySQL/Redis，微服务经验，良好编码规范' },
  { company: '腾讯', title: '测试工程师', salary: '10-14K', requirements: '自动化测试，接口测试，熟悉JMeter/Postman' },
  { company: '字节跳动', title: '数据分析师', salary: '15K', requirements: 'SQL扎实，Python数据分析，熟悉可视化工具' },
  { company: '美团', title: 'DevOps工程师', salary: '18-22K', requirements: 'CI/CD，Docker/K8s，Linux运维经验' },
  { company: '京东', title: 'Java开发工程师', salary: '13-18K', requirements: 'Java后端开发，Spring Cloud，数据库调优' },
  { company: '小米', title: '全栈开发工程师', salary: '12-16K', requirements: 'React + Node.js，全栈项目经验' },
  { company: 'PingCAP', title: '数据库研发工程师', salary: '20-30K', requirements: '分布式系统，数据库内核，Go/C++' },
  { company: '蚂蚁集团', title: '安全工程师', salary: '20K+', requirements: '安全评估，渗透测试，安全合规' },
  { company: '网易', title: '前端开发工程师', salary: '10-13K', requirements: 'React/TypeScript，组件化，性能优化' },
  { company: 'B站', title: '视频平台后端', salary: '1.8万', requirements: 'Golang，微服务架构，高并发处理' },
  { company: '滴滴', title: '算法工程师', salary: '25K', requirements: '推荐/搜索算法，Python/Scala，机器学习' },
  { company: '美的', title: '嵌入式工程师', salary: '8-12K', requirements: 'C/C++，嵌入式Linux，硬件基础' },
  { company: '顺丰', title: '数据工程师', salary: '15-20K', requirements: '大数据处理，Kafka/Spark，数据仓库' },
  { company: '携程', title: '测试开发工程师', salary: '12-15K', requirements: '测试框架开发，自动化脚本，质量体系' },
  { company: 'OPPO', title: 'Android工程师', salary: '1.5万', requirements: 'Android开发，Kotlin/Java，组件化' },
  { company: '科大讯飞', title: 'NLP工程师', salary: '20-25K', requirements: 'NLP模型，Transformer，Python/PyTorch' },
  { company: '小红书', title: '前端工程师', salary: '12-17K', requirements: 'React + SSR，工程化，A/B测试经验' },
  { company: '得物', title: '后端工程师', salary: '15-20K', requirements: 'Golang/Java，消息队列，缓存设计' },
  { company: '商汤', title: '计算机视觉工程师', salary: '2.5万', requirements: 'CV方向，OpenCV，深度学习模型' },
];

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    salary TEXT,
    requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.get('SELECT COUNT(*) AS cnt FROM jobs', (err, row) => {
    if (err) {
      console.error('计数失败:', err.message);
      process.exit(1);
    }
    const existing = row.cnt || 0;
    if (existing >= 30) {
      console.log(`已有 ${existing} 条数据，跳过示例数据插入。`);
      process.exit(0);
      return;
    }
    const stmt = db.prepare('INSERT INTO jobs (company, title, salary, requirements) VALUES (?, ?, ?, ?)');
    jobs.forEach(j => stmt.run(j.company, j.title, j.salary, j.requirements));
    stmt.finalize((e) => {
      if (e) {
        console.error('插入失败:', e.message);
        process.exit(1);
      }
      console.log(`插入示例数据 ${jobs.length} 条`);
      process.exit(0);
    });
  });
});

const fs = require('fs');
const pa = require('path');

const dir = 'c:/Users/Pablo/Desktop/Proyectos/SIM/SimBes/frontend/src/components/modules/';
const files = [
  'Module1_IPR/SIMBES_Modulo1.jsx',
  'Module2_Hydraulics/index.jsx',
  'Module3_Gas/index.jsx',
  'Module4_Electrical/index.jsx',
  'Module5_Sensors/index.jsx',
  'Module6_DIFA/index.jsx',
  'Module7_Reliability/index.jsx',
  'Module8_Builder/index.jsx'
];

let replaced = 0;
files.forEach(f => {
  const p = pa.join(dir, f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    const oldStr = '<div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.7 }}>{q.explanation}</div>';
    const newStr = '<div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.7 }}>\n                    {fb.correct ? q.explanation : (q.incorrect_feedback?.[fb.selected] || q.explanation)}\n                  </div>';
    if (content.includes(oldStr)) {
      content = content.replace(oldStr, newStr);
      fs.writeFileSync(p, content);
      replaced++;
    } else {
      console.log('Not found in ', f);
    }
  }
});
console.log('Replaced ' + replaced + ' files');

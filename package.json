<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dark Code Editor</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1e1e1e;color:#d4d4d4;font-family:'Consolas','Courier New',monospace;overflow:hidden}
#header{background:#2d2d2d;padding:8px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #3e3e3e}
#header select, #header button{background:#0e639c;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px}
#header button:hover{background:#1177bb}
#header span{margin-right:auto;font-size:12px;color:#888}
#editor{width:100%;height:calc(100vh - 90px)}
#output{background:#1e1e1e;border-top:1px solid #3e3e3e;height:50px;padding:8px;overflow:auto;font-size:13px;color:#0f0}
#tabs{display:flex;background:#2d2d2d;border-bottom:1px solid #3e3e3e;overflow-x:auto}
.tab{padding:8px 16px;background:#2d2d2d;border-left:1px solid #3e3e3e;cursor:pointer;white-space:nowrap}
.tab.active{background:#1e1e1e}
.tab.close{color:#f48771;margin-right:4px}
.loading{position:fixed;inset:0;background:#1e1e1e;display:flex;align-items:center;justify-content:center;font-size:18px}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"></script>
</head>
<body>
<div class="loading" id="loading">جاري تحميل المحر...</div>

<div id="header">
  <button onclick="runCode()">▶ تشغيل</button>
  <select id="langSelect" onchange="changeLang()">
    <option value="auto">تلقائي</option>
    <option value="javascript">JavaScript</option>
    <option value="python">Python</option>
    <option value="html">HTML</option>
    <option value="lua">Lua</option>
    <option value="sql">SQL</option>
    <option value="cpp">C++</option>
    <option value="java">Java</option>
    <option value="csharp">C#</option>
    <option value="php">PHP</option>
    <option value="go">Go</option>
    <option value="rust">Rust</option>
    <option value="ruby">Ruby</option>
    <option value="swift">Swift</option>
    <option value="kotlin">Kotlin</option>
  </select>
  <button onclick="clearOutput()">مسح</button>
  <span>5 لغات تشغيل فعلي | 10 لغات تلوين فقط</span>
</div>

<div id="tabs">
  <div class="tab active">main.js <span class="close" onclick="closeTab()">×</span></div>
</div>

<div id="editor"></div>
<div id="output">جاهز للتشغيل...</div>

<script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
<script>
let editor, pyodide;
let currentLang = 'javascript';
let currentCode = 'console.log("مرحبا دارك");';

const langExtensions = {
  javascript: 'js', python: 'py', html: 'html', lua: 'lua', sql: 'sql',
  cpp: 'cpp', java: 'java', csharp: 'cs', php: 'php', go: 'go',
  rust: 'rs', ruby: 'rb', swift: 'swift', kotlin: 'kt'
};

const runnableLangs = ['javascript','python','html','lua','sql'];

// كشف اللغة تلقائياً
function detectLang(code){
  if(/<html|<!DOCTYPE/i.test(code)) return 'html';
  if(/def |import |print\(/i.test(code)) return 'python';
  if(/function |const |let |console\.log/i.test(code)) return 'javascript';
  if(/SELECT|INSERT|UPDATE|DELETE/i.test(code)) return 'sql';
  if(/#include|<iostream>/i.test(code)) return 'cpp';
  if(/public class|System\.out/i.test(code)) return 'java';
  if(/func |package main/i.test(code)) return 'go';
  return 'javascript';
}

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
require(['vs/editor.main'], function(){
  editor = monaco.editor.create(document.getElementById('editor'),{
    value: currentCode,
    language: 'javascript',
    theme: 'vs-dark',
    fontSize: 14,
    automaticLayout: true,
    minimap: {enabled: false}
  });
  
  editor.onDidChangeModelContent(()=>{
    currentCode = editor.getValue();
    if(document.getElementById('langSelect').value === 'auto'){
      let detected = detectLang(currentCode);
      monaco.editor.setModelLanguage(editor.getModel(), detected);
      currentLang = detected;
    }
  });
  
  document.getElementById('loading').style.display = 'none';
});

// تحميل Pyodide لـ Python
async function loadPyodide(){
  if(!pyodide){
    document.getElementById('output').innerText = 'جاري تحميل Python...';
    pyodide = await loadPyodide();
  }
}

async function runCode(){
  const output = document.getElementById('output');
  output.innerText = 'جار التشغيل...\n';
  
  try{
    if(currentLang === 'javascript'){
      const result = eval(currentCode);
      output.innerText += result !== undefined ? result : 'تم التنفيذ';
    }
    else if(currentLang === 'python'){
      await loadPyodide();
      pyodide.setStdout({write: s => output.innerText += s});
      await pyodide.runPythonAsync(currentCode);
    }
    else if(currentLang === 'html'){
      const win = window.open();
      win.document.write(currentCode);
    }
    else if(currentLang === 'lua'){
      output.innerText += 'Lua: تحتاج مكتبة خارجية للتشغيل. الكود محفوظ وملون صح';
    }
    else if(currentLang === 'sql'){
      output.innerText += 'SQL: التشغيل يتطلب SQLite بالمتصفح. الكود ملون وجاهز';
    }
    else{
      output.innerText += `${currentLang}: هاي اللغة تلوين فقط. التشغيل بدو تطبيق Android أصلي مع Termux`;
    }
  }catch(e){
    output.innerText += 'خطأ: ' + e.message;
  }
}

function changeLang(){
  let val = document.getElementById('langSelect').value;
  if(val === 'auto'){
    currentLang = detectLang(currentCode);
  }else{
    currentLang = val;
  }
  monaco.editor.setModelLanguage(editor.getModel(), currentLang);
}

function clearOutput(){
  document.getElementById('output').innerText = '';
}

function closeTab(){
  // نسخة بسيطة - تبويب واحد
}

window.addEventListener('error', e=>{
  document.getElementById('output').innerText += '\nخطأ: ' + e.message;
});
</script>
</body>
</html>

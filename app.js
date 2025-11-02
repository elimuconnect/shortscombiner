const fileInput = document.getElementById('fileInput');
const combineBtn = document.getElementById('combineBtn');
const logEl = document.getElementById('log');
const resultEl = document.getElementById('result');

combineBtn.addEventListener('click', async () => {
  const files = fileInput.files;
  if (!files.length) return alert('Select video files first');

  const formData = new FormData();
  for (const f of files) formData.append('videos', f);

  logEl.textContent = 'Uploading files...';

  try {
    const res = await fetch('/combine', { method: 'POST', body: formData });
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    logEl.textContent = 'Videos combined successfully!';
    resultEl.innerHTML = `<video controls src="${data.url}" style="width:100%;max-width:500px"></video>`;
  } catch (err) {
    logEl.textContent = 'Error: ' + err.message;
  }
});

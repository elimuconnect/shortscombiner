const fileInput = document.getElementById("fileInput");
const combineBtn = document.getElementById("combineBtn");
const log = document.getElementById("log");
const result = document.getElementById("result");

combineBtn.onclick = async () => {
  const files = fileInput.files;
  if (!files.length) {
    alert("Please select at least one video to combine!");
    return;
  }

  log.innerText = "⏳ Uploading and combining videos...";
  result.innerHTML = "";

  const formData = new FormData();
  for (let file of files) {
    formData.append("videos", file);
  }

  try {
    // 🔗 Send to your Render backend
    const res = await fetch("https://shortscombiner.onrender.com/combine", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const blob = await res.blob();
    const videoUrl = URL.createObjectURL(blob);

    log.innerText = "✅ Done! Combined video ready below.";
    result.innerHTML = `
      <video controls style="width:100%;max-width:480px;border-radius:10px;margin-top:10px">
        <source src="${videoUrl}" type="video/mp4">
      </video>
      <br>
      <a href="${videoUrl}" download="combined.mp4">⬇️ Download Combined Video</a>
    `;
  } catch (err) {
    console.error(err);
    log.innerText = "❌ Error combining videos: " + err.message;
  }
};

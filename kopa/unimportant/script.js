let count = parseInt(localStorage.getItem("clickCount")) || 0;
display.textContent = count;

btn.addEventListener("click", () => {
  count++;
  localStorage.setItem("clickCount", count);
  display.textContent = count;
});
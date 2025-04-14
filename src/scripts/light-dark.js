const lightMobile = document.getElementById("lightMobile");
const darkMobile = document.getElementById("darkMobile");
const lightPc = document.getElementById("lightPc");
const darkPc = document.getElementById("darkPc");

function switcher() {
  const currentTheme = localStorage.theme || "light";

  if (currentTheme === "light") {
    document.documentElement.classList.add("dark");
    localStorage.theme = "dark";
    if (lightMobile) lightMobile.style.display = "none";
    if (darkMobile) darkMobile.style.display = "block";
    if (lightPc) lightPc.style.display = "none";
    if (darkPc) darkPc.style.display = "block";
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.theme = "light";
    if (lightMobile) lightMobile.style.display = "block";
    if (darkMobile) darkMobile.style.display = "none";
    if (lightPc) lightPc.style.display = "block";
    if (darkPc) darkPc.style.display = "none";
  }
}

// Attach event listeners only to toggle buttons
if (lightMobile) lightMobile.addEventListener("click", switcher);
if (darkMobile) darkMobile.addEventListener("click", switcher);
if (lightPc) lightPc.addEventListener("click", switcher);
if (darkPc) darkPc.addEventListener("click", switcher);

document.addEventListener("DOMContentLoaded", () => {
  const currentTheme = localStorage.theme || "light";

  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark"); // Apply dark class
    if (lightMobile) lightMobile.style.display = "none";
    if (darkMobile) darkMobile.style.display = "block";
    if (lightPc) lightPc.style.display = "none";
    if (darkPc) darkPc.style.display = "block";
  } else {
    document.documentElement.classList.remove("dark"); // Ensure light mode
    if (lightMobile) lightMobile.style.display = "block";
    if (darkMobile) darkMobile.style.display = "none";
    if (lightPc) lightPc.style.display = "block";
    if (darkPc) darkPc.style.display = "none";
  }
});

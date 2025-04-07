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

lightMobile.addEventListener("click", switcher);
darkMobile.addEventListener("click", switcher);
lightPc.addEventListener("click", switcher);
darkPc.addEventListener("click", switcher);

document.addEventListener("DOMContentLoaded", () => {
  const currentTheme = localStorage.theme || "light";

  if (currentTheme === "dark") {
    if (lightMobile) lightMobile.style.display = "none";
    if (darkMobile) darkMobile.style.display = "block";
    if (lightPc) lightPc.style.display = "none";
    if (darkPc) darkPc.style.display = "block";
  } else {
    if (lightMobile) lightMobile.style.display = "block";
    if (darkMobile) darkMobile.style.display = "none";
    if (lightPc) lightPc.style.display = "block";
    if (darkPc) darkPc.style.display = "none";
  }
});

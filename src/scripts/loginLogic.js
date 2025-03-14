const firstName = document.getElementById("firstname");
const lastName = document.getElementById("lastname");
const submit = document.getElementById("submit");
const acc = document.getElementById("acc");
const changeBtn = document.getElementById("change");
let isRegister = true;

changeBtn.addEventListener("click", switcher);

function switcher() {
  if (isRegister) {
    firstName.style.display = "none";
    lastName.style.display = "none";
    submit.textContent = "Přihlásit se";
    acc.textContent = "Ještě nemáte účet?";
    changeBtn.textContent = "Registrovat";
  } else {
    firstName.style.display = "block";
    lastName.style.display = "block";
    submit.textContent = "Registrovat";
    acc.textContent = "Uč máte účet?";
    changeBtn.textContent = "Přihlásit se";
  }
  isRegister = !isRegister;
}

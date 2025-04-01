// Funkce pro odhlášení
async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      return;
    }

    // Po úspěšném odhlášení přesměrujeme uživatele na přihlašovací stránku
    alert("Ůspešně odhlášeno");
    window.location.href = "login.html"; // Přesměrování na domovskou stránku
  } catch (error) {
    alert(error);
  }
}

const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", logout);
const logoutBtn2 = document.getElementById("logoutBig");
logoutBtn2.addEventListener("click", logout);

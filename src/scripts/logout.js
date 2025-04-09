const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

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

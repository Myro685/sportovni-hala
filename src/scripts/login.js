// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

// Výběr elementů
const form = document.querySelector("form");
const firstName = document.getElementById("firstname");
const lastName = document.getElementById("lastname");
const email = document.getElementById("email");
const password = document.getElementById("password");
const submit = document.getElementById("submit");
const acc = document.getElementById("acc");
const changeBtn = document.getElementById("change");
const teamLabel = document.getElementById("team-label");
const team = document.getElementById("team-select");
let isRegister = true;

async function fetchTeams() {
  const { data, error } = await supabaseClient.from("Tym").select("*");

  if (error) {
    console.error("Chyba při načítání týmů:", error);
    return;
  }

  console.log("📌 Načtené týmy:", data);

  // Vypsání týmů do <select>
  const teamSelect = document.getElementById("team-select");
  if (!teamSelect) {
    console.error("Element s ID 'team-select' nebyl nalezen!");
    return;
  }

  // Zachování placeholderu a přidání týmů
  data.forEach((tym) => {
    const option = document.createElement("option");
    option.value = tym.TymID; // Nastavení hodnoty na TymID
    option.textContent = `${tym.Nazevtymu}`;
    teamSelect.appendChild(option);
  });
}

// ✅ Spuštění funkce po načtení stránky
document.addEventListener("DOMContentLoaded", fetchTeams);

// Kontrola, zda je uživatel už přihlášen
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (session) {
    // Pokud je už přihlášen, přesměruj na index.html
    window.location.href = "../pages/index.html";
  }
});

// Přepínání mezi registrací a přihlášením
changeBtn.addEventListener("click", switcher);

function switcher() {
  if (isRegister) {
    firstName.style.display = "none";
    lastName.style.display = "none";
    teamLabel.style.display = "none";
    team.style.display = "none";
    submit.textContent = "Přihlásit se";
    acc.textContent = "Ještě nemáte účet?";
    changeBtn.textContent = "Registrovat";
  } else {
    firstName.style.display = "block";
    lastName.style.display = "block";
    teamLabel.style.display = "block";
    team.style.display = "block";
    submit.textContent = "Registrovat";
    acc.textContent = "Už máte účet?";
    changeBtn.textContent = "Přihlásit se";
  }
  isRegister = !isRegister;
  form.reset();
}

// Logika odeslání formuláře
submit.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    if (isRegister) {
      // Registrace
      const { data, error } = await supabaseClient.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            first_name: firstName.value,
            last_name: lastName.value,
          },
        },
      });

      if (error) {
        console.error("Chyba při registraci:", error.message);
        alert("Registrace selhala: " + error.message);
        return;
      }

      // Vložení uživatele do tabulky Uzivatel
      const { error: insertError } = await supabaseClient
        .from("Uzivatel")
        .insert({
          Email: email.value,
          Jmeno: firstName.value,
          Prijmeni: lastName.value,
          Telefon: null, // Můžeš přidat input pro telefon
          AdresaID: null, // Nahraď dynamickou hodnotou nebo vytvoř adresu
          RoleuzivateluID: 3, // Nahraď dynamickou hodnotou (např. defaultní role)
          TymID: 3, // Nahraď dynamickou hodnotou (např. výběr týmu)
        });

      if (insertError) {
        console.error("Chyba při ukládání dat:", insertError.message);
        alert("Chyba při ukládání dat: " + insertError.message);
        return;
      }

      alert("Registrace úspěšná! Zkontrolujte svůj email pro potvrzení.");
      // Po registraci přepni na přihlášení, aby se uživatel mohl přihlásit
      switcher();
    } else {
      // Přihlášení
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });

      if (error) {
        console.error("Chyba při přihlášení:", error.message);
        alert("Přihlášení selhalo: " + error.message);
        return;
      }

      alert("Úspěšně přihlášen!");
      window.location.href = "../pages/index.html";
    }

    form.reset();
  } catch (error) {
    console.error("Chyba:", error.message);
    alert("Chyba: " + error.message);
  }
});

// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

const ROLE_ADMIN = 1;
const ROLE_TRAINER = 2;
const ROLE_PLAYER = 3;

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

// Funkce pro validaci hesla
function validatePassword(password) {
  // Minimální délka
  if (password.length < 8) {
    return "Heslo musí mít alespoň 8 znaků.";
  }

  // Kontrola kombinace znaků
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
    return "Heslo musí obsahovat velké písmeno, malé písmeno, číslici a speciální znak.";
  }

  // Žádné běžné vzorce
  const commonPasswords = ["password123", "12345678", "qwerty"];
  if (commonPasswords.includes(password.toLowerCase())) {
    return "Toto heslo je příliš běžné, zvolte jiné.";
  }

  return null; // Heslo je v pořádku
}

async function fetchTeams() {
  const { data, error } = await supabaseClient.from("Tym").select("*");

  if (error) {
    return;
  }

  data.forEach((tym) => {
    const option = document.createElement("option");
    option.value = tym.TymID;
    option.textContent = `${tym.Nazevtymu}`;
    team.appendChild(option);
  });
}

// Spuštění funkce po načtení stránky
document.addEventListener("DOMContentLoaded", fetchTeams);

// Kontrola, zda je uživatel už přihlášen
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (session) {
    console.log(session.user.email);

    await getUserData(session.user.email);
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
      // Kontrola hesla při registraci
      const passwordError = validatePassword(password.value);
      if (passwordError) {
        alert(passwordError);
        return;
      }

      const teamSelected = team.value;

      // 1. Nejprve provedeme databázovou operaci (transakci)
      const { error: dbError } = await supabaseClient.rpc("register_user", {
        p_email: email.value,
        p_jmeno: firstName.value,
        p_prijmeni: lastName.value,
        p_tym_id: parseInt(teamSelected),
      });

      if (dbError) {
        alert("Chyba při ukládání dat do databáze: " + dbError.message);
        return;
      }

      // 2. Pokud databázová operace proběhla úspěšně, provedeme registraci v Supabase Auth
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
        // Pokud selže registrace v Auth, musíme smazat záznam z tabulky Uzivatel (rollback)
        const { error: deleteError } = await supabaseClient
          .from("Uzivatel")
          .delete()
          .eq("Email", email.value);

        if (deleteError) {
          alert("Chyba při rušení registrace: " + deleteError.message);
        }

        alert("Registrace selhala: " + error.message);
        return;
      }

      alert("Registrace úspěšná!");
      window.location.href = "../pages/index.html";
    } else {
      // Přihlášení (bez změn)
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });

      if (error) {
        alert("Přihlášení selhala: " + error.message);
        return;
      } else {
        await getUserData(data.user.email);
        alert("Úspěšně přihlášen!");
        window.location.href = "../pages/index.html";
      }
    }

    form.reset();
  } catch (error) {
    alert("Chyba: " + error.message);
  }
});

async function getUserData(email) {
  const { data: userData, error: userError } = await supabaseClient
    .from("Uzivatel")
    .select("RoleuzivateluID, UzivatelID, TymID")
    .eq("Email", email)
    .single();

  if (userError) {
    alert("Chyba při načítani dat " + userError.message);
    console.error(userError.message);

    return null;
  }

  localStorage.setItem("userData", JSON.stringify(userData));
  console.log("Uloženo do localStorage:", userData);
  return userData;
}

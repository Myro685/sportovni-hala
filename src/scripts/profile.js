// Inicializace Supabase
const supabaseClient = window.supabase.createClient(
  "https://xpxurtdkmufuemamajzl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU"
);

// Načtení dat
document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const email = document.getElementById("email");
  const number = document.getElementById("number");
  const team = document.getElementById("team");
  const city = document.getElementById("city");
  const psc = document.getElementById("psc");
  const street = document.getElementById("street");
  const cp = document.getElementById("cp");
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editNumber = document.getElementById("editNumber");
  const editCity = document.getElementById("editCity");
  const editPsc = document.getElementById("editPsc");
  const editStreet = document.getElementById("editStreet");
  const editCp = document.getElementById("editCp");
  const profilePicture = document.querySelectorAll(".profile-picture");

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      alert("Uživatel není přihlášen!");
      window.location.href = "../pages/login.html";
      return;
    }

    const userEmail = session.user.email;

    // Načtení dat uživatele pomocí funkce get_user_profile
    const { data: userData, error: userError } = await supabaseClient.rpc(
      "get_user_profile",
      { p_email: userEmail }
    );

    if (userError) {
      alert("Chyba při načítání uživatelských dat: " + userError.message);
      return;
    }

    const profile = userData[0]; // Funkce vrací tabulku, vezmeme první řádek

    firstName.value = profile.jmeno || "Není zadáno";
    lastName.value = profile.prijmeni || "Není zadáno";
    email.value = profile.email || "Není zadáno";
    number.value = profile.telefon || "Není zadáno";
    team.value = profile.tym_nazev;
    city.value = profile.nazevmesta;
    psc.value = profile.psc;
    street.value = profile.ulice;
    cp.value = profile.cp;

    const defaultImage = "../assets/basic-profile.png";
    let profilePictureUrl = profile.profile_picture_url || defaultImage;
    if (profile.profile_picture_url) {
      const timestamp = new Date().getTime();
      profilePictureUrl = `${profile.profile_picture_url}?t=${timestamp}`;
    }
    console.log("Nastavovaná URL pro obrázek:", profilePictureUrl);
    profilePicture.forEach((img) => {
      img.src = profilePictureUrl;
    });

    editFirstName.value = profile.jmeno || "";
    editLastName.value = profile.prijmeni || "";
    editNumber.value = profile.telefon || "";
    editCity.value = profile.nazevmesta || "";
    editPsc.value = profile.psc || "";
    editStreet.value = profile.ulice || "";
    editCp.value = profile.cp || "";
  } catch (error) {
    alert("Chyba: " + error.message);
  }
}

// Modal
const openButton = document.getElementById("openModal");
const closeButton = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const editForm = document.querySelector("#modal form");

openButton.addEventListener("click", () => {
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
});

closeButton.addEventListener("click", () => {
  modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const number = document.getElementById("number");
  const city = document.getElementById("city");
  const psc = document.getElementById("psc");
  const street = document.getElementById("street");
  const cp = document.getElementById("cp");
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editNumber = document.getElementById("editNumber");
  const editCity = document.getElementById("editCity");
  const editPsc = document.getElementById("editPsc");
  const editStreet = document.getElementById("editStreet");
  const editCp = document.getElementById("editCp");
  const editProfilePicture = document.getElementById("editProfilePicture");
  const modalForm = document.getElementById("modalForm");
  const profilePicture = document.querySelectorAll(".profile-picture");

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const userEmail = session.user.email;

    const { data: userData, error: fetchError } = await supabaseClient
      .from("Uzivatel")
      .select("UzivatelID")
      .eq("Email", userEmail)
      .single();

    if (fetchError) {
      alert("Chyba při načítání dat uživatele: " + fetchError.message);
      return;
    }

    // Nahrávání nového obrázku, pokud byl vybrán
    let profilePictureUrl = null;
    if (editProfilePicture.files && editProfilePicture.files[0]) {
      profilePictureUrl = await uploadProfilePicture(
        editProfilePicture.files[0],
        userData.UzivatelID
      );
      if (profilePictureUrl) {
        const success = await updateUserProfilePicture(
          userData.UzivatelID,
          profilePictureUrl
        );
        if (success) {
          const timestamp = new Date().getTime();
          const cacheBustedUrl = `${profilePictureUrl}?t=${timestamp}`;
          profilePicture.forEach((img) => {
            img.src = cacheBustedUrl;
          });
        } else {
          alert("Nepodařilo se aktualizovat URL obrázku v databázi.");
          return;
        }
      } else {
        alert("Nepodařilo se nahrát obrázek.");
        return;
      }
    }

    // Převod hodnot PSC a CP na integer, nebo NULL pokud jsou prázdné
    const pscValue = editPsc.value ? parseInt(editPsc.value) : null;
    const cpValue = editCp.value ? parseInt(editCp.value) : null;

    // Kontrola, zda jsou hodnoty platné
    if (editPsc.value && (isNaN(pscValue) || pscValue < 0)) {
      alert("PSČ musí být platné číslo!");
      return;
    }
    if (editCp.value && (isNaN(cpValue) || cpValue < 0)) {
      alert("Číslo popisné musí být platné číslo!");
      return;
    }

    // Aktualizace profilu pomocí funkce update_user_profile
    const { error: updateError } = await supabaseClient.rpc(
      "update_user_profile",
      {
        p_email: userEmail,
        p_jmeno: editFirstName.value,
        p_prijmeni: editLastName.value,
        p_telefon: editNumber.value,
        p_nazevmesta: editCity.value,
        p_psc: pscValue, // Nyní integer nebo null
        p_ulice: editStreet.value,
        p_cp: cpValue, // Nyní integer nebo null
      }
    );

    if (updateError) {
      alert("Chyba při aktualizaci profilu: " + updateError.message);
      return;
    }

    // Aktualizace zobrazených hodnot
    firstName.value = editFirstName.value || "Není zadáno";
    lastName.value = editLastName.value || "Není zadáno";
    number.value = editNumber.value || "Není zadáno";
    city.value = editCity.value || "Není zadáno";
    psc.value = editPsc.value || "Není zadáno";
    street.value = editStreet.value || "Není zadáno";
    cp.value = editCp.value || "Není zadáno";

    modal.classList.add("hidden");
    modalForm.reset();
    alert("Profil byl úspěšně aktualizován!");
  } catch (error) {
    alert("Chyba: " + error.message);
  }
});

// Funkce pro nahrávání obrázku
async function uploadProfilePicture(file, userId) {
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB

  if (!allowedTypes.includes(file.type)) {
    alert("Prosím nahrajte obrázek ve formátu JPEG nebo PNG.");
    return null;
  }

  if (file.size > maxSizeInBytes) {
    alert("Obrázek je příliš velký. Maximální velikost je 5 MB.");
    return null;
  }

  const timestamp = new Date().getTime();
  const fileName = `${userId}-profile-picture-${timestamp}.jpg`;

  const { data: existingFiles, error: listError } = await supabaseClient.storage
    .from("profile-pictures")
    .list("", { search: `${userId}-profile-picture` });

  if (listError) {
    console.error("Chyba při vyhledávání starých obrázků:", listError);
  } else if (existingFiles && existingFiles.length > 0) {
    const filesToRemove = existingFiles.map((file) => file.name);
    const { error: removeError } = await supabaseClient.storage
      .from("profile-pictures")
      .remove(filesToRemove);

    if (removeError) {
      console.error("Chyba při odstraňování starých obrázků:", removeError);
    } else {
      console.log("Staré obrázky úspěšně odstraněny:", filesToRemove);
    }
  }

  const { data, error } = await supabaseClient.storage
    .from("profile-pictures")
    .upload(fileName, file, {
      upsert: true,
    });

  if (error) {
    console.error("Chyba při nahrávání obrázku:", error);
    return null;
  }

  const { publicUrl } = supabaseClient.storage
    .from("profile-pictures")
    .getPublicUrl(fileName).data;

  console.log("Veřejná URL nového obrázku:", publicUrl);
  return publicUrl;
}

// Funkce pro aktualizaci URL obrázku v databázi
async function updateUserProfilePicture(userId, pictureUrl) {
  const { data, error } = await supabaseClient
    .from("Uzivatel")
    .update({ profile_picture_url: pictureUrl })
    .eq("UzivatelID", userId);

  if (error) {
    console.error("Chyba při aktualizaci URL obrázku:", error);
    return false;
  }
  console.log("URL úspěšně aktualizována v databázi:", pictureUrl);
  return true;
}

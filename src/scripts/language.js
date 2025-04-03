// Language translations
const translations = {
    en: {
      home: "Home",
      teams: "Teams",
      players: "Players",
      profile: "Profile",
      my_profile: "My Profile",
      first_name: "First Name:",
      last_name: "Last Name:",
      email: "Email:",
      phone: "Phone:",
      team_member: "Team Member:",
      city: "City:",
      zip: "ZIP Code:",
      street: "Street:",
      house_number: "House Number:",
      edit_profile: "Edit Profile",
      address: "Address",
      edit: "Edit",
      // Index.html
      details: "Details",
      // Players.html
      player_list: "Player List",
      search_players: "Search for a player or team...",
      // Login.html
      hall: "Hall",
      password: "Password",
      register: "Register",
      have_account: "Already have an account?",
      login: "Log In",
      select_team: "Select Team",
      // Teams.html
      team_list: "Team List",
      search_team: "Search for a team...",
      add_team: "Add Team",
      new_team_name: "New team name...",
      // Training.html
      will_you_come: "Will you come?",
      yes: "Yes",
      no: "No",
      coach: "Coach:",
      activity: "Activity:",
      start: "Start:",
      end: "End:",
      search_players: "Search for a player or team...",
      new_team_name: "New team name...",
      search_team: "Search for a team...",
      time: "Time:",
      reserve_system: "Reservation System",
      training: "Training",
    },
    cs: {
      home: "Domů",
      teams: "Týmy",
      players: "Hráči",
      profile: "Profil",
      my_profile: "Můj Profil",
      first_name: "Jméno:",
      last_name: "Příjmení:",
      email: "E-mail:",
      phone: "Telefon:",
      team_member: "Člen týmu:",
      city: "Město:",
      zip: "PSČ:",
      street: "Ulice:",
      house_number: "Číslo popisné:",
      edit_profile: "Upravit profil",
      address: "Adresa",
      edit: "Upravit",
      // Index.html
      details: "Podrobnosti",
      // Players.html
      player_list: "Seznam hráčů",
      search_players: "Vyhledat hráče nebo tým...",
      // Login.html
      hall: "Hala",
      password: "Heslo",
      register: "Registrovat",
      have_account: "Už máte účet?",
      login: "Přihlásit se",
      select_team: "Vyberte tým",
      // Teams.html
      team_list: "Seznam týmů",
      search_team: "Vyhledat tým...",
      add_team: "Přidat tým",
      new_team_name: "Název nového týmu...",
      // Training.html
      will_you_come: "Přijdeš?",
      yes: "Ano",
      no: "Ne",
      coach: "Trenér:",
      activity: "Aktivita:",
      start: "Začátek:",
      end: "Konec:",
      search_players: "Vyhledat hráče nebo tým...",
      new_team_name: "Název nového týmu...",
      search_team: "Vyhledat tým...",
      time: "Čas:",
      reserve_system: "Rezervační systém",
      training: "Trénink",
    },
    de: {
      home: "Zuhause",
      teams: "Teams",
      players: "Spieler",
      profile: "Profil",
      my_profile: "Mein Profil",
      first_name: "Vorname:",
      last_name: "Nachname:",
      email: "E-Mail:",
      phone: "Telefon:",
      team_member: "Teammitglied:",
      city: "Stadt:",
      zip: "PLZ:",
      street: "Straße:",
      house_number: "Hausnummer:",
      edit_profile: "Profil bearbeiten",
      address: "Adresse",
      edit: "Bearbeiten",
      // Index.html
      details: "Details",
      // Players.html
      player_list: "Spielerliste",
      search_players: "Spieler oder Team suchen...",
      // Login.html
      hall: "Halle",
      password: "Passwort",
      register: "Registrieren",
      have_account: "Haben Sie schon ein Konto?",
      login: "Einloggen",
      select_team: "Team auswählen",
      // Teams.html
      team_list: "Teamliste",
      search_team: "Team suchen...",
      add_team: "Team hinzufügen",
      new_team_name: "Neuer Teamname...",
      // Training.html
      will_you_come: "Kommst du?",
      yes: "Ja",
      no: "Nein",
      coach: "Trainer:",
      activity: "Aktivität:",
      start: "Start:",
      end: "Ende:",
      search_players: "Spieler oder Team suchen...",
      new_team_name: "Neuer Teamname...",
      search_team: "Team suchen...",
      time: "Zeit:",
      reserve_system: "Reservierungssystem",
      training: "Training",
    }
  };
  
  // Function to change language
  function changeLanguage(lang) {
    document.documentElement.lang = lang;
    
    document.querySelectorAll('[data-lang-key]').forEach(element => {
      const key = element.getAttribute('data-lang-key');
      if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
        element.setAttribute('placeholder', translations[lang][key]);
      } else {
        // Jinak aktualizujeme textový obsah
        element.textContent = translations[lang][key];
      }
    });

    document.querySelectorAll('.language-btn').forEach(button => {
    button.classList.remove('ring-2', 'ring-cyan-500', 'p-1');
  });

    localStorage.setItem('preferredLanguage', lang); // Save preference
  }
  
  // Inicializace po načtení stránky
  document.addEventListener('DOMContentLoaded', () => {
    // Přidání event listenerů na tlačítka
    document.querySelectorAll('.language-btn').forEach(button => {
      button.addEventListener('click', () => {
        const lang = button.getAttribute('data-lang');
        changeLanguage(lang);
      });
    });
  
    // Načtení uloženého jazyka nebo výchozího "cs"
    const savedLang = localStorage.getItem('preferredLanguage') || 'cs';
    changeLanguage(savedLang);
  });
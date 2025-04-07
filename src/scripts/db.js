
const supabaseClient = window.supabase.createClient('https://xpxurtdkmufuemamajzl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHVydGRrbXVmdWVtYW1hanpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTk3MzksImV4cCI6MjA1NzUzNTczOX0.uRPj22s06XSTvuuHGz-7oAqfTRp2LqUFTCKxC8QprMU' );

let currentUserId = null;
let currentUserData = null; 
let currentTymID = null;

async function getUserData(userId) {
    const { data: userData, error: userError } = await supabaseClient
    .from("Uzivatel")
    .select("RoleuzivateluID, UzivatelID, TymID, Email")
    .eq("UzivatelID", userId)
    .single();
    if (userError) {
    alert("Chyba při načítání role uživatele: " + userError.message);
    return;
    }
    return userData;        
}

async function updateAttendance(currentUserId, attendance) {
    
    const { error } = await supabaseClient
    .from("Seznamprihlasenychrezervacihracu")
    .update({Stavprihlaseni: attendance})
    .select("Stavprihlaseni")
    .eq("UzivatelID", currentUserId );

    if (error) {
        console.error("problem s updatovanim dochazky v db: "+ error.message);
        return; 
    }
    return;
}

async function checkUserRole() {
    try {
        const {
        data: { session },
        error: sessionError,
        } = await supabaseClient.auth.getSession();
    
        if (sessionError || !session) {
        alert("Uživatel není přihlášen!");
        return;
        } 
    
        const userEmail = session.user.email;
        
        //getUserData(currentUserId);
        const { data: userData, error: userError } = await supabaseClient
        .from("Uzivatel")
        .select("RoleuzivateluID, UzivatelID, TymID")
        .eq("Email", userEmail)
        .single();
    
        
    
        currentUserData = userData;
        currentUserId = userData.UzivatelID;
        
        
        currentTymID = userData.TymID;
    
        
        } catch (error) {
        alert("Chyba: " + error.message);
        }
        
    }

export {updateAttendance, supabaseClient, checkUserRole};
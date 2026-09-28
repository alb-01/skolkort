const SUPABASE_URL = "https://kuucfiejtuzeaomwboiy.supabase.co";
const SUPABASE_KEY = "sb_publishable_wVhZoiKNe0aloDmkylBFZg_WHfnDOd9";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Globala variabler
let countdownTimer = null;
let currentStudent = null; // Spara den inloggade elevens data i minnet

// ========================================
// ELEMENT-REFERENSER
// ========================================
const loginPage = document.getElementById("loginPage");
const cardPage = document.getElementById("cardPage");

const loginForm = document.getElementById("loginForm");
const studentIdInput = document.getElementById("studentId");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

const studentName = document.getElementById("studentName");
const displayStudentId = document.getElementById("displayStudentId");
const cardId = document.getElementById("cardId");
const authorizationStatus = document.getElementById("authorizationStatus");

const useCardButton = document.getElementById("useCardButton");
const accessMessage = document.getElementById("accessMessage");
const logoutButton = document.getElementById("logoutButton");

const qrContainer = document.getElementById("qrContainer");
const qrcodeElement = document.getElementById("qrcode");


// ========================================
// INLOGGNING MOT SUPABASE
// ========================================
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const enteredStudentId = studentIdInput.value.trim();
    const enteredPassword = passwordInput.value.trim();

    loginError.textContent = "Söker i databasen...";

    console.log("Söker i databasen efter:", { enteredStudentId, enteredPassword });

    // Leta efter eleven i Supabase-databasen
    const { data: student, error } = await supabaseClient
        .from("students")
        .select("*")
        .eq("student_id", enteredStudentId)
        .eq("password", enteredPassword)
        .maybeSingle();

    if (error) {
        console.error("Supabase databasfel:", error);
    }

    console.log("Mottagen elevdata:", student);

    // Felaktig inloggning eller databasfel
    if (error || !student) {
        loginError.textContent = "Fel Elev-ID eller lösenord.";
        return;
    }

    // Spara eleven och visa skolkortet
    currentStudent = student;
    loginError.textContent = "";
    showStudentCard(student);
});


// ========================================
// VISA ELEVENS KORT
// ========================================
function showStudentCard(student) {
    studentName.textContent = student.name;
    displayStudentId.textContent = student.student_id;
    cardId.textContent = student.card_id || student.card_i || "N/A";

    accessMessage.textContent = "";
    qrContainer.classList.add("hidden");
    qrcodeElement.innerHTML = "";

    if (student.authorized) {
        authorizationStatus.textContent = "✓ Behörig elev";
        authorizationStatus.parentElement.classList.remove("not-authorized");

        useCardButton.disabled = false;
        useCardButton.style.opacity = "1";
    } else {
        authorizationStatus.textContent = "✕ Ej behörig elev";
        authorizationStatus.parentElement.classList.add("not-authorized");

        useCardButton.disabled = true;
        useCardButton.style.opacity = "0.5";
    }

    loginPage.classList.add("hidden");
    cardPage.classList.remove("hidden");
}


// ========================================
// ANVÄND DIGITALT SKOLKORT (TIMER + QR)
// ========================================
useCardButton.addEventListener("click", function () {
    if (useCardButton.disabled || !currentStudent) {
        return;
    }

    // Stoppa eventuell aktiv timer
    clearInterval(countdownTimer);
    qrcodeElement.innerHTML = "";

    // Generera den fullständiga länken för GitHub Pages / Localhost
    const baseUrl = window.location.origin + window.location.pathname;
    const qrData = `${baseUrl}?student_id=${encodeURIComponent(currentStudent.student_id)}`;

    console.log("Genererar QR-kod för ESP32:", qrData);

    // Skapa QR-koden som en bild via QR Server API (ecc=M ger glesa/lättlästa rutor)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${encodeURIComponent(qrData)}`;

    // Sätt in bilden direkt i HTML-elementet
    qrcodeElement.innerHTML = `<img src="${qrApiUrl}" alt="QR Kod" style="width: 180px; height: 180px; display: block; margin: 0 auto;" />`;

    qrContainer.classList.remove("hidden");

    let timeLeft = 30;
    useCardButton.disabled = true;
    useCardButton.style.opacity = "0.5";
    accessMessage.textContent = `✓ Skanna koden vid dörren (${timeLeft}s)`;

    // Starta nedräkningen
    countdownTimer = setInterval(function () {
        timeLeft--;

        if (timeLeft > 0) {
            accessMessage.textContent = `✓ Skanna koden vid dörren (${timeLeft}s)`;
        } else {
            clearInterval(countdownTimer);
            accessMessage.textContent = "✕ Tiden har gått ut. Tryck igen för ny kod.";
            qrContainer.classList.add("hidden");
            qrcodeElement.innerHTML = "";

            if (currentStudent && currentStudent.authorized) {
                useCardButton.disabled = false;
                useCardButton.style.opacity = "1";
            }
        }
    }, 1000);
});


// ========================================
// LOGGA UT
// ========================================
logoutButton.addEventListener("click", function () {
    clearInterval(countdownTimer);

    currentStudent = null; // Rensa sparad elev

    loginPage.classList.remove("hidden");
    cardPage.classList.add("hidden");

    loginForm.reset();

    studentName.textContent = "";
    displayStudentId.textContent = "";
    cardId.textContent = "";
    authorizationStatus.textContent = "";
    accessMessage.textContent = "";
    loginError.textContent = "";

    qrContainer.classList.add("hidden");
    qrcodeElement.innerHTML = "";

    authorizationStatus.parentElement.classList.remove("not-authorized");

    useCardButton.disabled = false;
    useCardButton.style.opacity = "1";

    studentIdInput.focus();
});
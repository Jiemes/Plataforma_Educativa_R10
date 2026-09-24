// Configuración de Firebase para Plataforma_R10
const firebaseConfig = {
    apiKey: "AIzaSyCf0uv7aAiPed1tvTQUIoiGihcf2r995JY",
    authDomain: "plataforma-cfp403.firebaseapp.com",
    projectId: "plataforma-cfp403",
    storageBucket: "plataforma-cfp403.appspot.com",
    messagingSenderId: "928403211415",
    appId: "1:928403211415:web:a14d53b2d7cc034c0695d2",
    measurementId: "G-95YDH60VRE"
};

// Detección dinámica y robusta de la plataforma en ejecución
(function() {
    const href = (window.location.href || '').toLowerCase();
    const hostname = (window.location.hostname || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase();

    // 1. Detección de CFP 403
    const isCfp = href.includes('cfp403') || href.includes('cfp-403') || href.includes('web-cfp403');

    // 2. Detección de Plataforma R10 Antigua
    // Se encuentra en jiemes.github.io/plataforma_r10 (sin "educativa") y no en entorno local de pruebas
    const isR10Legacy = !isCfp && (
        href.includes('jiemes.github.io/plataforma_r10') ||
        (pathname.includes('/plataforma_r10/') && !href.includes('educativa') && !hostname.includes('127.0.0.1') && !hostname.includes('localhost'))
    );

    // 3. Detección de Plataforma Educativa R10 (Nueva plataforma Ciclo 2026)
    // Se ejecuta en jiemes.github.io/plataforma_educativa_r10, o contiene "educativa", o en local
    let isEducativaR10 = false;
    if (isCfp) {
        isEducativaR10 = false;
    } else if (isR10Legacy) {
        isEducativaR10 = false;
    } else {
        isEducativaR10 = true;
    }

    window.IS_PLATAFORMA_EDUCATIVA_R10 = isEducativaR10;
    window.IS_PLATAFORMA_CFP403 = isCfp;
    window.IS_PLATAFORMA_R10_LEGACY = isR10Legacy;

    if (isEducativaR10) {
        window.PLATFORM_ID = 'EDUCATIVA_R10';
        window.PLATFORM_NAME = 'Plataforma Educativa R10';
    } else if (isCfp) {
        window.PLATFORM_ID = 'EDU';
        window.PLATFORM_NAME = 'Plataforma CFP 403';
    } else {
        window.PLATFORM_ID = 'R10';
        window.PLATFORM_NAME = 'Plataforma R10';
    }

    // Helper central para determinar si un curso es del ciclo 2026
    window.isCourse2026 = function(courseId, courseName) {
        const id = String(courseId || '').toLowerCase().trim();
        const name = String(courseName || '').toLowerCase().trim();
        return id.includes('2026') || name.includes('2026') || id === '3d2';
    };
})();

// Inicializar Firebase (Compatible con la versión compat/v9 que estamos usando en los scripts del HTML)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exportar servicios para usar en toda la app
window.db = firebase.firestore();
window.authFirebase = firebase.auth();
window.storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;


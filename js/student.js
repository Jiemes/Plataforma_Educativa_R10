// Mi Aula Virtual - Lógica del Alumno v9.18.12
let studentSession = JSON.parse(localStorage.getItem('user_session'));
let currentCourseId = '';
let currentViewState = 'home';

function cfpAlert(title, message) {
    const modal = document.getElementById('cfp-alert');
    if (!modal) return alert(message);
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    modal.classList.add('active');
}

function closeCfpAlert() {
    const modal = document.getElementById('cfp-alert');
    if (modal) modal.classList.remove('active');
}

if (!studentSession) { window.location.href = 'index.html'; }

function getCourseIcon(courseName) {
    const name = String(courseName || '').toUpperCase();

    // 1. Robótica y Automatización -> Brazo robótico
    if (name.includes('ROBÓTICA') || name.includes('ROBOTICA') || name.includes('AUTOMATIZACIÓN') || name.includes('AUTOMATIZACION')) {
        return '🦾';
    }

    // 2. Diseño y Fabricación Digital - 3D -> Impresora 3D
    if (name.includes('3D') || name.includes('FABRICACIÓN') || name.includes('FABRICACION') || name.includes('IMPRESIÓN') || name.includes('IMPRESION')) {
        return '🖨️';
    }

    // 3. Pensamiento Computacional / Inteligencia Artificial / IA -> Logo con las letras I.A.
    if (name.includes('PENSAMIENTO') || name.includes('INTELIGENCIA ARTIFICIAL') || name.includes('I.A.') || /\bIA\b/.test(name)) {
        return '<span class="icon-ia-logo">I.A.</span>';
    }

    // 4. Habilidades Digitales -> Computadora
    if (name.includes('HABILIDADES') || name.includes('COMPUTAD') || name.includes('OFIMÁT') || name.includes('OFIMAT')) {
        return '💻';
    }

    // 5. Software / Videojuegos / Programación -> Mando de videojuegos
    if (name.includes('PROGRAMACIÓN') || name.includes('PROGRAMACION') || name.includes('PROGRAMADOR') || name.includes('SOFTWARE') || name.includes('VIDEOJUEGO')) {
        return '🎮';
    }

    // 6. Diseño Gráfico / Publicidad / Marketing
    if (name.includes('DISEÑO') || name.includes('DISENO') || name.includes('MARKETING') || name.includes('PUBLICID')) {
        return '🎨';
    }

    // 7. Gastronomía / Cocinero / Pastas / Comedor
    if (name.includes('COCIN') || name.includes('PASTA') || name.includes('COMEDOR') || name.includes('GASTRONOM')) {
        return '🍳';
    }

    // 8. Idiomas / Inglés
    if (name.includes('INGLÉS') || name.includes('INGLES') || name.includes('IDIOMA')) {
        return '🌐';
    }

    // 9. Horticultura / Huerta / Jardinería / Agro
    if (name.includes('HORTICULT') || name.includes('HUERTA') || name.includes('JARDIN') || name.includes('AGRO')) {
        return '🌱';
    }

    // 10. Textil / Costura / Confección
    if (name.includes('TEXTIL') || name.includes('COSTURA') || name.includes('CONFECC') || name.includes('MODA')) {
        return '🧵';
    }

    // 11. Electricidad / Electrónica
    if (name.includes('ELECTRIC') || name.includes('ELECTRÓN') || name.includes('ELECTRON')) {
        return '⚡';
    }

    // Default: Computadora si dice digital, sino birrete académico
    if (name.includes('DIGITAL')) return '💻';
    return '🎓';
}

async function initStudentDashboard() {
    const homeName = document.getElementById('home-student-name');
    if (homeName) {
        const nombre = studentSession.nombre.split(',')[1] || studentSession.nombre.split(' ')[0];
        homeName.innerText = `¡Hola, ${nombre.trim()}!`;
    }

    const btnConfig = document.querySelector('.btn-config-main');
    if (btnConfig) btnConfig.classList.remove('hidden');

    const grid = document.getElementById('home-course-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="loader">Sincronizando tus promedios...</div>';

    let todasLasEntregas = [];
    try {
        const entregasSnap = await db.collection('entregas')
            .where('alumno_dni', '==', studentSession.dni)
            .where('estado', '==', 'Calificado')
            .get();
        todasLasEntregas = entregasSnap.docs.map(doc => doc.data());
    } catch (e) {
        console.warn("No se pudieron cargar los promedios:", e);
    }

    grid.innerHTML = '';
    
    if (studentSession.cursos && studentSession.cursos.length > 0) {
        studentSession.cursos.forEach(curso => {
            const entregasCurso = todasLasEntregas.filter(e => e.curso === curso.id);
            const total = entregasCurso.reduce((sum, e) => sum + parseFloat(e.nota || 0), 0);
            const prom = entregasCurso.length > 0 ? (total / entregasCurso.length).toFixed(1) : '---';

            const card = document.createElement('div');
            card.className = 'course-card animated-in';
            card.innerHTML = `
                <div class="course-icon">${getCourseIcon(curso.nombre)}</div>
                <h3 style="font-size:1.4rem; font-weight:800; margin-bottom:5px;">${curso.nombre}</h3>
                <div style="margin-bottom:15px;">
                    <span style="background:var(--primary-light); color:var(--primary-color); padding:4px 10px; border-radius:10px; font-weight:800; font-size:0.8rem;">
                        🎯 Promedio: ${prom}
                    </span>
                </div>
                <p style="font-size:0.9rem; color:#64748b; margin-bottom:20px;">Accede a tus materiales y realiza tus entregas.</p>
                <button class="btn-enter-course">INGRESAR AL CURSO</button>
            `;
            card.onclick = () => selectCourse(curso.id, curso.nombre);
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 20px; color:#64748b;">No tienes cursos inscritos aún. Revisa la vidriera abajo.</div>';
    }


    // AGREGAR CARD DE FORMACIÓN PROFESIONAL
    const fpCard = document.createElement('div');
    fpCard.className = 'course-card animated-in fp-special-card';
    fpCard.innerHTML = `
        <div class="course-icon" style="background:none;"><img src="assets/logo_fp.png" style="height:80px; width:auto; object-fit:contain;"></div>
        <h3 style="font-size:1.4rem; font-weight:800; margin-bottom:5px;">FORMACIÓN PROFESIONAL</h3>
        <div style="margin-bottom:15px;">
            <span style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:10px; font-weight:800; font-size:0.8rem;">
                🏛️ Institucional
            </span>
        </div>
        <p style="font-size:0.9rem; color:#64748b; margin-bottom:20px;">Conoce la historia y el impacto del trabajo bonaerense.</p>
        <button class="btn-enter-course" style="background:#0369a1;">VER INFORMACIÓN</button>
    `;
    fpCard.onclick = openFpView;
    grid.appendChild(fpCard);

    updateHeaderButton();
    loadAvailableCourses();
    checkOnboardingTour();
}

function checkOnboardingTour() {
    // Verificar si el usuario ya vio el tour en este dispositivo
    const hasSeenTour = localStorage.getItem('r10_tour_seen_' + studentSession.dni);
    if (!hasSeenTour) {
        setTimeout(() => {
            const modal = document.getElementById('tour-modal');
            if (modal) modal.classList.remove('hidden');
        }, 500); // Pequeño retraso para que cargue la UI
    }
}

function closeTour() {
    const modal = document.getElementById('tour-modal');
    if (modal) modal.classList.add('hidden');
    localStorage.setItem('r10_tour_seen_' + studentSession.dni, 'true');
}

async function loadAvailableCourses() {
    const gridAbiertos = document.getElementById('home-available-courses');
    if (!gridAbiertos) return;
    
    try {
        const snap = await db.collection('cursos')
            .where('platformId', '==', window.PLATFORM_ID || 'r10')
            .where('inscripcion_abierta', '==', true)
            .get();
            
        if (snap.empty) {
            gridAbiertos.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 20px; color:#64748b; font-size:0.9rem;">No hay cursos abiertos a inscripción en este momento.</div>';
            return;
        }

        gridAbiertos.innerHTML = '';
        let count = 0;
        snap.forEach(doc => {
            const c = doc.data();
            
            // Si el alumno ya está anotado en este curso, no lo mostramos en la vidriera
            if (studentSession.cursos && studentSession.cursos.find(sc => sc.id === doc.id)) return;
            
            count++;
            const card = document.createElement('div');
            card.className = 'course-card animated-in';
            card.style.border = '2px solid #00b9e8';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="course-icon" style="background:#e0f2fe;">${getCourseIcon(c.nombre)}</div>
                <h3 style="font-size:1.35rem; font-weight:800; margin:12px 0 8px 0; color:#0f172a; line-height:1.25;">${c.nombre}</h3>
                <div style="margin-bottom:20px;">
                    <span style="background:#e0f2fe; color:#0284c7; padding:5px 12px; border-radius:10px; font-weight:800; font-size:0.78rem; letter-spacing:0.5px;">
                        INSCRIPCIÓN ABIERTA
                    </span>
                </div>
                <button class="btn-enter-course" style="background:linear-gradient(135deg, #00b9e8, #0284c7); color:white; font-weight:800; border:none; box-shadow:0 4px 14px rgba(0, 185, 232, 0.35);">VER INFORMACIÓN E INSCRIBIRME</button>
            `;
            card.onclick = () => openCourseEnrollModal(doc.id, c.nombre, c.materia || '');
            gridAbiertos.appendChild(card);
        });
        
        if (count === 0) {
            gridAbiertos.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 20px; color:#64748b; font-size:0.9rem;">Ya estás inscripto en todos los cursos disponibles.</div>';
        }
        
    } catch (e) {
        console.error("Error cargando vidriera:", e);
        gridAbiertos.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:red;">Error cargando cursos.</div>';
    }
}

let currentPendingEnrollment = null;
let lastEnrolledCourse = null;

function escapeHtml(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

async function openCourseEnrollModal(courseId, courseName, courseMateria) {
    currentPendingEnrollment = { id: courseId, name: courseName, materia: courseMateria };
    
    const modal = document.getElementById('course-enroll-modal');
    if (!modal) return;

    document.getElementById('enroll-modal-title').innerText = courseName;
    const catEl = document.getElementById('enroll-modal-category');
    if (catEl) catEl.style.display = 'none';
    
    const container = document.getElementById('enroll-materials-container');
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 25px; color:#64748b;">
            <div class="spinner-premium" style="margin: 0 auto 10px auto;"></div>
            <p style="font-size:0.85rem; font-weight:600;">Cargando propuesta y programa del curso...</p>
        </div>
    `;

    const btnConfirm = document.getElementById('btn-confirm-enrollment');
    if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = '🚀 CONFIRMAR INSCRIPCIÓN AL CURSO';
    }

    modal.classList.remove('hidden');

    // Cargar documentos desde config_cursos
    let welcomeUrl = '';
    let syllabusUrl = '';
    try {
        let config = null;
        const configSnap = await db.collection('config_cursos').doc(courseId).get();
        if (configSnap.exists) {
            config = configSnap.data();
        } else if (courseMateria) {
            const fallbackSnap = await db.collection('config_cursos').doc(courseMateria).get();
            if (fallbackSnap.exists) config = fallbackSnap.data();
        }

        if (config) {
            const matInicio = (config.materiales && config.materiales.inicio) || (config.materials && config.materials.inicio) || {};
            welcomeUrl = matInicio.welcome || config.welcome_url || '';
            syllabusUrl = matInicio.syllabus || config.syllabus_url || '';
        }
    } catch (e) {
        console.warn("Error cargando materiales para modal de inscripción:", e);
    }

    // Renderizar tarjetas de Bienvenida y Programa
    container.innerHTML = `
        <div class="enroll-doc-card">
            <div class="enroll-doc-card-top">
                <div class="enroll-doc-icon">👋</div>
                <div class="enroll-doc-info">
                    <h4>Mensaje de Bienvenida</h4>
                    <p>Presentación docente, pautas de cursada y objetivos iniciales.</p>
                </div>
            </div>
            ${welcomeUrl ? `
                <button type="button" class="btn-doc-preview" onclick="openEnrollDocModal('${welcomeUrl}', 'Bienvenida - ${escapeHtml(courseName)}')">
                    📖 Leer Bienvenida
                </button>
            ` : `
                <span class="badge-pending">Disponible al iniciar</span>
            `}
        </div>

        <div class="enroll-doc-card">
            <div class="enroll-doc-card-top">
                <div class="enroll-doc-icon">📋</div>
                <div class="enroll-doc-info">
                    <h4>Programa Académico</h4>
                    <p>Contenidos temáticos, cronograma de actividades y competencias a adquirir.</p>
                </div>
            </div>
            ${syllabusUrl ? `
                <button type="button" class="btn-doc-preview" onclick="openEnrollDocModal('${syllabusUrl}', 'Programa - ${escapeHtml(courseName)}')">
                    📋 Ver Programa
                </button>
            ` : `
                <span class="badge-pending">Programa en elaboración</span>
            `}
        </div>
    `;
}

function closeCourseEnrollModal() {
    const modal = document.getElementById('course-enroll-modal');
    if (modal) modal.classList.add('hidden');
}

function openEnrollDocModal(url, title) {
    const modal = document.getElementById('enroll-doc-modal');
    const iframe = document.getElementById('enroll-doc-iframe');
    const titleEl = document.getElementById('enroll-doc-title');
    const extLink = document.getElementById('enroll-doc-external-link');
    const loader = document.getElementById('enroll-doc-loader');

    if (!modal || !iframe) return;

    if (titleEl) titleEl.innerText = title || "Documento Informativo";
    if (extLink) extLink.href = url;

    let finalUrl = url;
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/\/d\/(.+?)(\/|$)/) || url.match(/id=(.+?)(&|$)/);
        if (idMatch) finalUrl = `https://drive.google.com/file/d/${idMatch[1]}/preview?view=fitH`;
    }

    if (loader) loader.style.display = 'flex';
    iframe.onload = () => {
        if (loader) loader.style.display = 'none';
    };
    iframe.src = finalUrl;

    modal.classList.remove('hidden');
}

function closeEnrollDocModal() {
    const modal = document.getElementById('enroll-doc-modal');
    const iframe = document.getElementById('enroll-doc-iframe');
    if (iframe) iframe.src = 'about:blank';
    if (modal) modal.classList.add('hidden');
}

async function executeEnrollment() {
    if (!currentPendingEnrollment) return;
    const { id: courseId, name: courseName } = currentPendingEnrollment;

    const btn = document.getElementById('btn-confirm-enrollment');
    if (btn) {
        btn.innerText = '⏳ Procesando inscripción...';
        btn.disabled = true;
    }

    try {
        const userUid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
        const currentEmail = String((studentSession && studentSession.email) || '').trim().toLowerCase();
        let userData = null;
        
        // 1. Intentamos buscar en alumnos_registro por email (variaciones de casing)
        if (currentEmail) {
            let userDoc = await db.collection('alumnos_registro').where('email', '==', currentEmail).get();
            if (userDoc.empty) {
                userDoc = await db.collection('alumnos_registro').where('email', '==', currentEmail.toUpperCase()).get();
            }
            if (userDoc.empty && studentSession.email) {
                userDoc = await db.collection('alumnos_registro').where('email', '==', studentSession.email).get();
            }
            if (!userDoc.empty) {
                userData = userDoc.docs[0].data();
            }
        }
        
        // 2. Si no se encontró por email, buscar por UID de Firebase Auth
        if (!userData && userUid) {
            const uidDoc = await db.collection('alumnos_registro').doc(userUid).get();
            if (uidDoc.exists) userData = uidDoc.data();
        }
        
        // 3. Si no existe ficha previa, generarla automáticamente con los datos de sesión para nunca bloquear
        if (!userData) {
            userData = {
                full_name: (studentSession && studentSession.nombre) || currentEmail.split('@')[0].toUpperCase(),
                email: currentEmail,
                dni: String((studentSession && studentSession.dni) || '').trim(),
                rol: 'alumno'
            };
        }
        
        // 4. Determinar ID de documento seguro (GARANTIZADO QUE NUNCA SEA VACÍO)
        let studentDni = String(userData.dni || (studentSession && studentSession.dni) || '').trim();
        if (!studentDni) {
            studentDni = userUid || (currentEmail ? currentEmail.replace(/[^a-zA-Z0-9_-]/g, '_') : '') || ('alu_' + Date.now());
            userData.dni = studentDni;
            if (studentSession) studentSession.dni = studentDni;
        }

        if (!userData.full_name) {
            userData.full_name = (studentSession && studentSession.nombre) || currentEmail.split('@')[0].toUpperCase();
        }
        userData.email = currentEmail || userData.email || '';

        // 5. Guardar en la colección del curso (con docId válido garantizado)
        await db.collection('alumnos_' + courseId).doc(studentDni).set(userData, { merge: true });

        // 6. Guardar o sincronizar en alumnos_registro
        if (userUid) {
            try {
                await db.collection('alumnos_registro').doc(userUid).set(userData, { merge: true });
            } catch (syncErr) {
                console.warn("Aviso sincronizando alumnos_registro:", syncErr);
            }
        }
        
        // 7. Actualizar studentSession
        if (!studentSession.cursos) studentSession.cursos = [];
        const yaInscrito = studentSession.cursos.some(sc => sc.id === courseId);
        if (!yaInscrito) {
            studentSession.cursos.push({ id: courseId, nombre: courseName });
        }
        localStorage.setItem('user_session', JSON.stringify(studentSession));
        
        closeCourseEnrollModal();
        initStudentDashboard(); // Recargar la vista en segundo plano

        // Mostrar modal de éxito con botón para ingresar directamente al curso
        openEnrollSuccessModal(courseId, courseName);
        
    } catch (e) {
        console.error("Error en inscripción:", e);
        cfpAlert("ERROR", "Hubo un problema con la inscripción: " + e.message);
        if (btn) {
            btn.innerText = '🚀 CONFIRMAR INSCRIPCIÓN AL CURSO';
            btn.disabled = false;
        }
    }
}

function openEnrollSuccessModal(courseId, courseName) {
    lastEnrolledCourse = { id: courseId, name: courseName };
    const modal = document.getElementById('enroll-success-modal');
    const nameEl = document.getElementById('enroll-success-course-name');
    const iconEl = document.getElementById('enroll-success-course-icon');
    if (nameEl) nameEl.innerText = courseName;
    if (iconEl) iconEl.innerHTML = getCourseIcon(courseName);
    if (modal) modal.classList.remove('hidden');
}

function closeEnrollSuccessModal() {
    const modal = document.getElementById('enroll-success-modal');
    if (modal) modal.classList.add('hidden');
}

function enterEnrolledCourse() {
    if (!lastEnrolledCourse) return;
    const { id: courseId, name: courseName } = lastEnrolledCourse;
    closeEnrollSuccessModal();
    selectCourse(courseId, courseName);
}

function updateHeaderButton() {
    const btn = document.getElementById('btn-header-action');
    if (!btn) return;

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    if (currentViewState === 'home') {
        newBtn.innerText = 'Salir';
        newBtn.onclick = () => {
            localStorage.removeItem('user_session');
            window.location.href = 'index.html';
        };
    } else if (currentViewState === 'course' || currentViewState === 'fp') {
        newBtn.innerText = 'Inicio';
        newBtn.onclick = backToHome;
    } else if (currentViewState === 'viewer') {
        newBtn.innerText = 'Volver';
        newBtn.onclick = closeViewer;
    }
}

function openFpView() {
    currentViewState = 'fp';
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('fp-view').classList.remove('hidden');
    
    const btnConfig = document.querySelector('.btn-config-main');
    if (btnConfig) btnConfig.classList.add('hidden');

    updateHeaderButton();
}

function selectCourse(courseId, courseName) {
    currentCourseId = courseId;
    currentViewState = 'course';

    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('course-view').classList.remove('hidden');
    
    const titleEl = document.getElementById('course-title');
    if (titleEl) {
        titleEl.innerHTML = `<span style="margin-right:10px; display:inline-flex; align-items:center; vertical-align:middle;">${getCourseIcon(courseName)}</span>${courseName}`;
    }

    const btnConfig = document.querySelector('.btn-config-main');
    if (btnConfig) btnConfig.classList.add('hidden');

    closeAllModals();
    updateHeaderButton();
    loadContent();
}

function backToHome() {
    currentCourseId = '';
    currentViewState = 'home';

    document.getElementById('course-view').classList.add('hidden');
    document.getElementById('fp-view').classList.add('hidden');
    document.getElementById('home-view').classList.remove('hidden');

    const btnConfig = document.querySelector('.btn-config-main');
    if (btnConfig) btnConfig.classList.remove('hidden');

    closeAllModals();
    updateHeaderButton();
}

function closeAllModals() {
    closeConfigModal();
    closeForo();
    closeCfpAlert();
    closeCourseEnrollModal();
    closeEnrollDocModal();
    closeEnrollSuccessModal();
}

async function loadContent() {
    try {
        const weeksContainer = document.getElementById('weeks-container');
        weeksContainer.innerHTML = '<div style="text-align:center; padding:30px;"><p style="font-size:0.9rem; color:#64748b;">⌛ Sincronizando contenidos...</p></div>';

        const configSnap = await db.collection('config_cursos').doc(currentCourseId).get();
        if (!configSnap.exists) return;

        const config = configSnap.data();
        let materiales = config.materiales || config.materials || {};

        const entregasSnap = await db.collection('entregas')
            .where('alumno_dni', '==', studentSession.dni)
            .where('curso', '==', currentCourseId)
            .get();

        // Deduplicar por semana para que el alumno siempre visualice la última versión enviada
        const entregasMap = new Map();
        entregasSnap.docs.forEach(doc => {
            const data = doc.data();
            const match = String(data.semana || '').match(/\d+/);
            if (!match) return;
            const semNum = parseInt(match[0], 10);
            const rawTime = data.fecha_entrega || data.timestamp || data.fecha;
            const time = rawTime ? new Date(rawTime).getTime() || 0 : 0;
            if (!entregasMap.has(semNum) || time >= (entregasMap.get(semNum)._time || 0)) {
                entregasMap.set(semNum, { id: doc.id, ...data, _time: time, semana: semNum });
            }
        });
        const entregas = Array.from(entregasMap.values());

        weeksContainer.innerHTML = '';
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);

        const materialsKeys = Object.keys(materiales).filter(k => k.startsWith('sem_'));

        const calificados = entregas.filter(e => e.estado === 'Calificado');
        const totalPuntos = calificados.reduce((sum, e) => sum + parseFloat(e.nota || 0), 0);
        const promedioCurso = calificados.length > 0 ? (totalPuntos / calificados.length).toFixed(1) : '---';
        const progreso = materialsKeys.length > 0 ? Math.round((calificados.length / materialsKeys.length) * 100) : 0;

        const statsBanner = document.getElementById('course-stats-summary');
        if (statsBanner) {
            statsBanner.innerHTML = `
                <div class="stat-item">🎯 <strong>${promedioCurso}</strong></div>
                <div class="stat-item">📈 <strong>${progreso}%</strong></div>
                <button class="btn-foro-banner" onclick="openForo()">💬 MURO DE CONSULTAS</button>
            `;
        }

        let weeksKeys = Object.keys(materiales)
            .filter(k => k.startsWith('sem_'))
            .map(k => parseInt(k.replace('sem_', '')))
            .sort((a, b) => b - a);

        weeksKeys.forEach(i => {
            const mat = materiales[`sem_${i}`] || {};
            const fechaLibStr = mat.fecha;
            if (!fechaLibStr) return;
            const fechaLib = new Date(fechaLibStr + "T00:00:00");
            if (hoy < fechaLib) return;

            const entrega = entregas.find(e => e.semana === i);
            const card = document.createElement('div');
            card.className = `week-card`;
            card.innerHTML = `
                <div class="week-header" onclick="this.parentElement.classList.toggle('opened')">
                    <h3>Semana ${i} ${entrega ? '✅' : '⌛'}</h3>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="week-body">
                    ${mat.clase ? `
                        <div class="content-item" onclick="visualizePdf('${mat.clase}', 'Clase ${i}', this)">
                            <span class="icon">📖</span>
                            <div class="item-info"><strong>Clase ${i}</strong><p>Material de estudio</p></div>
                        </div>
                    ` : ''}
                    ${mat.actividad ? `
                        <div class="content-item" onclick="visualizePdf('${mat.actividad}', 'Actividad ${i}', this)">
                            <span class="icon">🛠️</span>
                            <div class="item-info"><strong>Actividad ${i}</strong><p>Consigna práctica</p></div>
                        </div>
                    ` : ''}
                    
                    <div class="assignment-container">
                        <div class="status-label ${entrega ? 'status-sent' : 'status-pending'}">
                            ${entrega ? (entrega.estado === 'Calificado' ? '✅ Calificada' : '✅ Actividad Enviada') : '⌛ Entrega Pendiente'}
                        </div>

                        ${entrega && entrega.estado === 'Calificado' ? `
                            <div class="grade-badge-premium">NOTA: ${entrega.nota} / 100</div>
                            ${entrega.devolucion ? `<div class="feedback-bubble">${entrega.devolucion}</div>` : ''}
                        ` : ''}
                        
                        <div class="input-group">
                            <label for="link-${i}">Pega aquí el link de Drive con tu actividad: <span id="status-icon-${i}"></span></label>
                            <input type="text" id="link-${i}" class="input-premium-task link-input-validate" 
                                   data-semana="${i}"
                                   oninput="validateLinkLive(${i}, this.value)"
                                   placeholder="https://drive.google.com/..." 
                                   value="${entrega ? (entrega.archivo_url || '') : ''}">
                        </div>

                        <div id="validation-banner-${i}" class="validation-banner-task hidden"></div>

                        <div class="help-text-task">
                            <p>💡 <strong>Ayuda:</strong> Sube tu archivo a Google Drive, asegúrate de que el acceso sea público y pega el link aquí.</p>
                        </div>

                        <button id="btn-submit-${i}" 
                                class="btn-submit-task" 
                                onclick="submitTask(${i})"
                                ${entrega && entrega.archivo_url ? '' : 'disabled'}
                        >
                            ${entrega ? 'ACTUALIZAR ACTIVIDAD' : 'ENVIAR ACTIVIDAD'}
                        </button>
                    </div>
                </div>
            `;
            weeksContainer.appendChild(card);
        });

        const matInicio = materiales['inicio'] || {};
        const welcomeUrl = matInicio.welcome || config.welcome_url;
        const syllabusUrl = matInicio.syllabus || config.syllabus_url;

        if (welcomeUrl || syllabusUrl) {
            const introCard = document.createElement('div');
            introCard.className = 'week-card';
            introCard.innerHTML = `
                <div class="week-header" onclick="this.parentElement.classList.toggle('opened')">
                    <h3>📚 Bienvenida y Programa</h3>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="week-body">
                    ${welcomeUrl ? `
                        <div class="content-item" onclick="visualizePdf('${welcomeUrl}', 'Bienvenida', this)">
                            <span class="icon">👋</span>
                            <div class="item-info"><strong>Mensaje Inicial</strong><p>Lectura de bienvenida</p></div>
                        </div>
                    ` : ''}
                    ${syllabusUrl ? `
                        <div class="content-item" onclick="visualizePdf('${syllabusUrl}', 'Programa Académico', this)">
                            <span class="icon">📋</span>
                            <div class="item-info"><strong>Programa</strong><p>Contenidos del curso</p></div>
                        </div>
                    ` : ''}
                </div>
            `;
            weeksContainer.appendChild(introCard);
        }

    } catch (e) { console.error(e); }
}

function visualizePdf(url, title, element) {
    if (!url) return cfpAlert("AVISO", "Material no disponible.");

    currentViewState = 'viewer';
    updateHeaderButton();

    document.querySelectorAll('.content-item').forEach(el => el.classList.remove('active'));
    element?.classList.add('active');

    const container = document.getElementById('viewer-container');
    const viewer = document.getElementById('pdf-viewer');
    const loader = document.getElementById('pdf-loader');

    document.getElementById('course-view').classList.add('mode-viewer');

    container.classList.remove('hidden');
    viewer.style.visibility = "hidden";
    if (loader) loader.style.display = "block";

    let finalUrl = url;
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/\/d\/(.+?)(\/|$)/) || url.match(/id=(.+?)(&|$)/);
        if (idMatch) finalUrl = `https://drive.google.com/file/d/${idMatch[1]}/preview?view=fitH`;
    }

    viewer.onload = () => { if (loader) loader.style.display = "none"; viewer.style.visibility = "visible"; };
    viewer.src = finalUrl;

    const titleEl = document.getElementById('viewer-title-premium');
    if (titleEl) titleEl.innerText = title || "Vista de Documento";
}

function printPdf() {
    const viewer = document.getElementById('pdf-viewer');
    const url = viewer.src;

    if (!url || url === "about:blank") return;

    // Intentamos imprimir el iframe (puede fallar por cross-origin)
    try {
        viewer.contentWindow.print();
    } catch (e) {
        // Fallback: Abrir en pestaña nueva para imprimir (el navegador lo maneja nativamente)
        let printUrl = url;
        if (url.includes('drive.google.com')) {
            // Convertimos /preview en /view para asegurar opciones completas
            printUrl = url.replace('/preview', '/view');
        }
        window.open(printUrl, '_blank');
    }
}

function closeViewer() {
    currentViewState = 'course';
    updateHeaderButton();

    document.getElementById('course-view').classList.remove('mode-viewer');
    document.getElementById('viewer-container').classList.add('hidden');
    document.getElementById('pdf-viewer').src = "about:blank";
    document.querySelectorAll('.content-item').forEach(el => el.classList.remove('active'));
}

async function submitTask(semana) {
    const linkInput = document.getElementById(`link-${semana}`);
    const rawUrl = linkInput ? linkInput.value.trim() : '';

    if (!rawUrl) return cfpAlert("ATENCIÓN", "Por favor, pega el link de tu actividad.");
    if (!rawUrl.toLowerCase().includes('google.com')) return cfpAlert("ERROR", "El link debe pertenecer a Google. Por favor, verifica el enlace.");

    // VALIDACIÓN: Evitar carpetas
    if (rawUrl.includes('/folders/') || rawUrl.includes('folderview') || rawUrl.includes('/u/0/f')) {
        return cfpAlert(
            "❌ ERROR: HAS PEGADO UNA CARPETA", 
            "Estás intentando subir una CARPETA completa en lugar del archivo.\n\n👉 SOLUCIÓN:\n1. Entra a tu carpeta de Google Drive.\n2. Haz clic derecho sobre tu ARCHIVO específico (Doc, PPT, PDF).\n3. Selecciona 'Compartir' -> 'Copiar vínculo'.\n4. Borra el link anterior y pega el nuevo aquí."
        );
    }

    // BLOQUEO INMEDIATO DEL BOTÓN: Evita envíos múltiples si el alumno hace varios clics
    const btn = document.getElementById(`btn-submit-${semana}`);
    if (btn && btn.disabled) return;

    const originalBtnText = btn ? btn.innerText : 'ENVIAR ACTIVIDAD';
    if (btn) {
        btn.disabled = true;
        btn.innerText = '⏳ Enviando actividad...';
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
    }

    try {
        const studentDni = String(studentSession.dni || '').trim();
        const semInt = parseInt(String(semana).replace(/\D/g, ''), 10);
        // ID único determinístico por curso, semana y alumno: garantiza una sola versión en la base de datos
        const docId = `${currentCourseId}_sem_${semInt}_${studentDni}`.replace(/[^a-zA-Z0-9_-]/g, '_');

        const taskData = {
            alumno_dni: studentDni,
            alumno_nombre: studentSession.nombre,
            curso: currentCourseId,
            semana: semInt,
            archivo_url: rawUrl,
            fecha_entrega: new Date().toISOString(),
            estado: 'Pendiente',
            platformId: window.PLATFORM_ID || 'R10'
        };

        // 1. Guardar en el documento único (sobrescribe cualquier versión previa)
        await db.collection('entregas').doc(docId).set(taskData, { merge: true });

        // 2. Limpiar posibles duplicados antiguos que se hayan creado con IDs aleatorios
        try {
            const oldDuplicatesSnap = await db.collection('entregas')
                .where('alumno_dni', '==', studentDni)
                .where('curso', '==', currentCourseId)
                .get();

            if (!oldDuplicatesSnap.empty) {
                for (const d of oldDuplicatesSnap.docs) {
                    if (d.id === docId) continue;
                    const dData = d.data();
                    const dSem = parseInt(String(dData.semana || '').replace(/\D/g, ''), 10);
                    if (dSem === semInt) {
                        await d.ref.delete();
                    }
                }
            }
        } catch (cleanErr) {
            console.warn("Aviso limpiando duplicados anteriores:", cleanErr);
        }

        cfpAlert("ÉXITO", "🚀 ¡Actividad Enviada con éxito!");
        await loadContent(); // Recargar para habilitar el botón como 'ACTUALIZAR ACTIVIDAD'
    } catch (error) {
        console.error("Error al enviar actividad:", error);
        cfpAlert("ERROR", "Error al enviar: " + error.message);
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalBtnText;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    }
}

let foroUnsubscribe = null;
let replyToStudent = null;
let editingMsgId = null;

function openForo() {
    document.getElementById('foro-modal').classList.remove('hidden');
    loadForoStudent();
}

function closeForo() {
    document.getElementById('foro-modal').classList.add('hidden');
    if (foroUnsubscribe) foroUnsubscribe();
}

function loadForoStudent() {
    if (foroUnsubscribe) foroUnsubscribe();
    const container = document.getElementById('foro-student-container');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Sincronizando muro...</p>';

    foroUnsubscribe = db.collection('foro_mensajes')
        .where('curso_id', '==', currentCourseId)
        .onSnapshot(snap => {
            container.innerHTML = '';
            if (snap.empty) {
                container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:30px;">Aún no hay consultas en este muro. ¡Sé el primero en preguntar!</p>';
                return;
            }

            let msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            msgs.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            msgs.forEach(msg => {
                const isMe = msg.alumno_dni === studentSession.dni;
                const isAdmin = msg.is_admin;

                const div = document.createElement('div');
                div.className = `msg-bubble ${isAdmin ? 'msg-admin' : (isMe ? 'msg-student-me' : 'msg-student-others')}`;

                div.innerHTML = `
                    <div class="msg-header">
                        <span class="msg-author">${isAdmin ? '⭐ DOCENTE' : (isMe ? 'Tú' : (msg.alumno_nombre || 'Alumno'))}</span>
                        <span class="msg-time">${new Date(msg.fecha).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    ${msg.respuesta_a ? `
                        <div class="quote-box">
                            <strong>${msg.respuesta_a.name || msg.respuesta_a.nombre}:</strong> "${msg.respuesta_a.mensaje.slice(0, 50)}..."
                        </div>
                    ` : ''}
                    <div class="msg-content" id="msg-text-${msg.id}">${msg.mensaje}</div>
                    <div class="msg-actions">
                        <button class="btn-msg-action" onclick="replyToMessageStudent('${msg.id}', '${isAdmin ? 'Docente' : (msg.alumno_nombre || 'Alumno')}', '${msg.mensaje}')">🔄 Responder</button>
                        ${isMe ? `
                            <button class="btn-msg-action" onclick="prepareEditStudent('${msg.id}', \`${msg.mensaje.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">✏️ Editar</button>
                            <button class="btn-msg-action" onclick="deleteMessageStudent('${msg.id}')">🗑️ Borrar</button>
                        ` : ''}
                    </div>
                `;
                container.appendChild(div);
            });
            container.scrollTop = container.scrollHeight;
        });
}

function replyToMessageStudent(id, name, text) {
    replyToStudent = { id, name, mensaje: text };
    const preview = document.getElementById('reply-preview-student');
    const nameSpan = document.getElementById('reply-to-name-student');
    nameSpan.innerText = name;
    preview.classList.remove('hidden');
    document.getElementById('foro-input-student').focus();
    editingMsgId = null;
    document.getElementById('btn-send-foro').innerText = 'ENVIAR';
}

function cancelReplyStudent() {
    replyToStudent = null;
    document.getElementById('reply-preview-student').classList.add('hidden');
}

function prepareEditStudent(id, text) {
    editingMsgId = id;
    const input = document.getElementById('foro-input-student');
    input.value = text;
    input.focus();
    document.getElementById('btn-send-foro').innerText = 'GUARDAR';
    cancelReplyStudent();
}

async function sendMessageStudent() {
    const input = document.getElementById('foro-input-student');
    const msg = input.value.trim();
    if (!msg) return;

    try {
        if (editingMsgId) {
            await db.collection('foro_mensajes').doc(editingMsgId).update({
                mensaje: msg,
                fecha_edicion: new Date().toISOString()
            });
            editingMsgId = null;
            document.getElementById('btn-send-foro').innerText = 'ENVIAR';
        } else {
            await db.collection('foro_mensajes').add({
                curso_id: currentCourseId,
                alumno_dni: studentSession.dni,
                alumno_nombre: studentSession.nombre,
                mensaje: msg,
                fecha: new Date().toISOString(),
                is_admin: false,
                respuesta_a: replyToStudent,
                platformId: PLATFORM_ID
            });
        }
        input.value = '';
        cancelReplyStudent();
    } catch (e) { cfpAlert("ERROR", "Error: " + e.message); }
}

async function deleteMessageStudent(id) {
    if (confirm("¿Seguro que quieres borrar tu mensaje?")) {
        await db.collection('foro_mensajes').doc(id).delete();
    }
}

function openConfigModal() {
    document.getElementById('config-modal').classList.remove('hidden');
}

function closeConfigModal() {
    document.getElementById('config-modal').classList.add('hidden');
    document.getElementById('new-password').value = '';
    document.getElementById('repeat-password').value = '';
}

async function saveNewPassword() {
    const newPass = document.getElementById('new-password').value.trim();
    const repeatPass = document.getElementById('repeat-password').value.trim();

    if (newPass.length < 6) {
        return cfpAlert("ERROR", "La contraseña debe tener al menos 6 caracteres por seguridad.");
    }

    if (newPass !== repeatPass) {
        return cfpAlert("ERROR", "Las contraseñas no coinciden. Por favor, verifica.");
    }

    try {
        const user = authFirebase.currentUser;
        if (!user) return cfpAlert("ERROR", "Error de sesión. Por favor, vuelve a ingresar.");

        await user.updatePassword(newPass);

        cfpAlert("ÉXITO", "✅ Contraseña actualizada con éxito. Úsala en tu próximo ingreso.");
        closeConfigModal();
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            cfpAlert("SEGURIDAD", "⚠️ Por seguridad, esta acción requiere haber iniciado sesión recientemente. Por favor, sal y vuelve a entrar para cambiar tu contraseña.");
        } else {
            cfpAlert("ERROR", "Error al actualizar: " + error.message);
        }
    }
}

// --- SISTEMA DE VALIDACIÓN DE DRIVE (v9.18.50) ---
let driveValidationTimers = {};

async function validateLinkLive(semana, url) {
    const statusIcon = document.getElementById(`status-icon-${semana}`);
    const banner = document.getElementById(`validation-banner-${semana}`);
    const btn = document.getElementById(`btn-submit-${semana}`);

    // Estado Inmediato: Bloquear botón mientras se escribe o verifica
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }

    if (!url) {
        statusIcon.innerHTML = '';
        if (banner) banner.classList.add('hidden');
        if (btn) { btn.disabled = true; } 
        return;
    }

    // Debounce de 500ms para evitar spam de validaciones
    clearTimeout(driveValidationTimers[semana]);
    driveValidationTimers[semana] = setTimeout(async () => {
        
        if (!url.toLowerCase().includes('google.com')) {
            statusIcon.innerHTML = '❌';
            return;
        }

        // EXTRAER ID
        const idMatch = url.match(/\/d\/(.+?)(\/|$)/) || url.match(/id=(.+?)(&|$)/);
        const fileId = idMatch ? idMatch[1].split(/[?&]/)[0] : null;

        if (!fileId) {
            statusIcon.innerHTML = '⚠️';
            return;
        }

        // isChecking = true
        statusIcon.innerHTML = '<span class="spinner-verify">⏳</span> Verificando permisos...';
        
        const img = new Image();
        img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w20&t=${Date.now()}`;
        
        img.onload = () => {
            // isValidLink = true, isChecking = false
            statusIcon.innerHTML = '✅ <span style="color:#10b981; font-size:0.8rem;">Link Correcto</span>';
            if (banner) banner.classList.add('hidden');
            if (btn) {
                btn.style.opacity = '1';
                btn.disabled = false;
                btn.style.cursor = 'pointer';
                btn.style.background = '#0ea5e9'; // Color activo
            }
        };

        img.onerror = () => {
            // isValidLink = false, isChecking = false
            statusIcon.innerHTML = '🔒 <span style="color:#ef4444; font-size:0.8rem;">Acceso Restringido</span>';
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
            
            if (banner) {
                banner.innerHTML = `
                    <div style="background:#fff7ed; border:1px solid #fed7aa; padding:15px; border-radius:12px; margin-top:10px; font-size:0.85rem; color:#9a3412; animation: fadeIn 0.3s ease;">
                        <strong style="display:block; margin-bottom:10px; font-size:0.9rem;">⚠️ ¡Atención! Tu archivo no es accesible.</strong>
                        El sistema detectó que tu enlace de Google Drive está en modo Privado. Para que el profesor pueda corregir tu actividad, sigue estos pasos:
                        <ol style="margin:10px 0; padding-left:20px;">
                            <li>Abre tu archivo en Google Drive.</li>
                            <li>Haz clic en el botón azul <b>"Compartir"</b> (arriba a la derecha).</li>
                            <li>En "Acceso general", cambia "Restringido" por <b>"Cualquier persona con el enlace"</b>.</li>
                            <li>Asegúrate de que el rol sea <b>"Lector"</b>.</li>
                            <li>Haz clic en <b>"Copiar enlace"</b> y vuelve a pegarlo aquí.</li>
                        </ol>
                    </div>
                `;
                banner.classList.remove('hidden');
            }
        };
    }, 500);
}

initStudentDashboard();

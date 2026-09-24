// Lógica de inicio de sesión con Firebase Auth v9.18.3
function cfpAlert(title, message) {
    const modal = document.getElementById('cfp-alert');
    if (!modal) return alert(message);
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerHTML = message;
    modal.classList.add('active');
}

function closeCfpAlert() {
    document.getElementById('cfp-alert').classList.remove('active');
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawEmailTyped = document.getElementById('email').value.trim();
    const email = rawEmailTyped.toLowerCase();
    const rawPass = document.getElementById('password').value.trim();
    // Limpiamos DNI de forma agresiva: solo números y letras (elimina espacios, puntos, guiones)
    const cleanDni = rawPass.replace(/[^a-zA-Z0-9]/g, '');

    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Verificando...';
    btn.disabled = true;

    try {
        // 0. ADMIN MAESTRO
        if (email === 'sanchezjuanmanuel@abc.gob.ar' && rawPass === 'Perroloco2026') {
            try { 
                await authFirebase.signInWithEmailAndPassword(email, rawPass); 
            } catch(err) { 
                if(err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials') {
                    await authFirebase.createUserWithEmailAndPassword(email, rawPass); 
                } else throw err; 
            }
            const mainAdmin = { role: 'super-admin', nombre: 'Admin Maestro', cursos: 'all' };
            await db.collection('usuarios_auth').doc(email).set(mainAdmin);
            localStorage.setItem('admin_session', JSON.stringify(mainAdmin));
            window.location.href = 'admin.html';
            return;
        }

        // 1. LOGIN DIRECTO
        let isLoggedIn = false;
        try {
            await authFirebase.signInWithEmailAndPassword(email, rawPass);
            isLoggedIn = true;
        } catch(err) {
            if (err.code === 'auth/wrong-password') {
                throw new Error("🔑 Contraseña incorrecta. Si ya ingresaste antes y la cambiaste, usa 'Recuperar Contraseña'.");
            }
            if (err.code !== 'auth/user-not-found' && err.code !== 'auth/invalid-login-credentials' && err.code !== 'permission-denied') throw err;
        }

        // 2. SI LOGUEÓ: VERIFICAR SI ES ADMIN O ALUMNO
        if (isLoggedIn) {
            const adminDoc = await db.collection('usuarios_auth').doc(email).get();
            if (adminDoc.exists) {
                const adminData = adminDoc.data();
                const userRole = adminData.role || 'profesor'; 
                localStorage.setItem('admin_session', JSON.stringify({
                    email: email, role: userRole, nombre: adminData.nombre || 'Administrador', cursos: adminData.cursos || []
                }));
                window.location.href = 'admin.html';
                return;
            }
        }

        // 3. SI NO LOGUEÓ: PROCESAR REGISTRO INICIAL (DNI COMO CLAVE)
        if (!isLoggedIn) {
            // CASO A: Admin/Docente nuevo
            try {
                const adminCheck = await db.collection('usuarios_auth').doc(email).get();
                if (adminCheck.exists) {
                    const aData = adminCheck.data();
                    if (aData.password_init && (aData.password_init === cleanDni || aData.password_init === rawPass)) {
                        try {
                            await authFirebase.createUserWithEmailAndPassword(email, rawPass);
                        } catch(ee) {
                            if (ee.code !== 'auth/email-already-in-use') throw ee;
                            await authFirebase.signInWithEmailAndPassword(email, rawPass);
                        }
                        await db.collection('usuarios_auth').doc(email).update({ password_init: firebase.firestore.FieldValue.delete() });
                        const aDataCurrent = await db.collection('usuarios_auth').doc(email).get();
                        const finalAData = aDataCurrent.exists ? aDataCurrent.data() : aData;
                        
                        const userRole = finalAData.role || 'profesor';
                        localStorage.setItem('admin_session', JSON.stringify({
                            email: email, role: userRole, nombre: finalAData.nombre || 'Administrador', cursos: finalAData.cursos || []
                        }));
                        window.location.href = 'admin.html';
                        return;
                    }
                }
            } catch (e) { }

            // CASO B: Alumno nuevo o sin cuenta Auth creada
            if (window.IS_PLATAFORMA_EDUCATIVA_R10) {
                // En Plataforma Educativa R10 es obligatorio haber completado el registro institucional con fotos de DNI
                throw new Error(
                    `<div style="text-align:left; line-height:1.45;">` +
                    `<h3 style="color:#0284c7; margin:0 0 10px 0; font-size:1.15rem; font-weight:800; display:flex; align-items:center; gap:8px;">` +
                    `<span>🆔</span> REGISTRO OBLIGATORIO - CICLO 2026</h3>` +
                    `<p style="font-size:0.92rem; color:#334155; margin-bottom:12px;">` +
                    `No se encontró un usuario activo con esas credenciales. Para acceder a la <strong>Plataforma Educativa R10</strong>, todos los estudiantes deben completar su registro obligatorio con las fotos del DNI (frente y dorso).` +
                    `</p>` +
                    `<div style="text-align:center; margin-top:14px;">` +
                    `<a href="registro.html?email=${encodeURIComponent(email)}&dni=${encodeURIComponent(cleanDni || '')}" ` +
                    `style="display:inline-block; padding:12px 24px; background:linear-gradient(135deg, #00b9e8, #0284c7); color:white; border-radius:10px; text-decoration:none; font-weight:800; font-size:0.95rem; box-shadow:0 4px 14px rgba(2,132,199,0.35);">` +
                    `CREAR MI CUENTA CON FOTOS DE DNI ➔</a>` +
                    `</div>` +
                    `</div>`
                );
            }

            // Fallback para plataformas legacy (Plataforma R10 antigua y CFP 403)
            let info_alumno = null;
            let currentCourses = ['habilidades', 'programacion'];
            try {
                const coursesSnap = await db.collection('cursos').where('platformId', '==', window.PLATFORM_ID).get();
                if (!coursesSnap.empty) currentCourses = coursesSnap.docs.map(d => d.id);
            } catch (e) { }

            for (let cid of currentCourses) {
                try {
                    const snapCheck = await db.collection(`alumnos_${cid}`).doc(cleanDni).get();
                    if (snapCheck.exists) { 
                        const dataRead = snapCheck.data();
                        if (String(dataRead.email || "").toLowerCase() === email) {
                             info_alumno = dataRead; break; 
                        }
                    }
                } catch (e) { }
            }

            if (info_alumno) {
                try {
                    await authFirebase.createUserWithEmailAndPassword(email, rawPass);
                } catch(ee) {
                    if (ee.code === 'auth/email-already-in-use') {
                        throw new Error("🔑 Contraseña incorrecta o cuenta activa. Si no la recuerdas, usa el botón '¿Olvidaste tu contraseña?' abajo.");
                    }
                    throw ee;
                }
            } else {
                throw new Error("❌ No se encontró registro con ese Email y DNI (" + cleanDni + "). Verifique sus datos.");
            }
        }

        // 4. PREPARAR SESIÓN DE ALUMNO 
        let cursos_inscrito = [];
        let info_final = null;
        let coursesDocs = [];
        try {
            const coursesList = await db.collection('cursos').get();
            coursesDocs = coursesList.docs
                .map(d => ({ id: d.id, nombre: d.data().nombre, platformId: d.data().platformId }))
                .filter(d => {
                    const is2026 = window.isCourse2026(d.id, d.nombre);
                    if (!window.IS_PLATAFORMA_EDUCATIVA_R10) {
                        // En plataformas antiguas: NUNCA mostrar ni cargar cursos 2026
                        return !is2026 && (d.platformId === window.PLATFORM_ID);
                    } else {
                        // En Plataforma Educativa R10: cargar cursos 2026
                        return is2026;
                    }
                });
        } catch (e) {
            coursesDocs = [];
        }

        for (let doc of coursesDocs) {
            try {
                const qSnapLower = await db.collection(`alumnos_${doc.id}`).where('email', '==', email).get();
                const qSnapRaw = qSnapLower.empty ? await db.collection(`alumnos_${doc.id}`).where('email', '==', rawEmailTyped).get() : qSnapLower;
                
                if (!qSnapRaw.empty) {
                    const aluData = qSnapRaw.docs[0].data();
                    if (!info_final) info_final = aluData;
                    cursos_inscrito.push({ id: doc.id, nombre: doc.nombre });
                } else if (cleanDni.length >= 7 && cleanDni.length <= 11) {
                    const aluDoc = await db.collection(`alumnos_${doc.id}`).doc(cleanDni).get();
                    if (aluDoc.exists && String(aluDoc.data().email || "").toLowerCase() === email) {
                        if (!info_final) info_final = aluDoc.data();
                        cursos_inscrito.push({ id: doc.id, nombre: doc.nombre });
                    }
                }
            } catch (e) { }
        }

        // Buscar en la base central de 'alumnos_registro'
        try {
            // 1. Buscar por UID en Firebase Auth
            if (authFirebase.currentUser) {
                const uidDoc = await db.collection('alumnos_registro').doc(authFirebase.currentUser.uid).get();
                if (uidDoc.exists) {
                    info_final = uidDoc.data();
                }
            }
            // 2. Buscar por DNI
            if (!info_final && cleanDni.length >= 7) {
                const dniDoc = await db.collection('alumnos_registro').doc(cleanDni).get();
                if (dniDoc.exists) {
                    info_final = dniDoc.data();
                }
            }
            // 3. Buscar por email
            if (!info_final) {
                let userDoc = await db.collection('alumnos_registro').where('email', '==', email).get();
                if (userDoc.empty && rawEmailTyped && rawEmailTyped !== email) {
                    userDoc = await db.collection('alumnos_registro').where('email', '==', rawEmailTyped).get();
                }
                if (userDoc.empty) {
                    userDoc = await db.collection('alumnos_registro').where('email', '==', email.toUpperCase()).get();
                }
                if (!userDoc.empty) {
                    info_final = userDoc.docs[0].data();
                }
            }
        } catch (e) {
            console.error("Error buscando en alumnos_registro:", e);
        }

        // =========================================================================
        // REGLA CRÍTICA PARA PLATAFORMA EDUCATIVA R10:
        // Todos los alumnos (incluyendo los que ya tenían cuenta en Plataforma R10
        // o CFP 403) DEBEN tener completo su legajo institucional con las fotos de DNI.
        // =========================================================================
        if (window.IS_PLATAFORMA_EDUCATIVA_R10) {
            const hasDniDocs = Boolean(
                info_final && 
                (info_final.dni_documentos_completos === true || 
                 (info_final.dni_frente_url && info_final.dni_dorso_url))
            );

            if (!hasDniDocs) {
                // Desautenticar de Firebase Auth para que no quede logueado sin legajo
                try { await authFirebase.signOut(); } catch (e) {}
                localStorage.removeItem('user_session');

                const dniParam = (cleanDni && cleanDni.length >= 7) ? cleanDni : ((info_final && info_final.dni) ? info_final.dni : '');

                throw new Error(
                    `<div style="text-align:left; line-height:1.45;">` +
                    `<h3 style="color:#0284c7; margin:0 0 10px 0; font-size:1.15rem; font-weight:800; display:flex; align-items:center; gap:8px;">` +
                    `<span>🆔</span> REGISTRO OBLIGATORIO - CICLO 2026</h3>` +
                    `<p style="font-size:0.92rem; color:#334155; margin-bottom:12px;">` +
                    `Para ingresar a la <strong>Plataforma Educativa R10</strong>, todos los estudiantes deben completar su registro institucional adjuntando la documentación requerida (<strong>Fotos de frente y dorso de su DNI</strong>).` +
                    `</p>` +
                    `<p style="font-size:0.86rem; color:#64748b; margin-bottom:18px; background:#f1f5f9; padding:10px; border-radius:8px; border-left:4px solid #00b9e8;">` +
                    `Si ya eras usuario de <em>Plataforma R10</em> o <em>CFP 403</em>, debes completar este registro para validar tus datos e inscribirte a los cursos 2026.` +
                    `</p>` +
                    `<div style="text-align:center;">` +
                    `<a href="registro.html?email=${encodeURIComponent(email)}&dni=${encodeURIComponent(dniParam)}" ` +
                    `style="display:inline-block; padding:12px 24px; background:linear-gradient(135deg, #00b9e8, #0284c7); color:white; border-radius:10px; text-decoration:none; font-weight:800; font-size:0.95rem; box-shadow:0 4px 14px rgba(2,132,199,0.35);">` +
                    `COMPLETAR MI REGISTRO CON DNI ➔</a>` +
                    `</div>` +
                    `</div>`
                );
            }
        }

        // En plataformas antiguas: si autenticó con éxito pero no tenía ficha previa, crearle ficha automática para nunca bloquear
        if (!window.IS_PLATAFORMA_EDUCATIVA_R10 && !info_final && authFirebase.currentUser) {
            const fallbackName = (authFirebase.currentUser.displayName || email.split('@')[0]).toUpperCase();
            const fallbackDni = (cleanDni && cleanDni.length >= 7) ? cleanDni : authFirebase.currentUser.uid.substring(0, 10).toUpperCase();
            info_final = {
                full_name: fallbackName,
                nombres: fallbackName,
                apellidos: '',
                dni: fallbackDni,
                email: email,
                rol: 'alumno'
            };
            try {
                await db.collection('alumnos_registro').doc(authFirebase.currentUser.uid).set(info_final, { merge: true });
            } catch (e) {
                console.warn("Aviso guardando ficha automática:", e);
            }
        }

        if (info_final) {
            const studentName = info_final.full_name || 
                (info_final.apellidos && info_final.nombres ? `${info_final.apellidos}, ${info_final.nombres}` : '') ||
                info_final.nombres || 
                info_final.nombre || 
                email.split('@')[0].toUpperCase();

            localStorage.setItem('user_session', JSON.stringify({
                nombre: studentName,
                dni: info_final.dni || cleanDni || '',
                email: info_final.email || email,
                cursos: cursos_inscrito
            }));
            window.location.href = 'student.html';
        } else {
            throw new Error(`⚠️ Autenticado en el sistema, pero no se encontró su ficha de registro.<br><br><a href="registro.html?email=${encodeURIComponent(email)}" style="display:inline-block; margin-top:8px; padding:8px 16px; background:#0099cc; color:white; border-radius:8px; text-decoration:none; font-weight:700;">COMPLETAR REGISTRO</a>`);
        }

    } catch (error) {
        let msg = error.message || 'Error al ingresar.';
        if (msg.includes('permission')) msg = "⚠️ ERROR: Se está actualizando el sistema o faltan permisos.";
        cfpAlert("ATENCIÓN", msg);
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

async function recuperarClave() {
    const email = document.getElementById('email').value.trim();
    if (!email) return cfpAlert("AVISO", "Escribe tu correo arriba para enviarte el enlace de recuperación.");
    try {
        await authFirebase.sendPasswordResetEmail(email);
        cfpAlert("ÉXITO", "📬 Enlace enviado a " + email + ". Revisa tu correo (y Spam).");
    } catch(e) {
        let msg = "No se pudo enviar.";
        if (e.code === 'auth/user-not-found') msg = "El correo no está registrado.";
        cfpAlert("ERROR", msg);
    }
}

// =========================================================================
// CONTROLADOR DE VISTAS (GUÍA DE BIENVENIDA / FORMULARIO DE ACCESO)
// =========================================================================
window.showLoginView = function() {
    const welcome = document.getElementById('welcome-view');
    const login = document.getElementById('login-view');
    if (welcome && login) {
        welcome.classList.add('hidden');
        login.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('email')?.focus();
        }, 120);
    }
};

window.showWelcomeView = function() {
    const welcome = document.getElementById('welcome-view');
    const login = document.getElementById('login-view');
    if (welcome && login) {
        login.classList.add('hidden');
        welcome.classList.remove('hidden');
    }
};

// Si viene con parámetro ?view=login (por ejemplo al volver de registro o recuperación), ir directo al formulario
try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'login') {
        window.showLoginView();
    }
} catch (e) { }



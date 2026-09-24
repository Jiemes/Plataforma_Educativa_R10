let currentStep = 1;
const totalSteps = 5;

// Estado de documentos DNI
const dniFiles = {
    frente: null,
    dorso: null
};

const dniPreviews = {
    frente: null,
    dorso: null
};

// Prevenir que el navegador autocomplete campos de texto (como Sobrenombre, Nombres, etc.) con el email del usuario
function cleanAccidentalAutofill() {
    const inputs = document.querySelectorAll('#registro-form input:not(#reg_email)');
    inputs.forEach(el => {
        if (el.value && typeof el.value === 'string' && el.value.includes('@')) {
            el.value = '';
        }
    });
}

// Inicializa el primer paso y listeners
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    initDniDropzones();
    cleanAccidentalAutofill();
    setTimeout(cleanAccidentalAutofill, 300);
    setTimeout(cleanAccidentalAutofill, 800);
    setTimeout(cleanAccidentalAutofill, 1500);

    // Escuchar cambios indebidos en todos los campos que no sean email
    document.querySelectorAll('#registro-form input:not(#reg_email)').forEach(input => {
        input.addEventListener('change', () => {
            if (input.value && input.value.includes('@')) input.value = '';
        });
        input.addEventListener('input', () => {
            if (input.value && input.value.includes('@') && input.id !== 'reg_email') {
                input.value = '';
            }
        });
    });
    
    // Si viene email por parámetro de URL, precompletarlo ÚNICAMENTE en reg_email
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        if (emailParam) {
            const emailInput = document.getElementById('reg_email');
            if (emailInput) {
                emailInput.value = emailParam;
                const preview = document.getElementById('preview_email');
                if (preview) preview.textContent = emailParam;
            }
        }
    } catch (e) { }

    // Escucha cambios en el campo email para actualizar la preview en el paso 5
    document.getElementById('reg_email').addEventListener('input', (e) => {
        const preview = document.getElementById('preview_email');
        if(preview) preview.textContent = e.target.value || '-';
    });
});

// CONTROLADOR DEL CARTEL / MODAL DE CARGANDO DOCUMENTACIÓN
function showLoadingModal(title, stepText, percent) {
    const modal = document.getElementById('registro-loading-modal');
    if (!modal) return;
    
    if (title) {
        const titleEl = document.getElementById('loading-modal-title');
        if (titleEl) titleEl.textContent = title;
    }
    if (stepText) {
        const stepEl = document.getElementById('loading-modal-step');
        if (stepEl) stepEl.textContent = stepText;
    }
    if (percent !== undefined) {
        const fillEl = document.getElementById('loading-progress-bar-fill');
        const percentEl = document.getElementById('loading-modal-percent');
        if (fillEl) fillEl.style.width = `${percent}%`;
        if (percentEl) percentEl.textContent = `${percent}%`;
    }
    
    modal.classList.add('active');
    
    // Bloquear cierre accidental de ventana mientras sube
    window.onbeforeunload = function() {
        return "El registro y la carga de documentación están en proceso. Si sales ahora, tus datos no se guardarán.";
    };
}

function updateLoadingProgress(stepText, percent) {
    if (stepText) {
        const stepEl = document.getElementById('loading-modal-step');
        if (stepEl) stepEl.textContent = stepText;
    }
    if (percent !== undefined) {
        const fillEl = document.getElementById('loading-progress-bar-fill');
        const percentEl = document.getElementById('loading-modal-percent');
        if (fillEl) fillEl.style.width = `${percent}%`;
        if (percentEl) percentEl.textContent = `${percent}%`;
    }
}

function finishLoadingModal(successTitle, successDesc) {
    const iconEl = document.getElementById('loading-spinner-icon');
    const ringEl = document.querySelector('.loading-spinner-ring');
    const titleEl = document.getElementById('loading-modal-title');
    const descEl = document.getElementById('loading-modal-desc');
    const stepEl = document.getElementById('loading-modal-step');
    const fillEl = document.getElementById('loading-progress-bar-fill');
    const percentEl = document.getElementById('loading-modal-percent');
    const alertBox = document.querySelector('.loading-main-alert');
    const warnBox = document.querySelector('.loading-warning-box');

    if (iconEl) iconEl.textContent = '✅';
    if (ringEl) {
        ringEl.style.borderColor = '#10b981';
        ringEl.style.animation = 'none';
    }
    if (titleEl) titleEl.textContent = successTitle || '¡Registro Completado con Éxito!';
    if (alertBox) {
        alertBox.style.background = '#dcfce7';
        alertBox.style.borderColor = '#86efac';
        alertBox.style.color = '#166534';
        alertBox.innerHTML = '<strong>¡Tu legajo y fotos de DNI han sido guardados correctamente!</strong>';
    }
    if (descEl) descEl.textContent = successDesc || 'Redirigiendo a la pantalla de inicio de sesión...';
    if (stepEl) stepEl.textContent = 'Completado';
    if (fillEl) {
        fillEl.style.width = '100%';
        fillEl.style.background = '#10b981';
    }
    if (percentEl) percentEl.textContent = '100%';
    if (warnBox) warnBox.style.display = 'none';

    window.onbeforeunload = null;
}

function hideLoadingModal() {
    const modal = document.getElementById('registro-loading-modal');
    if (modal) modal.classList.remove('active');
    window.onbeforeunload = null;
}

// DISPARAR SELECTOR DE ARCHIVO
function triggerFileInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.click();
}

// GESTIÓN DE ARCHIVOS DNI
function handleDniFileSelect(e, side) {
    const file = e.target.files && e.target.files[0];
    if (file) {
        processDniFile(file, side);
    }
}

function processDniFile(file, side) {
    if (!file) return;

    // Validar tipo de archivo permitido
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
        showAlert('FORMATO NO VÁLIDO', 'Por favor selecciona una imagen (JPG, PNG, WEBP) o un documento PDF del DNI.');
        return;
    }

    // Tamaño máximo: 12MB
    if (file.size > 12 * 1024 * 1024) {
        showAlert('ARCHIVO DEMASIADO GRANDE', 'El archivo no debe superar los 12MB. Toma una foto con menor resolución o recorta la imagen.');
        return;
    }

    if (isImage) {
        // Comprimir imagen usando canvas para carga ultra-rápida, liviana y nítida
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const img = new Image();
            img.onload = () => {
                // Redimensionar manteniendo proporción (1100px genera ~70KB con nitidez óptima)
                const maxDim = 1100;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.74);
                
                // Convertir dataURL a Blob
                fetch(compressedDataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
                        dniFiles[side] = compressedFile;
                        dniPreviews[side] = compressedDataUrl;
                        displayDniPreview(side, compressedDataUrl, compressedFile.name, formatBytes(compressedFile.size));
                    });
            };
            img.src = loadEvent.target.result;
        };
        reader.readAsDataURL(file);
    } else if (isPdf) {
        dniFiles[side] = file;
        // Para PDF usamos un icono/thumbnail informativo
        const pdfPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='140' viewBox='0 0 200 140'><rect width='200' height='140' fill='%23fee2e2'/><text x='100' y='75' font-size='32' text-anchor='middle' fill='%23ef4444'>📄 PDF</text></svg>";
        dniPreviews[side] = pdfPlaceholder;
        displayDniPreview(side, pdfPlaceholder, file.name, formatBytes(file.size));
    }
}

function displayDniPreview(side, previewUrl, fileName, fileSizeStr) {
    const emptyBox = document.getElementById(`empty-${side}`);
    const filledBox = document.getElementById(`filled-${side}`);
    const imgEl = document.getElementById(`img-preview-${side}`);
    const nameEl = document.getElementById(`file-name-${side}`);
    const sizeEl = document.getElementById(`file-size-${side}`);
    const statusTag = document.getElementById(`status-tag-${side}`);
    const cardEl = document.getElementById(`card-dni-${side}`);
    const errorEl = document.getElementById(`error-${side}`);

    if (imgEl) imgEl.src = previewUrl;
    if (nameEl) nameEl.textContent = fileName;
    if (sizeEl) sizeEl.textContent = fileSizeStr;

    if (emptyBox) emptyBox.classList.add('hidden');
    if (filledBox) filledBox.classList.remove('hidden');

    if (statusTag) {
        statusTag.textContent = "✅ Listo";
        statusTag.classList.add('ready');
    }

    if (cardEl) {
        cardEl.classList.add('has-file');
        cardEl.classList.remove('has-error');
    }

    if (errorEl) errorEl.classList.add('hidden');
}

function removeDniFile(side) {
    dniFiles[side] = null;
    dniPreviews[side] = null;

    const input = document.getElementById(`reg_dni_${side}`);
    if (input) input.value = '';

    const emptyBox = document.getElementById(`empty-${side}`);
    const filledBox = document.getElementById(`filled-${side}`);
    const statusTag = document.getElementById(`status-tag-${side}`);
    const cardEl = document.getElementById(`card-dni-${side}`);

    if (emptyBox) emptyBox.classList.remove('hidden');
    if (filledBox) filledBox.classList.add('hidden');

    if (statusTag) {
        statusTag.textContent = "Pendiente";
        statusTag.classList.remove('ready');
    }

    if (cardEl) {
        cardEl.classList.remove('has-file');
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// INICIALIZAR DRAG AND DROP
function initDniDropzones() {
    ['frente', 'dorso'].forEach(side => {
        const dropzone = document.getElementById(`dropzone-${side}`);
        if (!dropzone) return;

        ['dragenter', 'dragover'].forEach(evtName => {
            dropzone.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(evtName => {
            dropzone.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('drag-active');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                processDniFile(files[0], side);
            }
        });
    });
}

function nextStep() {
    // Basic HTML5 validation before moving to the next step
    const currentSection = document.getElementById(`step-${currentStep}`);
    const inputs = currentSection.querySelectorAll('input[required], select[required]');
    
    let allValid = true;
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.reportValidity();
            allValid = false;
        }
    });

    if (!allValid) return;

    if (currentStep < totalSteps) {
        currentStep++;
        updateUI();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
}

function updateUI() {
    // Actualizar secciones
    for (let i = 1; i <= totalSteps; i++) {
        document.getElementById(`step-${i}`).classList.remove('active');
        document.getElementById(`step-ind-${i}`).classList.remove('active');
        if (i < currentStep) {
            document.getElementById(`step-ind-${i}`).classList.add('completed');
        } else {
            document.getElementById(`step-ind-${i}`).classList.remove('completed');
        }
    }
    
    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.getElementById(`step-ind-${currentStep}`).classList.add('active');

    // Botones
    document.getElementById('btn-prev').style.display = currentStep === 1 ? 'none' : 'block';
    
    if (currentStep === totalSteps) {
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('btn-submit').style.display = 'block';
    } else {
        document.getElementById('btn-next').style.display = 'block';
        document.getElementById('btn-submit').style.display = 'none';
    }
}

// Lógica condicional del formulario
function toggleTrabajoFields() {
    const selector = document.getElementById('reg_trabajando').value;
    const camposTrabajo = document.getElementById('campos_trabajo');
    const camposNoTrabajo = document.getElementById('campos_no_trabajo');

    if (selector === 'SI') {
        camposTrabajo.style.display = 'grid';
        camposNoTrabajo.style.display = 'none';
    } else if (selector === 'NO') {
        camposTrabajo.style.display = 'none';
        camposNoTrabajo.style.display = 'grid';
    } else {
        camposTrabajo.style.display = 'none';
        camposNoTrabajo.style.display = 'none';
    }
}

// Custom Alert function similar to the original app
function showAlert(title, message) {
    const modal = document.getElementById('cfp-alert');
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerHTML = message;
    modal.classList.add('active');
}

// Envío del formulario
document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. VALIDACIÓN OBLIGATORIA DE DOCUMENTOS DNI (FRENTE Y REVERSO)
    let missingDocs = false;

    if (!dniFiles.frente) {
        missingDocs = true;
        const cardFrente = document.getElementById('card-dni-frente');
        const errFrente = document.getElementById('error-frente');
        if (cardFrente) cardFrente.classList.add('has-error');
        if (errFrente) errFrente.classList.remove('hidden');
    }

    if (!dniFiles.dorso) {
        missingDocs = true;
        const cardDorso = document.getElementById('card-dni-dorso');
        const errDorso = document.getElementById('error-dorso');
        if (cardDorso) cardDorso.classList.add('has-error');
        if (errDorso) errDorso.classList.remove('hidden');
    }

    if (missingDocs) {
        showAlert('DOCUMENTACIÓN INCOMPLETA', 'Es <strong>obligatorio</strong> adjuntar la foto del <strong>Frente</strong> y del <strong>Reverso</strong> de tu Documento Nacional de Identidad (DNI) para poder crear tu usuario y completar tu legajo institucional.');
        // Hacer scroll suave hacia la sección de DNI
        document.querySelector('.dni-upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // 2. VALIDACIÓN DE CONTRASEÑA
    const pass1 = document.getElementById('reg_pass1').value;
    const pass2 = document.getElementById('reg_pass2').value;

    if (pass1 !== pass2) {
        showAlert('ERROR', 'Las contraseñas no coinciden.');
        return;
    }

    if (pass1.length < 6) {
        showAlert('ERROR', 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    const email = document.getElementById('reg_email').value.trim().toLowerCase();
    const dniRaw = document.getElementById('reg_dni').value.trim();
    const dniClean = dniRaw.replace(/\D/g, '');
    
    // Recopilar todos los datos
    const userData = {
        // Personales
        full_name: document.getElementById('reg_apellidos').value.toUpperCase() + ', ' + document.getElementById('reg_nombres').value.toUpperCase(),
        nombres: document.getElementById('reg_nombres').value.trim(),
        apellidos: document.getElementById('reg_apellidos').value.trim(),
        dni: dniClean,
        cuil: document.getElementById('reg_cuil').value.trim(),
        nacimiento: document.getElementById('reg_nacimiento').value,
        lugar_nacimiento: document.getElementById('reg_lugar_nac').value.trim(),
        nacionalidad: document.getElementById('reg_nacionalidad').value.trim(),
        sexo: document.getElementById('reg_sexo').value,
        identidad: document.getElementById('reg_identidad').value.trim(),
        sobrenombre: document.getElementById('reg_sobrenombre').value.trim(),
        
        // Contacto y Domicilio
        email: email,
        celular: document.getElementById('reg_celular').value.trim(),
        telefono: document.getElementById('reg_telefono').value.trim(),
        calle: document.getElementById('reg_calle').value.trim(),
        altura: document.getElementById('reg_altura').value.trim(),
        piso: document.getElementById('reg_piso').value.trim(),
        depto: document.getElementById('reg_depto').value.trim(),
        torre: document.getElementById('reg_torre').value.trim(),
        entre_calles: document.getElementById('reg_entrecalles').value.trim(),
        localidad: document.getElementById('reg_localidad').value.trim(),
        distrito: document.getElementById('reg_distrito').value.trim(),
        provincia: document.getElementById('reg_provincia').value.trim(),
        codigo_postal: document.getElementById('reg_cp').value.trim(),

        // Hogar y Salud
        cant_personas: document.getElementById('reg_cant_per').value,
        cant_adultos: document.getElementById('reg_cant_adu').value,
        cant_ninos: document.getElementById('reg_cant_nin').value,
        cant_hijos: document.getElementById('reg_cant_hij').value,
        lenguas: document.getElementById('reg_lenguas').value.trim(),
        
        salud_asma: document.getElementById('salud_asma').checked,
        salud_celiaquia: document.getElementById('salud_celiaquia').checked,
        salud_cardiaco: document.getElementById('salud_cardiaco').checked,
        salud_diabetes: document.getElementById('salud_diabetes').checked,
        salud_presion: document.getElementById('salud_presion').checked,
        salud_convulsiones: document.getElementById('salud_convulsiones').checked,
        salud_alergias: document.getElementById('salud_alergias').checked,
        salud_discapacidad: document.getElementById('salud_discapacidad').checked,
        otras_salud: document.getElementById('reg_otras_salud').value.trim(),

        // Educacion y Trabajo
        nivel_educativo: document.getElementById('reg_nivel_edu').value,
        estado_educativo: document.getElementById('reg_estado_edu').value,
        esta_trabajando: document.getElementById('reg_trabajando').value,
        
        // Documentos DNI
        dni_frente_url: '',
        dni_dorso_url: '',
        dni_documentos_completos: true,
        dni_documentos_fecha: new Date().toISOString(),

        // Rol
        rol: 'alumno',
        fecha_registro: new Date().toISOString()
    };

    if (userData.esta_trabajando === 'SI') {
        userData.ocupacion = document.getElementById('reg_ocupacion').value.trim();
        userData.lugar_trabajo = document.getElementById('reg_lugar_trabajo').value.trim();
        userData.trabajo_desde = document.getElementById('reg_trabajo_desde').value.trim();
        userData.tipo_contratacion = document.getElementById('reg_contratacion').value.trim();
    } else if (userData.esta_trabajando === 'NO') {
        userData.busca_trabajo = document.getElementById('reg_busca_trabajo').value;
        userData.trabajo_antes = document.getElementById('reg_trabajo_antes').value.trim();
    }

    const btnSubmit = document.getElementById('btn-submit');
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = "⏳ Creando cuenta...";
    btnSubmit.disabled = true;

    // Abrir el cartel prominente de cargando y bloquear cierre de ventana
    showLoadingModal(
        'Guardando documentación y creando tu legajo...',
        '1/4: Preparando y optimizando documentación del DNI...',
        25
    );

    try {
        updateLoadingProgress('2/4: Creando credenciales seguras de usuario...', 50);

        // 1. Crear usuario en Firebase Auth o iniciar sesión si ya se creó previamente
        let uid;
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, pass1);
            uid = userCredential.user.uid;
        } catch (authErr) {
            if (authErr.code === 'auth/email-already-in-use') {
                // Si el usuario ya fue creado en Auth, nos autenticamos para completar el registro
                try {
                    const loginCred = await firebase.auth().signInWithEmailAndPassword(email, pass1);
                    uid = loginCred.user.uid;
                } catch (loginErr) {
                    throw new Error("El correo ingresado ya está registrado con otra contraseña. Si ya tienes cuenta, ingresa desde la pantalla principal o recupera tu contraseña.");
                }
            } else {
                throw authErr;
            }
        }

        // 2. DOCUMENTACIÓN DNI: Almacenamiento seguro, instantáneo y optimizado
        updateLoadingProgress('3/4: Registrando fotos de DNI y legajo institucional...', 75);

        let urlFrente = dniPreviews.frente || '';
        let urlDorso = dniPreviews.dorso || '';

        // Si Firebase Storage está disponible y el origen no sufre de CORS no configurado
        if (window.storage && window.location.hostname !== 'jiemes.github.io') {
            try {
                const ts = Date.now();
                const extFrente = dniFiles.frente.name ? dniFiles.frente.name.split('.').pop() : 'jpg';
                const extDorso = dniFiles.dorso.name ? dniFiles.dorso.name.split('.').pop() : 'jpg';

                const refFrente = window.storage.ref().child(`documentos_dni/${dniClean}_${uid}/frente_${ts}.${extFrente}`);
                const refDorso = window.storage.ref().child(`documentos_dni/${dniClean}_${uid}/reverso_${ts}.${extDorso}`);

                const snapFrente = await refFrente.put(dniFiles.frente);
                urlFrente = await snapFrente.ref.getDownloadURL();

                const snapDorso = await refDorso.put(dniFiles.dorso);
                urlDorso = await snapDorso.ref.getDownloadURL();
            } catch (storageError) {
                console.warn("Storage upload no disponible en este entorno, utilizando almacenamiento directo optimizado.");
            }
        }

        userData.dni_frente_url = urlFrente;
        userData.dni_dorso_url = urlDorso;

        // Sanitizar campos undefined antes de enviar a Firestore
        Object.keys(userData).forEach(k => {
            if (userData[k] === undefined || userData[k] === null) {
                userData[k] = '';
            }
        });

        // 3. Guardar datos en la colección 'alumnos_registro' por UID
        updateLoadingProgress('4/4: Confirmando legajo en el sistema institucional...', 92);
        await db.collection('alumnos_registro').doc(uid).set(userData, { merge: true });

        // Guardar o indexar también por DNI para que el panel administrativo y los reportes lo encuentren al instante
        if (dniClean) {
            try {
                await db.collection('alumnos_registro').doc(dniClean).set(userData, { merge: true });
            } catch (dniSyncErr) {
                console.warn("Aviso indexando por DNI:", dniSyncErr);
            }
        }

        // Breve pausa para brindar retroalimentación visual fluida
        await new Promise(r => setTimeout(r, 600));

        finishLoadingModal(
            '¡Registro Completado con Éxito!',
            'Tus datos personales y fotografías de DNI han sido guardados correctamente en tu legajo. En breve serás redirigido a la pantalla principal.'
        );

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2200);

    } catch (error) {
        hideLoadingModal();
        console.error("Error en registro:", error);
        let msg = error.message || "Error al crear la cuenta.";
        showAlert('ATENCIÓN', msg);
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
});

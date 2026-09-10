let currentStep = 1;
const totalSteps = 5;

// Inicializa el primer paso
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    
    // Si viene email por parámetro de URL, precompletarlo
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
    
    // Recopilar todos los datos
    const userData = {
        // Personales
        full_name: document.getElementById('reg_apellidos').value.toUpperCase() + ', ' + document.getElementById('reg_nombres').value.toUpperCase(),
        nombres: document.getElementById('reg_nombres').value.trim(),
        apellidos: document.getElementById('reg_apellidos').value.trim(),
        dni: document.getElementById('reg_dni').value.trim(),
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
    btnSubmit.innerText = "Creando cuenta...";
    btnSubmit.disabled = true;

    try {
        // 1. Crear usuario en Firebase Auth o iniciar sesión si ya se creó previamente
        let uid;
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, pass1);
            uid = userCredential.user.uid;
        } catch (authErr) {
            if (authErr.code === 'auth/email-already-in-use') {
                // Si el usuario ya fue creado en Auth (por ejemplo en un intento previo que falló al guardar en DB),
                // nos autenticamos con la contraseña ingresada para obtener su UID y completar el registro
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

        // Sanitizar campos undefined antes de enviar a Firestore
        Object.keys(userData).forEach(k => {
            if (userData[k] === undefined || userData[k] === null) {
                userData[k] = '';
            }
        });

        // 2. Guardar datos en la colección 'alumnos_registro'
        await db.collection('alumnos_registro').doc(uid).set(userData);

        showAlert('¡ÉXITO!', 'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión y anotarte a los cursos disponibles.');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2500);

    } catch (error) {
        console.error("Error en registro:", error);
        let msg = error.message || "Error al crear la cuenta.";
        showAlert('ATENCIÓN', msg);
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
});

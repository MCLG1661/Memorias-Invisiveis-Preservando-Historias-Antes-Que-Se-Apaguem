import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://mtqjsmcfsouxhfxrjrkx.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_YA8jN2YWu30ofygmwnzEDg_4z1eZcOT';


const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


let currentUser = null;
let activeFamily = null;


// ==========================================================
// ESTILOS DA AUTENTICAÇÃO
// ==========================================================

function injectAuthStyles() {

    if (document.getElementById('mi-auth-styles')) {
        return;
    }


    const style =
        document.createElement('style');


    style.id =
        'mi-auth-styles';


    style.textContent = `

        .mi-auth-trigger,
        .mi-auth-logout {

            border: 0;
            cursor: pointer;
            font: inherit;

        }


        .mi-auth-trigger {

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 8px;

            padding: 10px 16px;

            border-radius: 999px;

            background: transparent;

            color: var(--primary);

            border:
                1px solid
                rgba(0, 0, 0, 0.14);

            font-weight: 600;

        }


        .mi-auth-trigger:hover {

            border-color:
                var(--accent);

            color:
                var(--accent);

        }


        .mi-auth-user {

            display: inline-flex;

            align-items: center;

            gap: 10px;

            font-size: 0.9rem;

            color:
                var(--primary);

        }


        .mi-auth-user-text {

            display: flex;

            flex-direction: column;

            line-height: 1.2;

        }


        .mi-auth-user-text small {

            color:
                var(--gray);

            font-size: 0.72rem;

        }


        .mi-auth-logout {

            padding: 8px 12px;

            border-radius: 999px;

            background:
                var(--secondary);

            color:
                var(--primary);

            font-weight: 600;

        }


        .mi-auth-backdrop {

            position: fixed;

            inset: 0;

            z-index: 9999;

            display: none;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, 0.55);

        }


        .mi-auth-backdrop.is-open {

            display: flex;

        }


        .mi-auth-modal {

            width:
                min(100%, 460px);

            background:
                #ffffff;

            border-radius:
                20px;

            padding:
                28px;

            box-shadow:
                0 24px 70px
                rgba(0, 0, 0, 0.25);

            position:
                relative;

        }


        .mi-auth-modal h2 {

            margin:
                0 0 8px;

            color:
                var(--primary);

            font-family:
                'Playfair Display',
                serif;

        }


        .mi-auth-modal > p {

            margin:
                0 0 22px;

            color:
                var(--gray);

            line-height:
                1.6;

        }


        .mi-auth-close {

            position:
                absolute;

            top:
                14px;

            right:
                14px;

            width:
                38px;

            height:
                38px;

            border:
                0;

            border-radius:
                50%;

            background:
                var(--secondary);

            cursor:
                pointer;

            font-size:
                1rem;

            color:
                var(--primary);

        }


        .mi-auth-tabs {

            display:
                grid;

            grid-template-columns:
                1fr 1fr;

            gap:
                8px;

            margin-bottom:
                20px;

        }


        .mi-auth-tab {

            border:
                1px solid
                rgba(0, 0, 0, 0.12);

            background:
                #ffffff;

            padding:
                10px;

            border-radius:
                10px;

            cursor:
                pointer;

            font-weight:
                600;

            color:
                var(--primary);

        }


        .mi-auth-tab.is-active {

            background:
                var(--primary);

            color:
                #ffffff;

            border-color:
                var(--primary);

        }


        .mi-auth-form {

            display:
                grid;

            gap:
                14px;

        }


        .mi-auth-field {

            display:
                grid;

            gap:
                6px;

        }


        .mi-auth-field label {

            color:
                var(--primary);

            font-weight:
                600;

            font-size:
                0.9rem;

        }


        .mi-auth-field input {

            width:
                100%;

            border:
                1px solid
                rgba(0, 0, 0, 0.16);

            border-radius:
                10px;

            padding:
                12px 14px;

            font:
                inherit;

        }


        .mi-auth-submit {

            margin-top:
                4px;

            border:
                0;

            border-radius:
                10px;

            background:
                var(--accent);

            color:
                #ffffff;

            padding:
                12px 16px;

            font:
                inherit;

            font-weight:
                700;

            cursor:
                pointer;

        }


        .mi-auth-submit:disabled {

            opacity:
                0.65;

            cursor:
                wait;

        }


        .mi-auth-message {

            display:
                none;

            padding:
                10px 12px;

            border-radius:
                10px;

            font-size:
                0.88rem;

            line-height:
                1.5;

        }


        .mi-auth-message.is-visible {

            display:
                block;

        }


        .mi-auth-message.error {

            background:
                #fff1f1;

            color:
                #9d2020;

        }


        .mi-auth-message.success {

            background:
                #effaf2;

            color:
                #236b37;

        }


        @media (max-width: 768px) {

            .mi-auth-user {

                align-items:
                    flex-start;

                flex-direction:
                    column;

            }


            .mi-auth-trigger {

                width:
                    100%;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


// ==========================================================
// INTERFACE DA AUTENTICAÇÃO
// ==========================================================

function injectAuthUI() {

    const nav =
        document.querySelector(
            '.nav-links'
        );


    if (
        !nav ||
        document.getElementById(
            'miAuthSlot'
        )
    ) {

        return;

    }


    const slot =
        document.createElement(
            'div'
        );


    slot.id =
        'miAuthSlot';


    slot.innerHTML = `

        <button
            type="button"
            class="mi-auth-trigger"
            id="miAuthOpen"
        >

            <i class="fas fa-user"></i>

            Entrar

        </button>

    `;


    const cta =
        nav.querySelector(
            '.cta-button'
        );


    if (cta) {

        nav.insertBefore(
            slot,
            cta
        );

    } else {

        nav.appendChild(
            slot
        );

    }


    const backdrop =
        document.createElement(
            'div'
        );


    backdrop.className =
        'mi-auth-backdrop';


    backdrop.id =
        'miAuthBackdrop';


    backdrop.setAttribute(
        'aria-hidden',
        'true'
    );


    backdrop.innerHTML = `

        <div
            class="mi-auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="miAuthTitle"
        >

            <button
                type="button"
                class="mi-auth-close"
                id="miAuthClose"
                aria-label="Fechar"
            >

                <i class="fas fa-xmark"></i>

            </button>


            <h2 id="miAuthTitle">

                Acesse seu acervo

            </h2>


            <p id="miAuthIntro">

                Entre com seu e-mail e senha
                para acessar seu acervo familiar.

            </p>


            <div class="mi-auth-tabs">

                <button
                    type="button"
                    class="mi-auth-tab is-active"
                    data-auth-mode="login"
                >

                    Entrar

                </button>


                <button
                    type="button"
                    class="mi-auth-tab"
                    data-auth-mode="signup"
                >

                    Criar conta

                </button>

            </div>


            <form
                class="mi-auth-form"
                id="miAuthForm"
            >

                <div
                    class="mi-auth-field"
                    id="miNameField"
                    hidden
                >

                    <label for="miAuthName">

                        Nome

                    </label>


                    <input
                        id="miAuthName"
                        type="text"
                        autocomplete="name"
                        maxlength="100"
                    >

                </div>


                <div class="mi-auth-field">

                    <label for="miAuthEmail">

                        E-mail

                    </label>


                    <input
                        id="miAuthEmail"
                        type="email"
                        autocomplete="email"
                        required
                    >

                </div>


                <div class="mi-auth-field">

                    <label for="miAuthPassword">

                        Senha

                    </label>


                    <input
                        id="miAuthPassword"
                        type="password"
                        autocomplete="current-password"
                        minlength="6"
                        required
                    >

                </div>


                <div
                    class="mi-auth-message"
                    id="miAuthMessage"
                    role="status"
                ></div>


                <button
                    type="submit"
                    class="mi-auth-submit"
                    id="miAuthSubmit"
                >

                    Entrar

                </button>

            </form>

        </div>

    `;


    document.body.appendChild(
        backdrop
    );

}


// ==========================================================
// ELEMENTOS
// ==========================================================

function getAuthElements() {

    return {

        slot:
            document.getElementById(
                'miAuthSlot'
            ),

        open:
            document.getElementById(
                'miAuthOpen'
            ),

        backdrop:
            document.getElementById(
                'miAuthBackdrop'
            ),

        close:
            document.getElementById(
                'miAuthClose'
            ),

        form:
            document.getElementById(
                'miAuthForm'
            ),

        nameField:
            document.getElementById(
                'miNameField'
            ),

        name:
            document.getElementById(
                'miAuthName'
            ),

        email:
            document.getElementById(
                'miAuthEmail'
            ),

        password:
            document.getElementById(
                'miAuthPassword'
            ),

        message:
            document.getElementById(
                'miAuthMessage'
            ),

        submit:
            document.getElementById(
                'miAuthSubmit'
            ),

        intro:
            document.getElementById(
                'miAuthIntro'
            ),

        tabs:
            [
                ...document.querySelectorAll(
                    '[data-auth-mode]'
                )
            ]

    };

}


// ==========================================================
// MODAL
// ==========================================================

function openAuthModal() {

    const {
        backdrop,
        email
    } =
        getAuthElements();


    if (!backdrop) {
        return;
    }


    backdrop.classList.add(
        'is-open'
    );


    backdrop.setAttribute(
        'aria-hidden',
        'false'
    );


    setTimeout(
        function () {

            if (email) {
                email.focus();
            }

        },
        50
    );

}


function closeAuthModal() {

    const {
        backdrop,
        message
    } =
        getAuthElements();


    if (!backdrop) {
        return;
    }


    backdrop.classList.remove(
        'is-open'
    );


    backdrop.setAttribute(
        'aria-hidden',
        'true'
    );


    if (message) {

        message.textContent =
            '';


        message.className =
            'mi-auth-message';

    }

}


// ==========================================================
// MENSAGENS
// ==========================================================

function showAuthMessage(
    text,
    type = 'error'
) {

    const {
        message
    } =
        getAuthElements();


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        `mi-auth-message is-visible ${type}`;

}


// ==========================================================
// MODO LOGIN / CADASTRO
// ==========================================================

function setAuthMode(
    mode
) {

    const {

        tabs,
        nameField,
        password,
        submit,
        intro

    } =
        getAuthElements();


    const signup =
        mode ===
        'signup';


    tabs.forEach(
        function (tab) {

            tab.classList.toggle(
                'is-active',
                tab.dataset.authMode ===
                    mode
            );

        }
    );


    if (nameField) {

        nameField.hidden =
            !signup;

    }


    if (password) {

        password.autocomplete =
            signup
                ? 'new-password'
                : 'current-password';

    }


    if (submit) {

        submit.textContent =
            signup
                ? 'Criar conta'
                : 'Entrar';


        submit.dataset.mode =
            mode;

    }


    if (intro) {

        intro.textContent =
            signup
                ? 'Crie sua conta para começar a construir um acervo familiar.'
                : 'Entre com seu e-mail e senha para acessar seu acervo familiar.';

    }

}


// ==========================================================
// FAMÍLIA ATIVA
// ==========================================================

async function loadActiveFamily() {

    if (!currentUser) {

        activeFamily =
            null;


        return null;

    }


    const {
        data,
        error
    } =
        await supabase

            .from(
                'family_memberships'
            )

            .select(
                `
                family_id,
                role,
                status,
                families (
                    id,
                    name,
                    description
                )
                `
            )

            .eq(
                'user_id',
                currentUser.id
            )

            .eq(
                'status',
                'active'
            )

            .limit(
                1
            )

            .maybeSingle();


    if (error) {

        console.error(
            'Erro ao carregar família ativa:',
            error
        );


        activeFamily =
            null;


        return null;

    }


    activeFamily =
        data || null;


    return activeFamily;

}


// ==========================================================
// ESCAPE
// ==========================================================

function escapeForAuth(
    value
) {

    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        value ?? '';


    return div.innerHTML;

}


// ==========================================================
// ESTADO DO USUÁRIO
// ==========================================================

function renderAuthState() {

    const {
        slot
    } =
        getAuthElements();


    if (!slot) {
        return;
    }


    if (!currentUser) {

        slot.innerHTML = `

            <button
                type="button"
                class="mi-auth-trigger"
                id="miAuthOpen"
            >

                <i class="fas fa-user"></i>

                Entrar

            </button>

        `;


        const button =
            document.getElementById(
                'miAuthOpen'
            );


        if (button) {

            button.addEventListener(
                'click',
                openAuthModal
            );

        }


        return;

    }


    const familyName =

        activeFamily
            ?.families
            ?.name

        ||

        'Acervo ainda não selecionado';


    const email =

        currentUser.email

        ||

        'Usuário autenticado';


    slot.innerHTML = `

        <div class="mi-auth-user">

            <div class="mi-auth-user-text">

                <strong>

                    ${escapeForAuth(email)}

                </strong>


                <small>

                    ${escapeForAuth(familyName)}

                </small>

            </div>


            <button
                type="button"
                class="mi-auth-logout"
                id="miAuthLogout"
            >

                Sair

            </button>

        </div>

    `;


    const logoutButton =
        document.getElementById(
            'miAuthLogout'
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            async function () {

                await supabase
                    .auth
                    .signOut();

            }
        );

    }

}


// ==========================================================
// ERROS
// ==========================================================

function authErrorMessage(
    error
) {

    const message =
        String(
            error?.message || ''
        )
            .toLowerCase();


    if (
        message.includes(
            'invalid login credentials'
        )
    ) {

        return (
            'E-mail ou senha inválidos.'
        );

    }


    if (
        message.includes(
            'email not confirmed'
        )
    ) {

        return (
            'Confirme seu e-mail antes de entrar.'
        );

    }


    if (
        message.includes(
            'user already registered'
        )
    ) {

        return (
            'Este e-mail já possui uma conta.'
        );

    }


    if (
        message.includes(
            'password'
        )
    ) {

        return (
            'A senha informada não atende aos requisitos de segurança.'
        );

    }


    return (
        'Não foi possível concluir a autenticação. Tente novamente.'
    );

}


// ==========================================================
// SUBMIT
// ==========================================================

async function handleAuthSubmit(
    event
) {

    event.preventDefault();


    const {

        name,
        email,
        password,
        submit

    } =
        getAuthElements();


    const mode =

        submit
            ?.dataset
            .mode

        ||

        'login';


    const emailValue =

        email
            ?.value
            .trim()

        ||

        '';


    const passwordValue =

        password
            ?.value

        ||

        '';


    if (
        !emailValue ||
        !passwordValue
    ) {

        showAuthMessage(
            'Informe e-mail e senha.'
        );


        return;

    }


    if (submit) {

        submit.disabled =
            true;

    }


    try {

        if (
            mode ===
            'signup'
        ) {

            const fullName =

                name
                    ?.value
                    .trim()

                ||

                '';


            const {
                data,
                error
            } =
                await supabase
                    .auth
                    .signUp({

                        email:
                            emailValue,

                        password:
                            passwordValue,

                        options: {

                            data: {

                                full_name:
                                    fullName

                            },

                            emailRedirectTo:
                                'https://memorias-invisiveis.vercel.app/'

                        }

                    });


            if (error) {
                throw error;
            }


            if (
                data.session
            ) {

                showAuthMessage(
                    'Conta criada com sucesso.',
                    'success'
                );


                setTimeout(
                    closeAuthModal,
                    700
                );

            } else {

                showAuthMessage(
                    'Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.',
                    'success'
                );

            }

        } else {

            const {
                error
            } =
                await supabase
                    .auth
                    .signInWithPassword({

                        email:
                            emailValue,

                        password:
                            passwordValue

                    });


            if (error) {
                throw error;
            }


            showAuthMessage(
                'Login realizado com sucesso.',
                'success'
            );


            setTimeout(
                closeAuthModal,
                500
            );

        }

    } catch (error) {

        console.error(
            'Erro de autenticação:',
            error
        );


        showAuthMessage(
            authErrorMessage(
                error
            )
        );

    } finally {

        if (submit) {

            submit.disabled =
                false;

        }

    }

}


// ==========================================================
// EVENTOS
// ==========================================================

function bindAuthEvents() {

    const {

        open,
        close,
        backdrop,
        form,
        tabs

    } =
        getAuthElements();


    if (open) {

        open.addEventListener(
            'click',
            openAuthModal
        );

    }


    if (close) {

        close.addEventListener(
            'click',
            closeAuthModal
        );

    }


    if (form) {

        form.addEventListener(
            'submit',
            handleAuthSubmit
        );

    }


    if (backdrop) {

        backdrop.addEventListener(
            'click',
            function (event) {

                if (
                    event.target ===
                    backdrop
                ) {

                    closeAuthModal();

                }

            }
        );

    }


    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key ===
                'Escape'
            ) {

                closeAuthModal();

            }

        }
    );


    tabs.forEach(
        function (tab) {

            tab.addEventListener(
                'click',
                function () {

                    setAuthMode(
                        tab.dataset.authMode
                            ||
                        'login'
                    );

                }
            );

        }
    );


    setAuthMode(
        'login'
    );

}


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function initializeAuth() {

    injectAuthStyles();

    injectAuthUI();

    bindAuthEvents();


    const {
        data
    } =
        await supabase
            .auth
            .getSession();


    currentUser =
        data
            ?.session
            ?.user

        ||

        null;


    if (
        currentUser
    ) {

        await loadActiveFamily();

    }


    renderAuthState();


    supabase
        .auth
        .onAuthStateChange(
            async function (
                event,
                session
            ) {

                currentUser =

                    session
                        ?.user

                    ||

                    null;


                if (
                    currentUser
                ) {

                    await loadActiveFamily();

                } else {

                    activeFamily =
                        null;

                }


                renderAuthState();


                window.dispatchEvent(
                    new CustomEvent(
                        'memorias-invisiveis:auth-change',
                        {
                            detail: {

                                event,

                                user:
                                    currentUser,

                                family:
                                    activeFamily

                            }
                        }
                    )
                );

            }
        );


    window.MemoriasInvisiveisAuth = {

        supabase,

        getUser:
            function () {

                return currentUser;

            },

        getActiveFamily:
            function () {

                return activeFamily;

            },

        refreshFamily:
            loadActiveFamily,

        openLogin:
            openAuthModal

    };


    window.dispatchEvent(
        new CustomEvent(
            'memorias-invisiveis:auth-ready',
            {
                detail: {

                    user:
                        currentUser,

                    family:
                        activeFamily

                }
            }
        )
    );

}


// ==========================================================
// START
// ==========================================================

initializeAuth()
    .catch(
        function (error) {

            console.error(
                'Falha ao inicializar autenticação Supabase:',
                error
            );

        }
    );

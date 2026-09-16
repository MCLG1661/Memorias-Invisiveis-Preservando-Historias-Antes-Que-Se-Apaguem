import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';


// ==========================================================
// SUPABASE
// ==========================================================

const SUPABASE_URL =
    'https://mtqjsmcfsouxhfxrjrkx.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_YA8jN2YWu30ofygmwnzEDg_4z1eZcOT';

const APP_URL =
    'https://memorias-invisiveis.vercel.app/';

const supabase =
    createClient(
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


// ==========================================================
// ESTADO
// ==========================================================

let currentUser = null;
let activeFamily = null;
let authMode = 'login';


// ==========================================================
// ESTILOS DA AUTENTICAÇÃO
// ==========================================================

function injectAuthStyles() {

    if (
        document.getElementById(
            'mi-auth-styles'
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            'style'
        );

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
            gap: 8px;

            color:
                var(--primary);

        }


        .mi-auth-user-icon {

            width: 34px;
            height: 34px;

            flex: 0 0 34px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background:
                var(--secondary);

            color:
                var(--primary);

        }


        .mi-auth-user-text {

            display: flex;
            flex-direction: column;

            line-height: 1.15;

            min-width: 0;

        }


        .mi-auth-user-text strong {

            color:
                var(--primary);

            font-size:
                0.82rem;

            font-weight:
                700;

            max-width:
                150px;

            overflow:
                hidden;

            text-overflow:
                ellipsis;

            white-space:
                nowrap;

        }


        .mi-auth-user-text small {

            color:
                var(--gray);

            font-size:
                0.65rem;

            max-width:
                150px;

            overflow:
                hidden;

            text-overflow:
                ellipsis;

            white-space:
                nowrap;

        }


        .mi-auth-logout {

            padding:
                7px 11px;

            border-radius:
                999px;

            background:
                var(--secondary);

            color:
                var(--primary);

            font-size:
                0.76rem;

            font-weight:
                600;

            transition:
                var(--transition);

        }


        .mi-auth-logout:hover {

            background:
                #dfc5a6;

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
                min(
                    100%,
                    460px
                );

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

            position: absolute;

            top: 14px;
            right: 14px;

            width: 38px;
            height: 38px;

            border: 0;
            border-radius: 50%;

            background:
                var(--secondary);

            cursor: pointer;

            font-size:
                1rem;

            color:
                var(--primary);

        }


        .mi-auth-tabs {

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 8px;

            margin-bottom:
                20px;

        }


        .mi-auth-tabs[hidden] {

            display: none;

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

            display: grid;

            gap: 14px;

        }


        .mi-auth-field {

            display: grid;

            gap: 6px;

        }


        .mi-auth-field[hidden] {

            display: none;

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

            width: 100%;

            border:
                1px solid
                rgba(0, 0, 0, 0.16);

            border-radius:
                10px;

            padding:
                12px 14px;

            font:
                inherit;

            box-sizing:
                border-box;

        }


        .mi-auth-field input:focus {

            outline:
                2px solid
                rgba(0, 0, 0, 0.08);

            border-color:
                var(--accent);

        }


        .mi-auth-forgot {

            justify-self: end;

            margin-top:
                -6px;

            padding: 0;

            border: 0;

            background:
                transparent;

            color:
                var(--accent);

            font: inherit;

            font-size:
                0.84rem;

            font-weight:
                600;

            cursor:
                pointer;

        }


        .mi-auth-forgot:hover {

            text-decoration:
                underline;

        }


        .mi-auth-secondary {

            justify-self: center;

            border: 0;

            background:
                transparent;

            color:
                var(--primary);

            font: inherit;

            font-size:
                0.86rem;

            font-weight:
                600;

            cursor:
                pointer;

            padding:
                4px 8px;

        }


        .mi-auth-secondary:hover {

            color:
                var(--accent);

            text-decoration:
                underline;

        }


        .mi-auth-submit {

            margin-top:
                4px;

            border: 0;

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

                width: 100%;

                align-items:
                    flex-start;

                flex-wrap:
                    wrap;

            }


            .mi-auth-user-text {

                flex: 1;

            }


            .mi-auth-user-text strong,
            .mi-auth-user-text small {

                max-width:
                    100%;

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


            <div
                class="mi-auth-tabs"
                id="miAuthTabs"
            >

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


                <div
                    class="mi-auth-field"
                    id="miEmailField"
                >

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


                <div
                    class="mi-auth-field"
                    id="miPasswordField"
                >

                    <label
                        for="miAuthPassword"
                        id="miPasswordLabel"
                    >

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
                    class="mi-auth-field"
                    id="miPasswordConfirmField"
                    hidden
                >

                    <label for="miAuthPasswordConfirm">

                        Confirmar nova senha

                    </label>


                    <input
                        id="miAuthPasswordConfirm"
                        type="password"
                        autocomplete="new-password"
                        minlength="6"
                    >

                </div>


                <button
                    type="button"
                    class="mi-auth-forgot"
                    id="miAuthForgot"
                >

                    Esqueci minha senha

                </button>


                <div
                    class="mi-auth-message"
                    id="miAuthMessage"
                    role="status"
                    aria-live="polite"
                ></div>


                <button
                    type="submit"
                    class="mi-auth-submit"
                    id="miAuthSubmit"
                    data-mode="login"
                >

                    Entrar

                </button>


                <button
                    type="button"
                    class="mi-auth-secondary"
                    id="miAuthBackToLogin"
                    hidden
                >

                    Voltar para o login

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

        title:
            document.getElementById(
                'miAuthTitle'
            ),

        tabsContainer:
            document.getElementById(
                'miAuthTabs'
            ),

        nameField:
            document.getElementById(
                'miNameField'
            ),

        name:
            document.getElementById(
                'miAuthName'
            ),

        emailField:
            document.getElementById(
                'miEmailField'
            ),

        email:
            document.getElementById(
                'miAuthEmail'
            ),

        passwordField:
            document.getElementById(
                'miPasswordField'
            ),

        passwordLabel:
            document.getElementById(
                'miPasswordLabel'
            ),

        password:
            document.getElementById(
                'miAuthPassword'
            ),

        passwordConfirmField:
            document.getElementById(
                'miPasswordConfirmField'
            ),

        passwordConfirm:
            document.getElementById(
                'miAuthPasswordConfirm'
            ),

        forgot:
            document.getElementById(
                'miAuthForgot'
            ),

        backToLogin:
            document.getElementById(
                'miAuthBackToLogin'
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
// MENSAGENS
// ==========================================================

function clearAuthMessage() {

    const {
        message
    } =
        getAuthElements();

    if (!message) {
        return;
    }

    message.textContent =
        '';

    message.className =
        'mi-auth-message';

}


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
// MODAL
// ==========================================================

function openAuthModal(
    mode = null
) {

    const {
        backdrop,
        email,
        password
    } =
        getAuthElements();

    if (!backdrop) {
        return;
    }

    if (mode) {

        setAuthMode(
            mode
        );

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

            if (
                authMode ===
                'recovery_update'
            ) {

                password?.focus();

            } else {

                email?.focus();

            }

        },
        50
    );

}


function closeAuthModal() {

    const {
        backdrop
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

    clearAuthMessage();

}


// ==========================================================
// MODO DA AUTENTICAÇÃO
// ==========================================================

function setAuthMode(
    mode
) {

    const validModes = [
        'login',
        'signup',
        'recovery_request',
        'recovery_update'
    ];

    authMode =
        validModes.includes(
            mode
        )
            ? mode
            : 'login';

    const {
        tabs,
        tabsContainer,
        title,
        intro,
        nameField,
        name,
        emailField,
        email,
        passwordField,
        passwordLabel,
        password,
        passwordConfirmField,
        passwordConfirm,
        forgot,
        backToLogin,
        submit
    } =
        getAuthElements();

    clearAuthMessage();

    const signup =
        authMode ===
        'signup';

    const login =
        authMode ===
        'login';

    const recoveryRequest =
        authMode ===
        'recovery_request';

    const recoveryUpdate =
        authMode ===
        'recovery_update';


    tabs.forEach(
        function (tab) {

            tab.classList.toggle(
                'is-active',
                tab.dataset.authMode ===
                    authMode
            );

        }
    );


    if (tabsContainer) {

        tabsContainer.hidden =
            recoveryRequest ||
            recoveryUpdate;

    }


    if (nameField) {

        nameField.hidden =
            !signup;

    }


    if (name) {

        name.required =
            signup;

    }


    if (emailField) {

        emailField.hidden =
            recoveryUpdate;

    }


    if (email) {

        email.required =
            !recoveryUpdate;

    }


    if (passwordField) {

        passwordField.hidden =
            recoveryRequest;

    }


    if (password) {

        password.required =
            !recoveryRequest;

        password.value =
            '';

        password.autocomplete =
            signup ||
            recoveryUpdate
                ? 'new-password'
                : 'current-password';

    }


    if (passwordLabel) {

        passwordLabel.textContent =
            recoveryUpdate
                ? 'Nova senha'
                : 'Senha';

    }


    if (passwordConfirmField) {

        passwordConfirmField.hidden =
            !recoveryUpdate;

    }


    if (passwordConfirm) {

        passwordConfirm.required =
            recoveryUpdate;

        passwordConfirm.value =
            '';

    }


    if (forgot) {

        forgot.hidden =
            !login;

    }


    if (backToLogin) {

        backToLogin.hidden =
            !recoveryRequest;

    }


    if (title) {

        if (recoveryRequest) {

            title.textContent =
                'Recuperar acesso';

        } else if (recoveryUpdate) {

            title.textContent =
                'Defina sua nova senha';

        } else {

            title.textContent =
                'Acesse seu acervo';

        }

    }


    if (intro) {

        if (signup) {

            intro.textContent =
                'Crie sua conta para começar a construir um acervo familiar.';

        } else if (recoveryRequest) {

            intro.textContent =
                'Informe o e-mail da sua conta. Enviaremos um link para você definir uma nova senha.';

        } else if (recoveryUpdate) {

            intro.textContent =
                'Crie uma nova senha para voltar a acessar seu acervo familiar.';

        } else {

            intro.textContent =
                'Entre com seu e-mail e senha para acessar seu acervo familiar.';

        }

    }


    if (submit) {

        submit.dataset.mode =
            authMode;

        if (signup) {

            submit.textContent =
                'Criar conta';

        } else if (recoveryRequest) {

            submit.textContent =
                'Enviar link de recuperação';

        } else if (recoveryUpdate) {

            submit.textContent =
                'Salvar nova senha';

        } else {

            submit.textContent =
                'Entrar';

        }

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
// NOME DO USUÁRIO
// ==========================================================

function getCurrentUserDisplayName() {

    if (!currentUser) {
        return 'Usuário';
    }


    const metadataName =
        String(
            currentUser
                ?.user_metadata
                ?.full_name
            ||
            ''
        ).trim();


    if (metadataName) {
        return metadataName;
    }


    const metadataNameAlternative =
        String(
            currentUser
                ?.user_metadata
                ?.name
            ||
            ''
        ).trim();


    if (metadataNameAlternative) {
        return metadataNameAlternative;
    }


    const email =
        String(
            currentUser.email || ''
        );


    if (email.includes('@')) {

        const firstPart =
            email
                .split('@')[0]
                .trim();

        if (firstPart) {

            return firstPart;

        }

    }


    return 'Usuário';

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


        document
            .getElementById(
                'miAuthOpen'
            )
            ?.addEventListener(
                'click',
                function () {

                    openAuthModal(
                        'login'
                    );

                }
            );


        return;

    }


    const familyName =
        activeFamily
            ?.families
            ?.name
        ||
        'Acervo familiar';


    const displayName =
        getCurrentUserDisplayName();


    slot.innerHTML = `

        <div class="mi-auth-user">

            <div
                class="mi-auth-user-icon"
                aria-hidden="true"
            >

                <i class="fas fa-user"></i>

            </div>


            <div class="mi-auth-user-text">

                <strong>

                    ${escapeForAuth(
                        displayName
                    )}

                </strong>


                <small>

                    ${escapeForAuth(
                        familyName
                    )}

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


    document
        .getElementById(
            'miAuthLogout'
        )
        ?.addEventListener(
            'click',
            async function () {

                const {
                    error
                } =
                    await supabase
                        .auth
                        .signOut();


                if (error) {

                    console.error(
                        'Erro ao sair:',
                        error
                    );

                }

            }
        );

}


// ==========================================================
// MENSAGENS DE ERRO
// ==========================================================

function authErrorMessage(
    error
) {

    const message =
        String(
            error?.message || ''
        ).toLowerCase();


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
            'same password'
        )
    ) {

        return (
            'A nova senha precisa ser diferente da senha atual.'
        );

    }


    if (
        message.includes(
            'rate limit'
        ) ||
        message.includes(
            'security purposes'
        )
    ) {

        return (
            'Aguarde um pouco antes de solicitar outro e-mail de recuperação.'
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
// RECUPERAÇÃO DE SENHA
// ==========================================================

async function requestPasswordRecovery(
    emailValue
) {

    const {
        error
    } =
        await supabase
            .auth
            .resetPasswordForEmail(
                emailValue,
                {
                    redirectTo:
                        APP_URL
                }
            );


    if (error) {
        throw error;
    }


    /*
     * A mensagem é propositalmente neutra.
     *
     * Não informamos se o e-mail existe ou não,
     * evitando enumeração de usuários.
     */

    showAuthMessage(
        'Se existir uma conta associada a este e-mail, você receberá um link para redefinir sua senha.',
        'success'
    );

}


async function updateRecoveredPassword(
    passwordValue,
    passwordConfirmValue
) {

    if (
        !passwordValue ||
        !passwordConfirmValue
    ) {

        showAuthMessage(
            'Informe e confirme a nova senha.'
        );

        return false;

    }


    if (
        passwordValue.length < 6
    ) {

        showAuthMessage(
            'A nova senha deve ter pelo menos 6 caracteres.'
        );

        return false;

    }


    if (
        passwordValue !==
        passwordConfirmValue
    ) {

        showAuthMessage(
            'As senhas informadas não coincidem.'
        );

        return false;

    }


    const {
        error
    } =
        await supabase
            .auth
            .updateUser({
                password:
                    passwordValue
            });


    if (error) {
        throw error;
    }


    showAuthMessage(
        'Senha atualizada com sucesso. Seu acesso foi recuperado.',
        'success'
    );


    return true;

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
        passwordConfirm,
        submit
    } =
        getAuthElements();


    const mode =
        submit
            ?.dataset
            ?.mode
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


    const passwordConfirmValue =
        passwordConfirm
            ?.value
        ||
        '';


    clearAuthMessage();


    // ======================================================
    // RECUPERAÇÃO — SOLICITAR LINK
    // ======================================================

    if (
        mode ===
        'recovery_request'
    ) {

        if (!emailValue) {

            showAuthMessage(
                'Informe seu e-mail.'
            );

            return;

        }


        if (submit) {

            submit.disabled =
                true;

        }


        try {

            await requestPasswordRecovery(
                emailValue
            );

        } catch (error) {

            console.error(
                'Erro ao solicitar recuperação de senha:',
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


        return;

    }


    // ======================================================
    // RECUPERAÇÃO — DEFINIR NOVA SENHA
    // ======================================================

    if (
        mode ===
        'recovery_update'
    ) {

        if (submit) {

            submit.disabled =
                true;

        }


        try {

            const updated =
                await updateRecoveredPassword(
                    passwordValue,
                    passwordConfirmValue
                );


            if (updated) {

                setTimeout(
                    closeAuthModal,
                    1400
                );

            }

        } catch (error) {

            console.error(
                'Erro ao atualizar senha:',
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


        return;

    }


    // ======================================================
    // LOGIN / CADASTRO
    // ======================================================

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

        // ==================================================
        // CADASTRO
        // ==================================================

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


            if (!fullName) {

                showAuthMessage(
                    'Informe seu nome.'
                );

                return;

            }


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
                                APP_URL

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


            return;

        }


        // ==================================================
        // LOGIN
        // ==================================================

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
        tabs,
        forgot,
        backToLogin
    } =
        getAuthElements();


    open?.addEventListener(
        'click',
        function () {

            openAuthModal(
                'login'
            );

        }
    );


    close?.addEventListener(
        'click',
        closeAuthModal
    );


    form?.addEventListener(
        'submit',
        handleAuthSubmit
    );


    forgot?.addEventListener(
        'click',
        function () {

            setAuthMode(
                'recovery_request'
            );

        }
    );


    backToLogin?.addEventListener(
        'click',
        function () {

            setAuthMode(
                'login'
            );

        }
    );


    backdrop?.addEventListener(
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
                        tab.dataset
                            .authMode
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
// EVENTO DE ALTERAÇÃO DE AUTENTICAÇÃO
// ==========================================================

async function processAuthStateChange(
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


    /*
     * PASSWORD_RECOVERY é disparado quando o usuário
     * retorna ao aplicativo pelo link enviado pelo Supabase.
     *
     * Nesse momento existe uma sessão temporária válida
     * para permitir a alteração da senha.
     */

    if (
        event ===
        'PASSWORD_RECOVERY'
    ) {

        openAuthModal(
            'recovery_update'
        );

    }


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


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function initializeAuth() {

    injectAuthStyles();

    injectAuthUI();

    bindAuthEvents();


    /*
     * Registramos o listener antes da leitura inicial
     * da sessão para não perder eventos de retorno
     * provenientes de links de autenticação.
     */

    supabase
        .auth
        .onAuthStateChange(
            function (
                event,
                session
            ) {

                /*
                 * O processamento é deslocado para a próxima
                 * tarefa para evitar chamadas assíncronas
                 * adicionais dentro do callback interno
                 * do cliente de autenticação.
                 */

                setTimeout(
                    function () {

                        processAuthStateChange(
                            event,
                            session
                        )
                            .catch(
                                function (error) {

                                    console.error(
                                        'Erro ao processar mudança de autenticação:',
                                        error
                                    );

                                }
                            );

                    },
                    0
                );

            }
        );


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
            function () {

                openAuthModal(
                    'login'
                );

            },

        openPasswordRecovery:
            function () {

                openAuthModal(
                    'recovery_request'
                );

            }

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

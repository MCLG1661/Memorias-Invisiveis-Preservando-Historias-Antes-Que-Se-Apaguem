// ==========================================================
// MEMÓRIAS INVISÍVEIS
// FASE 6 — PESSOAS & FAMÍLIA
//
// Responsabilidades:
// - Listar pessoas do acervo familiar
// - Cadastrar familiares
// - Editar familiares
// - Impedir duplicidades simples
// - Disponibilizar familiares no formulário de memórias
// - Atualizar automaticamente a lista de pessoas
// ==========================================================


// ==========================================================
// ESTADO
// ==========================================================

let familyPeople = [];
let familyModuleInitialized = false;
let familyLoading = false;
let editingPersonId = null;


// ==========================================================
// HELPERS AUTH
// ==========================================================

function getFamilyAuthController() {
    return window.MemoriasInvisiveisAuth || null;
}


function getFamilySupabase() {
    return getFamilyAuthController()?.supabase || null;
}


function getFamilyCurrentUser() {
    const auth = getFamilyAuthController();

    if (!auth || typeof auth.getUser !== 'function') {
        return null;
    }

    return auth.getUser();
}


function getFamilyActiveFamily() {
    const auth = getFamilyAuthController();

    if (!auth || typeof auth.getActiveFamily !== 'function') {
        return null;
    }

    return auth.getActiveFamily();
}


function getFamilyActiveFamilyId() {
    const family = getFamilyActiveFamily();

    return (
        family?.family_id ||
        family?.families?.id ||
        null
    );
}


function getFamilyActiveFamilyName() {
    const family = getFamilyActiveFamily();

    return (
        family?.families?.name ||
        'Minha Família'
    );
}


// ==========================================================
// ESCAPE
// ==========================================================

function familyEscapeHTML(value) {
    const div = document.createElement('div');

    div.textContent = value ?? '';

    return div.innerHTML;
}


// ==========================================================
// DATA
// ==========================================================

function familyFormatDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('pt-BR').format(date);
}


// ==========================================================
// NOME DA PESSOA
// ==========================================================

function familyDisplayName(person) {
    if (!person) {
        return '';
    }

    const preferred =
        String(person.preferred_name || '').trim();

    if (preferred) {
        return preferred;
    }

    return familyFullName(person);
}


function familyFullName(person) {
    if (!person) {
        return '';
    }

    return [
        person.first_name,
        person.last_name
    ]
        .filter(Boolean)
        .join(' ')
        .trim();
}


// ==========================================================
// NORMALIZAÇÃO
// ==========================================================

function normalizeFamilyPersonName(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
}


// ==========================================================
// DUPLICIDADE
// ==========================================================

function familyPersonExists(
    firstName,
    lastName,
    ignoredPersonId = null
) {
    const target =
        normalizeFamilyPersonName(
            [firstName, lastName]
                .filter(Boolean)
                .join(' ')
        );

    return familyPeople.some(
        function (person) {
            if (
                ignoredPersonId &&
                person.id === ignoredPersonId
            ) {
                return false;
            }

            const existing =
                normalizeFamilyPersonName(
                    familyFullName(person)
                );

            return existing === target;
        }
    );
}


// ==========================================================
// ESTILOS
// ==========================================================

function injectFamilyStyles() {
    if (
        document.getElementById(
            'mi-family-styles'
        )
    ) {
        return;
    }

    const style =
        document.createElement('style');

    style.id =
        'mi-family-styles';

    style.textContent = `

        .mi-family-section {
            background: #ffffff;
        }

        .mi-family-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .mi-family-summary {
            color: var(--gray);
            font-size: 0.95rem;
        }

        .mi-family-add-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;

            border: 0;
            border-radius: 999px;

            padding: 12px 18px;

            background: var(--accent);
            color: #ffffff;

            font: inherit;
            font-weight: 700;

            cursor: pointer;
            transition: var(--transition);
        }

        .mi-family-add-button:hover {
            background: var(--accent-light);
            transform: translateY(-2px);
        }

        .mi-family-grid {
            display: grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(230px, 1fr)
                );

            gap: 20px;
        }

        .mi-person-card {
            background: var(--light);

            border:
                1px solid
                rgba(0, 0, 0, 0.08);

            border-radius: 18px;

            padding: 22px;

            box-shadow:
                0 10px 30px
                rgba(0, 0, 0, 0.05);

            transition: var(--transition);

            display: flex;
            flex-direction: column;
        }

        .mi-person-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow);
        }

        .mi-person-avatar {
            width: 56px;
            height: 56px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background: var(--secondary);
            color: var(--primary);

            font-size: 1.25rem;

            margin-bottom: 16px;
        }

        .mi-person-card h3 {
            margin: 0 0 6px;

            color: var(--primary);

            font-family:
                'Playfair Display',
                serif;
        }

        .mi-person-preferred {
            color: var(--accent);

            font-size: 0.9rem;
            font-weight: 600;

            margin-bottom: 12px;
        }

        .mi-person-meta {
            display: grid;
            gap: 7px;

            color: var(--gray);

            font-size: 0.88rem;
            line-height: 1.45;
        }

        .mi-person-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;

            margin-top: 20px;
            padding-top: 14px;

            border-top:
                1px solid
                rgba(45, 90, 122, 0.1);
        }

        .mi-person-edit {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;

            border: 0;
            background: transparent;

            color: var(--primary);

            font: inherit;
            font-size: 0.82rem;
            font-weight: 700;

            cursor: pointer;

            padding: 5px 0;
        }

        .mi-person-edit:hover {
            color: var(--accent);
        }

        .mi-family-empty {
            grid-column: 1 / -1;

            padding: 45px 30px;

            text-align: center;

            border:
                1px dashed
                rgba(0, 0, 0, 0.18);

            border-radius: 18px;

            color: var(--gray);
        }

        .mi-family-empty i {
            font-size: 2rem;

            margin-bottom: 15px;

            color: var(--secondary);
        }

        .mi-family-loading {
            grid-column: 1 / -1;

            padding: 40px;

            text-align: center;

            color: var(--gray);
        }

        .mi-family-backdrop {
            position: fixed;

            inset: 0;

            z-index: 10000;

            display: none;
            align-items: center;
            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, 0.55);
        }

        .mi-family-backdrop.is-open {
            display: flex;
        }

        .mi-family-modal {
            width:
                min(
                    100%,
                    560px
                );

            max-height: 90vh;

            overflow-y: auto;

            background: #ffffff;

            border-radius: 20px;

            padding: 28px;

            position: relative;

            box-shadow:
                0 24px 70px
                rgba(0, 0, 0, 0.25);
        }

        .mi-family-modal h2 {
            margin: 0 0 8px;

            color: var(--primary);

            font-family:
                'Playfair Display',
                serif;
        }

        .mi-family-modal-intro {
            margin: 0 0 22px;

            color: var(--gray);

            line-height: 1.6;
        }

        .mi-family-close {
            position: absolute;

            top: 14px;
            right: 14px;

            width: 38px;
            height: 38px;

            border: 0;
            border-radius: 50%;

            background: var(--secondary);
            color: var(--primary);

            cursor: pointer;
        }

        .mi-family-form {
            display: grid;
            gap: 16px;
        }

        .mi-family-form-grid {
            display: grid;

            grid-template-columns:
                repeat(
                    2,
                    minmax(0, 1fr)
                );

            gap: 14px;
        }

        .mi-family-field {
            display: grid;
            gap: 6px;
        }

        .mi-family-field.full {
            grid-column: 1 / -1;
        }

        .mi-family-field label {
            color: var(--primary);

            font-size: 0.9rem;
            font-weight: 600;
        }

        .mi-family-field input,
        .mi-family-field textarea {
            width: 100%;

            border:
                1px solid
                rgba(0, 0, 0, 0.16);

            border-radius: 10px;

            padding: 12px 14px;

            font: inherit;
        }

        .mi-family-field input:focus,
        .mi-family-field textarea:focus {
            outline: none;

            border-color: var(--accent);

            box-shadow:
                0 0 0 4px
                rgba(197, 110, 79, 0.1);
        }

        .mi-family-field textarea {
            min-height: 110px;
            resize: vertical;
        }

        .mi-family-submit {
            border: 0;
            border-radius: 10px;

            padding: 13px 18px;

            background: var(--accent);
            color: #ffffff;

            font: inherit;
            font-weight: 700;

            cursor: pointer;
        }

        .mi-family-submit:disabled {
            opacity: 0.65;
            cursor: wait;
        }

        .mi-family-message {
            display: none;

            padding: 10px 12px;

            border-radius: 10px;

            font-size: 0.88rem;
            line-height: 1.5;
        }

        .mi-family-message.is-visible {
            display: block;
        }

        .mi-family-message.success {
            background: #effaf2;
            color: #236b37;
        }

        .mi-family-message.error {
            background: #fff1f1;
            color: #9d2020;
        }

        .mi-memory-person-help {
            display: flex;

            align-items: center;
            justify-content: space-between;

            gap: 12px;

            flex-wrap: wrap;

            margin-top: 6px;
        }

        .mi-memory-person-help span {
            color: var(--gray);

            font-size: 0.78rem;
            line-height: 1.4;
        }

        .mi-memory-person-add {
            border: 0;
            background: transparent;

            color: var(--accent);

            font: inherit;
            font-size: 0.78rem;
            font-weight: 700;

            cursor: pointer;

            padding: 0;
        }

        .mi-memory-person-add:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {

            .mi-family-form-grid {
                grid-template-columns: 1fr;
            }

            .mi-family-field.full {
                grid-column: auto;
            }

            .mi-family-add-button {
                width: 100%;
            }

            .mi-memory-person-help {
                align-items: flex-start;
                flex-direction: column;
            }

        }

    `;

    document.head.appendChild(style);
}


// ==========================================================
// NAV
// ==========================================================

function injectFamilyNavLink() {
    const nav =
        document.querySelector(
            '.nav-links'
        );

    if (
        !nav ||
        document.getElementById(
            'miFamilyNavLink'
        )
    ) {
        return;
    }

    const link =
        document.createElement('a');

    link.id =
        'miFamilyNavLink';

    link.href =
        '#familia';

    link.textContent =
        'Minha Família';

    const archiveLink =
        Array.from(
            nav.querySelectorAll('a')
        ).find(
            function (item) {
                return (
                    item.getAttribute(
                        'href'
                    ) ===
                    '#acervo'
                );
            }
        );

    if (archiveLink) {
        archiveLink.insertAdjacentElement(
            'afterend',
            link
        );
    } else {
        nav.appendChild(link);
    }
}


// ==========================================================
// SEÇÃO MINHA FAMÍLIA
// ==========================================================

function injectFamilySection() {
    if (
        document.getElementById(
            'familia'
        )
    ) {
        return;
    }

    const archiveSection =
        document.getElementById(
            'acervo'
        );

    if (!archiveSection) {
        return;
    }

    const section =
        document.createElement('section');

    section.id =
        'familia';

    section.className =
        'mi-family-section';

    section.innerHTML = `

        <div class="container">

            <h2 class="section-title">
                Minha Família
            </h2>

            <p
                class="section-intro"
                id="miFamilyIntro"
            >
                Pessoas que fazem parte do seu acervo familiar.
            </p>

            <div class="mi-family-toolbar">

                <div
                    class="mi-family-summary"
                    id="miFamilySummary"
                >
                    Carregando pessoas...
                </div>

                <button
                    type="button"
                    class="mi-family-add-button"
                    id="miAddPersonButton"
                >
                    <i class="fas fa-user-plus"></i>
                    Adicionar familiar
                </button>

            </div>

            <div
                class="mi-family-grid"
                id="miFamilyGrid"
                aria-live="polite"
            ></div>

        </div>

    `;

    archiveSection.insertAdjacentElement(
        'afterend',
        section
    );
}


// ==========================================================
// MODAL
// ==========================================================

function injectFamilyModal() {
    if (
        document.getElementById(
            'miFamilyBackdrop'
        )
    ) {
        return;
    }

    const backdrop =
        document.createElement('div');

    backdrop.id =
        'miFamilyBackdrop';

    backdrop.className =
        'mi-family-backdrop';

    backdrop.setAttribute(
        'aria-hidden',
        'true'
    );

    backdrop.innerHTML = `

        <div
            class="mi-family-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="miFamilyModalTitle"
        >

            <button
                type="button"
                class="mi-family-close"
                id="miFamilyClose"
                aria-label="Fechar"
            >
                <i class="fas fa-xmark"></i>
            </button>

            <h2 id="miFamilyModalTitle">
                Adicionar familiar
            </h2>

            <p
                class="mi-family-modal-intro"
                id="miFamilyModalIntro"
            >
                Cadastre uma pessoa para começar a organizar
                as histórias do seu acervo familiar.
            </p>

            <form
                class="mi-family-form"
                id="miFamilyForm"
            >

                <div class="mi-family-form-grid">

                    <div class="mi-family-field">

                        <label for="miPersonFirstName">
                            Nome *
                        </label>

                        <input
                            type="text"
                            id="miPersonFirstName"
                            maxlength="100"
                            required
                        >

                    </div>

                    <div class="mi-family-field">

                        <label for="miPersonLastName">
                            Sobrenome
                        </label>

                        <input
                            type="text"
                            id="miPersonLastName"
                            maxlength="100"
                        >

                    </div>

                    <div class="mi-family-field">

                        <label for="miPersonPreferredName">
                            Nome pelo qual era conhecido(a)
                        </label>

                        <input
                            type="text"
                            id="miPersonPreferredName"
                            maxlength="100"
                        >

                    </div>

                    <div class="mi-family-field">

                        <label for="miPersonBirthDate">
                            Data de nascimento
                        </label>

                        <input
                            type="date"
                            id="miPersonBirthDate"
                        >

                    </div>

                    <div class="mi-family-field full">

                        <label for="miPersonBirthPlace">
                            Local de nascimento
                        </label>

                        <input
                            type="text"
                            id="miPersonBirthPlace"
                            maxlength="160"
                            placeholder="Ex.: Rio de Janeiro, RJ"
                        >

                    </div>

                    <div class="mi-family-field full">

                        <label for="miPersonBiography">
                            Breve descrição
                        </label>

                        <textarea
                            id="miPersonBiography"
                            maxlength="1000"
                            placeholder="Ex.: Avó materna, professora, conhecida pelas histórias da infância..."
                        ></textarea>

                    </div>

                </div>

                <div
                    class="mi-family-message"
                    id="miFamilyMessage"
                    role="status"
                ></div>

                <button
                    type="submit"
                    class="mi-family-submit"
                    id="miFamilySubmit"
                >
                    Adicionar ao acervo
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

function getFamilyElements() {
    return {
        grid:
            document.getElementById(
                'miFamilyGrid'
            ),

        summary:
            document.getElementById(
                'miFamilySummary'
            ),

        intro:
            document.getElementById(
                'miFamilyIntro'
            ),

        addButton:
            document.getElementById(
                'miAddPersonButton'
            ),

        backdrop:
            document.getElementById(
                'miFamilyBackdrop'
            ),

        close:
            document.getElementById(
                'miFamilyClose'
            ),

        form:
            document.getElementById(
                'miFamilyForm'
            ),

        modalTitle:
            document.getElementById(
                'miFamilyModalTitle'
            ),

        modalIntro:
            document.getElementById(
                'miFamilyModalIntro'
            ),

        firstName:
            document.getElementById(
                'miPersonFirstName'
            ),

        lastName:
            document.getElementById(
                'miPersonLastName'
            ),

        preferredName:
            document.getElementById(
                'miPersonPreferredName'
            ),

        birthDate:
            document.getElementById(
                'miPersonBirthDate'
            ),

        birthPlace:
            document.getElementById(
                'miPersonBirthPlace'
            ),

        biography:
            document.getElementById(
                'miPersonBiography'
            ),

        message:
            document.getElementById(
                'miFamilyMessage'
            ),

        submit:
            document.getElementById(
                'miFamilySubmit'
            )
    };
}


// ==========================================================
// RESET DO FORMULÁRIO
// ==========================================================

function resetFamilyFormState() {
    editingPersonId = null;

    const {
        form,
        modalTitle,
        modalIntro,
        submit,
        message
    } =
        getFamilyElements();

    form?.reset();

    if (modalTitle) {
        modalTitle.textContent =
            'Adicionar familiar';
    }

    if (modalIntro) {
        modalIntro.textContent =
            'Cadastre uma pessoa para começar a organizar as histórias do seu acervo familiar.';
    }

    if (submit) {
        submit.textContent =
            'Adicionar ao acervo';
    }

    if (message) {
        message.textContent = '';

        message.className =
            'mi-family-message';
    }
}


// ==========================================================
// ABRIR MODAL PARA CADASTRO
// ==========================================================

function openFamilyModal() {
    if (
        !getFamilyCurrentUser() ||
        !getFamilyActiveFamilyId()
    ) {
        window.alert(
            'Entre em sua conta para gerenciar sua família.'
        );

        return;
    }

    resetFamilyFormState();

    const {
        backdrop,
        firstName
    } =
        getFamilyElements();

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
            firstName?.focus();
        },
        50
    );
}


// ==========================================================
// ABRIR MODAL PARA EDIÇÃO
// ==========================================================

function openEditPersonModal(personId) {
    const person =
        familyPeople.find(
            function (item) {
                return item.id === personId;
            }
        );

    if (!person) {
        window.alert(
            'Não foi possível localizar este familiar.'
        );

        return;
    }

    const {
        backdrop,
        modalTitle,
        modalIntro,
        firstName,
        lastName,
        preferredName,
        birthDate,
        birthPlace,
        biography,
        submit,
        message
    } =
        getFamilyElements();

    if (!backdrop) {
        return;
    }

    editingPersonId =
        person.id;

    if (modalTitle) {
        modalTitle.textContent =
            'Editar familiar';
    }

    if (modalIntro) {
        modalIntro.textContent =
            'Atualize os dados desta pessoa. As memórias já vinculadas continuarão associadas ao mesmo familiar.';
    }

    if (firstName) {
        firstName.value =
            person.first_name || '';
    }

    if (lastName) {
        lastName.value =
            person.last_name || '';
    }

    if (preferredName) {
        preferredName.value =
            person.preferred_name || '';
    }

    if (birthDate) {
        birthDate.value =
            person.birth_date || '';
    }

    if (birthPlace) {
        birthPlace.value =
            person.birth_place || '';
    }

    if (biography) {
        biography.value =
            person.biography || '';
    }

    if (submit) {
        submit.textContent =
            'Salvar alterações';
    }

    if (message) {
        message.textContent = '';

        message.className =
            'mi-family-message';
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
            firstName?.focus();
        },
        50
    );
}


// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeFamilyModal() {
    const {
        backdrop
    } =
        getFamilyElements();

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

    resetFamilyFormState();
}


// ==========================================================
// MENSAGEM
// ==========================================================

function showFamilyMessage(
    text,
    type = 'error'
) {
    const {
        message
    } =
        getFamilyElements();

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        `mi-family-message is-visible ${type}`;
}


// ==========================================================
// AUTOCOMPLETE DO FORMULÁRIO DE MEMÓRIA
// ==========================================================

function ensureMemoryPersonAutocomplete() {
    const memoryPerson =
        document.getElementById(
            'memoryPerson'
        );

    if (!memoryPerson) {
        return;
    }

    let dataList =
        document.getElementById(
            'miFamilyPeopleList'
        );

    if (!dataList) {
        dataList =
            document.createElement(
                'datalist'
            );

        dataList.id =
            'miFamilyPeopleList';

        document.body.appendChild(
            dataList
        );
    }

    memoryPerson.setAttribute(
        'list',
        'miFamilyPeopleList'
    );

    memoryPerson.setAttribute(
        'autocomplete',
        'off'
    );

    memoryPerson.setAttribute(
        'placeholder',
        familyPeople.length > 0
            ? 'Selecione ou digite o nome de um familiar'
            : 'Digite o nome da pessoa'
    );

    dataList.innerHTML = '';

    familyPeople.forEach(
        function (person) {
            const name =
                familyFullName(person) ||
                familyDisplayName(person);

            if (!name) {
                return;
            }

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                name;

            if (person.preferred_name) {
                option.label =
                    `Conhecido(a) como ${person.preferred_name}`;
            }

            dataList.appendChild(
                option
            );
        }
    );

    ensureMemoryPersonHelp();
}


// ==========================================================
// AJUDA ABAIXO DO CAMPO PESSOA
// ==========================================================

function ensureMemoryPersonHelp() {
    const memoryPerson =
        document.getElementById(
            'memoryPerson'
        );

    if (!memoryPerson) {
        return;
    }

    const formGroup =
        memoryPerson.closest(
            '.form-group'
        );

    if (
        !formGroup ||
        document.getElementById(
            'miMemoryPersonHelp'
        )
    ) {
        return;
    }

    const helper =
        document.createElement(
            'div'
        );

    helper.id =
        'miMemoryPersonHelp';

    helper.className =
        'mi-memory-person-help';

    helper.innerHTML = `

        <span id="miMemoryPersonHint">
            Selecione um familiar já cadastrado
            ou digite um novo nome.
        </span>

        <button
            type="button"
            class="mi-memory-person-add"
            id="miMemoryPersonAdd"
        >
            <i class="fas fa-user-plus"></i>
            Cadastrar familiar
        </button>

    `;

    formGroup.appendChild(
        helper
    );

    document
        .getElementById(
            'miMemoryPersonAdd'
        )
        ?.addEventListener(
            'click',
            openFamilyModal
        );
}


// ==========================================================
// ATUALIZAR AUTOCOMPLETE
// ==========================================================

function refreshMemoryPersonAutocomplete() {
    ensureMemoryPersonAutocomplete();

    const hint =
        document.getElementById(
            'miMemoryPersonHint'
        );

    if (!hint) {
        return;
    }

    if (!getFamilyCurrentUser()) {
        hint.textContent =
            'Entre em sua conta para selecionar pessoas do acervo familiar.';

        return;
    }

    if (familyPeople.length === 0) {
        hint.textContent =
            'Nenhum familiar cadastrado ainda. Você pode digitar um nome ou cadastrar uma pessoa.';

        return;
    }

    hint.textContent =
        familyPeople.length === 1
            ? '1 familiar disponível para seleção. Você também pode digitar um novo nome.'
            : `${familyPeople.length} familiares disponíveis para seleção. Você também pode digitar um novo nome.`;
}


// ==========================================================
// CARREGAR PESSOAS
// ==========================================================

async function loadFamilyPeople() {
    const supabase =
        getFamilySupabase();

    const user =
        getFamilyCurrentUser();

    const familyId =
        getFamilyActiveFamilyId();

    const {
        grid,
        summary,
        intro
    } =
        getFamilyElements();

    if (!grid || !summary) {
        return;
    }

    if (
        !supabase ||
        !user ||
        !familyId
    ) {
        familyPeople = [];

        summary.textContent =
            'Entre em sua conta para acessar sua família.';

        if (intro) {
            intro.textContent =
                'Cadastre e organize as pessoas que fazem parte das suas histórias.';
        }

        renderFamilyPeople();
        refreshMemoryPersonAutocomplete();

        return;
    }

    familyLoading = true;

    renderFamilyPeople();

    const {
        data,
        error
    } =
        await supabase
            .from('people')
            .select(`
                id,
                family_id,
                first_name,
                last_name,
                preferred_name,
                birth_date,
                death_date,
                birth_place,
                biography,
                created_by,
                created_at,
                updated_at
            `)
            .eq(
                'family_id',
                familyId
            )
            .order(
                'first_name',
                {
                    ascending: true
                }
            );

    familyLoading = false;

    if (error) {
        console.error(
            'Erro ao carregar pessoas:',
            error
        );

        summary.textContent =
            'Não foi possível carregar os familiares.';

        renderFamilyPeople();
        refreshMemoryPersonAutocomplete();

        return;
    }

    familyPeople =
        data || [];

    if (intro) {
        intro.textContent =
            `Pessoas cadastradas no acervo ${getFamilyActiveFamilyName()}.`;
    }

    summary.textContent =
        familyPeople.length === 1
            ? '1 pessoa cadastrada'
            : `${familyPeople.length} pessoas cadastradas`;

    renderFamilyPeople();
    refreshMemoryPersonAutocomplete();

    window.dispatchEvent(
        new CustomEvent(
            'memorias-invisiveis:people-change',
            {
                detail: {
                    people:
                        familyPeople
                }
            }
        )
    );
}


// ==========================================================
// RENDER
// ==========================================================

function renderFamilyPeople() {
    const {
        grid
    } =
        getFamilyElements();

    if (!grid) {
        return;
    }

    if (familyLoading) {
        grid.innerHTML = `

            <div class="mi-family-loading">
                <i class="fas fa-spinner fa-spin"></i>
                Carregando sua família...
            </div>

        `;

        return;
    }

    if (
        familyPeople.length === 0
    ) {
        grid.innerHTML = `

            <div class="mi-family-empty">

                <i class="fas fa-users"></i>

                <h3>
                    Sua família começa aqui
                </h3>

                <p>
                    Cadastre a primeira pessoa do acervo
                    para começar a organizar suas histórias.
                </p>

            </div>

        `;

        return;
    }

    grid.innerHTML = '';

    familyPeople.forEach(
        function (person) {
            const card =
                document.createElement(
                    'article'
                );

            card.className =
                'mi-person-card';

            const displayName =
                familyDisplayName(
                    person
                );

            const fullName =
                familyFullName(
                    person
                );

            const preferredLine =
                person.preferred_name &&
                person.preferred_name !== fullName
                    ? `
                        <div class="mi-person-preferred">
                            ${familyEscapeHTML(
                                person.preferred_name
                            )}
                        </div>
                    `
                    : '';

            const fullNameLine =
                fullName &&
                displayName !== fullName
                    ? `
                        <div>
                            <i class="fas fa-id-card"></i>
                            ${familyEscapeHTML(fullName)}
                        </div>
                    `
                    : '';

            const birthLine =
                person.birth_date
                    ? `
                        <div>
                            <i class="fas fa-cake-candles"></i>
                            Nascimento:
                            ${familyEscapeHTML(
                                familyFormatDate(
                                    person.birth_date
                                )
                            )}
                        </div>
                    `
                    : '';

            const placeLine =
                person.birth_place
                    ? `
                        <div>
                            <i class="fas fa-location-dot"></i>
                            ${familyEscapeHTML(
                                person.birth_place
                            )}
                        </div>
                    `
                    : '';

            const biographyLine =
                person.biography
                    ? `
                        <div>
                            <i class="fas fa-book-open"></i>
                            ${familyEscapeHTML(
                                person.biography
                            )}
                        </div>
                    `
                    : '';

            card.innerHTML = `

                <div class="mi-person-avatar">
                    <i class="fas fa-user"></i>
                </div>

                <h3>
                    ${familyEscapeHTML(
                        displayName
                    )}
                </h3>

                ${preferredLine}

                <div class="mi-person-meta">

                    ${fullNameLine}

                    ${birthLine}

                    ${placeLine}

                    ${biographyLine}

                </div>

                <div class="mi-person-actions">

                    <button
                        type="button"
                        class="mi-person-edit"
                        data-edit-person="${familyEscapeHTML(
                            person.id
                        )}"
                    >
                        <i class="fas fa-pen"></i>
                        Editar
                    </button>

                </div>

            `;

            card
                .querySelector(
                    '[data-edit-person]'
                )
                ?.addEventListener(
                    'click',
                    function () {
                        openEditPersonModal(
                            person.id
                        );
                    }
                );

            grid.appendChild(
                card
            );
        }
    );
}


// ==========================================================
// SUBMIT — CADASTRO OU EDIÇÃO
// ==========================================================

async function handleFamilySubmit(
    event
) {
    event.preventDefault();

    const supabase =
        getFamilySupabase();

    const user =
        getFamilyCurrentUser();

    const familyId =
        getFamilyActiveFamilyId();

    const {
        firstName,
        lastName,
        preferredName,
        birthDate,
        birthPlace,
        biography,
        submit
    } =
        getFamilyElements();

    if (
        !supabase ||
        !user ||
        !familyId
    ) {
        showFamilyMessage(
            'Não foi possível identificar seu acervo familiar.'
        );

        return;
    }

    const first =
        firstName?.value.trim() || '';

    const last =
        lastName?.value.trim() || '';

    const preferred =
        preferredName?.value.trim() || '';

    const birth =
        birthDate?.value || null;

    const place =
        birthPlace?.value.trim() || '';

    const bio =
        biography?.value.trim() || '';

    if (!first) {
        showFamilyMessage(
            'Informe o nome da pessoa.'
        );

        return;
    }

    if (
        familyPersonExists(
            first,
            last,
            editingPersonId
        )
    ) {
        showFamilyMessage(
            'Já existe uma pessoa com esse nome neste acervo.'
        );

        return;
    }

    if (submit) {
        submit.disabled = true;
    }

    try {
        // ==================================================
        // EDIÇÃO
        // ==================================================

        if (editingPersonId) {
            const {
                error
            } =
                await supabase
                    .from('people')
                    .update({
                        first_name:
                            first,

                        last_name:
                            last || null,

                        preferred_name:
                            preferred || null,

                        birth_date:
                            birth,

                        birth_place:
                            place || null,

                        biography:
                            bio || null
                    })
                    .eq(
                        'id',
                        editingPersonId
                    )
                    .eq(
                        'family_id',
                        familyId
                    );

            if (error) {
                throw error;
            }

            showFamilyMessage(
                'Dados do familiar atualizados com sucesso.',
                'success'
            );

            await loadFamilyPeople();

            setTimeout(
                closeFamilyModal,
                700
            );

            return;
        }


        // ==================================================
        // CADASTRO
        // ==================================================

        const {
            data,
            error
        } =
            await supabase
                .from('people')
                .insert({
                    family_id:
                        familyId,

                    first_name:
                        first,

                    last_name:
                        last || null,

                    preferred_name:
                        preferred || null,

                    birth_date:
                        birth,

                    birth_place:
                        place || null,

                    biography:
                        bio || null,

                    created_by:
                        user.id
                })
                .select(`
                    id,
                    family_id,
                    first_name,
                    last_name,
                    preferred_name,
                    birth_date,
                    death_date,
                    birth_place,
                    biography,
                    created_by,
                    created_at,
                    updated_at
                `)
                .single();

        if (error) {
            throw error;
        }

        showFamilyMessage(
            'Familiar adicionado ao acervo com sucesso.',
            'success'
        );

        await loadFamilyPeople();

        /*
         * Quando o cadastro é aberto a partir do
         * formulário de memória, já deixamos a pessoa
         * recém-criada preenchida no campo.
         */

        const memoryPerson =
            document.getElementById(
                'memoryPerson'
            );

        if (
            memoryPerson &&
            data
        ) {
            memoryPerson.value =
                familyFullName(data) ||
                familyDisplayName(data);
        }

        setTimeout(
            closeFamilyModal,
            700
        );

    } catch (error) {
        console.error(
            'Erro ao salvar familiar:',
            error
        );

        showFamilyMessage(
            editingPersonId
                ? 'Não foi possível atualizar esta pessoa.'
                : 'Não foi possível adicionar esta pessoa ao acervo.'
        );

    } finally {
        if (submit) {
            submit.disabled = false;
        }
    }
}


// ==========================================================
// EVENTOS
// ==========================================================

function bindFamilyEvents() {
    const {
        addButton,
        close,
        backdrop,
        form
    } =
        getFamilyElements();

    addButton?.addEventListener(
        'click',
        openFamilyModal
    );

    close?.addEventListener(
        'click',
        closeFamilyModal
    );

    form?.addEventListener(
        'submit',
        handleFamilySubmit
    );

    backdrop?.addEventListener(
        'click',
        function (event) {
            if (
                event.target ===
                backdrop
            ) {
                closeFamilyModal();
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
                closeFamilyModal();
            }
        }
    );
}


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function initializeFamilyModule() {
    if (
        familyModuleInitialized
    ) {
        return;
    }

    familyModuleInitialized = true;

    injectFamilyStyles();

    injectFamilyNavLink();

    injectFamilySection();

    injectFamilyModal();

    ensureMemoryPersonAutocomplete();

    bindFamilyEvents();

    await loadFamilyPeople();

    window.MemoriasInvisiveisFamily = {
        getPeople:
            function () {
                return [
                    ...familyPeople
                ];
            },

        refresh:
            loadFamilyPeople,

        openAddPerson:
            openFamilyModal,

        openEditPerson:
            openEditPersonModal
    };
}


// ==========================================================
// AUTH EVENTS
// ==========================================================

window.addEventListener(
    'memorias-invisiveis:auth-ready',
    async function () {
        await initializeFamilyModule();

        await loadFamilyPeople();
    }
);


window.addEventListener(
    'memorias-invisiveis:auth-change',
    async function () {
        if (
            !familyModuleInitialized
        ) {
            await initializeFamilyModule();

            return;
        }

        await loadFamilyPeople();
    }
);


// ==========================================================
// START
// ==========================================================

if (
    document.readyState ===
    'loading'
) {
    document.addEventListener(
        'DOMContentLoaded',
        async function () {
            await initializeFamilyModule();
        },
        {
            once: true
        }
    );
} else {
    initializeFamilyModule();
}

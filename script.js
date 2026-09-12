// ==========================================================
// MEMÓRIAS INVISÍVEIS
// FASE 7.5 — NAVEGAÇÃO MEMÓRIA ↔ PESSOA
//
// Persistência:
// - Visitante não autenticado -> localStorage
// - Usuário autenticado       -> Supabase
//
// Integração relacional:
// Pessoa ↔ Memória ↔ Pessoa
// ==========================================================


// ==========================================================
// CONFIGURAÇÕES
// ==========================================================

const STORAGE_KEY = 'memoriasInvisiveis.memories';

const prompts = [
    'Qual lembrança da sua infância você nunca gostaria de esquecer?',
    'Que conselho de seus pais ou avós ficou com você ao longo da vida?',
    'Qual tradição da sua família merece continuar existindo?',
    'Qual história sobre seus pais ou avós você gostaria que as próximas gerações conhecessem?',
    'Qual foi um dos dias mais felizes da sua juventude?',
    'Que lugar marcou profundamente a história da sua família?',
    'Qual receita da sua família traz lembranças especiais?',
    'Como eram os almoços, festas ou encontros familiares quando você era mais jovem?',
    'Qual experiência profissional mudou a forma como você enxerga a vida?',
    'Quem foi uma pessoa importante na sua formação e por quê?',
    'Qual viagem ficou marcada na sua memória?',
    'Que acontecimento histórico você viveu e nunca esqueceu?',
    'Como você conheceu uma pessoa importante na sua vida?',
    'Qual hábito ou costume da sua família você gostaria de preservar?',
    'Que história você gostaria que seus filhos, netos ou familiares conhecessem no futuro?'
];


// ==========================================================
// ELEMENTOS
// ==========================================================

const header =
    document.getElementById('header');

const mobileMenuBtn =
    document.getElementById('mobileMenuBtn');

const navLinks =
    document.querySelector('.nav-links');

const memoryForm =
    document.getElementById('memoryForm');

const memoryPerson =
    document.getElementById('memoryPerson');

const memoryPeriod =
    document.getElementById('memoryPeriod');

const memoryTitle =
    document.getElementById('memoryTitle');

const memoryCategory =
    document.getElementById('memoryCategory');

const memoryStory =
    document.getElementById('memoryStory');

const clearFormButton =
    document.getElementById('clearFormButton');

const formMessage =
    document.getElementById('formMessage');

const promptText =
    document.getElementById('promptText');

const newPromptButton =
    document.getElementById('newPromptButton');

const memorySearch =
    document.getElementById('memorySearch');

const categoryFilter =
    document.getElementById('categoryFilter');

const memoryArchive =
    document.getElementById('memoryArchive');


// ==========================================================
// ESTADO
// ==========================================================

let memories =
    loadLocalMemories();

let usingCloud = false;

let cloudLoading = false;

let initializationStarted = false;


// ==========================================================
// ESTILO DA NAVEGAÇÃO MEMÓRIA → PESSOA
// ==========================================================

function injectMemoryNavigationStyles() {
    if (
        document.getElementById(
            'mi-memory-navigation-styles'
        )
    ) {
        return;
    }

    const style =
        document.createElement('style');

    style.id =
        'mi-memory-navigation-styles';

    style.textContent = `
        .memory-person-button {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border: 0;
            padding: 0;
            margin: 0;
            background: transparent;
            color: inherit;
            font: inherit;
            cursor: pointer;
            text-align: left;
        }

        .memory-person-button:hover {
            color: var(--accent);
            text-decoration: underline;
        }

        .memory-person-button:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 4px;
            border-radius: 4px;
        }
    `;

    document.head.appendChild(style);
}


// ==========================================================
// SUPABASE / AUTH
// ==========================================================

function getAuthController() {
    return (
        window.MemoriasInvisiveisAuth ||
        null
    );
}


function getCurrentUser() {
    const auth =
        getAuthController();

    if (
        !auth ||
        typeof auth.getUser !== 'function'
    ) {
        return null;
    }

    return auth.getUser();
}


function getActiveFamily() {
    const auth =
        getAuthController();

    if (
        !auth ||
        typeof auth.getActiveFamily !==
            'function'
    ) {
        return null;
    }

    return auth.getActiveFamily();
}


function getSupabaseClient() {
    return (
        getAuthController()?.supabase ||
        null
    );
}


function getActiveFamilyId() {
    const family =
        getActiveFamily();

    return (
        family?.family_id ||
        family?.families?.id ||
        null
    );
}


// ==========================================================
// HEADER
// ==========================================================

window.addEventListener(
    'scroll',
    function () {
        if (!header) {
            return;
        }

        if (window.scrollY > 50) {
            header.classList.add(
                'scrolled'
            );
        } else {
            header.classList.remove(
                'scrolled'
            );
        }
    }
);


// ==========================================================
// MENU MOBILE
// ==========================================================

if (
    mobileMenuBtn &&
    navLinks
) {
    mobileMenuBtn.addEventListener(
        'click',
        function () {
            const isOpen =
                navLinks.style.display ===
                'flex';

            if (isOpen) {
                closeMobileMenu();
                return;
            }

            navLinks.style.display =
                'flex';

            navLinks.style.flexDirection =
                'column';

            navLinks.style.position =
                'absolute';

            navLinks.style.top =
                '100%';

            navLinks.style.left =
                '0';

            navLinks.style.width =
                '100%';

            navLinks.style.backgroundColor =
                'var(--light)';

            navLinks.style.padding =
                '30px';

            navLinks.style.boxShadow =
                'var(--shadow)';

            navLinks.style.gap =
                '20px';

            mobileMenuBtn.setAttribute(
                'aria-expanded',
                'true'
            );
        }
    );
}


function closeMobileMenu() {
    if (
        !navLinks ||
        !mobileMenuBtn
    ) {
        return;
    }

    if (
        window.innerWidth <= 768
    ) {
        navLinks.style.display =
            'none';

        mobileMenuBtn.setAttribute(
            'aria-expanded',
            'false'
        );
    }
}


window.addEventListener(
    'resize',
    function () {
        if (
            !navLinks ||
            !mobileMenuBtn
        ) {
            return;
        }

        if (
            window.innerWidth > 768
        ) {
            navLinks.style.display =
                '';

            navLinks.style.flexDirection =
                '';

            navLinks.style.position =
                '';

            navLinks.style.top =
                '';

            navLinks.style.left =
                '';

            navLinks.style.width =
                '';

            navLinks.style.backgroundColor =
                '';

            navLinks.style.padding =
                '';

            navLinks.style.boxShadow =
                '';

            navLinks.style.gap =
                '';

            mobileMenuBtn.setAttribute(
                'aria-expanded',
                'false'
            );
        }
    }
);


// ==========================================================
// SCROLL SUAVE
// ==========================================================

document
    .querySelectorAll(
        'a[href^="#"]'
    )
    .forEach(
        function (anchor) {
            anchor.addEventListener(
                'click',
                function (event) {
                    const targetId =
                        this.getAttribute(
                            'href'
                        );

                    if (
                        !targetId ||
                        targetId === '#'
                    ) {
                        return;
                    }

                    const targetElement =
                        document.querySelector(
                            targetId
                        );

                    if (
                        !targetElement
                    ) {
                        return;
                    }

                    event.preventDefault();

                    closeMobileMenu();

                    window.scrollTo({
                        top:
                            targetElement
                                .offsetTop -
                            100,

                        behavior:
                            'smooth'
                    });
                }
            );
        }
    );


// ==========================================================
// ANIMAÇÕES
// ==========================================================

const observerOptions = {
    threshold: 0.1,
    rootMargin:
        '0px 0px -50px 0px'
};


if (
    'IntersectionObserver' in
    window
) {
    const observer =
        new IntersectionObserver(
            function (entries) {
                entries.forEach(
                    function (entry) {
                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }

                        entry.target
                            .style
                            .opacity =
                            '1';

                        entry.target
                            .style
                            .transform =
                            'translateY(0)';

                        observer.unobserve(
                            entry.target
                        );
                    }
                );
            },
            observerOptions
        );

    const animatedElements =
        document.querySelectorAll(
            [
                '.card',
                '.stat-item',
                '.hero-text',
                '.hero-image',
                '.problem-text',
                '.problem-visual',
                '.memory-panel'
            ].join(', ')
        );

    animatedElements.forEach(
        function (element) {
            element.style.opacity =
                '0';

            element.style.transform =
                'translateY(20px)';

            element.style.transition =
                'opacity 0.6s ease, transform 0.6s ease';

            observer.observe(
                element
            );
        }
    );
}


// ==========================================================
// LOCAL STORAGE
// ==========================================================

function loadLocalMemories() {
    try {
        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {
        console.error(
            'Erro ao carregar memórias locais:',
            error
        );

        return [];
    }
}


function saveLocalMemories() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                memories
            )
        );

        return true;

    } catch (error) {
        console.error(
            'Erro ao salvar memórias locais:',
            error
        );

        return false;
    }
}


// ==========================================================
// ID LOCAL
// ==========================================================

function createMemoryId() {
    if (
        window.crypto &&
        typeof window.crypto
            .randomUUID ===
            'function'
    ) {
        return (
            window.crypto.randomUUID()
        );
    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );
}


// ==========================================================
// NORMALIZAÇÃO
// ==========================================================

function normalizeText(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase(
            'pt-BR'
        );
}


// ==========================================================
// PESSOA
// ==========================================================

function getPersonDisplayName(
    person
) {
    if (!person) {
        return (
            'Pessoa não vinculada'
        );
    }

    const preferredName =
        String(
            person.preferred_name ||
            ''
        ).trim();

    if (preferredName) {
        return preferredName;
    }

    const firstName =
        String(
            person.first_name ||
            ''
        ).trim();

    const lastName =
        String(
            person.last_name ||
            ''
        ).trim();

    const fullName =
        [
            firstName,
            lastName
        ]
            .filter(Boolean)
            .join(' ')
            .trim();

    return (
        fullName ||
        'Pessoa não vinculada'
    );
}


// ==========================================================
// NAVEGAÇÃO MEMÓRIA → PESSOA
// ==========================================================

async function openPersonProfileFromMemory(
    personId
) {
    if (!personId) {
        return;
    }

    let familyController =
        window.MemoriasInvisiveisFamily;

    if (
        !familyController ||
        typeof familyController
            .openPersonProfile !==
            'function'
    ) {
        await new Promise(
            function (resolve) {
                setTimeout(
                    resolve,
                    150
                );
            }
        );

        familyController =
            window.MemoriasInvisiveisFamily;
    }

    if (
        !familyController ||
        typeof familyController
            .openPersonProfile !==
            'function'
    ) {
        window.alert(
            'O perfil familiar ainda não está disponível.'
        );

        return;
    }

    familyController
        .openPersonProfile(
            personId
        );
}


// ==========================================================
// DATA
// ==========================================================

function formatDate(
    dateString
) {
    if (!dateString) {
        return '';
    }

    const date =
        new Date(dateString);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    return new Intl.DateTimeFormat(
        'pt-BR',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }
    ).format(date);
}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHTML(value) {
    const div =
        document.createElement(
            'div'
        );

    div.textContent =
        value ?? '';

    return div.innerHTML;
}


// ==========================================================
// MENSAGENS
// ==========================================================

function showFormMessage(
    message,
    type = 'success'
) {
    if (!formMessage) {
        return;
    }

    formMessage.textContent =
        message;

    formMessage.className =
        `form-message is-visible ${type}`;
}


function clearFormMessage() {
    if (!formMessage) {
        return;
    }

    formMessage.textContent =
        '';

    formMessage.className =
        'form-message';
}


// ==========================================================
// LIMPAR FORMULÁRIO
// ==========================================================

function clearMemoryForm() {
    if (!memoryForm) {
        return;
    }

    memoryForm.reset();

    clearFormMessage();

    memoryPerson?.focus();
}


// ==========================================================
// NORMALIZAÇÃO DA MEMÓRIA CLOUD
// ==========================================================

function normalizeCloudMemory(
    record
) {
    const relations =
        Array.isArray(
            record.memory_people
        )
            ? record.memory_people
            : [];

    const protagonistRelation =
        relations.find(
            function (
                relation
            ) {
                return (
                    relation.role ===
                    'protagonist'
                );
            }
        ) ||
        relations[0] ||
        null;

    const person =
        protagonistRelation
            ?.people ||
        null;

    return {
        id:
            record.id,

        person:
            getPersonDisplayName(
                person
            ),

        personId:
            protagonistRelation
                ?.person_id ||
            person?.id ||
            null,

        period:
            record.period_text ||
            '',

        title:
            record.title ||
            '',

        category:
            record.category ||
            'Outras',

        story:
            record.story ||
            '',

        createdAt:
            record.created_at
    };
}


// ==========================================================
// CARREGAR CLOUD
// ==========================================================

async function loadCloudMemories() {
    const supabase =
        getSupabaseClient();

    const user =
        getCurrentUser();

    const familyId =
        getActiveFamilyId();

    if (
        !supabase ||
        !user ||
        !familyId
    ) {
        return false;
    }

    cloudLoading =
        true;

    renderLoadingState();

    const {
        data,
        error
    } =
        await supabase
            .from('memories')
            .select(`
                id,
                family_id,
                created_by,
                title,
                story,
                category,
                period_text,
                created_at,
                memory_people (
                    person_id,
                    role,
                    people (
                        id,
                        first_name,
                        last_name,
                        preferred_name
                    )
                )
            `)
            .eq(
                'family_id',
                familyId
            )
            .order(
                'created_at',
                {
                    ascending:
                        false
                }
            );

    cloudLoading =
        false;

    if (error) {
        console.error(
            'Erro ao carregar memórias da nuvem:',
            error
        );

        return false;
    }

    memories =
        (data || [])
            .map(
                normalizeCloudMemory
            );

    usingCloud =
        true;

    renderMemories();

    updateStorageLabels();

    return true;
}


// ==========================================================
// MODO LOCAL
// ==========================================================

function loadLocalMode() {
    usingCloud =
        false;

    memories =
        loadLocalMemories();

    renderMemories();

    updateStorageLabels();
}


// ==========================================================
// ORIGEM DO ACERVO
// ==========================================================

async function refreshMemorySource() {
    const user =
        getCurrentUser();

    const family =
        getActiveFamily();

    if (
        user &&
        family
    ) {
        const loaded =
            await loadCloudMemories();

        if (loaded) {
            return;
        }
    }

    loadLocalMode();
}


// ==========================================================
// LOADING
// ==========================================================

function renderLoadingState() {
    if (!memoryArchive) {
        return;
    }

    memoryArchive.innerHTML = `
        <div class="empty-state">

            <i
                class="fas fa-spinner fa-spin"
            ></i>

            <h3>
                Carregando seu acervo
            </h3>

            <p>
                Buscando as histórias
                preservadas na nuvem.
            </p>

        </div>
    `;
}


// ==========================================================
// LABELS LOCAL / CLOUD
// ==========================================================

function updateStorageLabels() {
    const archiveSection =
        document.getElementById(
            'acervo'
        );

    if (!archiveSection) {
        return;
    }

    const intro =
        archiveSection
            .querySelector(
                '.section-intro'
            );

    const summaryParagraphs =
        archiveSection
            .querySelectorAll(
                '.archive-summary p'
            );

    if (usingCloud) {
        if (intro) {
            intro.textContent =
                'As histórias deste acervo familiar são armazenadas com segurança na nuvem e ficam disponíveis após o login.';
        }

        if (
            summaryParagraphs[0]
        ) {
            summaryParagraphs[0]
                .innerHTML = `
                <span
                    class="memory-count"
                    id="memoryCount"
                >
                    ${
                        memories.length ===
                        1
                            ? '1 memória'
                            : `${memories.length} memórias`
                    }
                </span>

                preservadas neste acervo.
            `;
        }

        if (
            summaryParagraphs[1]
        ) {
            summaryParagraphs[1]
                .innerHTML = `
                <i
                    class="fas fa-cloud"
                ></i>

                Acervo sincronizado
                com a nuvem
            `;
        }

        return;
    }

    if (intro) {
        intro.textContent =
            'As histórias registradas sem login permanecem somente neste navegador. Entre em sua conta para acessar o acervo familiar em nuvem.';
    }

    if (
        summaryParagraphs[0]
    ) {
        summaryParagraphs[0]
            .innerHTML = `
            <span
                class="memory-count"
                id="memoryCount"
            >
                ${
                    memories.length ===
                    1
                        ? '1 memória'
                        : `${memories.length} memórias`
                }
            </span>

            preservadas neste navegador.
        `;
    }

    if (
        summaryParagraphs[1]
    ) {
        summaryParagraphs[1]
            .innerHTML = `
            <i
                class="fas fa-lock"
            ></i>

            Armazenamento local
            neste navegador
        `;
    }
}


// ==========================================================
// LOCALIZAR OU CRIAR PESSOA
// ==========================================================

async function findOrCreatePerson(
    personName
) {
    const supabase =
        getSupabaseClient();

    const user =
        getCurrentUser();

    const familyId =
        getActiveFamilyId();

    if (
        !supabase ||
        !user ||
        !familyId
    ) {
        throw new Error(
            'Não foi possível identificar usuário ou família.'
        );
    }

    const cleanName =
        String(
            personName || ''
        )
            .trim()
            .replace(
                /\s+/g,
                ' '
            );

    if (!cleanName) {
        throw new Error(
            'Nome da pessoa não informado.'
        );
    }

    const {
        data: people,
        error: peopleError
    } =
        await supabase
            .from('people')
            .select(`
                id,
                first_name,
                last_name,
                preferred_name
            `)
            .eq(
                'family_id',
                familyId
            );

    if (peopleError) {
        throw peopleError;
    }

    const normalizedInput =
        normalizeText(
            cleanName
        );

    const existingPerson =
        (people || [])
            .find(
                function (
                    person
                ) {
                    const displayName =
                        normalizeText(
                            getPersonDisplayName(
                                person
                            )
                        );

                    const firstName =
                        normalizeText(
                            person.first_name
                        );

                    const fullName =
                        normalizeText(
                            [
                                person.first_name,
                                person.last_name
                            ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    ' '
                                )
                        );

                    return (
                        displayName ===
                            normalizedInput ||
                        firstName ===
                            normalizedInput ||
                        fullName ===
                            normalizedInput
                    );
                }
            );

    if (
        existingPerson
    ) {
        return {
            person:
                existingPerson,

            created:
                false
        };
    }

    const {
        data:
            createdPerson,
        error:
            createError
    } =
        await supabase
            .from('people')
            .insert({
                family_id:
                    familyId,

                first_name:
                    cleanName,

                created_by:
                    user.id
            })
            .select(`
                id,
                first_name,
                last_name,
                preferred_name
            `)
            .single();

    if (createError) {
        throw createError;
    }

    return {
        person:
            createdPerson,

        created:
            true
    };
}


// ==========================================================
// REGISTRO DA MEMÓRIA
// ==========================================================

if (memoryForm) {
    memoryForm.addEventListener(
        'submit',
        async function (
            event
        ) {
            event.preventDefault();

            clearFormMessage();

            const person =
                memoryPerson
                    ?.value
                    .trim() ||
                '';

            const period =
                memoryPeriod
                    ?.value
                    .trim() ||
                '';

            const title =
                memoryTitle
                    ?.value
                    .trim() ||
                '';

            const category =
                memoryCategory
                    ?.value ||
                '';

            const story =
                memoryStory
                    ?.value
                    .trim() ||
                '';

            if (
                !person ||
                !title ||
                !category ||
                !story
            ) {
                showFormMessage(
                    'Preencha os campos obrigatórios para preservar esta memória.',
                    'error'
                );

                return;
            }

            const user =
                getCurrentUser();

            const family =
                getActiveFamily();

            if (
                user &&
                family
            ) {
                await saveMemoryToCloud({
                    person,
                    period,
                    title,
                    category,
                    story
                });

                return;
            }

            saveMemoryLocally({
                person,
                period,
                title,
                category,
                story
            });
        }
    );
}


// ==========================================================
// SALVAR LOCAL
// ==========================================================

function saveMemoryLocally(
    values
) {
    const newMemory = {
        id:
            createMemoryId(),

        person:
            values.person,

        personId:
            null,

        period:
            values.period,

        title:
            values.title,

        category:
            values.category,

        story:
            values.story,

        createdAt:
            new Date()
                .toISOString()
    };

    memories.unshift(
        newMemory
    );

    const saved =
        saveLocalMemories();

    if (!saved) {
        memories.shift();

        showFormMessage(
            'Não foi possível salvar esta memória no navegador.',
            'error'
        );

        return;
    }

    renderMemories();

    updateStorageLabels();

    memoryForm.reset();

    showFormMessage(
        'Memória preservada neste navegador. Entre em sua conta para usar o acervo em nuvem.',
        'success'
    );

    scrollToArchive();
}


// ==========================================================
// SALVAR CLOUD
// ==========================================================

async function saveMemoryToCloud(
    values
) {
    const supabase =
        getSupabaseClient();

    const user =
        getCurrentUser();

    const familyId =
        getActiveFamilyId();

    if (
        !supabase ||
        !user ||
        !familyId
    ) {
        showFormMessage(
            'Não foi possível identificar seu acervo familiar.',
            'error'
        );

        return;
    }

    const submitButton =
        memoryForm
            .querySelector(
                'button[type="submit"]'
            );

    if (submitButton) {
        submitButton.disabled =
            true;
    }

    let createdMemoryId =
        null;

    try {
        const {
            person
        } =
            await findOrCreatePerson(
                values.person
            );

        if (!person?.id) {
            throw new Error(
                'Não foi possível criar ou localizar a pessoa.'
            );
        }

        const {
            data:
                createdMemory,
            error:
                memoryError
        } =
            await supabase
                .from('memories')
                .insert({
                    family_id:
                        familyId,

                    created_by:
                        user.id,

                    title:
                        values.title,

                    story:
                        values.story,

                    category:
                        values.category,

                    period_text:
                        values.period ||
                        null
                })
                .select(`
                    id,
                    family_id,
                    created_by,
                    title,
                    story,
                    category,
                    period_text,
                    created_at
                `)
                .single();

        if (memoryError) {
            throw memoryError;
        }

        createdMemoryId =
            createdMemory.id;

        const {
            error:
                relationError
        } =
            await supabase
                .from(
                    'memory_people'
                )
                .insert({
                    memory_id:
                        createdMemory.id,

                    person_id:
                        person.id,

                    role:
                        'protagonist'
                });

        if (
            relationError
        ) {
            await supabase
                .from(
                    'memories'
                )
                .delete()
                .eq(
                    'id',
                    createdMemory.id
                )
                .eq(
                    'family_id',
                    familyId
                );

            createdMemoryId =
                null;

            throw relationError;
        }

        const loaded =
            await loadCloudMemories();

        if (!loaded) {
            throw new Error(
                'A memória foi criada, mas não foi possível atualizar o acervo.'
            );
        }

        memoryForm.reset();

        showFormMessage(
            'Memória preservada com sucesso no seu acervo familiar.',
            'success'
        );

        window
            .MemoriasInvisiveisFamily
            ?.refresh?.();

        scrollToArchive();

    } catch (error) {
        console.error(
            'Erro ao preservar memória na nuvem:',
            error
        );

        showFormMessage(
            'Não foi possível preservar esta memória na nuvem. Nenhuma alteração incompleta será considerada válida.',
            'error'
        );

    } finally {
        if (submitButton) {
            submitButton.disabled =
                false;
        }
    }
}


// ==========================================================
// SCROLL PARA ACERVO
// ==========================================================

function scrollToArchive() {
    setTimeout(
        function () {
            const archive =
                document.getElementById(
                    'acervo'
                );

            if (!archive) {
                return;
            }

            window.scrollTo({
                top:
                    archive.offsetTop -
                    100,

                behavior:
                    'smooth'
            });
        },
        400
    );
}


// ==========================================================
// LIMPAR
// ==========================================================

clearFormButton
    ?.addEventListener(
        'click',
        clearMemoryForm
    );


// ==========================================================
// PROMPTS
// ==========================================================

function showRandomPrompt() {
    if (
        !promptText ||
        prompts.length === 0
    ) {
        return;
    }

    let newPrompt =
        prompts[
            Math.floor(
                Math.random() *
                prompts.length
            )
        ];

    if (
        prompts.length > 1 &&
        newPrompt ===
        promptText
            .textContent
            .trim()
    ) {
        const currentIndex =
            prompts.indexOf(
                newPrompt
            );

        newPrompt =
            prompts[
                (
                    currentIndex +
                    1
                ) %
                prompts.length
            ];
    }

    promptText.textContent =
        newPrompt;
}


newPromptButton
    ?.addEventListener(
        'click',
        showRandomPrompt
    );


// ==========================================================
// BUSCA / FILTROS
// ==========================================================

memorySearch
    ?.addEventListener(
        'input',
        renderMemories
    );


categoryFilter
    ?.addEventListener(
        'change',
        renderMemories
    );


function getFilteredMemories() {
    const searchTerm =
        memorySearch
            ?.value
            .trim()
            .toLowerCase() ||
        '';

    const selectedCategory =
        categoryFilter
            ?.value ||
        'all';

    return memories.filter(
        function (memory) {
            const matchesCategory =
                selectedCategory ===
                    'all' ||
                memory.category ===
                    selectedCategory;

            const searchableText =
                [
                    memory.person,
                    memory.period,
                    memory.title,
                    memory.category,
                    memory.story
                ]
                    .join(' ')
                    .toLowerCase();

            const matchesSearch =
                !searchTerm ||
                searchableText.includes(
                    searchTerm
                );

            return (
                matchesCategory &&
                matchesSearch
            );
        }
    );
}


// ==========================================================
// RENDER ACERVO
// ==========================================================

function renderMemories() {
    if (!memoryArchive) {
        return;
    }

    if (cloudLoading) {
        return;
    }

    updateMemoryCount();

    const filteredMemories =
        getFilteredMemories();

    memoryArchive.innerHTML =
        '';

    if (
        memories.length === 0
    ) {
        memoryArchive.innerHTML = `
            <div class="empty-state">

                <i
                    class="fas fa-book-open"
                ></i>

                <h3>
                    Seu acervo começa
                    com uma história
                </h3>

                <p>
                    Registre uma memória
                    acima e ela aparecerá
                    aqui.
                </p>

            </div>
        `;

        return;
    }

    if (
        filteredMemories.length ===
        0
    ) {
        memoryArchive.innerHTML = `
            <div class="empty-state">

                <i
                    class="fas fa-magnifying-glass"
                ></i>

                <h3>
                    Nenhuma memória encontrada
                </h3>

                <p>
                    Tente alterar a busca
                    ou selecionar outra
                    categoria.
                </p>

            </div>
        `;

        return;
    }

    filteredMemories.forEach(
        function (memory) {
            memoryArchive
                .appendChild(
                    createMemoryCard(
                        memory
                    )
                );
        }
    );
}


// ==========================================================
// CARD DA MEMÓRIA
// ==========================================================

function createMemoryCard(
    memory
) {
    const card =
        document.createElement(
            'article'
        );

    card.className =
        'memory-card';

    card.dataset.memoryId =
        memory.id;

    const periodText =
        memory.period
            ? escapeHTML(
                memory.period
            )
            : 'Período não informado';

    const createdDate =
        formatDate(
            memory.createdAt
        );

    const hasPersonProfile =
        Boolean(
            usingCloud &&
            memory.personId
        );

    const personMarkup =
        hasPersonProfile
            ? `
                <button
                    type="button"
                    class="memory-person memory-person-button"
                    data-memory-person-id="${escapeHTML(
                        memory.personId
                    )}"
                    aria-label="Abrir perfil de ${escapeHTML(
                        memory.person
                    )}"
                >
                    <i
                        class="fas fa-user"
                    ></i>

                    ${escapeHTML(
                        memory.person
                    )}
                </button>
            `
            : `
                <p class="memory-person">

                    <i
                        class="fas fa-user"
                    ></i>

                    ${escapeHTML(
                        memory.person
                    )}

                </p>
            `;

    card.innerHTML = `
        <div
            class="memory-card-top"
        >

            <span
                class="memory-category"
            >
                ${escapeHTML(
                    memory.category
                )}
            </span>

            <span
                class="memory-period"
            >
                ${periodText}
            </span>

        </div>

        <div>

            <h3>
                ${escapeHTML(
                    memory.title
                )}
            </h3>

            ${personMarkup}

        </div>

        <p
            class="memory-story"
        >
            ${escapeHTML(
                memory.story
            )}
        </p>

        <div
            class="memory-meta"
        >

            <i
                class="fas fa-clock"
            ></i>

            Registrada em

            ${createdDate}

        </div>

        <div
            class="memory-card-actions"
        >

            <button
                type="button"
                class="delete-memory-button"
                data-delete-memory="${escapeHTML(
                    memory.id
                )}"
                aria-label="Excluir memória ${escapeHTML(
                    memory.title
                )}"
            >

                <i
                    class="fas fa-trash"
                ></i>

                Excluir

            </button>

        </div>
    `;

    const profileButton =
        card.querySelector(
            '[data-memory-person-id]'
        );

    profileButton
        ?.addEventListener(
            'click',
            async function () {
                await openPersonProfileFromMemory(
                    memory.personId
                );
            }
        );

    const deleteButton =
        card.querySelector(
            '[data-delete-memory]'
        );

    deleteButton
        ?.addEventListener(
            'click',
            function () {
                deleteMemory(
                    memory.id
                );
            }
        );

    return card;
}


// ==========================================================
// CONTADOR
// ==========================================================

function updateMemoryCount() {
    const counter =
        document.getElementById(
            'memoryCount'
        );

    if (!counter) {
        return;
    }

    const total =
        memories.length;

    counter.textContent =
        total === 1
            ? '1 memória'
            : `${total} memórias`;
}


// ==========================================================
// EXCLUSÃO
// ==========================================================

async function deleteMemory(
    memoryId
) {
    const memory =
        memories.find(
            function (item) {
                return (
                    item.id ===
                    memoryId
                );
            }
        );

    if (!memory) {
        return;
    }

    const confirmed =
        window.confirm(
            `Excluir a memória "${memory.title}"?\n\nEsta ação não poderá ser desfeita.`
        );

    if (!confirmed) {
        return;
    }

    if (usingCloud) {
        await deleteCloudMemory(
            memoryId
        );

        return;
    }

    deleteLocalMemory(
        memoryId
    );
}


// ==========================================================
// EXCLUSÃO LOCAL
// ==========================================================

function deleteLocalMemory(
    memoryId
) {
    const previousMemories =
        [...memories];

    memories =
        memories.filter(
            function (item) {
                return (
                    item.id !==
                    memoryId
                );
            }
        );

    const saved =
        saveLocalMemories();

    if (!saved) {
        memories =
            previousMemories;

        window.alert(
            'Não foi possível excluir a memória.'
        );

        return;
    }

    renderMemories();

    updateStorageLabels();
}


// ==========================================================
// EXCLUSÃO CLOUD
// ==========================================================

async function deleteCloudMemory(
    memoryId
) {
    const supabase =
        getSupabaseClient();

    const familyId =
        getActiveFamilyId();

    if (
        !supabase ||
        !familyId
    ) {
        window.alert(
            'Não foi possível identificar o acervo.'
        );

        return;
    }

    const {
        error
    } =
        await supabase
            .from('memories')
            .delete()
            .eq(
                'id',
                memoryId
            )
            .eq(
                'family_id',
                familyId
            );

    if (error) {
        console.error(
            'Erro ao excluir memória:',
            error
        );

        window.alert(
            'Não foi possível excluir a memória da nuvem.'
        );

        return;
    }

    await loadCloudMemories();
}


// ==========================================================
// AUTH EVENTS
// ==========================================================

window.addEventListener(
    'memorias-invisiveis:auth-ready',
    async function () {
        await refreshMemorySource();
    }
);


window.addEventListener(
    'memorias-invisiveis:auth-change',
    async function () {
        await refreshMemorySource();
    }
);


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function initializeMemories() {
    if (
        initializationStarted
    ) {
        return;
    }

    initializationStarted =
        true;

    injectMemoryNavigationStyles();

    renderMemories();

    updateStorageLabels();

    if (
        getAuthController()
    ) {
        await refreshMemorySource();
    }
}


if (
    document.readyState ===
    'loading'
) {
    document.addEventListener(
        'DOMContentLoaded',
        initializeMemories,
        {
            once: true
        }
    );

} else {
    initializeMemories();
}

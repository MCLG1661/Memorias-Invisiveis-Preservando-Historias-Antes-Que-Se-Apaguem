// ==========================================================
// Memórias Invisíveis
// MVP Interativo
// LocalStorage + Supabase
// ==========================================================


// ==========================================================
// Configurações
// ==========================================================

const STORAGE_KEY =
    'memoriasInvisiveis.memories';

const CLOUD_PERSON_KEY =
    'memoriasInvisiveis.cloudPersons';


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
// Elementos principais
// ==========================================================

const header =
    document.getElementById(
        'header'
    );


const mobileMenuBtn =
    document.getElementById(
        'mobileMenuBtn'
    );


const navLinks =
    document.querySelector(
        '.nav-links'
    );


const memoryForm =
    document.getElementById(
        'memoryForm'
    );


const memoryPerson =
    document.getElementById(
        'memoryPerson'
    );


const memoryPeriod =
    document.getElementById(
        'memoryPeriod'
    );


const memoryTitle =
    document.getElementById(
        'memoryTitle'
    );


const memoryCategory =
    document.getElementById(
        'memoryCategory'
    );


const memoryStory =
    document.getElementById(
        'memoryStory'
    );


const clearFormButton =
    document.getElementById(
        'clearFormButton'
    );


const formMessage =
    document.getElementById(
        'formMessage'
    );


const promptText =
    document.getElementById(
        'promptText'
    );


const newPromptButton =
    document.getElementById(
        'newPromptButton'
    );


const memorySearch =
    document.getElementById(
        'memorySearch'
    );


const categoryFilter =
    document.getElementById(
        'categoryFilter'
    );


const memoryCount =
    document.getElementById(
        'memoryCount'
    );


const memoryArchive =
    document.getElementById(
        'memoryArchive'
    );


// ==========================================================
// Estado
// ==========================================================

let memories =
    loadLocalMemories();


let cloudPersons =
    loadCloudPersons();


let usingCloud =
    false;


let cloudLoading =
    false;


// ==========================================================
// Auth helpers
// ==========================================================

function getAuthController() {

    return (
        window.MemoriasInvisiveisAuth
        ||
        null
    );

}


function getCurrentUser() {

    const auth =
        getAuthController();


    if (
        !auth ||
        typeof auth.getUser !==
            'function'
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

    const auth =
        getAuthController();


    return (
        auth?.supabase
        ||
        null
    );

}


// ==========================================================
// Header — efeito no scroll
// ==========================================================

window.addEventListener(
    'scroll',
    function () {

        if (!header) {
            return;
        }


        if (
            window.scrollY >
            50
        ) {

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
// Menu mobile
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

            } else {

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

        }
    );

}


// ==========================================================
// Fecha menu mobile
// ==========================================================

function closeMobileMenu() {

    if (
        !navLinks ||
        !mobileMenuBtn
    ) {

        return;

    }


    if (
        window.innerWidth <=
        768
    ) {

        navLinks.style.display =
            'none';


        mobileMenuBtn.setAttribute(
            'aria-expanded',
            'false'
        );

    }

}


// ==========================================================
// Ajuste responsivo
// ==========================================================

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
            window.innerWidth >
            768
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
// Scroll suave
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
                            targetElement.offsetTop
                            -
                            100,

                        behavior:
                            'smooth'

                    });

                }
            );

        }
    );


// ==========================================================
// Animações
// ==========================================================

const observerOptions = {

    threshold:
        0.1,

    rootMargin:
        '0px 0px -50px 0px'

};


if (
    'IntersectionObserver'
    in window
) {

    const observer =
        new IntersectionObserver(

            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.style.opacity =
                                '1';


                            entry.target.style.transform =
                                'translateY(0)';


                            observer.unobserve(
                                entry.target
                            );

                        }

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

                '.memory-panel',

                '.memory-card'

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
// LocalStorage
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
            JSON.parse(
                stored
            );


        return (
            Array.isArray(parsed)
                ? parsed
                : []
        );

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
// Pessoa relacionada — suporte transitório
// ==========================================================

function loadCloudPersons() {

    try {

        const stored =
            localStorage.getItem(
                CLOUD_PERSON_KEY
            );


        if (!stored) {

            return {};

        }


        const parsed =
            JSON.parse(
                stored
            );


        if (
            !parsed ||
            typeof parsed !==
                'object' ||
            Array.isArray(parsed)
        ) {

            return {};

        }


        return parsed;

    } catch (error) {

        console.error(
            'Erro ao carregar pessoas vinculadas:',
            error
        );


        return {};

    }

}


function saveCloudPersons() {

    try {

        localStorage.setItem(

            CLOUD_PERSON_KEY,

            JSON.stringify(
                cloudPersons
            )

        );

    } catch (error) {

        console.error(
            'Erro ao armazenar pessoa relacionada:',
            error
        );

    }

}


function saveCloudPerson(
    memoryId,
    person
) {

    cloudPersons[
        memoryId
    ] =
        person;


    saveCloudPersons();

}


function deleteCloudPerson(
    memoryId
) {

    delete cloudPersons[
        memoryId
    ];


    saveCloudPersons();

}


// ==========================================================
// Criação de ID local
// ==========================================================

function createMemoryId() {

    if (

        window.crypto &&

        typeof window.crypto.randomUUID ===
            'function'

    ) {

        return (
            window.crypto.randomUUID()
        );

    }


    return (

        Date.now()
            .toString(36)

        +

        Math.random()
            .toString(36)
            .substring(2)

    );

}


// ==========================================================
// Data
// ==========================================================

function formatDate(
    dateString
) {

    if (
        !dateString
    ) {

        return '';

    }


    const date =
        new Date(
            dateString
        );


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

            day:
                '2-digit',

            month:
                '2-digit',

            year:
                'numeric'

        }

    ).format(
        date
    );

}


// ==========================================================
// Escape HTML
// ==========================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        value ?? '';


    return (
        div.innerHTML
    );

}


// ==========================================================
// Mensagens
// ==========================================================

function showFormMessage(
    message,
    type = 'success'
) {

    if (
        !formMessage
    ) {

        return;

    }


    formMessage.textContent =
        message;


    formMessage.className =
        `form-message is-visible ${type}`;

}


function clearFormMessage() {

    if (
        !formMessage
    ) {

        return;

    }


    formMessage.textContent =
        '';


    formMessage.className =
        'form-message';

}


// ==========================================================
// Limpar formulário
// ==========================================================

function clearMemoryForm() {

    if (
        !memoryForm
    ) {

        return;

    }


    memoryForm.reset();

    clearFormMessage();


    if (
        memoryPerson
    ) {

        memoryPerson.focus();

    }

}


// ==========================================================
// Normalizar memória Supabase
// ==========================================================

function normalizeCloudMemory(
    record
) {

    return {

        id:
            record.id,

        person:
            cloudPersons[
                record.id
            ]
            ||
            'Pessoa não vinculada',

        period:
            record.period_text
            ||
            '',

        title:
            record.title
            ||
            '',

        category:
            record.category
            ||
            'Outras',

        story:
            record.story
            ||
            '',

        createdAt:
            record.created_at

    };

}


// ==========================================================
// Carregar memórias do Supabase
// ==========================================================

async function loadCloudMemories() {

    const supabase =
        getSupabaseClient();


    const user =
        getCurrentUser();


    const activeFamily =
        getActiveFamily();


    const familyId =
        activeFamily?.family_id
        ||
        activeFamily?.families?.id
        ||
        null;


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

            .from(
                'memories'
            )

            .select(
                `
                id,
                family_id,
                created_by,
                title,
                story,
                category,
                period_text,
                created_at
                `
            )

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


    if (
        error
    ) {

        console.error(
            'Erro ao carregar memórias da nuvem:',
            error
        );


        return false;

    }


    memories =
        (
            data
            ||
            []
        ).map(
            normalizeCloudMemory
        );


    usingCloud =
        true;


    renderMemories();

    updateStorageLabels();


    return true;

}


// ==========================================================
// Modo local
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
// Inicializar origem do acervo
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


        if (
            loaded
        ) {

            return;

        }

    }


    loadLocalMode();

}


// ==========================================================
// Estado carregando
// ==========================================================

function renderLoadingState() {

    if (
        !memoryArchive
    ) {

        return;

    }


    memoryArchive.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-spinner fa-spin"></i>

            <h3>
                Carregando seu acervo
            </h3>

            <p>
                Buscando as histórias preservadas na nuvem.
            </p>

        </div>

    `;

}


// ==========================================================
// Textos armazenamento
// ==========================================================

function updateStorageLabels() {

    const archiveSection =
        document.getElementById(
            'acervo'
        );


    if (
        !archiveSection
    ) {

        return;

    }


    const intro =
        archiveSection.querySelector(
            '.section-intro'
        );


    const summaryParagraphs =
        archiveSection.querySelectorAll(
            '.archive-summary p'
        );


    if (
        usingCloud
    ) {

        if (
            intro
        ) {

            intro.textContent =
                'As histórias deste acervo familiar são armazenadas com segurança na nuvem e ficam disponíveis após o login.';

        }


        if (
            summaryParagraphs[0]
        ) {

            summaryParagraphs[0].innerHTML = `

                <span
                    class="memory-count"
                    id="memoryCount"
                >
                    ${memories.length === 1
                        ? '1 memória'
                        : `${memories.length} memórias`}
                </span>

                preservadas neste acervo.

            `;

        }


        if (
            summaryParagraphs[1]
        ) {

            summaryParagraphs[1].innerHTML = `

                <i class="fas fa-cloud"></i>

                Acervo sincronizado com a nuvem

            `;

        }

    } else {

        if (
            intro
        ) {

            intro.textContent =
                'As histórias registradas sem login permanecem somente neste navegador. Entre em sua conta para acessar o acervo familiar em nuvem.';

        }


        if (
            summaryParagraphs[1]
        ) {

            summaryParagraphs[1].innerHTML = `

                <i class="fas fa-lock"></i>

                Armazenamento local neste navegador

            `;

        }

    }

}


// ==========================================================
// Registro
// ==========================================================

if (
    memoryForm
) {

    memoryForm.addEventListener(

        'submit',

        async function (
            event
        ) {

            event.preventDefault();

            clearFormMessage();


            const person =
                memoryPerson
                    ? memoryPerson.value.trim()
                    : '';


            const period =
                memoryPeriod
                    ? memoryPeriod.value.trim()
                    : '';


            const title =
                memoryTitle
                    ? memoryTitle.value.trim()
                    : '';


            const category =
                memoryCategory
                    ? memoryCategory.value
                    : '';


            const story =
                memoryStory
                    ? memoryStory.value.trim()
                    : '';


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
// Salvar local
// ==========================================================

function saveMemoryLocally(
    values
) {

    const newMemory = {

        id:
            createMemoryId(),

        person:
            values.person,

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


    if (
        !saved
    ) {

        memories.shift();


        showFormMessage(

            'Não foi possível salvar esta memória no navegador.',

            'error'

        );


        return;

    }


    renderMemories();

    memoryForm.reset();


    showFormMessage(

        'Memória preservada neste navegador. Entre em sua conta para usar o acervo em nuvem.',

        'success'

    );


    scrollToArchive();

}


// ==========================================================
// Salvar Supabase
// ==========================================================

async function saveMemoryToCloud(
    values
) {

    const supabase =
        getSupabaseClient();


    const user =
        getCurrentUser();


    const family =
        getActiveFamily();


    const familyId =
        family?.family_id
        ||
        family?.families?.id
        ||
        null;


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
        memoryForm.querySelector(
            'button[type="submit"]'
        );


    if (
        submitButton
    ) {

        submitButton.disabled =
            true;

    }


    const {
        data,
        error
    } =
        await supabase

            .from(
                'memories'
            )

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
                    values.period
                    ||
                    null

            })

            .select(
                `
                id,
                family_id,
                created_by,
                title,
                story,
                category,
                period_text,
                created_at
                `
            )

            .single();


    if (
        submitButton
    ) {

        submitButton.disabled =
            false;

    }


    if (
        error
    ) {

        console.error(
            'Erro ao salvar memória na nuvem:',
            error
        );


        showFormMessage(

            'Não foi possível preservar esta memória na nuvem.',

            'error'

        );


        return;

    }


    saveCloudPerson(
        data.id,
        values.person
    );


    memories.unshift({

        ...normalizeCloudMemory(
            data
        ),

        person:
            values.person

    });


    usingCloud =
        true;


    renderMemories();

    updateStorageLabels();


    memoryForm.reset();


    showFormMessage(

        'Memória preservada com sucesso no seu acervo familiar.',

        'success'

    );


    scrollToArchive();

}


// ==========================================================
// Scroll para acervo
// ==========================================================

function scrollToArchive() {

    setTimeout(

        function () {

            const archive =
                document.getElementById(
                    'acervo'
                );


            if (
                archive
            ) {

                window.scrollTo({

                    top:
                        archive.offsetTop
                        -
                        100,

                    behavior:
                        'smooth'

                });

            }

        },

        400

    );

}


// ==========================================================
// Botão limpar
// ==========================================================

if (
    clearFormButton
) {

    clearFormButton.addEventListener(

        'click',

        clearMemoryForm

    );

}


// ==========================================================
// Perguntas inspiradoras
// ==========================================================

function showRandomPrompt() {

    if (

        !promptText ||

        prompts.length ===
            0

    ) {

        return;

    }


    let newPrompt =
        prompts[

            Math.floor(

                Math.random()

                *

                prompts.length

            )

        ];


    if (

        prompts.length >
            1 &&

        newPrompt ===
            promptText.textContent.trim()

    ) {

        const currentIndex =
            prompts.indexOf(
                newPrompt
            );


        const nextIndex =
            (
                currentIndex
                +
                1
            )
            %
            prompts.length;


        newPrompt =
            prompts[
                nextIndex
            ];

    }


    promptText.textContent =
        newPrompt;

}


if (
    newPromptButton
) {

    newPromptButton.addEventListener(

        'click',

        showRandomPrompt

    );

}


// ==========================================================
// Busca e filtros
// ==========================================================

if (
    memorySearch
) {

    memorySearch.addEventListener(

        'input',

        renderMemories

    );

}


if (
    categoryFilter
) {

    categoryFilter.addEventListener(

        'change',

        renderMemories

    );

}


// ==========================================================
// Filtragem
// ==========================================================

function getFilteredMemories() {

    const searchTerm =
        memorySearch
            ? memorySearch.value
                .trim()
                .toLowerCase()
            : '';


    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : 'all';


    return memories.filter(

        function (memory) {

            const matchesCategory =

                selectedCategory ===
                    'all'

                ||

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

                !searchTerm

                ||

                searchableText.includes(
                    searchTerm
                );


            return (

                matchesCategory

                &&

                matchesSearch

            );

        }

    );

}


// ==========================================================
// Renderização
// ==========================================================

function renderMemories() {

    if (

        !memoryArchive ||

        !memoryCount

    ) {

        return;

    }


    if (
        cloudLoading
    ) {

        return;

    }


    updateMemoryCount();


    const filteredMemories =
        getFilteredMemories();


    memoryArchive.innerHTML =
        '';


    if (
        memories.length ===
        0
    ) {

        memoryArchive.innerHTML = `

            <div class="empty-state">

                <i class="fas fa-book-open"></i>

                <h3>
                    Seu acervo começa com uma história
                </h3>

                <p>
                    Registre uma memória acima e ela aparecerá aqui.
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

                <i class="fas fa-magnifying-glass"></i>

                <h3>
                    Nenhuma memória encontrada
                </h3>

                <p>
                    Tente alterar a busca ou selecionar outra categoria.
                </p>

            </div>

        `;


        return;

    }


    filteredMemories.forEach(

        function (memory) {

            const card =
                createMemoryCard(
                    memory
                );


            memoryArchive.appendChild(
                card
            );

        }

    );

}


// ==========================================================
// Card
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


    card.innerHTML = `

        <div class="memory-card-top">

            <span class="memory-category">

                ${escapeHTML(
                    memory.category
                )}

            </span>

            <span class="memory-period">

                ${periodText}

            </span>

        </div>


        <div>

            <h3>

                ${escapeHTML(
                    memory.title
                )}

            </h3>

            <p class="memory-person">

                <i class="fas fa-user"></i>

                ${escapeHTML(
                    memory.person
                )}

            </p>

        </div>


        <p class="memory-story">

            ${escapeHTML(
                memory.story
            )}

        </p>


        <div class="memory-meta">

            <i class="fas fa-clock"></i>

            Registrada em

            ${createdDate}

        </div>


        <div class="memory-card-actions">

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

                <i class="fas fa-trash"></i>

                Excluir

            </button>

        </div>

    `;


    const deleteButton =
        card.querySelector(
            '[data-delete-memory]'
        );


    if (
        deleteButton
    ) {

        deleteButton.addEventListener(

            'click',

            function () {

                deleteMemory(
                    memory.id
                );

            }

        );

    }


    return card;

}


// ==========================================================
// Contador
// ==========================================================

function updateMemoryCount() {

    const currentCounter =
        document.getElementById(
            'memoryCount'
        );


    if (
        !currentCounter
    ) {

        return;

    }


    const total =
        memories.length;


    currentCounter.textContent =

        total ===
            1

            ? '1 memória'

            : `${total} memórias`;

}


// ==========================================================
// Exclusão
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


    if (
        !memory
    ) {

        return;

    }


    const confirmed =
        window.confirm(

            `Excluir a memória "${memory.title}"?\n\nEsta ação não poderá ser desfeita.`

        );


    if (
        !confirmed
    ) {

        return;

    }


    if (
        usingCloud
    ) {

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
// Exclusão local
// ==========================================================

function deleteLocalMemory(
    memoryId
) {

    const previousMemories =
        [
            ...memories
        ];


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


    if (
        !saved
    ) {

        memories =
            previousMemories;


        window.alert(

            'Não foi possível excluir a memória.'

        );


        return;

    }


    renderMemories();

}


// ==========================================================
// Exclusão Supabase
// ==========================================================

async function deleteCloudMemory(
    memoryId
) {

    const supabase =
        getSupabaseClient();


    const family =
        getActiveFamily();


    const familyId =
        family?.family_id
        ||
        family?.families?.id
        ||
        null;


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

            .from(
                'memories'
            )

            .delete()

            .eq(
                'id',
                memoryId
            )

            .eq(
                'family_id',
                familyId
            );


    if (
        error
    ) {

        console.error(
            'Erro ao excluir memória:',
            error
        );


        window.alert(

            'Não foi possível excluir a memória da nuvem.'

        );


        return;

    }


    memories =
        memories.filter(

            function (item) {

                return (
                    item.id !==
                    memoryId
                );

            }

        );


    deleteCloudPerson(
        memoryId
    );


    renderMemories();

    updateStorageLabels();

}


// ==========================================================
// Eventos de autenticação
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
// Inicialização
// ==========================================================

async function initializeMemories() {

    renderMemories();

    updateStorageLabels();


    if (
        getAuthController()
    ) {

        await refreshMemorySource();

    }

}


document.addEventListener(

    'DOMContentLoaded',

    function () {

        initializeMemories();

    }

);


// Caso script carregue após o DOM

if (
    document.readyState !==
        'loading'
) {

    initializeMemories();

}

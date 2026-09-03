// ==========================================================
// Memórias Invisíveis
// MVP Interativo
// ==========================================================


// ==========================================================
// Configurações
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
// Elementos principais
// ==========================================================

const header = document.getElementById('header');

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.querySelector('.nav-links');

const memoryForm = document.getElementById('memoryForm');

const memoryPerson = document.getElementById('memoryPerson');
const memoryPeriod = document.getElementById('memoryPeriod');
const memoryTitle = document.getElementById('memoryTitle');
const memoryCategory = document.getElementById('memoryCategory');
const memoryStory = document.getElementById('memoryStory');

const clearFormButton = document.getElementById('clearFormButton');

const formMessage = document.getElementById('formMessage');

const promptText = document.getElementById('promptText');
const newPromptButton = document.getElementById('newPromptButton');

const memorySearch = document.getElementById('memorySearch');
const categoryFilter = document.getElementById('categoryFilter');

const memoryCount = document.getElementById('memoryCount');
const memoryArchive = document.getElementById('memoryArchive');


// ==========================================================
// Estado
// ==========================================================

let memories = loadMemories();


// ==========================================================
// Header — efeito no scroll
// ==========================================================

window.addEventListener('scroll', function () {

    if (!header) {
        return;
    }

    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

});


// ==========================================================
// Menu mobile
// ==========================================================

if (mobileMenuBtn && navLinks) {

    mobileMenuBtn.addEventListener('click', function () {

        const isOpen = navLinks.style.display === 'flex';

        if (isOpen) {

            closeMobileMenu();

        } else {

            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = 'var(--light)';
            navLinks.style.padding = '30px';
            navLinks.style.boxShadow = 'var(--shadow)';
            navLinks.style.gap = '20px';

            mobileMenuBtn.setAttribute(
                'aria-expanded',
                'true'
            );

        }

    });

}


// ==========================================================
// Fecha o menu mobile
// ==========================================================

function closeMobileMenu() {

    if (!navLinks || !mobileMenuBtn) {
        return;
    }

    if (window.innerWidth <= 768) {

        navLinks.style.display = 'none';

        mobileMenuBtn.setAttribute(
            'aria-expanded',
            'false'
        );

    }

}


// ==========================================================
// Ajuste do menu ao redimensionar
// ==========================================================

window.addEventListener('resize', function () {

    if (!navLinks || !mobileMenuBtn) {
        return;
    }

    if (window.innerWidth > 768) {

        navLinks.style.display = '';
        navLinks.style.flexDirection = '';
        navLinks.style.position = '';
        navLinks.style.top = '';
        navLinks.style.left = '';
        navLinks.style.width = '';
        navLinks.style.backgroundColor = '';
        navLinks.style.padding = '';
        navLinks.style.boxShadow = '';
        navLinks.style.gap = '';

        mobileMenuBtn.setAttribute(
            'aria-expanded',
            'false'
        );

    }

});


// ==========================================================
// Scroll suave
// ==========================================================

document
    .querySelectorAll('a[href^="#"]')
    .forEach(function (anchor) {

        anchor.addEventListener(
            'click',
            function (event) {

                const targetId =
                    this.getAttribute('href');

                if (
                    !targetId ||
                    targetId === '#'
                ) {
                    return;
                }

                const targetElement =
                    document.querySelector(targetId);

                if (!targetElement) {
                    return;
                }

                event.preventDefault();

                closeMobileMenu();

                window.scrollTo({
                    top:
                        targetElement.offsetTop -
                        100,
                    behavior: 'smooth'
                });

            }
        );

    });


// ==========================================================
// Animações de entrada
// ==========================================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};


if ('IntersectionObserver' in window) {

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

            element.style.opacity = '0';

            element.style.transform =
                'translateY(20px)';

            element.style.transition =
                'opacity 0.6s ease, transform 0.6s ease';

            observer.observe(element);

        }
    );

}


// ==========================================================
// LocalStorage
// ==========================================================

function loadMemories() {

    try {

        const storedMemories =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!storedMemories) {
            return [];
        }

        const parsedMemories =
            JSON.parse(storedMemories);

        if (
            !Array.isArray(
                parsedMemories
            )
        ) {
            return [];
        }

        return parsedMemories;

    } catch (error) {

        console.error(
            'Erro ao carregar memórias:',
            error
        );

        return [];

    }

}


function saveMemories() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(memories)
        );

        return true;

    } catch (error) {

        console.error(
            'Erro ao salvar memórias:',
            error
        );

        return false;

    }

}


// ==========================================================
// Criação de ID
// ==========================================================

function createMemoryId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            'function'
    ) {

        return window.crypto.randomUUID();

    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


// ==========================================================
// Formatação de data
// ==========================================================

function formatDate(dateString) {

    if (!dateString) {
        return '';
    }

    const date = new Date(dateString);

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
// Escape HTML
// ==========================================================

function escapeHTML(value) {

    const div =
        document.createElement('div');

    div.textContent =
        value ?? '';

    return div.innerHTML;

}


// ==========================================================
// Mensagens do formulário
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

    formMessage.textContent = '';

    formMessage.className =
        'form-message';

}


// ==========================================================
// Limpar formulário
// ==========================================================

function clearMemoryForm() {

    if (!memoryForm) {
        return;
    }

    memoryForm.reset();

    clearFormMessage();

    if (memoryPerson) {
        memoryPerson.focus();
    }

}


// ==========================================================
// Registro de memória
// ==========================================================

if (memoryForm) {

    memoryForm.addEventListener(
        'submit',
        function (event) {

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


            const newMemory = {

                id: createMemoryId(),

                person,

                period,

                title,

                category,

                story,

                createdAt:
                    new Date().toISOString()

            };


            memories.unshift(
                newMemory
            );


            const saved =
                saveMemories();


            if (!saved) {

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
                'Memória preservada com sucesso neste navegador.',
                'success'
            );


            setTimeout(
                function () {

                    const archive =
                        document.getElementById(
                            'acervo'
                        );

                    if (archive) {

                        window.scrollTo({
                            top:
                                archive.offsetTop -
                                100,
                            behavior:
                                'smooth'
                        });

                    }

                },
                500
            );

        }
    );

}


// ==========================================================
// Botão limpar
// ==========================================================

if (clearFormButton) {

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
            promptText.textContent.trim()
    ) {

        const currentIndex =
            prompts.indexOf(
                newPrompt
            );

        const nextIndex =
            (
                currentIndex + 1
            ) %
            prompts.length;

        newPrompt =
            prompts[nextIndex];

    }


    promptText.textContent =
        newPrompt;

}


if (newPromptButton) {

    newPromptButton.addEventListener(
        'click',
        showRandomPrompt
    );

}


// ==========================================================
// Busca e filtros
// ==========================================================

if (memorySearch) {

    memorySearch.addEventListener(
        'input',
        renderMemories
    );

}


if (categoryFilter) {

    categoryFilter.addEventListener(
        'change',
        renderMemories
    );

}


// ==========================================================
// Filtragem das memórias
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
// Renderização do acervo
// ==========================================================

function renderMemories() {

    if (
        !memoryArchive ||
        !memoryCount
    ) {
        return;
    }


    updateMemoryCount();


    const filteredMemories =
        getFilteredMemories();


    memoryArchive.innerHTML = '';


    if (
        memories.length === 0
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
        filteredMemories.length === 0
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
// Criar card
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
                ${escapeHTML(memory.category)}
            </span>

            <span class="memory-period">
                ${periodText}
            </span>

        </div>


        <div>

            <h3>
                ${escapeHTML(memory.title)}
            </h3>

            <p class="memory-person">
                <i class="fas fa-user"></i>
                ${escapeHTML(memory.person)}
            </p>

        </div>


        <p class="memory-story">
            ${escapeHTML(memory.story)}
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
                data-delete-memory="${escapeHTML(memory.id)}"
                aria-label="Excluir memória ${escapeHTML(memory.title)}"
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


    if (deleteButton) {

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

    if (!memoryCount) {
        return;
    }


    const total =
        memories.length;


    memoryCount.textContent =
        total === 1
            ? '1 memória'
            : `${total} memórias`;

}


// ==========================================================
// Exclusão
// ==========================================================

function deleteMemory(
    memoryId
) {

    const memory =
        memories.find(
            function (item) {
                return item.id === memoryId;
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


    const previousMemories =
        [...memories];


    memories =
        memories.filter(
            function (item) {
                return item.id !== memoryId;
            }
        );


    const saved =
        saveMemories();


    if (!saved) {

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
// Inicialização
// ==========================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        renderMemories();

    }
);


// Caso o script seja carregado depois do DOM,
// renderiza imediatamente também.

if (
    document.readyState !==
    'loading'
) {

    renderMemories();

}

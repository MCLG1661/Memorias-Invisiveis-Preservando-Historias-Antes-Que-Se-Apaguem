// ==========================================================
// MEMÓRIAS INVISÍVEIS
// FASE 8.5 — NAVEGAÇÃO MEMÓRIA ↔ PESSOA
//
// Inclui:
// - Modelo temporal da Timeline
// - Timeline cronológica
// - Pessoas na Timeline
// - Filtros Pessoa / Categoria / Período
// - Navegação Timeline → Memória
// - Navegação Timeline → Perfil da Pessoa
//
// Regra de navegação:
// - O Acervo é a fonte de verdade.
// - Se a pessoa é navegável no card do Acervo,
//   também será navegável na Timeline.
// - Em modo local, a pessoa permanece informativa.
// ==========================================================

(function () {

    'use strict';


    // ======================================================
    // CONFIGURAÇÕES
    // ======================================================

    const TIMELINE_SECTION_ID = 'timeline';
    const TIMELINE_LIST_ID = 'familyTimeline';
    const TIMELINE_STYLE_ID = 'mi-timeline-styles';

    const PERSON_FILTER_ID = 'timelinePersonFilter';
    const CATEGORY_FILTER_ID = 'timelineCategoryFilter';
    const PERIOD_FILTER_ID = 'timelinePeriodFilter';
    const CLEAR_FILTERS_ID = 'timelineClearFilters';
    const RESULT_COUNT_ID = 'timelineResultCount';

    const MEMORY_ARCHIVE_ID = 'memoryArchive';

    const UNKNOWN_LABEL = 'Período não determinado';

    let timelineMemories = [];
    let archiveObserver = null;
    let syncTimer = null;


    // ======================================================
    // PRECISÃO TEMPORAL
    // ======================================================

    const PRECISION = Object.freeze({

        EXACT: 'exact',
        APPROXIMATE: 'approximate',
        RANGE: 'range',
        DECADE: 'decade',
        UNKNOWN: 'unknown'

    });


    // ======================================================
    // UTILITÁRIOS
    // ======================================================

    function normalizeText(value) {

        return String(value || '')
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR');

    }


    function escapeHTML(value) {

        const div = document.createElement('div');

        div.textContent = value ?? '';

        return div.innerHTML;

    }


    function cleanElementText(element) {

        if (!element) {
            return '';
        }

        return String(element.textContent || '')
            .trim()
            .replace(/\s+/g, ' ');

    }


    function isValidYear(year) {

        return (
            Number.isInteger(year) &&
            year >= 1000 &&
            year <= 2999
        );

    }


    // ======================================================
    // MODELO TEMPORAL
    // ======================================================

    function createUnknownTimeline(periodText = '') {

        const original = String(periodText || '').trim();

        return {

            original,

            year: null,

            endYear: null,

            precision: PRECISION.UNKNOWN,

            label:
                original ||
                UNKNOWN_LABEL,

            sortable: false,

            sortKey: null

        };

    }


    function createTimelineResult({
        original,
        year,
        endYear = null,
        precision,
        label
    }) {

        return {

            original:
                String(original || '').trim(),

            year,

            endYear,

            precision,

            label,

            sortable:
                Number.isInteger(year),

            sortKey:
                Number.isInteger(year)
                    ? year
                    : null

        };

    }


    // ======================================================
    // PARSER — ANO EXATO
    // ======================================================

    function parseExactYear(original, normalized) {

        if (
            !/^(18|19|20)\d{2}$/.test(normalized)
        ) {
            return null;
        }

        const year = Number(normalized);

        if (!isValidYear(year)) {
            return null;
        }

        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION.EXACT,

            label:
                String(year)

        });

    }


    // ======================================================
    // PARSER — INTERVALO
    // ======================================================

    function parseYearRange(original, normalized) {

        const match = normalized.match(
            /^((?:18|19|20)\d{2})\s*(?:-|–|—|a|ate)\s*((?:18|19|20)\d{2})$/
        );

        if (!match) {
            return null;
        }

        const first = Number(match[1]);
        const second = Number(match[2]);

        if (
            !isValidYear(first) ||
            !isValidYear(second)
        ) {
            return null;
        }

        const year =
            Math.min(first, second);

        const endYear =
            Math.max(first, second);

        return createTimelineResult({

            original,

            year,

            endYear,

            precision:
                PRECISION.RANGE,

            label:
                `${year}–${endYear}`

        });

    }


    // ======================================================
    // PARSER — DÉCADA
    // ======================================================

    function parseDecade(original, normalized) {

        const fourDigits = normalized.match(
            /^(?:decada de|decada dos|anos)\s*((?:18|19|20)\d{2})$/
        );

        if (fourDigits) {

            const rawYear =
                Number(fourDigits[1]);

            const year =
                Math.floor(rawYear / 10) * 10;

            return createTimelineResult({

                original,

                year,

                endYear:
                    year + 9,

                precision:
                    PRECISION.DECADE,

                label:
                    `Década de ${year}`

            });

        }


        const twoDigits = normalized.match(
            /^(?:decada de|decada dos|anos)\s*(\d{2})$/
        );

        if (!twoDigits) {
            return null;
        }

        const shortYear =
            Number(twoDigits[1]);

        const currentYear =
            new Date().getFullYear();

        const currentShort =
            currentYear % 100;

        const century =
            shortYear <= currentShort
                ? 2000
                : 1900;

        const year =
            century + shortYear;

        return createTimelineResult({

            original,

            year,

            endYear:
                year + 9,

            precision:
                PRECISION.DECADE,

            label:
                `Década de ${year}`

        });

    }


    // ======================================================
    // PARSER — APROXIMADO
    // ======================================================

    function parseApproximateYear(
        original,
        normalized
    ) {

        const patterns = [

            /^(?:cerca de|por volta de|aproximadamente|aprox\.?)\s*((?:18|19|20)\d{2})$/,

            /^((?:18|19|20)\d{2})\s*(?:aproximadamente|aprox\.?|mais ou menos)$/,

            /^(?:inicio de|meados de|final de)\s*((?:18|19|20)\d{2})$/

        ];


        for (const pattern of patterns) {

            const match =
                normalized.match(pattern);

            if (!match) {
                continue;
            }

            const year =
                Number(match[1]);

            if (!isValidYear(year)) {
                continue;
            }

            return createTimelineResult({

                original,

                year,

                precision:
                    PRECISION.APPROXIMATE,

                label:
                    `≈ ${year}`

            });

        }

        return null;

    }


    // ======================================================
    // PARSER — ANO EMBUTIDO
    // ======================================================

    function parseEmbeddedYear(
        original,
        normalized
    ) {

        const matches =
            normalized.match(
                /(?:18|19|20)\d{2}/g
            );

        if (
            !matches ||
            matches.length !== 1
        ) {
            return null;
        }

        const year =
            Number(matches[0]);

        if (!isValidYear(year)) {
            return null;
        }

        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION.APPROXIMATE,

            label:
                original

        });

    }


    // ======================================================
    // INTERPRETAR PERÍODO
    // ======================================================

    function parseMemoryPeriod(periodText) {

        const original =
            String(periodText || '').trim();

        if (!original) {
            return createUnknownTimeline();
        }

        const normalized =
            normalizeText(original);

        const parsers = [

            parseExactYear,
            parseYearRange,
            parseDecade,
            parseApproximateYear,
            parseEmbeddedYear

        ];

        for (const parser of parsers) {

            const result =
                parser(
                    original,
                    normalized
                );

            if (result) {
                return result;
            }

        }

        return createUnknownTimeline(
            original
        );

    }


    // ======================================================
    // ENRIQUECIMENTO
    // ======================================================

    function enrichMemoryWithTimeline(memory) {

        const safe =
            memory &&
            typeof memory === 'object'
                ? memory
                : {};

        return {

            ...safe,

            timeline:
                parseMemoryPeriod(
                    safe.period
                )

        };

    }


    function enrichMemoriesWithTimeline(memories) {

        if (!Array.isArray(memories)) {
            return [];
        }

        return memories.map(
            enrichMemoryWithTimeline
        );

    }


    // ======================================================
    // ORDENAÇÃO
    // ======================================================

    function compareTimelineAscending(
        firstMemory,
        secondMemory
    ) {

        const first =
            firstMemory.timeline;

        const second =
            secondMemory.timeline;


        if (
            first.sortable &&
            !second.sortable
        ) {
            return -1;
        }

        if (
            !first.sortable &&
            second.sortable
        ) {
            return 1;
        }

        if (
            !first.sortable &&
            !second.sortable
        ) {
            return 0;
        }

        if (
            first.sortKey !==
            second.sortKey
        ) {

            return (
                first.sortKey -
                second.sortKey
            );

        }

        return (
            (
                first.endYear ??
                first.year
            ) -
            (
                second.endYear ??
                second.year
            )
        );

    }


    function sortMemoriesByTimeline(memories) {

        return enrichMemoriesWithTimeline(
            memories
        ).sort(
            compareTimelineAscending
        );

    }


    function groupMemoriesByTimeline(memories) {

        const sorted =
            sortMemoriesByTimeline(
                memories
            );

        return {

            chronological:
                sorted.filter(
                    memory =>
                        memory.timeline.sortable
                ),

            undetermined:
                sorted.filter(
                    memory =>
                        !memory.timeline.sortable
                )

        };

    }


    // ======================================================
    // ACERVO — LOCALIZAR CARD
    // ======================================================

    function getArchive() {

        return document.getElementById(
            MEMORY_ARCHIVE_ID
        );

    }


    function findArchiveMemoryCard(memoryId) {

        const archive =
            getArchive();

        if (!archive || !memoryId) {
            return null;
        }

        return (
            Array.from(
                archive.querySelectorAll(
                    '.memory-card'
                )
            ).find(
                card =>
                    String(
                        card.dataset.memoryId || ''
                    ) ===
                    String(memoryId)
            ) ||
            null
        );

    }


    // ======================================================
    // PESSOA — LER DO CARD ORIGINAL
    //
    // IMPORTANTE:
    // O próprio Acervo define se existe perfil navegável.
    //
    // .memory-person-button = pessoa vinculada
    // .memory-person        = apenas texto/local
    // ======================================================

    function readPersonFromCard(card) {

        if (!card) {

            return {

                name: '',
                personId: null,
                navigable: false

            };

        }


        const button =
            card.querySelector(
                '.memory-person-button'
            );

        if (button) {

            return {

                name:
                    cleanElementText(
                        button
                    ),

                personId:
                    button.getAttribute(
                        'data-memory-person-id'
                    ) ||
                    button.dataset
                        ?.memoryPersonId ||
                    null,

                navigable: true

            };

        }


        const text =
            card.querySelector(
                '.memory-person'
            );

        return {

            name:
                cleanElementText(
                    text
                ),

            personId: null,

            navigable: false

        };

    }


    // ======================================================
    // LER MEMÓRIAS DO ACERVO
    // ======================================================

    function readMemoriesFromArchive() {

        const archive =
            getArchive();

        if (!archive) {
            return [];
        }

        const cards =
            archive.querySelectorAll(
                '.memory-card'
            );

        return Array
            .from(cards)
            .map(
                function (card, index) {

                    const person =
                        readPersonFromCard(
                            card
                        );

                    let period =
                        cleanElementText(
                            card.querySelector(
                                '.memory-period'
                            )
                        );

                    if (
                        period ===
                        'Período não informado'
                    ) {
                        period = '';
                    }

                    return {

                        id:
                            card.dataset.memoryId ||
                            `memory-${index}`,

                        title:
                            cleanElementText(
                                card.querySelector(
                                    'h3'
                                )
                            ),

                        person:
                            person.name,

                        personId:
                            person.personId,

                        personNavigable:
                            person.navigable,

                        period,

                        category:
                            cleanElementText(
                                card.querySelector(
                                    '.memory-category'
                                )
                            ),

                        story:
                            cleanElementText(
                                card.querySelector(
                                    '.memory-story'
                                )
                            )

                    };

                }
            );

    }


    // ======================================================
    // NAVEGAÇÃO → MEMÓRIA
    // ======================================================

    function clearArchiveFilters() {

        const search =
            document.getElementById(
                'memorySearch'
            );

        const category =
            document.getElementById(
                'categoryFilter'
            );


        if (
            search &&
            search.value
        ) {

            search.value = '';

            search.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );

        }


        if (
            category &&
            category.value !== 'all'
        ) {

            category.value = 'all';

            category.dispatchEvent(
                new Event(
                    'change',
                    {
                        bubbles: true
                    }
                )
            );

        }

    }


    function highlightMemory(card) {

        if (!card) {
            return;
        }

        document
            .querySelectorAll(
                '.memory-card.mi-memory-highlight'
            )
            .forEach(
                item =>
                    item.classList.remove(
                        'mi-memory-highlight'
                    )
            );

        card.classList.add(
            'mi-memory-highlight'
        );

        window.setTimeout(
            function () {

                card.classList.remove(
                    'mi-memory-highlight'
                );

            },
            2800
        );

    }


    function openMemory(memoryId) {

        if (!memoryId) {
            return;
        }

        clearArchiveFilters();


        const locateAndOpen =
            function () {

                const card =
                    findArchiveMemoryCard(
                        memoryId
                    );

                if (!card) {
                    return false;
                }

                card.scrollIntoView({

                    behavior: 'smooth',

                    block: 'center'

                });

                highlightMemory(card);

                return true;

            };


        if (locateAndOpen()) {
            return;
        }


        window.setTimeout(
            function () {

                if (!locateAndOpen()) {

                    window.alert(
                        'Não foi possível localizar esta memória no Acervo.'
                    );

                }

            },
            250
        );

    }


    // ======================================================
    // NAVEGAÇÃO → PERFIL DA PESSOA
    //
    // Não duplicamos a lógica do family.js.
    // Reutilizamos o botão da pessoa existente no card
    // original do Acervo.
    // ======================================================

    function openPersonProfile(memoryId) {

        if (!memoryId) {
            return;
        }

        const card =
            findArchiveMemoryCard(
                memoryId
            );

        if (!card) {

            window.alert(
                'Não foi possível localizar esta memória no Acervo.'
            );

            return;

        }


        const personButton =
            card.querySelector(
                '.memory-person-button'
            );


        if (!personButton) {

            // Modo local ou memória sem perfil vinculado.
            // O chip é apenas informativo.
            return;

        }


        personButton.click();

    }


    // ======================================================
    // FILTROS
    // ======================================================

    function uniqueValues(property) {

        return [
            ...new Set(

                timelineMemories
                    .map(
                        memory =>
                            String(
                                memory[property] || ''
                            ).trim()
                    )
                    .filter(Boolean)

            )
        ].sort(
            function (first, second) {

                return first.localeCompare(
                    second,
                    'pt-BR',
                    {
                        sensitivity: 'base'
                    }
                );

            }
        );

    }


    function periodOptions() {

        const values =
            new Map();


        enrichMemoriesWithTimeline(
            timelineMemories
        ).forEach(
            function (memory) {

                const timeline =
                    memory.timeline;

                const label =
                    timeline.sortable
                        ? timeline.label
                        : UNKNOWN_LABEL;

                if (!values.has(label)) {

                    values.set(
                        label,
                        {
                            label,

                            key:
                                timeline.sortable
                                    ? timeline.sortKey
                                    : Number
                                        .MAX_SAFE_INTEGER
                        }
                    );

                }

            }
        );


        return Array
            .from(
                values.values()
            )
            .sort(
                (first, second) =>
                    first.key -
                    second.key
            )
            .map(
                item =>
                    item.label
            );

    }


    function fillSelect(
        selectId,
        defaultLabel,
        values
    ) {

        const select =
            document.getElementById(
                selectId
            );

        if (!select) {
            return;
        }

        const previous =
            select.value;

        select.innerHTML = '';


        const defaultOption =
            document.createElement(
                'option'
            );

        defaultOption.value = 'all';

        defaultOption.textContent =
            defaultLabel;

        select.appendChild(
            defaultOption
        );


        values.forEach(
            function (value) {

                const option =
                    document.createElement(
                        'option'
                    );

                option.value =
                    value;

                option.textContent =
                    value;

                select.appendChild(
                    option
                );

            }
        );


        if (
            Array.from(
                select.options
            ).some(
                option =>
                    option.value ===
                    previous
            )
        ) {

            select.value =
                previous;

        }

    }


    function populateFilters() {

        fillSelect(
            PERSON_FILTER_ID,
            'Todas as pessoas',
            uniqueValues('person')
        );

        fillSelect(
            CATEGORY_FILTER_ID,
            'Todas as categorias',
            uniqueValues('category')
        );

        fillSelect(
            PERIOD_FILTER_ID,
            'Todos os períodos',
            periodOptions()
        );

    }


    function getFilters() {

        return {

            person:
                document
                    .getElementById(
                        PERSON_FILTER_ID
                    )
                    ?.value ||
                'all',

            category:
                document
                    .getElementById(
                        CATEGORY_FILTER_ID
                    )
                    ?.value ||
                'all',

            period:
                document
                    .getElementById(
                        PERIOD_FILTER_ID
                    )
                    ?.value ||
                'all'

        };

    }


    function getFilteredMemories() {

        const filters =
            getFilters();

        return enrichMemoriesWithTimeline(
            timelineMemories
        ).filter(
            function (memory) {

                const period =
                    memory.timeline.sortable
                        ? memory.timeline.label
                        : UNKNOWN_LABEL;

                return (

                    (
                        filters.person === 'all' ||
                        memory.person ===
                            filters.person
                    ) &&

                    (
                        filters.category === 'all' ||
                        memory.category ===
                            filters.category
                    ) &&

                    (
                        filters.period === 'all' ||
                        period ===
                            filters.period
                    )

                );

            }
        );

    }


    // ======================================================
    // SEÇÃO DA TIMELINE
    // ======================================================

    function ensureTimelineSection() {

        let section =
            document.getElementById(
                TIMELINE_SECTION_ID
            );

        if (section) {
            return section;
        }


        const archiveSection =
            document.getElementById(
                'acervo'
            );

        if (!archiveSection) {
            return null;
        }


        section =
            document.createElement(
                'section'
            );

        section.id =
            TIMELINE_SECTION_ID;

        section.className =
            'mi-timeline-section';


        section.innerHTML = `

            <div class="container">

                <h2 class="section-title">
                    Linha do Tempo Familiar
                </h2>

                <p class="section-intro">
                    Explore as histórias do acervo
                    em ordem cronológica e navegue
                    entre memórias e pessoas.
                </p>


                <div class="mi-timeline-filters">

                    <div class="mi-timeline-filter-group">

                        <label for="${PERSON_FILTER_ID}">
                            <i class="fas fa-user"></i>
                            Pessoa
                        </label>

                        <select
                            id="${PERSON_FILTER_ID}"
                            class="mi-timeline-filter-control"
                        >
                            <option value="all">
                                Todas as pessoas
                            </option>
                        </select>

                    </div>


                    <div class="mi-timeline-filter-group">

                        <label for="${CATEGORY_FILTER_ID}">
                            <i class="fas fa-tag"></i>
                            Categoria
                        </label>

                        <select
                            id="${CATEGORY_FILTER_ID}"
                            class="mi-timeline-filter-control"
                        >
                            <option value="all">
                                Todas as categorias
                            </option>
                        </select>

                    </div>


                    <div class="mi-timeline-filter-group">

                        <label for="${PERIOD_FILTER_ID}">
                            <i class="fas fa-calendar-days"></i>
                            Período
                        </label>

                        <select
                            id="${PERIOD_FILTER_ID}"
                            class="mi-timeline-filter-control"
                        >
                            <option value="all">
                                Todos os períodos
                            </option>
                        </select>

                    </div>


                    <button
                        type="button"
                        id="${CLEAR_FILTERS_ID}"
                        class="mi-timeline-clear-button"
                    >
                        <i class="fas fa-rotate-left"></i>
                        Limpar filtros
                    </button>

                </div>


                <div class="mi-timeline-results-summary">

                    <span id="${RESULT_COUNT_ID}">
                        0 memórias
                    </span>

                </div>


                <div
                    id="${TIMELINE_LIST_ID}"
                    class="mi-timeline-wrapper"
                    aria-live="polite"
                ></div>

            </div>

        `;


        archiveSection.insertAdjacentElement(
            'afterend',
            section
        );

        return section;

    }


    // ======================================================
    // CHIP DA PESSOA
    // ======================================================

    function createPersonMarkup(memory) {

        const personName =
            String(
                memory.person || ''
            ).trim();

        if (!personName) {
            return '';
        }


        if (!memory.personNavigable) {

            return `

                <div class="mi-timeline-person">

                    <span class="mi-timeline-person-icon">
                        <i class="fas fa-user"></i>
                    </span>

                    <span>
                        ${escapeHTML(personName)}
                    </span>

                </div>

            `;

        }


        return `

            <button
                type="button"
                class="
                    mi-timeline-person
                    mi-timeline-person-button
                "
                data-timeline-person
                aria-label="Abrir perfil de ${escapeHTML(personName)}"
                title="Abrir perfil de ${escapeHTML(personName)}"
            >

                <span class="mi-timeline-person-icon">
                    <i class="fas fa-user"></i>
                </span>

                <span>
                    ${escapeHTML(personName)}
                </span>

                <i
                    class="
                        fas
                        fa-arrow-up-right-from-square
                        mi-timeline-link-icon
                    "
                ></i>

            </button>

        `;

    }


    // ======================================================
    // CARD CRONOLÓGICO
    // ======================================================

    function createTimelineItem(memory) {

        const article =
            document.createElement(
                'article'
            );

        article.className =
            'mi-timeline-item';

        article.dataset.memoryId =
            memory.id || '';


        article.innerHTML = `

            <div class="mi-timeline-date">

                ${escapeHTML(
                    memory.timeline?.label ||
                    UNKNOWN_LABEL
                )}

            </div>


            <div class="mi-timeline-content">

                ${
                    memory.category
                        ? `
                            <span class="mi-timeline-category">
                                ${escapeHTML(memory.category)}
                            </span>
                        `
                        : ''
                }


                <h3 class="mi-timeline-title">

                    ${escapeHTML(
                        memory.title ||
                        'Memória sem título'
                    )}

                </h3>


                ${createPersonMarkup(memory)}


                ${
                    memory.story
                        ? `
                            <p class="mi-timeline-story">
                                ${escapeHTML(memory.story)}
                            </p>
                        `
                        : ''
                }


                <div class="mi-timeline-actions">

                    <button
                        type="button"
                        class="mi-timeline-memory-button"
                        data-timeline-memory
                    >
                        <i class="fas fa-book-open"></i>
                        Ver memória
                    </button>

                </div>

            </div>

        `;

        return article;

    }


    // ======================================================
    // CARD — PERÍODO NÃO DETERMINADO
    // ======================================================

    function createUnknownCard(memory) {

        const article =
            document.createElement(
                'article'
            );

        article.className =
            'mi-timeline-undetermined-card';

        article.dataset.memoryId =
            memory.id || '';


        article.innerHTML = `

            <h4>
                ${escapeHTML(
                    memory.title ||
                    'Memória sem título'
                )}
            </h4>

            <p class="mi-timeline-undetermined-period">
                ${escapeHTML(
                    memory.period ||
                    UNKNOWN_LABEL
                )}
            </p>

            ${createPersonMarkup(memory)}

            <div class="mi-timeline-actions">

                <button
                    type="button"
                    class="mi-timeline-memory-button"
                    data-timeline-memory
                >
                    <i class="fas fa-book-open"></i>
                    Ver memória
                </button>

            </div>

        `;

        return article;

    }


    // ======================================================
    // RENDER
    // ======================================================

    function renderTimeline() {

        const container =
            document.getElementById(
                TIMELINE_LIST_ID
            );

        if (!container) {
            return;
        }


        const filtered =
            getFilteredMemories();


        const counter =
            document.getElementById(
                RESULT_COUNT_ID
            );

        if (counter) {

            counter.textContent =
                filtered.length === 1
                    ? '1 memória'
                    : `${filtered.length} memórias`;

        }


        container.innerHTML = '';


        if (filtered.length === 0) {

            container.innerHTML = `

                <div class="mi-timeline-empty">

                    <i class="fas fa-clock-rotate-left"></i>

                    <h3>
                        Nenhuma memória encontrada
                    </h3>

                    <p>
                        Registre uma memória ou altere
                        os filtros da Linha do Tempo.
                    </p>

                </div>

            `;

            return;

        }


        const groups =
            groupMemoriesByTimeline(
                filtered
            );


        if (
            groups.chronological.length
        ) {

            const line =
                document.createElement(
                    'div'
                );

            line.className =
                'mi-timeline-line';

            container.appendChild(
                line
            );


            groups.chronological.forEach(
                function (memory) {

                    container.appendChild(
                        createTimelineItem(
                            memory
                        )
                    );

                }
            );

        }


        if (
            groups.undetermined.length
        ) {

            const section =
                document.createElement(
                    'div'
                );

            section.className =
                'mi-timeline-undetermined';


            section.innerHTML = `

                <h3 class="mi-timeline-undetermined-title">

                    <i class="fas fa-circle-question"></i>

                    Período não determinado

                </h3>

                <div class="mi-timeline-undetermined-list"></div>

            `;


            const list =
                section.querySelector(
                    '.mi-timeline-undetermined-list'
                );


            groups.undetermined.forEach(
                function (memory) {

                    list.appendChild(
                        createUnknownCard(
                            memory
                        )
                    );

                }
            );


            container.appendChild(
                section
            );

        }

    }


    // ======================================================
    // EVENT DELEGATION — FASE 8.5
    //
    // Um único listener permanece no container.
    // A Timeline pode ser recriada quantas vezes precisar
    // sem perder os eventos.
    // ======================================================

    function bindTimelineNavigation() {

        const container =
            document.getElementById(
                TIMELINE_LIST_ID
            );

        if (!container) {
            return;
        }


        if (
            container.dataset
                .navigationBound ===
            'true'
        ) {
            return;
        }


        container.dataset.navigationBound =
            'true';


        container.addEventListener(
            'click',
            function (event) {

                const personButton =
                    event.target.closest(
                        '.mi-timeline-person-button'
                    );

                const memoryButton =
                    event.target.closest(
                        '.mi-timeline-memory-button'
                    );


                if (personButton) {

                    event.preventDefault();
                    event.stopPropagation();

                    const article =
                        personButton.closest(
                            '[data-memory-id]'
                        );

                    const memoryId =
                        article?.dataset
                            ?.memoryId;

                    if (memoryId) {

                        openPersonProfile(
                            memoryId
                        );

                    }

                    return;

                }


                if (memoryButton) {

                    event.preventDefault();
                    event.stopPropagation();

                    const article =
                        memoryButton.closest(
                            '[data-memory-id]'
                        );

                    const memoryId =
                        article?.dataset
                            ?.memoryId;

                    if (memoryId) {

                        openMemory(
                            memoryId
                        );

                    }

                }

            }
        );

    }


    // ======================================================
    // SINCRONIZAR
    // ======================================================

    function syncTimeline() {

        timelineMemories =
            readMemoriesFromArchive();

        populateFilters();

        renderTimeline();

    }


    // ======================================================
    // EVENTOS DOS FILTROS
    // ======================================================

    function bindFilterEvents() {

        [
            PERSON_FILTER_ID,
            CATEGORY_FILTER_ID,
            PERIOD_FILTER_ID
        ].forEach(
            function (id) {

                const select =
                    document.getElementById(
                        id
                    );

                if (!select) {
                    return;
                }

                if (
                    select.dataset.bound ===
                    'true'
                ) {
                    return;
                }

                select.dataset.bound =
                    'true';

                select.addEventListener(
                    'change',
                    renderTimeline
                );

            }
        );


        const clearButton =
            document.getElementById(
                CLEAR_FILTERS_ID
            );

        if (
            clearButton &&
            clearButton.dataset.bound !==
                'true'
        ) {

            clearButton.dataset.bound =
                'true';

            clearButton.addEventListener(
                'click',
                function () {

                    [
                        PERSON_FILTER_ID,
                        CATEGORY_FILTER_ID,
                        PERIOD_FILTER_ID
                    ].forEach(
                        function (id) {

                            const select =
                                document.getElementById(
                                    id
                                );

                            if (select) {
                                select.value =
                                    'all';
                            }

                        }
                    );

                    renderTimeline();

                }
            );

        }

    }


    // ======================================================
    // OBSERVAR ALTERAÇÕES DO ACERVO
    // ======================================================

    function observeArchive() {

        const archive =
            getArchive();

        if (!archive) {
            return;
        }


        archiveObserver
            ?.disconnect();


        archiveObserver =
            new MutationObserver(
                function () {

                    window.clearTimeout(
                        syncTimer
                    );

                    syncTimer =
                        window.setTimeout(
                            syncTimeline,
                            100
                        );

                }
            );


        archiveObserver.observe(
            archive,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );

    }


    // ======================================================
    // ESTILOS
    // ======================================================

    function injectStyles() {

        document
            .getElementById(
                TIMELINE_STYLE_ID
            )
            ?.remove();


        const style =
            document.createElement(
                'style'
            );

        style.id =
            TIMELINE_STYLE_ID;


        style.textContent = `

            .mi-timeline-section {
                background: var(--light, #faf7f2);
                position: relative;
                overflow: hidden;
            }

            .mi-timeline-filters {
                max-width: 1000px;
                margin: 40px auto 0;
                padding: 22px;
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr))
                    auto;
                gap: 16px;
                align-items: end;
                background: rgba(255,255,255,.82);
                border: 1px solid rgba(0,0,0,.06);
                border-radius: 18px;
                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,.05);
            }

            .mi-timeline-filter-group {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .mi-timeline-filter-group label {
                font-size: .82rem;
                font-weight: 600;
                color: var(--primary, #28536b);
            }

            .mi-timeline-filter-group label i {
                margin-right: 5px;
                color: var(--accent, #c96f4a);
            }

            .mi-timeline-filter-control {
                width: 100%;
                min-height: 44px;
                padding: 0 12px;
                border:
                    1px solid
                    rgba(40,83,107,.18);
                border-radius: 10px;
                background: white;
                color: var(--primary, #28536b);
                font-family: inherit;
                cursor: pointer;
            }

            .mi-timeline-clear-button {
                min-height: 44px;
                padding: 0 16px;
                border:
                    1px solid
                    rgba(201,111,74,.28);
                border-radius: 10px;
                background: transparent;
                color: var(--accent, #c96f4a);
                font-family: inherit;
                font-weight: 600;
                cursor: pointer;
            }

            .mi-timeline-clear-button:hover {
                background: var(--accent, #c96f4a);
                color: white;
            }

            .mi-timeline-results-summary {
                max-width: 900px;
                margin: 22px auto 0;
                text-align: right;
                color: var(--gray, #66727a);
                font-size: .85rem;
                font-weight: 600;
            }

            .mi-timeline-wrapper {
                max-width: 900px;
                margin: 28px auto 0;
                position: relative;
            }

            .mi-timeline-line {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 110px;
                width: 3px;
                background: rgba(201,111,74,.25);
                border-radius: 999px;
            }

            .mi-timeline-item {
                position: relative;
                display: grid;
                grid-template-columns:
                    90px 1fr;
                gap: 40px;
                padding-bottom: 38px;
            }

            .mi-timeline-date {
                padding-top: 18px;
                text-align: right;
                font-family:
                    "Playfair Display",
                    serif;
                font-weight: 700;
                color: var(--primary, #28536b);
            }

            .mi-timeline-content {
                position: relative;
                padding: 22px 25px;
                border-radius: 16px;
                background: white;
                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,.08);
            }

            .mi-timeline-content::before {
                content: "";
                position: absolute;
                top: 25px;
                left: -35px;
                width: 13px;
                height: 13px;
                border:
                    4px solid
                    var(--light, #faf7f2);
                border-radius: 50%;
                background: var(--accent, #c96f4a);
            }

            .mi-timeline-category {
                display: inline-block;
                margin-bottom: 10px;
                padding: 5px 10px;
                border-radius: 999px;
                color: var(--accent, #c96f4a);
                background: rgba(201,111,74,.10);
                font-size: .76rem;
                font-weight: 600;
            }

            .mi-timeline-title {
                margin: 0 0 10px;
                color: var(--primary, #28536b);
                font-family:
                    "Playfair Display",
                    serif;
            }

            .mi-timeline-story {
                margin: 0;
                line-height: 1.7;
                color: var(--gray, #66727a);
            }

            .mi-timeline-person {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin: 0 0 16px;
                padding: 7px 12px;
                border:
                    1px solid
                    rgba(201,111,74,.20);
                border-radius: 999px;
                background: rgba(201,111,74,.08);
                color: var(--primary, #28536b);
                font-family: inherit;
                font-size: .88rem;
                font-weight: 600;
            }

            .mi-timeline-person-button {
                cursor: pointer;
                transition: .2s ease;
            }

            .mi-timeline-person-button:hover {
                background: rgba(201,111,74,.18);
                border-color: var(--accent, #c96f4a);
                transform: translateY(-1px);
            }

            .mi-timeline-person-icon {
                display: inline-flex;
                width: 24px;
                height: 24px;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: var(--accent, #c96f4a);
                color: white;
                font-size: .72rem;
            }

            .mi-timeline-link-icon {
                font-size: .68rem;
                opacity: .7;
            }

            .mi-timeline-actions {
                display: flex;
                justify-content: flex-end;
                margin-top: 18px;
                padding-top: 15px;
                border-top:
                    1px solid
                    rgba(40,83,107,.08);
            }

            .mi-timeline-memory-button {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                padding: 8px 13px;
                border:
                    1px solid
                    rgba(40,83,107,.18);
                border-radius: 9px;
                background: transparent;
                color: var(--primary, #28536b);
                font-family: inherit;
                font-weight: 600;
                cursor: pointer;
            }

            .mi-timeline-memory-button:hover {
                background: var(--primary, #28536b);
                color: white;
            }

            .memory-card.mi-memory-highlight {
                outline:
                    3px solid
                    rgba(201,111,74,.5);
                outline-offset: 4px;
                animation:
                    miMemoryPulse
                    1.3s ease
                    2;
            }

            @keyframes miMemoryPulse {

                50% {
                    box-shadow:
                        0 12px 38px
                        rgba(201,111,74,.32);
                }

            }

            .mi-timeline-undetermined {
                margin-top: 25px;
                padding-top: 35px;
                border-top:
                    1px solid
                    rgba(0,0,0,.08);
            }

            .mi-timeline-undetermined-title {
                text-align: center;
                color: var(--gray, #66727a);
            }

            .mi-timeline-undetermined-list {
                display: grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(250px,1fr)
                    );
                gap: 20px;
            }

            .mi-timeline-undetermined-card {
                padding: 20px;
                border-radius: 14px;
                background: white;
                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,.07);
            }

            .mi-timeline-undetermined-card h4 {
                margin: 0 0 10px;
                color: var(--primary, #28536b);
            }

            .mi-timeline-undetermined-period {
                color: var(--gray, #66727a);
            }

            .mi-timeline-empty {
                padding: 35px;
                text-align: center;
                border-radius: 18px;
                background: white;
                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,.08);
            }

            @media (max-width: 980px) {

                .mi-timeline-filters {
                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0,1fr)
                        );
                }

            }

            @media (max-width: 768px) {

                .mi-timeline-filters {
                    grid-template-columns: 1fr;
                }

                .mi-timeline-line {
                    left: 14px;
                }

                .mi-timeline-item {
                    display: block;
                    padding-left: 45px;
                }

                .mi-timeline-date {
                    padding: 0 0 8px;
                    text-align: left;
                }

                .mi-timeline-content::before {
                    left: -37px;
                }

                .mi-timeline-memory-button {
                    width: 100%;
                    justify-content: center;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    // ======================================================
    // AUTOTESTE DO MODELO TEMPORAL
    // ======================================================

    function runSelfCheck() {

        const tests = [

            [
                '1978',
                PRECISION.EXACT,
                1978
            ],

            [
                '1985-1987',
                PRECISION.RANGE,
                1985
            ],

            [
                'Década de 80',
                PRECISION.DECADE,
                1980
            ],

            [
                'Anos 90',
                PRECISION.DECADE,
                1990
            ],

            [
                '1998 aproximadamente',
                PRECISION.APPROXIMATE,
                1998
            ],

            [
                'Infância',
                PRECISION.UNKNOWN,
                null
            ]

        ];


        return tests.map(
            function (test) {

                const result =
                    parseMemoryPeriod(
                        test[0]
                    );

                return {

                    input:
                        test[0],

                    passed:
                        (
                            result.precision ===
                                test[1] &&
                            result.year ===
                                test[2]
                        ),

                    result

                };

            }
        );

    }


    // ======================================================
    // API PÚBLICA
    // ======================================================

    window.MemoriasInvisiveisTimeline = {

        PRECISION,

        parseMemoryPeriod,

        enrichMemoryWithTimeline,

        enrichMemoriesWithTimeline,

        sortMemoriesByTimeline,

        groupMemoriesByTimeline,

        readMemoriesFromArchive,

        render:
            renderTimeline,

        sync:
            syncTimeline,

        openMemory,

        openPersonProfile,

        runSelfCheck

    };


    // ======================================================
    // INICIALIZAÇÃO
    // ======================================================

    function initializeTimeline() {

        injectStyles();

        ensureTimelineSection();

        timelineMemories =
            readMemoriesFromArchive();

        populateFilters();

        bindFilterEvents();

        bindTimelineNavigation();

        renderTimeline();

        observeArchive();

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initializeTimeline,
            {
                once: true
            }
        );

    } else {

        initializeTimeline();

    }


    // ======================================================
    // FIM DA FASE 8.5
    // ======================================================

})();

// ==========================================================
// MEMÓRIAS INVISÍVEIS
// FASE 8.4 — FILTROS DA TIMELINE
//
// Evolução das Fases 8.1, 8.2 e 8.3.
//
// Responsabilidades:
// - Interpretar períodos das memórias.
// - Ordenar memórias cronologicamente.
// - Exibir a Linha do Tempo Familiar.
// - Exibir a pessoa associada à memória.
// - Filtrar a Timeline por:
//      1. Pessoa
//      2. Categoria
//      3. Período
// - Permitir combinação dos filtros.
// - Permitir limpar todos os filtros.
// - Atualizar a Timeline quando o acervo mudar.
//
// NÃO altera:
// - Supabase.
// - Banco de dados.
// - RLS.
// - Cadastro de memórias.
// - Exclusão de memórias.
// - Perfis familiares.
// - Relacionamentos.
// - Filtros do Acervo.
// - Navegação memória ↔ pessoa.
// ==========================================================

(function () {

    'use strict';


    // ======================================================
    // CONFIGURAÇÕES
    // ======================================================

    const TIMELINE_SECTION_ID = 'timeline';
    const TIMELINE_LIST_ID = 'familyTimeline';
    const TIMELINE_STYLE_ID = 'mi-timeline-styles';
    const TIMELINE_FILTERS_ID = 'timelineFilters';

    const PERSON_FILTER_ID = 'timelinePersonFilter';
    const CATEGORY_FILTER_ID = 'timelineCategoryFilter';
    const PERIOD_FILTER_ID = 'timelinePeriodFilter';
    const CLEAR_FILTERS_ID = 'timelineClearFilters';

    const TIMELINE_RESULT_COUNT_ID = 'timelineResultCount';

    const MEMORY_ARCHIVE_ID = 'memoryArchive';

    const UNKNOWN_LABEL = 'Período não determinado';

    let timelineMemories = [];


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
    // NORMALIZAÇÃO DE TEXTO
    // ======================================================

    function normalizeTimelineText(value) {

        return String(value || '')
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR');

    }


    // ======================================================
    // VALIDAÇÃO DE ANO
    // ======================================================

    function isValidTimelineYear(year) {

        return (
            Number.isInteger(year) &&
            year >= 1000 &&
            year <= 2999
        );

    }


    // ======================================================
    // RESULTADO TEMPORAL DESCONHECIDO
    // ======================================================

    function createUnknownTimeline(periodText = '') {

        const original =
            String(periodText || '').trim();

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


    // ======================================================
    // RESULTADO TEMPORAL
    // ======================================================

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
    // ANO EXATO
    // ======================================================

    function parseExactYear(
        original,
        normalized
    ) {

        const match =
            normalized.match(
                /^(18|19|20)\d{2}$/
            );

        if (!match) {
            return null;
        }


        const year =
            Number(normalized);


        if (!isValidTimelineYear(year)) {
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
    // INTERVALO DE ANOS
    // ======================================================

    function parseYearRange(
        original,
        normalized
    ) {

        const match =
            normalized.match(
                /^((?:18|19|20)\d{2})\s*(?:-|–|—|a|ate)\s*((?:18|19|20)\d{2})$/
            );


        if (!match) {
            return null;
        }


        const firstYear =
            Number(match[1]);

        const secondYear =
            Number(match[2]);


        if (
            !isValidTimelineYear(firstYear) ||
            !isValidTimelineYear(secondYear)
        ) {
            return null;
        }


        const year =
            Math.min(
                firstYear,
                secondYear
            );


        const endYear =
            Math.max(
                firstYear,
                secondYear
            );


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
    // DÉCADA
    // ======================================================

    function parseDecade(
        original,
        normalized
    ) {

        const fourDigitMatch =
            normalized.match(
                /^(?:decada de|decada dos|anos)\s*((?:18|19|20)\d{2})$/
            );


        if (fourDigitMatch) {

            const rawYear =
                Number(
                    fourDigitMatch[1]
                );


            const year =
                Math.floor(
                    rawYear / 10
                ) * 10;


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


        const twoDigitMatch =
            normalized.match(
                /^(?:decada de|decada dos|anos)\s*(\d{2})$/
            );


        if (!twoDigitMatch) {
            return null;
        }


        const shortYear =
            Number(
                twoDigitMatch[1]
            );


        const currentYear =
            new Date()
                .getFullYear();


        const currentShortYear =
            currentYear % 100;


        const century =
            shortYear <= currentShortYear
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
    // ANO APROXIMADO
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
                normalized.match(
                    pattern
                );


            if (!match) {
                continue;
            }


            const year =
                Number(
                    match[1]
                );


            if (!isValidTimelineYear(year)) {
                return null;
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
    // ANO EMBUTIDO EM TEXTO
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
            Number(
                matches[0]
            );


        if (!isValidTimelineYear(year)) {
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
    // INTERPRETADOR PRINCIPAL
    // ======================================================

    function parseMemoryPeriod(
        periodText
    ) {

        const original =
            String(
                periodText || ''
            ).trim();


        if (!original) {

            return createUnknownTimeline();

        }


        const normalized =
            normalizeTimelineText(
                original
            );


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
    // ENRIQUECER MEMÓRIA
    // ======================================================

    function enrichMemoryWithTimeline(
        memory
    ) {

        const safeMemory =
            memory &&
            typeof memory === 'object'
                ? memory
                : {};


        return {

            ...safeMemory,

            timeline:
                parseMemoryPeriod(
                    safeMemory.period
                )

        };

    }


    // ======================================================
    // ENRIQUECER LISTA
    // ======================================================

    function enrichMemoriesWithTimeline(
        memories
    ) {

        if (!Array.isArray(memories)) {
            return [];
        }


        return memories.map(
            enrichMemoryWithTimeline
        );

    }


    // ======================================================
    // ORDENAÇÃO ASCENDENTE
    // ======================================================

    function compareTimelineAscending(
        firstMemory,
        secondMemory
    ) {

        const first =
            firstMemory?.timeline ||
            parseMemoryPeriod(
                firstMemory?.period
            );


        const second =
            secondMemory?.timeline ||
            parseMemoryPeriod(
                secondMemory?.period
            );


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


        const firstEnd =
            first.endYear ??
            first.year;


        const secondEnd =
            second.endYear ??
            second.year;


        return (
            firstEnd -
            secondEnd
        );

    }


    // ======================================================
    // ORDENAÇÃO DESCENDENTE
    // ======================================================

    function compareTimelineDescending(
        firstMemory,
        secondMemory
    ) {

        const first =
            firstMemory?.timeline ||
            parseMemoryPeriod(
                firstMemory?.period
            );


        const second =
            secondMemory?.timeline ||
            parseMemoryPeriod(
                secondMemory?.period
            );


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
                second.sortKey -
                first.sortKey
            );

        }


        const firstEnd =
            first.endYear ??
            first.year;


        const secondEnd =
            second.endYear ??
            second.year;


        return (
            secondEnd -
            firstEnd
        );

    }


    // ======================================================
    // ORDENAR MEMÓRIAS
    // ======================================================

    function sortMemoriesByTimeline(
        memories,
        direction = 'ascending'
    ) {

        const enriched =
            enrichMemoriesWithTimeline(
                memories
            );


        return [...enriched].sort(

            direction === 'descending'
                ? compareTimelineDescending
                : compareTimelineAscending

        );

    }


    // ======================================================
    // AGRUPAR MEMÓRIAS
    // ======================================================

    function groupMemoriesByTimeline(
        memories
    ) {

        const sorted =
            sortMemoriesByTimeline(
                memories,
                'ascending'
            );


        const chronological = [];

        const undetermined = [];


        sorted.forEach(

            function (memory) {

                if (
                    memory
                        .timeline
                        ?.sortable
                ) {

                    chronological.push(
                        memory
                    );

                    return;

                }


                undetermined.push(
                    memory
                );

            }

        );


        return {

            chronological,

            undetermined

        };

    }


    // ======================================================
    // UTILITÁRIO DE TEXTO
    // ======================================================

    function cleanElementText(
        element
    ) {

        if (!element) {
            return '';
        }


        return String(
            element.textContent || ''
        )
            .trim()
            .replace(
                /\s+/g,
                ' '
            );

    }


    // ======================================================
    // PESSOA ASSOCIADA
    // ======================================================

    function readMemoryPerson(
        card
    ) {

        if (!card) {
            return '';
        }


        const personElement =
            card.querySelector(
                '.memory-person-button, .memory-person'
            );


        return cleanElementText(
            personElement
        );

    }


    // ======================================================
    // LER MEMÓRIAS DO ACERVO
    // ======================================================

    function readMemoriesFromArchive() {

        const archive =
            document.getElementById(
                MEMORY_ARCHIVE_ID
            );


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

                function (
                    card,
                    index
                ) {

                    const title =
                        cleanElementText(
                            card.querySelector(
                                'h3'
                            )
                        );


                    const person =
                        readMemoryPerson(
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


                    const category =
                        cleanElementText(
                            card.querySelector(
                                '.memory-category'
                            )
                        );


                    const story =
                        cleanElementText(
                            card.querySelector(
                                '.memory-story'
                            )
                        );


                    return {

                        id:
                            card.dataset.memoryId ||
                            `timeline-memory-${index}`,

                        title,

                        person,

                        period,

                        category,

                        story

                    };

                }

            );

    }


    // ======================================================
    // ESCAPE HTML
    // ======================================================

    function escapeTimelineHTML(
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


    // ======================================================
    // PESSOA — COMPONENTE VISUAL
    // ======================================================

    function createPersonMarkup(
        person
    ) {

        const safePerson =
            String(
                person || ''
            ).trim();


        if (!safePerson) {
            return '';
        }


        return `

            <div
                class="mi-timeline-person"
                aria-label="Pessoa associada à memória"
            >

                <span
                    class="mi-timeline-person-icon"
                    aria-hidden="true"
                >

                    <i class="fas fa-user"></i>

                </span>


                <span
                    class="mi-timeline-person-name"
                >

                    ${escapeTimelineHTML(
                        safePerson
                    )}

                </span>

            </div>

        `;

    }


    // ======================================================
    // FILTRO — VALORES ÚNICOS
    // ======================================================

    function getUniqueSortedValues(
        memories,
        property
    ) {

        return [
            ...new Set(

                memories
                    .map(
                        function (memory) {

                            return String(
                                memory[property] || ''
                            ).trim();

                        }
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


    // ======================================================
    // FILTRO — PERÍODOS DISPONÍVEIS
    // ======================================================

    function getTimelinePeriodOptions(
        memories
    ) {

        const enriched =
            enrichMemoriesWithTimeline(
                memories
            );


        const periods = new Map();


        enriched.forEach(
            function (memory) {

                const timeline =
                    memory.timeline;


                const value =
                    timeline.sortable
                        ? timeline.label
                        : UNKNOWN_LABEL;


                const sortKey =
                    timeline.sortable
                        ? timeline.sortKey
                        : Number.MAX_SAFE_INTEGER;


                if (!periods.has(value)) {

                    periods.set(
                        value,
                        {
                            value,
                            sortKey
                        }
                    );

                }

            }
        );


        return Array
            .from(
                periods.values()
            )
            .sort(
                function (first, second) {

                    if (
                        first.sortKey !==
                        second.sortKey
                    ) {

                        return (
                            first.sortKey -
                            second.sortKey
                        );

                    }


                    return first.value.localeCompare(
                        second.value,
                        'pt-BR'
                    );

                }
            );

    }


    // ======================================================
    // GARANTIR SEÇÃO DA TIMELINE
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
                    em ordem cronológica, acompanhe
                    as pessoas presentes nas memórias
                    e filtre a trajetória da família.
                </p>


                <div
                    id="${TIMELINE_FILTERS_ID}"
                    class="mi-timeline-filters"
                >

                    <div
                        class="mi-timeline-filter-group"
                    >

                        <label
                            for="${PERSON_FILTER_ID}"
                        >
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


                    <div
                        class="mi-timeline-filter-group"
                    >

                        <label
                            for="${CATEGORY_FILTER_ID}"
                        >
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


                    <div
                        class="mi-timeline-filter-group"
                    >

                        <label
                            for="${PERIOD_FILTER_ID}"
                        >
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


                    <div
                        class="mi-timeline-filter-actions"
                    >

                        <button
                            type="button"
                            id="${CLEAR_FILTERS_ID}"
                            class="mi-timeline-clear-button"
                        >

                            <i class="fas fa-rotate-left"></i>

                            Limpar filtros

                        </button>

                    </div>

                </div>


                <div
                    class="mi-timeline-results-summary"
                >

                    <span
                        id="${TIMELINE_RESULT_COUNT_ID}"
                    >
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
    // ATUALIZAR SELECT
    // ======================================================

    function replaceSelectOptions(
        select,
        defaultLabel,
        values
    ) {

        if (!select) {
            return;
        }


        const previousValue =
            select.value;


        select.innerHTML = '';


        const defaultOption =
            document.createElement(
                'option'
            );


        defaultOption.value =
            'all';


        defaultOption.textContent =
            defaultLabel;


        select.appendChild(
            defaultOption
        );


        values.forEach(
            function (item) {

                const option =
                    document.createElement(
                        'option'
                    );


                if (
                    typeof item === 'object'
                ) {

                    option.value =
                        item.value;

                    option.textContent =
                        item.value;

                } else {

                    option.value =
                        item;

                    option.textContent =
                        item;

                }


                select.appendChild(
                    option
                );

            }
        );


        const previousStillExists =
            Array.from(
                select.options
            ).some(
                function (option) {

                    return (
                        option.value ===
                        previousValue
                    );

                }
            );


        select.value =
            previousStillExists
                ? previousValue
                : 'all';

    }


    // ======================================================
    // PREENCHER FILTROS
    // ======================================================

    function populateTimelineFilters(
        memories
    ) {

        const personSelect =
            document.getElementById(
                PERSON_FILTER_ID
            );


        const categorySelect =
            document.getElementById(
                CATEGORY_FILTER_ID
            );


        const periodSelect =
            document.getElementById(
                PERIOD_FILTER_ID
            );


        const people =
            getUniqueSortedValues(
                memories,
                'person'
            );


        const categories =
            getUniqueSortedValues(
                memories,
                'category'
            );


        const periods =
            getTimelinePeriodOptions(
                memories
            );


        replaceSelectOptions(
            personSelect,
            'Todas as pessoas',
            people
        );


        replaceSelectOptions(
            categorySelect,
            'Todas as categorias',
            categories
        );


        replaceSelectOptions(
            periodSelect,
            'Todos os períodos',
            periods
        );

    }


    // ======================================================
    // OBTER FILTROS ATIVOS
    // ======================================================

    function getActiveTimelineFilters() {

        const person =
            document.getElementById(
                PERSON_FILTER_ID
            )?.value || 'all';


        const category =
            document.getElementById(
                CATEGORY_FILTER_ID
            )?.value || 'all';


        const period =
            document.getElementById(
                PERIOD_FILTER_ID
            )?.value || 'all';


        return {
            person,
            category,
            period
        };

    }


    // ======================================================
    // APLICAR FILTROS
    // ======================================================

    function filterTimelineMemories(
        memories
    ) {

        const filters =
            getActiveTimelineFilters();


        return enrichMemoriesWithTimeline(
            memories
        ).filter(
            function (memory) {

                const periodValue =
                    memory.timeline.sortable
                        ? memory.timeline.label
                        : UNKNOWN_LABEL;


                const personMatches =
                    (
                        filters.person === 'all' ||
                        memory.person === filters.person
                    );


                const categoryMatches =
                    (
                        filters.category === 'all' ||
                        memory.category === filters.category
                    );


                const periodMatches =
                    (
                        filters.period === 'all' ||
                        periodValue === filters.period
                    );


                return (
                    personMatches &&
                    categoryMatches &&
                    periodMatches
                );

            }
        );

    }


    // ======================================================
    // CONTADOR DE RESULTADOS
    // ======================================================

    function updateTimelineResultCount(
        visibleCount,
        totalCount
    ) {

        const counter =
            document.getElementById(
                TIMELINE_RESULT_COUNT_ID
            );


        if (!counter) {
            return;
        }


        const visibleLabel =
            visibleCount === 1
                ? '1 memória'
                : `${visibleCount} memórias`;


        if (
            visibleCount === totalCount
        ) {

            counter.textContent =
                visibleLabel;

            return;

        }


        counter.textContent =
            `${visibleLabel} de ${totalCount}`;

    }


    // ======================================================
    // CARD CRONOLÓGICO
    // ======================================================

    function createTimelineItem(
        memory
    ) {

        const item =
            document.createElement(
                'article'
            );


        item.className =
            'mi-timeline-item';


        item.dataset.memoryId =
            memory.id || '';


        const timeline =
            memory.timeline;


        const periodLabel =
            timeline?.label ||
            memory.period ||
            UNKNOWN_LABEL;


        item.innerHTML = `

            <div
                class="mi-timeline-date"
            >

                ${escapeTimelineHTML(
                    periodLabel
                )}

            </div>


            <div
                class="mi-timeline-content"
            >

                ${
                    memory.category
                        ? `

                            <span
                                class="mi-timeline-category"
                            >

                                ${escapeTimelineHTML(
                                    memory.category
                                )}

                            </span>

                        `
                        : ''
                }


                <h3
                    class="mi-timeline-title"
                >

                    ${escapeTimelineHTML(
                        memory.title ||
                        'Memória sem título'
                    )}

                </h3>


                ${createPersonMarkup(
                    memory.person
                )}


                ${
                    memory.story
                        ? `

                            <p
                                class="mi-timeline-story"
                            >

                                ${escapeTimelineHTML(
                                    memory.story
                                )}

                            </p>

                        `
                        : ''
                }

            </div>

        `;


        return item;

    }


    // ======================================================
    // CARD SEM DATA DETERMINADA
    // ======================================================

    function createUndeterminedCard(
        memory
    ) {

        const card =
            document.createElement(
                'article'
            );


        card.className =
            'mi-timeline-undetermined-card';


        card.dataset.memoryId =
            memory.id || '';


        const periodLabel =
            memory.period ||
            UNKNOWN_LABEL;


        card.innerHTML = `

            <h4>

                ${escapeTimelineHTML(
                    memory.title ||
                    'Memória sem título'
                )}

            </h4>


            <p
                class="mi-timeline-undetermined-period"
            >

                ${escapeTimelineHTML(
                    periodLabel
                )}

            </p>


            ${createPersonMarkup(
                memory.person
            )}

        `;


        return card;

    }


    // ======================================================
    // ESTADO SEM RESULTADOS
    // ======================================================

    function createNoResultsState() {

        const filters =
            getActiveTimelineFilters();


        const hasActiveFilters =
            (
                filters.person !== 'all' ||
                filters.category !== 'all' ||
                filters.period !== 'all'
            );


        if (hasActiveFilters) {

            return `

                <div
                    class="mi-timeline-empty"
                >

                    <i
                        class="fas fa-filter-circle-xmark"
                    ></i>

                    <h3>
                        Nenhuma memória encontrada
                    </h3>

                    <p>
                        Não existem memórias que
                        correspondam à combinação
                        de filtros selecionada.
                    </p>

                </div>

            `;

        }


        return `

            <div
                class="mi-timeline-empty"
            >

                <i
                    class="fas fa-clock-rotate-left"
                ></i>

                <h3>
                    A linha do tempo começa
                    com uma memória
                </h3>

                <p>
                    Registre histórias com
                    períodos ou anos para
                    construir a trajetória
                    da sua família.
                </p>

            </div>

        `;

    }


    // ======================================================
    // RENDER DA TIMELINE
    // ======================================================

    function renderTimeline() {

        ensureTimelineSection();


        const container =
            document.getElementById(
                TIMELINE_LIST_ID
            );


        if (!container) {
            return;
        }


        const filteredMemories =
            filterTimelineMemories(
                timelineMemories
            );


        updateTimelineResultCount(
            filteredMemories.length,
            timelineMemories.length
        );


        container.innerHTML = '';


        if (
            filteredMemories.length === 0
        ) {

            container.innerHTML =
                createNoResultsState();

            return;

        }


        const groups =
            groupMemoriesByTimeline(
                filteredMemories
            );


        if (
            groups
                .chronological
                .length > 0
        ) {

            const line =
                document.createElement(
                    'div'
                );


            line.className =
                'mi-timeline-line';


            line.setAttribute(
                'aria-hidden',
                'true'
            );


            container.appendChild(
                line
            );


            groups
                .chronological
                .forEach(

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
            groups
                .undetermined
                .length > 0
        ) {

            const undeterminedSection =
                document.createElement(
                    'div'
                );


            undeterminedSection.className =
                'mi-timeline-undetermined';


            undeterminedSection.innerHTML = `

                <h3
                    class="mi-timeline-undetermined-title"
                >

                    <i
                        class="fas fa-circle-question"
                    ></i>

                    Período não determinado

                </h3>


                <div
                    class="mi-timeline-undetermined-list"
                ></div>

            `;


            const list =
                undeterminedSection.querySelector(
                    '.mi-timeline-undetermined-list'
                );


            groups
                .undetermined
                .forEach(

                    function (memory) {

                        list?.appendChild(
                            createUndeterminedCard(
                                memory
                            )
                        );

                    }

                );


            container.appendChild(
                undeterminedSection
            );

        }

    }


    // ======================================================
    // SINCRONIZAR TIMELINE COM O ACERVO
    // ======================================================

    function syncTimelineFromArchive() {

        timelineMemories =
            readMemoriesFromArchive();


        populateTimelineFilters(
            timelineMemories
        );


        renderTimeline();

    }


    // ======================================================
    // EVENTOS DOS FILTROS
    // ======================================================

    function bindTimelineFilterEvents() {

        const personSelect =
            document.getElementById(
                PERSON_FILTER_ID
            );


        const categorySelect =
            document.getElementById(
                CATEGORY_FILTER_ID
            );


        const periodSelect =
            document.getElementById(
                PERIOD_FILTER_ID
            );


        const clearButton =
            document.getElementById(
                CLEAR_FILTERS_ID
            );


        [
            personSelect,
            categorySelect,
            periodSelect
        ].forEach(

            function (select) {

                if (!select) {
                    return;
                }


                select.addEventListener(
                    'change',
                    renderTimeline
                );

            }

        );


        clearButton?.addEventListener(
            'click',
            function () {

                if (personSelect) {
                    personSelect.value = 'all';
                }


                if (categorySelect) {
                    categorySelect.value = 'all';
                }


                if (periodSelect) {
                    periodSelect.value = 'all';
                }


                renderTimeline();

            }
        );

    }


    // ======================================================
    // OBSERVAR ALTERAÇÕES DO ACERVO
    // ======================================================

    function observeMemoryArchive() {

        const archive =
            document.getElementById(
                MEMORY_ARCHIVE_ID
            );


        if (!archive) {
            return;
        }


        let renderTimer =
            null;


        const observer =
            new MutationObserver(

                function () {

                    window.clearTimeout(
                        renderTimer
                    );


                    renderTimer =
                        window.setTimeout(

                            function () {

                                syncTimelineFromArchive();

                            },

                            80

                        );

                }

            );


        observer.observe(
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

    function injectTimelineStyles() {

        const previousStyle =
            document.getElementById(
                TIMELINE_STYLE_ID
            );


        if (previousStyle) {
            previousStyle.remove();
        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            TIMELINE_STYLE_ID;


        style.textContent = `

            /* ==============================================
               MEMÓRIAS INVISÍVEIS
               FASE 8.4 — FILTROS DA TIMELINE
            ============================================== */

            .mi-timeline-section {
                background:
                    var(--light, #faf7f2);

                position:
                    relative;

                overflow:
                    hidden;
            }


            /* ==============================================
               FILTROS
            ============================================== */

            .mi-timeline-filters {
                max-width:
                    1000px;

                margin:
                    40px auto 0;

                padding:
                    22px;

                display:
                    grid;

                grid-template-columns:
                    repeat(3, minmax(0, 1fr))
                    auto;

                gap:
                    16px;

                align-items:
                    end;

                background:
                    rgba(255, 255, 255, 0.82);

                border:
                    1px solid
                    rgba(0, 0, 0, 0.06);

                border-radius:
                    18px;

                box-shadow:
                    0 10px 30px
                    rgba(0, 0, 0, 0.05);
            }


            .mi-timeline-filter-group {
                display:
                    flex;

                flex-direction:
                    column;

                gap:
                    7px;
            }


            .mi-timeline-filter-group label {
                font-size:
                    0.82rem;

                font-weight:
                    600;

                color:
                    var(--primary, #28536b);
            }


            .mi-timeline-filter-group label i {
                margin-right:
                    5px;

                color:
                    var(--accent, #c96f4a);
            }


            .mi-timeline-filter-control {
                width:
                    100%;

                min-height:
                    44px;

                padding:
                    0 12px;

                border:
                    1px solid
                    rgba(40, 83, 107, 0.18);

                border-radius:
                    10px;

                outline:
                    none;

                background:
                    white;

                color:
                    var(--primary, #28536b);

                font-family:
                    inherit;

                font-size:
                    0.9rem;

                cursor:
                    pointer;

                transition:
                    border-color 0.2s ease,
                    box-shadow 0.2s ease;
            }


            .mi-timeline-filter-control:focus {
                border-color:
                    var(--accent, #c96f4a);

                box-shadow:
                    0 0 0 3px
                    rgba(201, 111, 74, 0.10);
            }


            .mi-timeline-filter-actions {
                display:
                    flex;

                align-items:
                    end;
            }


            .mi-timeline-clear-button {
                min-height:
                    44px;

                padding:
                    0 16px;

                border:
                    1px solid
                    rgba(201, 111, 74, 0.28);

                border-radius:
                    10px;

                background:
                    transparent;

                color:
                    var(--accent, #c96f4a);

                font-family:
                    inherit;

                font-weight:
                    600;

                cursor:
                    pointer;

                white-space:
                    nowrap;

                transition:
                    background 0.2s ease,
                    color 0.2s ease;
            }


            .mi-timeline-clear-button:hover {
                background:
                    var(--accent, #c96f4a);

                color:
                    white;
            }


            .mi-timeline-clear-button i {
                margin-right:
                    6px;
            }


            .mi-timeline-results-summary {
                max-width:
                    900px;

                margin:
                    22px auto 0;

                text-align:
                    right;

                font-size:
                    0.85rem;

                color:
                    var(--gray, #66727a);
            }


            .mi-timeline-results-summary span {
                font-weight:
                    600;

                color:
                    var(--primary, #28536b);
            }


            /* ==============================================
               TIMELINE
            ============================================== */

            .mi-timeline-wrapper {
                max-width:
                    900px;

                margin:
                    28px auto 0;

                position:
                    relative;
            }


            .mi-timeline-empty {
                max-width:
                    700px;

                margin:
                    35px auto 0;

                padding:
                    35px;

                text-align:
                    center;

                border-radius:
                    18px;

                background:
                    white;

                box-shadow:
                    var(
                        --shadow,
                        0 10px 30px
                        rgba(0, 0, 0, 0.08)
                    );
            }


            .mi-timeline-empty i {
                display:
                    block;

                margin-bottom:
                    15px;

                font-size:
                    2rem;

                color:
                    var(--accent, #c96f4a);
            }


            .mi-timeline-empty h3 {
                margin-bottom:
                    10px;
            }


            .mi-timeline-line {
                position:
                    absolute;

                top:
                    0;

                bottom:
                    0;

                left:
                    110px;

                width:
                    3px;

                border-radius:
                    999px;

                background:
                    rgba(201, 111, 74, 0.25);
            }


            .mi-timeline-item {
                position:
                    relative;

                display:
                    grid;

                grid-template-columns:
                    90px 1fr;

                gap:
                    40px;

                padding-bottom:
                    38px;
            }


            .mi-timeline-date {
                padding-top:
                    18px;

                text-align:
                    right;

                font-family:
                    "Playfair Display",
                    serif;

                font-weight:
                    700;

                font-size:
                    1.05rem;

                line-height:
                    1.3;

                color:
                    var(--primary, #28536b);
            }


            .mi-timeline-content {
                position:
                    relative;

                padding:
                    22px 25px;

                border-radius:
                    16px;

                background:
                    white;

                box-shadow:
                    var(
                        --shadow,
                        0 10px 30px
                        rgba(0, 0, 0, 0.08)
                    );
            }


            .mi-timeline-content::before {
                content:
                    "";

                position:
                    absolute;

                top:
                    25px;

                left:
                    -35px;

                width:
                    13px;

                height:
                    13px;

                border:
                    4px solid
                    var(--light, #faf7f2);

                border-radius:
                    50%;

                background:
                    var(--accent, #c96f4a);

                box-shadow:
                    0 0 0 2px
                    rgba(201, 111, 74, 0.25);
            }


            .mi-timeline-category {
                display:
                    inline-block;

                margin-bottom:
                    10px;

                padding:
                    5px 10px;

                border-radius:
                    999px;

                font-size:
                    0.76rem;

                font-weight:
                    600;

                letter-spacing:
                    0.02em;

                color:
                    var(--accent, #c96f4a);

                background:
                    rgba(201, 111, 74, 0.10);
            }


            .mi-timeline-title {
                margin:
                    0 0 10px;

                color:
                    var(--primary, #28536b);

                font-family:
                    "Playfair Display",
                    serif;
            }


            /* ==============================================
               PESSOA
            ============================================== */

            .mi-timeline-person {
                display:
                    inline-flex;

                align-items:
                    center;

                gap:
                    8px;

                margin:
                    0 0 16px;

                padding:
                    7px 12px;

                border:
                    1px solid
                    rgba(201, 111, 74, 0.20);

                border-radius:
                    999px;

                background:
                    rgba(201, 111, 74, 0.08);

                color:
                    var(--primary, #28536b);

                font-size:
                    0.88rem;

                font-weight:
                    600;
            }


            .mi-timeline-person-icon {
                display:
                    inline-flex;

                align-items:
                    center;

                justify-content:
                    center;

                width:
                    24px;

                height:
                    24px;

                flex:
                    0 0 24px;

                border-radius:
                    50%;

                background:
                    var(--accent, #c96f4a);

                color:
                    white;

                font-size:
                    0.72rem;
            }


            .mi-timeline-person-name {
                line-height:
                    1.2;
            }


            .mi-timeline-story {
                margin:
                    0;

                line-height:
                    1.7;

                color:
                    var(--gray, #66727a);
            }


            /* ==============================================
               PERÍODO NÃO DETERMINADO
            ============================================== */

            .mi-timeline-undetermined {
                margin-top:
                    25px;

                padding-top:
                    35px;

                border-top:
                    1px solid
                    rgba(0, 0, 0, 0.08);
            }


            .mi-timeline-undetermined-title {
                margin-bottom:
                    25px;

                text-align:
                    center;

                color:
                    var(--gray, #66727a);
            }


            .mi-timeline-undetermined-title i {
                margin-right:
                    7px;

                color:
                    var(--accent, #c96f4a);
            }


            .mi-timeline-undetermined-list {
                display:
                    grid;

                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(250px, 1fr)
                    );

                gap:
                    20px;
            }


            .mi-timeline-undetermined-card {
                padding:
                    20px;

                border-radius:
                    14px;

                background:
                    white;

                box-shadow:
                    var(
                        --shadow,
                        0 10px 30px
                        rgba(0, 0, 0, 0.07)
                    );
            }


            .mi-timeline-undetermined-card h4 {
                margin:
                    0 0 10px;

                color:
                    var(--primary, #28536b);
            }


            .mi-timeline-undetermined-period {
                margin:
                    0 0 12px;

                font-size:
                    0.9rem;

                color:
                    var(--gray, #66727a);
            }


            .mi-timeline-undetermined-card
            .mi-timeline-person {
                margin-bottom:
                    0;
            }


            /* ==============================================
               RESPONSIVO
            ============================================== */

            @media (max-width: 980px) {

                .mi-timeline-filters {
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                }


                .mi-timeline-filter-actions {
                    align-items:
                        stretch;
                }


                .mi-timeline-clear-button {
                    width:
                        100%;
                }

            }


            @media (max-width: 768px) {

                .mi-timeline-filters {
                    grid-template-columns:
                        1fr;

                    padding:
                        18px;
                }


                .mi-timeline-results-summary {
                    text-align:
                        left;
                }


                .mi-timeline-wrapper {
                    margin-top:
                        28px;
                }


                .mi-timeline-line {
                    left:
                        14px;
                }


                .mi-timeline-item {
                    display:
                        block;

                    padding-left:
                        45px;

                    padding-bottom:
                        30px;
                }


                .mi-timeline-date {
                    padding:
                        0 0 8px;

                    text-align:
                        left;
                }


                .mi-timeline-content::before {
                    top:
                        22px;

                    left:
                        -37px;
                }


                .mi-timeline-person {
                    max-width:
                        100%;
                }


                .mi-timeline-person-name {
                    overflow:
                        hidden;

                    text-overflow:
                        ellipsis;

                    white-space:
                        nowrap;
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

    function runTimelineModelSelfCheck() {

        const checks = [

            {
                input: '1978',
                precision: PRECISION.EXACT,
                year: 1978,
                endYear: null
            },

            {
                input: '1985-1987',
                precision: PRECISION.RANGE,
                year: 1985,
                endYear: 1987
            },

            {
                input: '1985 a 1987',
                precision: PRECISION.RANGE,
                year: 1985,
                endYear: 1987
            },

            {
                input: 'Década de 80',
                precision: PRECISION.DECADE,
                year: 1980,
                endYear: 1989
            },

            {
                input: 'Anos 90',
                precision: PRECISION.DECADE,
                year: 1990,
                endYear: 1999
            },

            {
                input:
                    '1998 aproximadamente',

                precision:
                    PRECISION.APPROXIMATE,

                year: 1998,
                endYear: null
            },

            {
                input:
                    'Viagem realizada em 2004',

                precision:
                    PRECISION.APPROXIMATE,

                year: 2004,
                endYear: null
            },

            {
                input: 'Infância',
                precision: PRECISION.UNKNOWN,
                year: null,
                endYear: null
            },

            {
                input: '',
                precision: PRECISION.UNKNOWN,
                year: null,
                endYear: null
            }

        ];


        return checks.map(

            function (check) {

                const result =
                    parseMemoryPeriod(
                        check.input
                    );


                return {

                    input:
                        check.input,

                    passed:
                        (
                            result.precision ===
                            check.precision &&

                            result.year ===
                            check.year &&

                            result.endYear ===
                            check.endYear
                        ),

                    expected:
                        check,

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

        filterTimelineMemories,

        render:
            renderTimeline,

        runSelfCheck:
            runTimelineModelSelfCheck

    };


    // ======================================================
    // INICIALIZAÇÃO
    // ======================================================

    function initializeTimeline() {

        injectTimelineStyles();

        ensureTimelineSection();

        timelineMemories =
            readMemoriesFromArchive();

        populateTimelineFilters(
            timelineMemories
        );

        bindTimelineFilterEvents();

        renderTimeline();

        observeMemoryArchive();

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
    // FIM DA FASE 8.4
    // ======================================================

})();

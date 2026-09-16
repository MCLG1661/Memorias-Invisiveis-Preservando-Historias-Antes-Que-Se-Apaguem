// ==========================================================
// MEMÓRIAS INVISÍVEIS
// FASE 8.6 — ESTADOS TEMPORAIS ESPECIAIS
//
// Inclui:
// - Modelo temporal da Timeline
// - Timeline cronológica
// - Pessoas na Timeline
// - Filtros Pessoa / Categoria / Período
// - Navegação Timeline → Memória
// - Navegação Timeline → Perfil da Pessoa
// - Estados temporais especiais e incerteza temporal
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
    const NOT_INFORMED_LABEL = 'Período não informado';

    let timelineMemories = [];
    let archiveObserver = null;
    let syncTimer = null;


    // ======================================================
    // PRECISÃO TEMPORAL — FASE 8.6
    // ======================================================

    const PRECISION = Object.freeze({

        EXACT: 'exact',

        APPROXIMATE: 'approximate',

        RANGE: 'range',

        DECADE: 'decade',

        DECADE_PART: 'decade_part',

        BEFORE: 'before',

        AFTER: 'after',

        UNKNOWN: 'unknown'

    });


    // ======================================================
    // PARTES DA DÉCADA
    // ======================================================

    const DECADE_PART = Object.freeze({

        EARLY: 'early',

        MID: 'mid',

        LATE: 'late'

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

        const div =
            document.createElement(
                'div'
            );

        div.textContent =
            value ?? '';

        return div.innerHTML;

    }


    function cleanElementText(element) {

        if (!element) {
            return '';
        }

        return String(
            element.textContent || ''
        )
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
    // CONVERTER DÉCADA CURTA
    //
    // Mantém a regra validada na Fase 8.1:
    //
    // Em 2026:
    // 20 → 2020
    // 30 → 1930
    // 70 → 1970
    // 90 → 1990
    // ======================================================

    function resolveShortDecade(shortYear) {

        const numeric =
            Number(shortYear);

        if (
            !Number.isInteger(numeric) ||
            numeric < 0 ||
            numeric > 99
        ) {
            return null;
        }


        const currentYear =
            new Date().getFullYear();

        const currentShort =
            currentYear % 100;

        const century =
            numeric <= currentShort
                ? 2000
                : 1900;


        return (
            century +
            numeric
        );

    }


    // ======================================================
    // MODELO TEMPORAL
    // ======================================================

    function createUnknownTimeline(
        periodText = ''
    ) {

        const original =
            String(
                periodText || ''
            ).trim();


        return {

            original,

            year: null,

            endYear: null,

            precision:
                PRECISION.UNKNOWN,

            qualifier: null,

            label:
                original ||
                NOT_INFORMED_LABEL,

            sortable: false,

            sortKey: null,

            special: true

        };

    }


    function createTimelineResult({
        original,
        year,
        endYear = null,
        precision,
        label,
        qualifier = null,
        sortKey = null,
        special = false
    }) {

        const validYear =
            Number.isInteger(year);


        return {

            original:
                String(
                    original || ''
                ).trim(),

            year,

            endYear,

            precision,

            qualifier,

            label,

            sortable:
                validYear,

            sortKey:
                Number.isFinite(sortKey)
                    ? sortKey
                    : (
                        validYear
                            ? year
                            : null
                    ),

            special

        };

    }


    // ======================================================
    // PARSER — ANO EXATO
    // ======================================================

    function parseExactYear(
        original,
        normalized
    ) {

        if (
            !/^(18|19|20)\d{2}$/
                .test(normalized)
        ) {

            return null;

        }


        const year =
            Number(normalized);


        if (!isValidYear(year)) {
            return null;
        }


        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION.EXACT,

            label:
                String(year),

            special: false

        });

    }


    // ======================================================
    // PARSER — INTERVALO
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


        const first =
            Number(match[1]);

        const second =
            Number(match[2]);


        if (
            !isValidYear(first) ||
            !isValidYear(second)
        ) {

            return null;

        }


        const year =
            Math.min(
                first,
                second
            );

        const endYear =
            Math.max(
                first,
                second
            );


        return createTimelineResult({

            original,

            year,

            endYear,

            precision:
                PRECISION.RANGE,

            label:
                `${year}–${endYear}`,

            special: true

        });

    }


    // ======================================================
    // PARSER — PARTE DA DÉCADA
    //
    // Exemplos:
    // início dos anos 80
    // inicio da decada de 80
    // meados dos anos 90
    // final dos anos 60
    // fim dos anos 70
    // ======================================================

    function parseDecadePart(
        original,
        normalized
    ) {

        const match =
            normalized.match(
                /^(inicio|comeco|meados|meio|final|fim)\s+(?:dos\s+anos|da\s+decada\s+de|da\s+decada\s+dos)\s+((?:18|19|20)\d{2}|\d{2})$/
            );


        if (!match) {
            return null;
        }


        const partText =
            match[1];

        const rawDecade =
            match[2];


        let decade;


        if (
            /^\d{2}$/
                .test(rawDecade)
        ) {

            decade =
                resolveShortDecade(
                    Number(rawDecade)
                );

        } else {

            decade =
                Math.floor(
                    Number(rawDecade) /
                    10
                ) * 10;

        }


        if (
            !isValidYear(decade)
        ) {

            return null;

        }


        let qualifier;
        let label;
        let sortKey;


        if (
            partText === 'inicio' ||
            partText === 'comeco'
        ) {

            qualifier =
                DECADE_PART.EARLY;

            label =
                `Início da década de ${decade}`;

            /*
             * A década continua sendo a âncora.
             * +1 apenas posiciona internamente
             * o início antes dos meados/final.
             */

            sortKey =
                decade + 1;

        } else if (
            partText === 'meados' ||
            partText === 'meio'
        ) {

            qualifier =
                DECADE_PART.MID;

            label =
                `Meados da década de ${decade}`;

            sortKey =
                decade + 5;

        } else {

            qualifier =
                DECADE_PART.LATE;

            label =
                `Final da década de ${decade}`;

            sortKey =
                decade + 8;

        }


        return createTimelineResult({

            original,

            year:
                decade,

            endYear:
                decade + 9,

            precision:
                PRECISION.DECADE_PART,

            qualifier,

            label,

            sortKey,

            special: true

        });

    }


    // ======================================================
    // PARSER — DÉCADA
    // ======================================================

    function parseDecade(
        original,
        normalized
    ) {

        const fourDigits =
            normalized.match(
                /^(?:decada de|decada dos|anos)\s*((?:18|19|20)\d{2})$/
            );


        if (fourDigits) {

            const rawYear =
                Number(
                    fourDigits[1]
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
                    `Década de ${year}`,

                sortKey:
                    year,

                special: true

            });

        }


        const twoDigits =
            normalized.match(
                /^(?:decada de|decada dos|anos)\s*(\d{2})$/
            );


        if (!twoDigits) {
            return null;
        }


        const year =
            resolveShortDecade(
                Number(
                    twoDigits[1]
                )
            );


        if (!isValidYear(year)) {
            return null;
        }


        return createTimelineResult({

            original,

            year,

            endYear:
                year + 9,

            precision:
                PRECISION.DECADE,

            label:
                `Década de ${year}`,

            sortKey:
                year,

            special: true

        });

    }


    // ======================================================
    // PARSER — ANTES DE
    //
    // Importante:
    // O ano funciona apenas como âncora.
    // Não afirmamos que o evento ocorreu naquele ano.
    // ======================================================

    function parseBeforeYear(
        original,
        normalized
    ) {

        const match =
            normalized.match(
                /^(?:antes de|anterior a|antes do ano de)\s*((?:18|19|20)\d{2})$/
            );


        if (!match) {
            return null;
        }


        const year =
            Number(
                match[1]
            );


        if (!isValidYear(year)) {
            return null;
        }


        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION.BEFORE,

            qualifier:
                'before',

            label:
                `Antes de ${year}`,

            /*
             * Não transformamos "antes de 1980"
             * em 1979.
             *
             * O pequeno deslocamento existe somente
             * para a ordenação visual em relação a
             * registros ancorados exatamente em 1980.
             */

            sortKey:
                year - 0.5,

            special: true

        });

    }


    // ======================================================
    // PARSER — DEPOIS DE
    // ======================================================

    function parseAfterYear(
        original,
        normalized
    ) {

        const match =
            normalized.match(
                /^(?:depois de|apos|posterior a|depois do ano de)\s*((?:18|19|20)\d{2})$/
            );


        if (!match) {
            return null;
        }


        const year =
            Number(
                match[1]
            );


        if (!isValidYear(year)) {
            return null;
        }


        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION.AFTER,

            qualifier:
                'after',

            label:
                `Depois de ${year}`,

            sortKey:
                year + 0.5,

            special: true

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


        for (
            const pattern
            of patterns
        ) {

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


            if (!isValidYear(year)) {
                continue;
            }


            return createTimelineResult({

                original,

                year,

                precision:
                    PRECISION.APPROXIMATE,

                label:
                    `≈ ${year}`,

                sortKey:
                    year,

                special: true

            });

        }


        return null;

    }


    // ======================================================
    // PARSER — ANO EMBUTIDO
    //
    // Exemplo:
    // "Viagem realizada em 2004"
    //
    // É considerado aproximado porque o campo
    // não forneceu uma data estruturada exata.
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


        if (!isValidYear(year)) {
            return null;
        }


        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION.APPROXIMATE,

            label:
                original,

            sortKey:
                year,

            special: true

        });

    }


    // ======================================================
    // INTERPRETAR PERÍODO
    // ======================================================

    function parseMemoryPeriod(
        periodText
    ) {

        const original =
            String(
                periodText || ''
            ).trim();


        if (!original) {

            return (
                createUnknownTimeline()
            );

        }


        const normalized =
            normalizeText(
                original
            );


        /*
         * A ordem dos parsers importa.
         *
         * Estados mais específicos precisam ser
         * testados antes de formatos mais genéricos.
         */

        const parsers = [

            parseExactYear,

            parseYearRange,

            parseDecadePart,

            parseDecade,

            parseBeforeYear,

            parseAfterYear,

            parseApproximateYear,

            parseEmbeddedYear

        ];


        for (
            const parser
            of parsers
        ) {

            const result =
                parser(
                    original,
                    normalized
                );


            if (result) {
                return result;
            }

        }


        /*
         * "Infância", "adolescência",
         * "quando éramos crianças" etc.
         *
         * O texto é preservado, mas nenhuma data
         * é inventada.
         */

        return (
            createUnknownTimeline(
                original
            )
        );

    }


    // ======================================================
    // DESCRIÇÃO DA PRECISÃO
    // ======================================================

    function getPrecisionLabel(
        timeline
    ) {

        if (!timeline) {
            return '';
        }


        switch (
            timeline.precision
        ) {

            case PRECISION.EXACT:

                return 'Ano informado';


            case PRECISION.APPROXIMATE:

                return 'Data aproximada';


            case PRECISION.RANGE:

                return 'Intervalo de anos';


            case PRECISION.DECADE:

                return 'Década';


            case PRECISION.DECADE_PART:

                return 'Parte da década';


            case PRECISION.BEFORE:

                return 'Antes de';


            case PRECISION.AFTER:

                return 'Depois de';


            case PRECISION.UNKNOWN:

                return (
                    timeline.original
                        ? 'Período sem data definida'
                        : 'Período não informado'
                );


            default:

                return '';

        }

    }


    // ======================================================
    // ENRIQUECIMENTO
    // ======================================================

    function enrichMemoryWithTimeline(
        memory
    ) {

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


    function enrichMemoriesWithTimeline(
        memories
    ) {

        if (
            !Array.isArray(
                memories
            )
        ) {

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


        /*
         * Se duas memórias compartilham a mesma
         * âncora temporal, usamos o fim do intervalo
         * apenas como critério secundário.
         */

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


    function sortMemoriesByTimeline(
        memories
    ) {

        return (
            enrichMemoriesWithTimeline(
                memories
            ).sort(
                compareTimelineAscending
            )
        );

    }


    function groupMemoriesByTimeline(
        memories
    ) {

        const sorted =
            sortMemoriesByTimeline(
                memories
            );


        return {

            chronological:
                sorted.filter(
                    memory =>
                        memory.timeline
                            .sortable
                ),

            undetermined:
                sorted.filter(
                    memory =>
                        !memory.timeline
                            .sortable
                )

        };

    }


    // ======================================================
    // ACERVO — LOCALIZAR CARD
    // ======================================================

    function getArchive() {

        return document
            .getElementById(
                MEMORY_ARCHIVE_ID
            );

    }


    function findArchiveMemoryCard(
        memoryId
    ) {

        const archive =
            getArchive();


        if (
            !archive ||
            !memoryId
        ) {

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
                        card.dataset
                            .memoryId ||
                        ''
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

    function readPersonFromCard(
        card
    ) {

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
                function (
                    card,
                    index
                ) {

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
                        NOT_INFORMED_LABEL
                    ) {

                        period = '';

                    }


                    return {

                        id:
                            card.dataset
                                .memoryId ||
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
            category.value !==
                'all'
        ) {

            category.value =
                'all';

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


    function highlightMemory(
        card
    ) {

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


    function openMemory(
        memoryId
    ) {

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

                    behavior:
                        'smooth',

                    block:
                        'center'

                });


                highlightMemory(
                    card
                );


                return true;

            };


        if (
            locateAndOpen()
        ) {

            return;

        }


        window.setTimeout(
            function () {

                if (
                    !locateAndOpen()
                ) {

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

    function openPersonProfile(
        memoryId
    ) {

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

            /*
             * Modo local ou memória
             * sem perfil vinculado.
             *
             * O chip é apenas informativo.
             */

            return;

        }


        personButton.click();

    }


    // ======================================================
    // FILTROS
    // ======================================================

    function uniqueValues(
        property
    ) {

        return [
            ...new Set(

                timelineMemories
                    .map(
                        memory =>
                            String(
                                memory[property] ||
                                ''
                            ).trim()
                    )
                    .filter(Boolean)

            )
        ].sort(
            function (
                first,
                second
            ) {

                return first.localeCompare(
                    second,
                    'pt-BR',
                    {
                        sensitivity:
                            'base'
                    }
                );

            }
        );

    }


    // ======================================================
    // OPÇÕES DO FILTRO DE PERÍODO
    // ======================================================

    function periodOptions() {

        const values =
            new Map();


        enrichMemoriesWithTimeline(
            timelineMemories
        ).forEach(
            function (memory) {

                const timeline =
                    memory.timeline;


                /*
                 * Para períodos desconhecidos,
                 * mantemos um único filtro:
                 * "Período não determinado".
                 *
                 * Isso evita criar filtros separados
                 * para "Infância", "Adolescência" etc.
                 */

                const label =
                    timeline.sortable
                        ? timeline.label
                        : UNKNOWN_LABEL;


                if (
                    !values.has(
                        label
                    )
                ) {

                    values.set(
                        label,
                        {
                            label,

                            key:
                                timeline.sortable
                                    ? timeline
                                        .sortKey
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
                function (
                    first,
                    second
                ) {

                    if (
                        first.key ===
                        second.key
                    ) {

                        return (
                            first.label
                                .localeCompare(
                                    second.label,
                                    'pt-BR'
                                )
                        );

                    }


                    return (
                        first.key -
                        second.key
                    );

                }
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


        defaultOption.value =
            'all';

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
            uniqueValues(
                'person'
            )
        );


        fillSelect(
            CATEGORY_FILTER_ID,
            'Todas as categorias',
            uniqueValues(
                'category'
            )
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


        return (
            enrichMemoriesWithTimeline(
                timelineMemories
            ).filter(
                function (memory) {

                    const period =
                        memory.timeline
                            .sortable
                            ? memory
                                .timeline
                                .label
                            : UNKNOWN_LABEL;


                    return (

                        (
                            filters.person ===
                                'all' ||
                            memory.person ===
                                filters.person
                        ) &&

                        (
                            filters.category ===
                                'all' ||
                            memory.category ===
                                filters.category
                        ) &&

                        (
                            filters.period ===
                                'all' ||
                            period ===
                                filters.period
                        )

                    );

                }
            )
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


        archiveSection
            .insertAdjacentElement(
                'afterend',
                section
            );


        return section;

    }


    // ======================================================
    // CHIP DA PESSOA
    // ======================================================

    function createPersonMarkup(
        memory
    ) {

        const personName =
            String(
                memory.person ||
                ''
            ).trim();


        if (!personName) {
            return '';
        }


        if (
            !memory
                .personNavigable
        ) {

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
    // INDICADOR DA PRECISÃO TEMPORAL — FASE 8.6
    // ======================================================

    function createTemporalPrecisionMarkup(
        timeline
    ) {

        if (
            !timeline ||
            timeline.precision ===
                PRECISION.EXACT
        ) {

            return '';

        }


        const precisionLabel =
            getPrecisionLabel(
                timeline
            );


        if (!precisionLabel) {
            return '';
        }


        let icon =
            'fa-clock';


        switch (
            timeline.precision
        ) {

            case PRECISION.APPROXIMATE:

                icon =
                    'fa-circle-half-stroke';

                break;


            case PRECISION.RANGE:

                icon =
                    'fa-arrows-left-right';

                break;


            case PRECISION.DECADE:

                icon =
                    'fa-calendar';

                break;


            case PRECISION.DECADE_PART:

                icon =
                    'fa-calendar-week';

                break;


            case PRECISION.BEFORE:

                icon =
                    'fa-arrow-left';

                break;


            case PRECISION.AFTER:

                icon =
                    'fa-arrow-right';

                break;


            case PRECISION.UNKNOWN:

                icon =
                    'fa-circle-question';

                break;

        }


        return `

            <span
                class="
                    mi-timeline-precision
                    mi-timeline-precision-${escapeHTML(
                        timeline.precision
                    )}
                "
                title="${escapeHTML(
                    precisionLabel
                )}"
            >

                <i class="fas ${icon}"></i>

                ${escapeHTML(
                    precisionLabel
                )}

            </span>

        `;

    }


    // ======================================================
    // CARD CRONOLÓGICO
    // ======================================================

    function createTimelineItem(
        memory
    ) {

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

                <span class="mi-timeline-date-label">

                    ${escapeHTML(
                        memory.timeline
                            ?.label ||
                        UNKNOWN_LABEL
                    )}

                </span>

                ${createTemporalPrecisionMarkup(
                    memory.timeline
                )}

            </div>


            <div class="mi-timeline-content">

                ${
                    memory.category
                        ? `
                            <span class="mi-timeline-category">
                                ${escapeHTML(
                                    memory.category
                                )}
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


                ${createPersonMarkup(
                    memory
                )}


                ${
                    memory.story
                        ? `
                            <p class="mi-timeline-story">
                                ${escapeHTML(
                                    memory.story
                                )}
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

    function createUnknownCard(
        memory
    ) {

        const article =
            document.createElement(
                'article'
            );


        article.className =
            'mi-timeline-undetermined-card';

        article.dataset.memoryId =
            memory.id || '';


        const periodLabel =
            memory.timeline
                ?.original ||
            NOT_INFORMED_LABEL;


        article.innerHTML = `

            <h4>
                ${escapeHTML(
                    memory.title ||
                    'Memória sem título'
                )}
            </h4>


            <p class="mi-timeline-undetermined-period">

                <i class="fas fa-clock-rotate-left"></i>

                ${escapeHTML(
                    periodLabel
                )}

            </p>


            ${createTemporalPrecisionMarkup(
                memory.timeline
            )}


            ${createPersonMarkup(
                memory
            )}


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


        if (
            filtered.length === 0
        ) {

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
            groups
                .chronological
                .length
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


            groups
                .chronological
                .forEach(
                    function (memory) {

                        container
                            .appendChild(
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
                .length
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

                <p class="mi-timeline-undetermined-intro">
                    Estas memórias preservam o período
                    informado, mas não possuem uma data
                    suficiente para posicionamento
                    cronológico seguro.
                </p>

                <div class="mi-timeline-undetermined-list"></div>

            `;


            const list =
                section.querySelector(
                    '.mi-timeline-undetermined-list'
                );


            groups
                .undetermined
                .forEach(
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


        container.dataset
            .navigationBound =
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
                        article
                            ?.dataset
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
                        article
                            ?.dataset
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
                    select.dataset
                        .bound ===
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
            clearButton.dataset
                .bound !==
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
                                document
                                    .getElementById(
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


            .mi-timeline-date-label {
                display: block;
            }


            /*
             * FASE 8.6
             * Indicador de precisão temporal.
             */

            .mi-timeline-precision {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                margin-top: 7px;
                padding: 4px 7px;
                border-radius: 999px;
                background: rgba(40,83,107,.07);
                color: var(--gray, #66727a);
                font-family: inherit;
                font-size: .62rem;
                font-weight: 600;
                line-height: 1.2;
            }


            .mi-timeline-precision i {
                font-size: .58rem;
                color: var(--accent, #c96f4a);
            }


            .mi-timeline-precision-approximate,
            .mi-timeline-precision-before,
            .mi-timeline-precision-after {
                background: rgba(201,111,74,.09);
            }


            .mi-timeline-precision-unknown {
                background: rgba(102,114,122,.10);
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
                margin-bottom: 8px;
                text-align: center;
                color: var(--gray, #66727a);
            }


            .mi-timeline-undetermined-intro {
                max-width: 650px;
                margin: 0 auto 24px;
                text-align: center;
                color: var(--gray, #66727a);
                font-size: .86rem;
                line-height: 1.6;
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
                display: flex;
                align-items: center;
                gap: 7px;
                margin: 0 0 8px;
                color: var(--gray, #66727a);
            }


            .mi-timeline-undetermined-period i {
                color: var(--accent, #c96f4a);
            }


            .mi-timeline-undetermined-card
            .mi-timeline-precision {
                margin:
                    0 0 14px;
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
                    grid-template-columns:
                        1fr;
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


                .mi-timeline-date-label {
                    display: inline-block;
                    margin-right: 7px;
                }


                .mi-timeline-precision {
                    margin-top: 0;
                    vertical-align: middle;
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
    // AUTOTESTE DO MODELO TEMPORAL — FASE 8.6
    // ======================================================

    function runSelfCheck() {

        const tests = [

            {
                input:
                    '1978',

                precision:
                    PRECISION.EXACT,

                year:
                    1978,

                label:
                    '1978'
            },


            {
                input:
                    '1985-1987',

                precision:
                    PRECISION.RANGE,

                year:
                    1985,

                endYear:
                    1987,

                label:
                    '1985–1987'
            },


            {
                input:
                    '1985 a 1987',

                precision:
                    PRECISION.RANGE,

                year:
                    1985,

                endYear:
                    1987,

                label:
                    '1985–1987'
            },


            {
                input:
                    'Década de 80',

                precision:
                    PRECISION.DECADE,

                year:
                    1980,

                endYear:
                    1989,

                label:
                    'Década de 1980'
            },


            {
                input:
                    'Anos 90',

                precision:
                    PRECISION.DECADE,

                year:
                    1990,

                endYear:
                    1999,

                label:
                    'Década de 1990'
            },


            {
                input:
                    '1998 aproximadamente',

                precision:
                    PRECISION.APPROXIMATE,

                year:
                    1998,

                label:
                    '≈ 1998'
            },


            {
                input:
                    'por volta de 1995',

                precision:
                    PRECISION.APPROXIMATE,

                year:
                    1995,

                label:
                    '≈ 1995'
            },


            {
                input:
                    'Viagem realizada em 2004',

                precision:
                    PRECISION.APPROXIMATE,

                year:
                    2004,

                label:
                    'Viagem realizada em 2004'
            },


            {
                input:
                    'início dos anos 80',

                precision:
                    PRECISION.DECADE_PART,

                year:
                    1980,

                endYear:
                    1989,

                qualifier:
                    DECADE_PART.EARLY,

                label:
                    'Início da década de 1980'
            },


            {
                input:
                    'meados dos anos 90',

                precision:
                    PRECISION.DECADE_PART,

                year:
                    1990,

                endYear:
                    1999,

                qualifier:
                    DECADE_PART.MID,

                label:
                    'Meados da década de 1990'
            },


            {
                input:
                    'final dos anos 60',

                precision:
                    PRECISION.DECADE_PART,

                year:
                    1960,

                endYear:
                    1969,

                qualifier:
                    DECADE_PART.LATE,

                label:
                    'Final da década de 1960'
            },


            {
                input:
                    'antes de 1980',

                precision:
                    PRECISION.BEFORE,

                year:
                    1980,

                label:
                    'Antes de 1980'
            },


            {
                input:
                    'depois de 2005',

                precision:
                    PRECISION.AFTER,

                year:
                    2005,

                label:
                    'Depois de 2005'
            },


            {
                input:
                    'Infância',

                precision:
                    PRECISION.UNKNOWN,

                year:
                    null,

                label:
                    'Infância'
            },


            {
                input:
                    '',

                precision:
                    PRECISION.UNKNOWN,

                year:
                    null,

                label:
                    NOT_INFORMED_LABEL
            }

        ];


        return tests.map(
            function (test) {

                const result =
                    parseMemoryPeriod(
                        test.input
                    );


                const checks = [

                    result.precision ===
                        test.precision,

                    result.year ===
                        test.year,

                    result.label ===
                        test.label

                ];


                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            test,
                            'endYear'
                        )
                ) {

                    checks.push(
                        result.endYear ===
                            test.endYear
                    );

                }


                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            test,
                            'qualifier'
                        )
                ) {

                    checks.push(
                        result.qualifier ===
                            test.qualifier
                    );

                }


                return {

                    input:
                        test.input,

                    passed:
                        checks.every(
                            Boolean
                        ),

                    expected:
                        test,

                    result

                };

            }
        );

    }


    // ======================================================
    // RESUMO DO AUTOTESTE
    // ======================================================

    function getSelfCheckSummary() {

        const results =
            runSelfCheck();


        const passed =
            results.filter(
                result =>
                    result.passed
            ).length;


        return {

            total:
                results.length,

            passed,

            failed:
                results.length -
                passed,

            success:
                passed ===
                results.length,

            results

        };

    }


    // ======================================================
    // API PÚBLICA
    // ======================================================

    window.MemoriasInvisiveisTimeline = {

        PRECISION,

        DECADE_PART,

        parseMemoryPeriod,

        getPrecisionLabel,

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

        runSelfCheck,

        getSelfCheckSummary

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
    // FIM DA FASE 8.6
    // ======================================================

})();

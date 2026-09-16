// ==========================================================
// MEMÓRIAS INVISÍVEIS
// FASE 8.2 — TIMELINE BÁSICA
//
// Evolução da Fase 8.1.
//
// Inclui:
// - Modelo temporal das memórias.
// - Interpretação de anos, intervalos e décadas.
// - Períodos aproximados.
// - Períodos indeterminados.
// - Ordenação cronológica.
// - Leitura das memórias já renderizadas no acervo.
// - Timeline visual básica.
// - Atualização automática quando o acervo mudar.
//
// Não altera:
// - Supabase.
// - Tabelas.
// - RLS.
// - Fluxo de cadastro.
// - Exclusão de memórias.
// - Perfis familiares.
// ==========================================================

(function () {

    'use strict';


    // ======================================================
    // CONFIGURAÇÕES
    // ======================================================

    const TIMELINE_SECTION_ID =
        'timeline';

    const TIMELINE_LIST_ID =
        'familyTimeline';

    const TIMELINE_STYLE_ID =
        'mi-timeline-styles';

    const MEMORY_ARCHIVE_ID =
        'memoryArchive';


    // ======================================================
    // PRECISÃO TEMPORAL
    // ======================================================

    const PRECISION =
        Object.freeze({

            EXACT:
                'exact',

            APPROXIMATE:
                'approximate',

            RANGE:
                'range',

            DECADE:
                'decade',

            UNKNOWN:
                'unknown'

        });


    const UNKNOWN_LABEL =
        'Período não determinado';


    // ======================================================
    // NORMALIZAÇÃO
    // ======================================================

    function normalizeTimelineText(
        value
    ) {

        return String(
            value || ''
        )
            .trim()
            .replace(
                /\s+/g,
                ' '
            )
            .normalize(
                'NFD'
            )
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .toLocaleLowerCase(
                'pt-BR'
            );

    }


    // ======================================================
    // VALIDAÇÃO DE ANO
    // ======================================================

    function isValidTimelineYear(
        year
    ) {

        return (
            Number.isInteger(
                year
            ) &&
            year >= 1000 &&
            year <= 2999
        );

    }


    // ======================================================
    // RESULTADO DESCONHECIDO
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

            year:
                null,

            endYear:
                null,

            precision:
                PRECISION.UNKNOWN,

            label:
                original ||
                UNKNOWN_LABEL,

            sortable:
                false,

            sortKey:
                null

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
                String(
                    original || ''
                ).trim(),

            year,

            endYear,

            precision,

            label,

            sortable:
                Number.isInteger(
                    year
                ),

            sortKey:
                Number.isInteger(
                    year
                )
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
            Number(
                normalized
            );


        if (
            !isValidTimelineYear(
                year
            )
        ) {

            return null;

        }


        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION.EXACT,

            label:
                String(
                    year
                )

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
            Number(
                match[1]
            );

        const secondYear =
            Number(
                match[2]
            );


        if (
            !isValidTimelineYear(
                firstYear
            ) ||
            !isValidTimelineYear(
                secondYear
            )
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


        if (
            fourDigitMatch
        ) {

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


        if (
            !twoDigitMatch
        ) {

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
            shortYear <=
            currentShortYear

                ? 2000
                : 1900;


        const year =
            century +
            shortYear;


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


            if (
                !isValidTimelineYear(
                    year
                )
            ) {

                return null;

            }


            return createTimelineResult({

                original,

                year,

                precision:
                    PRECISION
                        .APPROXIMATE,

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


        if (
            !isValidTimelineYear(
                year
            )
        ) {

            return null;

        }


        return createTimelineResult({

            original,

            year,

            precision:
                PRECISION
                    .APPROXIMATE,

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

            return (
                createUnknownTimeline()
            );

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


        return (
            createUnknownTimeline(
                original
            )
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
            typeof memory ===
                'object'

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
    // ORDENAÇÃO ASCENDENTE
    // ======================================================

    function compareTimelineAscending(
        firstMemory,
        secondMemory
    ) {

        const first =
            firstMemory
                ?.timeline ||

            parseMemoryPeriod(
                firstMemory
                    ?.period
            );


        const second =
            secondMemory
                ?.timeline ||

            parseMemoryPeriod(
                secondMemory
                    ?.period
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
            firstMemory
                ?.timeline ||

            parseMemoryPeriod(
                firstMemory
                    ?.period
            );


        const second =
            secondMemory
                ?.timeline ||

            parseMemoryPeriod(
                secondMemory
                    ?.period
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


        return [
            ...enriched
        ].sort(

            direction ===
                'descending'

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


        const chronological =
            [];


        const undetermined =
            [];


        sorted.forEach(

            function (
                memory
            ) {

                if (
                    memory
                        .timeline
                        ?.sortable
                ) {

                    chronological
                        .push(
                            memory
                        );

                    return;

                }


                undetermined
                    .push(
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
    // UTILITÁRIOS DOM
    // ======================================================

    function cleanElementText(
        element
    ) {

        if (!element) {

            return '';

        }


        return String(
            element
                .textContent ||
            ''
        )
            .trim()
            .replace(
                /\s+/g,
                ' '
            );

    }


    // ======================================================
    // LER MEMÓRIAS DO ACERVO
    //
    // A Fase 8.2 utiliza os cards já renderizados pelo
    // script.js.
    //
    // Isso evita alterar a persistência e mantém a Timeline
    // desacoplada do Supabase nesta etapa.
    // ======================================================

    function readMemoriesFromArchive() {

        const archive =
            document
                .getElementById(
                    MEMORY_ARCHIVE_ID
                );


        if (!archive) {

            return [];

        }


        const cards =
            archive
                .querySelectorAll(
                    '.memory-card'
                );


        return Array
            .from(
                cards
            )
            .map(

                function (
                    card,
                    index
                ) {

                    const title =
                        cleanElementText(
                            card
                                .querySelector(
                                    'h3'
                                )
                        );


                    const person =
                        cleanElementText(
                            card
                                .querySelector(
                                    '.memory-person'
                                )
                        );


                    const periodElement =
                        card
                            .querySelector(
                                '.memory-period'
                            );


                    let period =
                        cleanElementText(
                            periodElement
                        );


                    if (
                        period ===
                        'Período não informado'
                    ) {

                        period =
                            '';

                    }


                    const category =
                        cleanElementText(
                            card
                                .querySelector(
                                    '.memory-category'
                                )
                        );


                    const story =
                        cleanElementText(
                            card
                                .querySelector(
                                    '.memory-story'
                                )
                        );


                    return {

                        id:
                            card
                                .dataset
                                .memoryId ||
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
    // ESTILOS DA TIMELINE
    // ======================================================

    function injectTimelineStyles() {

        if (
            document
                .getElementById(
                    TIMELINE_STYLE_ID
                )
        ) {

            return;

        }


        const style =
            document
                .createElement(
                    'style'
                );


        style.id =
            TIMELINE_STYLE_ID;


        style.textContent = `

            /* ==============================================
               MEMÓRIAS INVISÍVEIS
               FASE 8.2 — TIMELINE
            ============================================== */

            .mi-timeline-section {
                background:
                    var(--light, #faf7f2);

                position:
                    relative;

                overflow:
                    hidden;
            }


            .mi-timeline-wrapper {
                max-width:
                    900px;

                margin:
                    55px auto 0;

                position:
                    relative;
            }


            .mi-timeline-empty {
                max-width:
                    700px;

                margin:
                    40px auto 0;

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
                        rgba(
                            0,
                            0,
                            0,
                            0.08
                        )
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
                    var(
                        --accent,
                        #c96f4a
                    );
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
                    rgba(
                        201,
                        111,
                        74,
                        0.25
                    );
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
                    var(
                        --primary,
                        #28536b
                    );
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
                        rgba(
                            0,
                            0,
                            0,
                            0.08
                        )
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
                    var(
                        --light,
                        #faf7f2
                    );

                border-radius:
                    50%;

                background:
                    var(
                        --accent,
                        #c96f4a
                    );

                box-shadow:
                    0 0 0 2px
                    rgba(
                        201,
                        111,
                        74,
                        0.25
                    );
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
                    var(
                        --accent,
                        #c96f4a
                    );

                background:
                    rgba(
                        201,
                        111,
                        74,
                        0.10
                    );
            }


            .mi-timeline-title {
                margin:
                    0 0 8px;

                color:
                    var(
                        --primary,
                        #28536b
                    );

                font-family:
                    "Playfair Display",
                    serif;
            }


            .mi-timeline-person {
                margin:
                    0 0 12px;

                font-size:
                    0.92rem;

                font-weight:
                    500;

                color:
                    var(
                        --gray,
                        #66727a
                    );
            }


            .mi-timeline-person i {
                margin-right:
                    6px;

                color:
                    var(
                        --accent,
                        #c96f4a
                    );
            }


            .mi-timeline-story {
                margin:
                    0;

                line-height:
                    1.7;

                color:
                    var(
                        --gray,
                        #66727a
                    );
            }


            .mi-timeline-undetermined {
                margin-top:
                    25px;

                padding-top:
                    35px;

                border-top:
                    1px solid
                    rgba(
                        0,
                        0,
                        0,
                        0.08
                    );
            }


            .mi-timeline-undetermined-title {
                margin-bottom:
                    25px;

                text-align:
                    center;

                color:
                    var(
                        --gray,
                        #66727a
                    );
            }


            .mi-timeline-undetermined-title i {
                margin-right:
                    7px;

                color:
                    var(
                        --accent,
                        #c96f4a
                    );
            }


            .mi-timeline-undetermined-list {
                display:
                    grid;

                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(
                            250px,
                            1fr
                        )
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
                        rgba(
                            0,
                            0,
                            0,
                            0.07
                        )
                    );
            }


            .mi-timeline-undetermined-card h4 {
                margin:
                    0 0 8px;

                color:
                    var(
                        --primary,
                        #28536b
                    );
            }


            .mi-timeline-undetermined-card p {
                margin:
                    0;

                font-size:
                    0.9rem;

                color:
                    var(
                        --gray,
                        #66727a
                    );
            }


            @media (
                max-width: 768px
            ) {

                .mi-timeline-wrapper {
                    margin-top:
                        40px;
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

            }

        `;


        document
            .head
            .appendChild(
                style
            );

    }


    // ======================================================
    // CRIAR SEÇÃO DA TIMELINE
    // ======================================================

    function ensureTimelineSection() {

        let section =
            document
                .getElementById(
                    TIMELINE_SECTION_ID
                );


        if (section) {

            return section;

        }


        const archiveSection =
            document
                .getElementById(
                    'acervo'
                );


        if (!archiveSection) {

            return null;

        }


        section =
            document
                .createElement(
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
                    em ordem cronológica e acompanhe
                    como as memórias da família se
                    conectam ao longo do tempo.
                </p>

                <div
                    id="${TIMELINE_LIST_ID}"
                    class="mi-timeline-wrapper"
                    aria-live="polite"
                ></div>

            </div>

        `;


        archiveSection
            .parentNode
            .insertBefore(
                section,
                archiveSection
            );


        return section;

    }


    // ======================================================
    // ESCAPE HTML
    // ======================================================

    function escapeTimelineHTML(
        value
    ) {

        const div =
            document
                .createElement(
                    'div'
                );


        div.textContent =
            value ?? '';


        return div.innerHTML;

    }


    // ======================================================
    // CARD CRONOLÓGICO
    // ======================================================

    function createTimelineItem(
        memory
    ) {

        const item =
            document
                .createElement(
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

            <div class="mi-timeline-date">

                ${escapeTimelineHTML(
                    periodLabel
                )}

            </div>


            <div class="mi-timeline-content">

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


                ${
                    memory.person
                        ? `
                            <p
                                class="mi-timeline-person"
                            >
                                <i
                                    class="fas fa-user"
                                ></i>

                                ${escapeTimelineHTML(
                                    memory.person
                                )}
                            </p>
                        `
                        : ''
                }


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
            document
                .createElement(
                    'article'
                );


        card.className =
            'mi-timeline-undetermined-card';


        card.dataset.memoryId =
            memory.id || '';


        card.innerHTML = `

            <h4>

                ${escapeTimelineHTML(
                    memory.title ||
                    'Memória sem título'
                )}

            </h4>


            <p>

                ${
                    memory.period

                        ? escapeTimelineHTML(
                            memory.period
                        )

                        : UNKNOWN_LABEL
                }

            </p>

        `;


        return card;

    }


    // ======================================================
    // RENDER DA TIMELINE
    // ======================================================

    function renderTimeline() {

        ensureTimelineSection();


        const container =
            document
                .getElementById(
                    TIMELINE_LIST_ID
                );


        if (!container) {

            return;

        }


        const memories =
            readMemoriesFromArchive();


        container.innerHTML =
            '';


        if (
            memories.length === 0
        ) {

            container.innerHTML = `

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


            return;

        }


        const groups =
            groupMemoriesByTimeline(
                memories
            );


        if (
            groups
                .chronological
                .length > 0
        ) {

            const line =
                document
                    .createElement(
                        'div'
                    );


            line.className =
                'mi-timeline-line';


            line.setAttribute(
                'aria-hidden',
                'true'
            );


            container
                .appendChild(
                    line
                );


            groups
                .chronological
                .forEach(

                    function (
                        memory
                    ) {

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
                .length > 0
        ) {

            const section =
                document
                    .createElement(
                        'div'
                    );


            section.className =
                'mi-timeline-undetermined';


            section.innerHTML = `

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
                section
                    .querySelector(
                        '.mi-timeline-undetermined-list'
                    );


            groups
                .undetermined
                .forEach(

                    function (
                        memory
                    ) {

                        list
                            ?.appendChild(
                                createUndeterminedCard(
                                    memory
                                )
                            );

                    }

                );


            container
                .appendChild(
                    section
                );

        }

    }


    // ======================================================
    // OBSERVAR ALTERAÇÕES DO ACERVO
    //
    // O script.js pode:
    // - carregar memórias da nuvem;
    // - adicionar memória;
    // - excluir memória;
    // - mudar entre local/cloud.
    //
    // A Timeline acompanha automaticamente essas mudanças.
    // ======================================================

    function observeMemoryArchive() {

        const archive =
            document
                .getElementById(
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

                    window
                        .clearTimeout(
                            renderTimer
                        );


                    renderTimer =
                        window
                            .setTimeout(

                                function () {

                                    renderTimeline();

                                },

                                80

                            );

                }

            );


        observer.observe(
            archive,
            {
                childList:
                    true,

                subtree:
                    true,

                characterData:
                    true
            }
        );

    }


    // ======================================================
    // AUTOTESTE DO MODELO TEMPORAL
    // ======================================================

    function runTimelineModelSelfCheck() {

        const checks = [

            {
                input:
                    '1978',

                precision:
                    PRECISION.EXACT,

                year:
                    1978,

                endYear:
                    null
            },

            {
                input:
                    '1985-1987',

                precision:
                    PRECISION.RANGE,

                year:
                    1985,

                endYear:
                    1987
            },

            {
                input:
                    '1985 a 1987',

                precision:
                    PRECISION.RANGE,

                year:
                    1985,

                endYear:
                    1987
            },

            {
                input:
                    'Década de 80',

                precision:
                    PRECISION.DECADE,

                year:
                    1980,

                endYear:
                    1989
            },

            {
                input:
                    'Anos 90',

                precision:
                    PRECISION.DECADE,

                year:
                    1990,

                endYear:
                    1999
            },

            {
                input:
                    '1998 aproximadamente',

                precision:
                    PRECISION
                        .APPROXIMATE,

                year:
                    1998,

                endYear:
                    null
            },

            {
                input:
                    'Viagem realizada em 2004',

                precision:
                    PRECISION
                        .APPROXIMATE,

                year:
                    2004,

                endYear:
                    null
            },

            {
                input:
                    'Infância',

                precision:
                    PRECISION.UNKNOWN,

                year:
                    null,

                endYear:
                    null
            },

            {
                input:
                    '',

                precision:
                    PRECISION.UNKNOWN,

                year:
                    null,

                endYear:
                    null
            }

        ];


        return checks.map(

            function (
                check
            ) {

                const result =
                    parseMemoryPeriod(
                        check.input
                    );


                return {

                    input:
                        check.input,

                    passed:
                        (
                            result
                                .precision ===
                                check
                                    .precision &&

                            result
                                .year ===
                                check
                                    .year &&

                            result
                                .endYear ===
                                check
                                    .endYear
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

    window
        .MemoriasInvisiveisTimeline = {

            PRECISION,

            parseMemoryPeriod,

            enrichMemoryWithTimeline,

            enrichMemoriesWithTimeline,

            sortMemoriesByTimeline,

            groupMemoriesByTimeline,

            readMemoriesFromArchive,

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

        renderTimeline();

        observeMemoryArchive();

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document
            .addEventListener(
                'DOMContentLoaded',
                initializeTimeline,
                {
                    once:
                        true
                }
            );

    } else {

        initializeTimeline();

    }


    // ======================================================
    // FIM DA FASE 8.2
    // ======================================================

})();

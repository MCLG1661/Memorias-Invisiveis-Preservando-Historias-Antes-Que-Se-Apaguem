// ==========================================================
// MEMÓRIAS INVISÍVEIS
// FASE 8.1 — MODELO TEMPORAL DA TIMELINE
//
// Responsabilidade:
// - Interpretar o período textual das memórias.
// - Normalizar anos, intervalos, décadas e aproximações.
// - Preparar ordenação cronológica.
// - Separar períodos cronológicos e indeterminados.
//
// Nesta fase:
// - NÃO altera Supabase.
// - NÃO altera o acervo atual.
// - NÃO altera a interface.
// ==========================================================

(function () {
    'use strict';


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


    const UNKNOWN_LABEL =
        'Período não determinado';


    // ======================================================
    // NORMALIZAÇÃO DE TEXTO
    // ======================================================

    function normalizeTimelineText(value) {
        return String(value || '')
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
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
    // RESULTADO INDETERMINADO
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
                Number.isInteger(year),

            sortKey:
                Number.isInteger(year)
                    ? year
                    : null
        };
    }


    // ======================================================
    // ANO EXATO
    //
    // Exemplos:
    // 1978
    // 2004
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

        if (
            !isValidTimelineYear(year)
        ) {
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
    // INTERVALO
    //
    // Exemplos:
    // 1985-1987
    // 1985 – 1987
    // 1985 a 1987
    // 1985 até 1987
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
    //
    // Exemplos:
    // Década de 1980
    // Anos 1980
    // Década de 80
    // Anos 90
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


        /*
         * Regra:
         *
         * 00 até o ano corrente
         * → século XXI
         *
         * restante
         * → século XX
         *
         * Exemplo em 2026:
         *
         * anos 20 → 2020
         * anos 90 → 1990
         */

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
    //
    // Exemplos:
    // aproximadamente 1998
    // cerca de 1998
    // por volta de 1998
    // 1998 aproximadamente
    // início de 1998
    // meados de 1998
    // final de 1998
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
    //
    // Exemplos:
    // "Viagem para Portugal em 2004"
    // "Meu casamento em 1987"
    //
    // Só aceitamos quando existe exatamente UM ano
    // identificável no texto.
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


        /*
         * A ordem dos parsers importa.
         *
         * Primeiro tentamos os formatos
         * mais específicos.
         */

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
    // ENRIQUECER UMA MEMÓRIA
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
    // ENRIQUECER LISTA DE MEMÓRIAS
    // ======================================================

    function enrichMemoriesWithTimeline(
        memories
    ) {
        if (
            !Array.isArray(memories)
        ) {
            return [];
        }

        return memories.map(
            enrichMemoryWithTimeline
        );
    }


    // ======================================================
    // COMPARAÇÃO CRONOLÓGICA ASCENDENTE
    //
    // Mais antiga → mais recente
    // ======================================================

    function compareTimelineAscending(
        firstMemory,
        secondMemory
    ) {
        const first =
            firstMemory
                ?.timeline ||
            parseMemoryPeriod(
                firstMemory?.period
            );

        const second =
            secondMemory
                ?.timeline ||
            parseMemoryPeriod(
                secondMemory?.period
            );


        /*
         * Datas conhecidas vêm antes.
         */

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


        /*
         * Ordenação pelo ano inicial.
         */

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
         * Desempate pelo ano final.
         */

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
    // COMPARAÇÃO CRONOLÓGICA DESCENDENTE
    //
    // Mais recente → mais antiga
    // ======================================================

    function compareTimelineDescending(
        firstMemory,
        secondMemory
    ) {
        const first =
            firstMemory
                ?.timeline ||
            parseMemoryPeriod(
                firstMemory?.period
            );

        const second =
            secondMemory
                ?.timeline ||
            parseMemoryPeriod(
                secondMemory?.period
            );


        /*
         * Mesmo em ordem descendente,
         * períodos desconhecidos continuam
         * no final.
         */

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
            direction ===
                'descending'
                ? compareTimelineDescending
                : compareTimelineAscending
        );
    }


    // ======================================================
    // AGRUPAR MEMÓRIAS
    //
    // chronological
    // → possui posição temporal
    //
    // undetermined
    // → período não interpretável
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
            function (memory) {
                if (
                    memory.timeline
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
    // AUTOTESTE DO MODELO
    //
    // Não altera dados.
    //
    // Pode ser executado pelo console:
    //
    // MemoriasInvisiveisTimeline.runSelfCheck()
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
    // API PÚBLICA DA TIMELINE
    // ======================================================

    window.MemoriasInvisiveisTimeline = {

        PRECISION,

        parseMemoryPeriod,

        enrichMemoryWithTimeline,

        enrichMemoriesWithTimeline,

        sortMemoriesByTimeline,

        groupMemoriesByTimeline,

        runSelfCheck:
            runTimelineModelSelfCheck
    };


    // ======================================================
    // FIM DA FASE 8.1
    // ======================================================

})();

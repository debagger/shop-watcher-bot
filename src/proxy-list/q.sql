use `bot-test`;

SELECT
    `p`.`id` AS `p_id`,
    `p`.`host` AS `p_host`,
    `p`.`port` AS `p_port`,
    (
        SELECT
            TIMESTAMPDIFF(HOUR, plu.updateTime, NOW())
        FROM
            proxy_list_update_loaded_proxies_proxy AS plu_pp
            LEFT JOIN proxy_list_update as plu ON plu.id = plu_pp.proxyListUpdateId
        WHERE
            plu_pp.proxyId = `p`.id
        ORDER BY
            plu_pp.proxyListUpdateId DESC
        LIMIT
            1
    ) AS `p_lastSeenOnSourcesHoursAgo`,
    (successTestsCount / testsCount) AS `successTestRate`,
    testsCount,
    successTestsCount
FROM
    `proxy` `p`
    LEFT JOIN (
        SELECT
            testedProxyId,
            COUNT(*) AS `testsCount`,
            SUM(`ptr`.`isOk`) AS `successTestsCount`
        FROM
            `proxy_test_run` `ptr`
        WHERE
            runTime >= DATE_SUB(?, INTERVAL ? HOUR)
        GROUP BY
            testedProxyId
    ) `t` ON `p`.`id` = t.testedProxyId
WHERE
    successTestsCount = 0
ORDER BY
    p_lastSeenOnSourcesHoursAgo DESC,
    `p`.`id` DESC

SELECT
    TIMESTAMPDIFF (HOUR, t.lastSeen, NOW ())
FROM
    (
        SELECT
            proxyId,
            MAX(plu.updateTime) AS lastSeen
        FROM
            proxy_sources_view as psv
            LEFT JOIN proxy_list_update as plu ON psv.lastUpdateId = plu.id
        WHERE psv.proxyId = 10242
        GROUP BY psv.proxyId
    ) as t
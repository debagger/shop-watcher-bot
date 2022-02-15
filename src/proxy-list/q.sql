SELECT p.*, (successTestsCount/testsCount) AS `successTestRate`, testsCount, successTestsCount 
FROM `proxy` `p` 
LEFT JOIN (SELECT `ptr`.`testedProxyId`, COUNT(*) testsCount, SUM(IF (`ptr`.`okResult` is not null, 1, 0)) successTestsCount 
FROM `proxy_test_run` `ptr` 
WHERE `ptr`.`runTime` >= DATE_SUB(sysdate(), INTERVAL 240 HOUR) 
GROUP BY `ptr`.`testedProxyId`) `t` ON `p`.`id`=t.testedProxyId ORDER BY successTestsCount DESC LIMIT 10
SELECT schema_name, table_name
FROM coral.tables
WHERE schema_name LIKE '%_demo'
ORDER BY schema_name, table_name;


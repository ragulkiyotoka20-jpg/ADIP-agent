SELECT schema_name, table_name, column_name, data_type
FROM coral.columns
WHERE schema_name LIKE '%_demo'
ORDER BY schema_name, table_name, ordinal_position;


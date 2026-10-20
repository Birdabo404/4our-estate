SELECT 'CREATE DATABASE estate_test OWNER estate'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'estate_test')\gexec

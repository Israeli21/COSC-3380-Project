-- Test table
CREATE TABLE test_table (
    id SERIAL PRIMARY KEY,
    message VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_table (message) VALUES ('Connection successful!');
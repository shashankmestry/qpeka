CREATE TABLE AuthInfo(
	userId BIGINT UNSIGNED NOT NULL PRIMARY KEY,
	username VARCHAR(100) NOT NULL,
	password VARCHAR(500) NOT NULL,
	INDEX `idx_username` (`username`)
) ENGINE = InnoDb DEFAULT CHARSET = latin1 MAX_ROWS =100000000;


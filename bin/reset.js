require("dotenv").config();
const { pool } = require("../database");
const gameRules = require("../gamerules");

const sql = `
 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET NAMES utf8mb4;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

CREATE TABLE IF NOT EXISTS \`cities\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`userId\` int(11) DEFAULT NULL,
  \`name\` varchar(50) DEFAULT NULL,
  \`x\` int(11) DEFAULT NULL,
  \`y\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`userId\` (\`userId\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;


-- Copiando dados para a tabela citydavi.cities: ~3 rows (aproximadamente)
DELETE FROM \`cities\`;

-- Copiando estrutura para tabela citydavi.citiesEvents
CREATE TABLE IF NOT EXISTS \`citiesEvents\` (
  \`eventId\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`cityId\` int(10) unsigned DEFAULT NULL,
  \`eventType\` enum('build','train','trade','attack','troops') DEFAULT NULL,
  \`eventStart\` timestamp NULL DEFAULT NULL,
  \`eventEnd\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`eventId\`),
  KEY \`cityId\` (\`cityId\`),
  CONSTRAINT \`cityId\` FOREIGN KEY (\`cityId\`) REFERENCES \`cities\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela citydavi.citiesEvents: ~1 rows (aproximadamente)
DELETE FROM \`citiesEvents\`;

-- Copiando estrutura para tabela citydavi.citiesResources
DROP TABLE \`citiesResources\`;
CREATE TABLE IF NOT EXISTS \`citiesResources\` (
  \`cityId\` int(10) unsigned NOT NULL,
  \`population\` double unsigned NOT NULL DEFAULT '20',
  \`loyalty\` double unsigned NOT NULL DEFAULT '100',
  \`wood\` double NOT NULL DEFAULT '${gameRules.resources.starting.wood || 0 }',
  \`food\` double NOT NULL DEFAULT '${gameRules.resources.starting.food || 0 }',
  \`iron\` double NOT NULL DEFAULT '${gameRules.resources.starting.iron || 0 }',
  \`stone\` double NOT NULL DEFAULT '${gameRules.resources.starting.stone || 0 }',
  \`townhall\` tinyint(3) unsigned DEFAULT NULL,
  \`farm\` tinyint(4) unsigned NOT NULL DEFAULT '${gameRules.buildings.farm.start || 0 }',
  \`sawmill\` tinyint(4) unsigned NOT NULL DEFAULT '${gameRules.buildings.sawmill.start || 0 }',
  \`ironmine\` tinyint(4) unsigned NOT NULL DEFAULT '${gameRules.buildings.ironmine.start || 0 }',
  \`stonemine\` tinyint(4) unsigned NOT NULL DEFAULT '${gameRules.buildings.stonemine.start || 0 }',
  \`storage\` tinyint(4) unsigned NOT NULL DEFAULT '${gameRules.buildings.storage.start || 0 }',
  \`market\` tinyint(4) unsigned NOT NULL DEFAULT '${gameRules.buildings.market.start || 0 }',
  \`lastUpdated\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY \`cityId\` (\`cityId\`),
  CONSTRAINT \`FK_citiesResources_cities\` FOREIGN KEY (\`cityId\`) REFERENCES \`cities\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela citydavi.citiesResources: ~4 rows (aproximadamente)
DELETE FROM \`citiesResources\`;

-- Copiando estrutura para tabela citydavi.eventsBuild
DROP TABLE \`eventsBuild\`;
CREATE TABLE IF NOT EXISTS \`eventsBuild\` (
  \`eventId\` int(11) unsigned DEFAULT NULL,
  \`building\` varchar(30) DEFAULT NULL,
  KEY \`eventId\` (\`eventId\`),
  CONSTRAINT \`eventId\` FOREIGN KEY (\`eventId\`) REFERENCES \`citiesEvents\` (\`eventId\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela citydavi.eventsBuild: ~0 rows (aproximadamente)
DELETE FROM \`eventsBuild\`;
/*!40000 ALTER TABLE \`eventsBuild\` DISABLE KEYS */;
/*!40000 ALTER TABLE \`eventsBuild\` ENABLE KEYS */;

-- Copiando estrutura para tabela citydavi.users
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`username\` varchar(50) CHARACTER SET utf8mb4 DEFAULT NULL,
  \`password\` varchar(200) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (\`id\`) USING BTREE,
  UNIQUE KEY \`username\` (\`username\`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- Copiando dados para a tabela citydavi.users: ~3 rows (aproximadamente)
DELETE FROM \`users\`;
/*!40000 ALTER TABLE \`users\` DISABLE KEYS */;
INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`) VALUES
	(1, 'davi1234', '$2b$10$tlfGAwM3Z8hn3OK.om0hnulkL9xVdsy.CikcAKWCbvylHOw9cDXL6');
/*!40000 ALTER TABLE \`users\` ENABLE KEYS */;

 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '');
SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS);
 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;
 SET SQL_NOTES=@OLD_SQL_NOTES;
`


async function doSQL(){
   const conn = await pool.getConnection();
   await conn.query(sql);
   await conn.release();
   process.exit(0)
}

doSQL();
-- MySQL dump 10.13  Distrib 5.7.17, for Linux (x86_64)
--
-- Host: localhost    Database: dirk
-- ------------------------------------------------------
-- Server version	5.7.17-0ubuntu0.16.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `blacklist`
--

DROP TABLE IF EXISTS `blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blacklist` (
  `serverID` bigint(255) NOT NULL,
  `noCmdInChannel` bigint(255) NOT NULL,
  `disabledCommand` varchar(50) NOT NULL,
  PRIMARY KEY (`serverID`,`noCmdInChannel`,`disabledCommand`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blacklist`
--

LOCK TABLES `blacklist` WRITE;
/*!40000 ALTER TABLE `blacklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calcUserData`
--

DROP TABLE IF EXISTS `calcUserData`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calcUserData` (
  `userID` bigint(255) NOT NULL,
  `mpLink` int(10) NOT NULL,
  `t1Name` varchar(25) DEFAULT NULL,
  `t2Name` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`userID`,`mpLink`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calcUserData`
--

LOCK TABLES `calcUserData` WRITE;
/*!40000 ALTER TABLE `calcUserData` DISABLE KEYS */;
/*!40000 ALTER TABLE `calcUserData` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandPrefix`
--

DROP TABLE IF EXISTS `commandPrefix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commandPrefix` (
  `serverID` bigint(255) NOT NULL,
  `commandPrefix` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`serverID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandPrefix`
--

LOCK TABLES `commandPrefix` WRITE;
/*!40000 ALTER TABLE `commandPrefix` DISABLE KEYS */;
/*!40000 ALTER TABLE `commandPrefix` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commands`
--

DROP TABLE IF EXISTS `commands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commands` (
  `serverID` bigint(255) NOT NULL,
  `commandName` varchar(25) NOT NULL,
  `typeCommand` varchar(10) NOT NULL,
  `commandMessage` text,
  PRIMARY KEY (`serverID`,`commandName`,`typeCommand`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commands`
--

LOCK TABLES `commands` WRITE;
/*!40000 ALTER TABLE `commands` DISABLE KEYS */;
/*!40000 ALTER TABLE `commands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modifiers`
--

DROP TABLE IF EXISTS `modifiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modifiers` (
  `userID` int(20) NOT NULL,
  `curMatchTeamOne` varchar(50) NOT NULL,
  `curMatchTeamTwo` varchar(50) NOT NULL,
  `modifierID` int(5) DEFAULT NULL,
  `modifierAmount` int(5) DEFAULT NULL,
  PRIMARY KEY (`userID`,`curMatchTeamOne`,`curMatchTeamTwo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modifiers`
--

LOCK TABLES `modifiers` WRITE;
/*!40000 ALTER TABLE `modifiers` DISABLE KEYS */;
/*!40000 ALTER TABLE `modifiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `osuNames`
--

DROP TABLE IF EXISTS `osuNames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `osuNames` (
  `userID` bigint(255) NOT NULL,
  `userName` varchar(25) DEFAULT NULL,
  `gameMode` int(1) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `osuNames`
--

LOCK TABLES `osuNames` WRITE;
/*!40000 ALTER TABLE `osuNames` DISABLE KEYS */;
/*!40000 ALTER TABLE `osuNames` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patatOrFriet`
--

DROP TABLE IF EXISTS `patatOrFriet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patatOrFriet` (
  `userID` bigint(255) NOT NULL,
  `serverID` bigint(255) DEFAULT NULL,
  `userName` varchar(50) DEFAULT NULL,
  `patat` int(1) DEFAULT NULL,
  `friet` int(1) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patatOrFriet`
--

LOCK TABLES `patatOrFriet` WRITE;
/*!40000 ALTER TABLE `patatOrFriet` DISABLE KEYS */;
/*!40000 ALTER TABLE `patatOrFriet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission`
--

DROP TABLE IF EXISTS `permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permission` (
  `serverID` bigint(255) NOT NULL,
  `userID` bigint(255) NOT NULL,
  `permissionName` varchar(50) NOT NULL,
  PRIMARY KEY (`serverID`,`userID`,`permissionName`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission`
--

LOCK TABLES `permission` WRITE;
/*!40000 ALTER TABLE `permission` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rollStats`
--

DROP TABLE IF EXISTS `rollStats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rollStats` (
  `rollAmount` bigint(255) NOT NULL,
  `timesRolled` bigint(255) DEFAULT NULL,
  PRIMARY KEY (`rollAmount`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rollStats`
--

LOCK TABLES `rollStats` WRITE;
/*!40000 ALTER TABLE `rollStats` DISABLE KEYS */;
/*!40000 ALTER TABLE `rollStats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userSettings`
--

DROP TABLE IF EXISTS `userSettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userSettings` (
  `userID` int(20) NOT NULL,
  `curMatchTeamOne` varchar(50) NOT NULL,
  `curMatchTeamTwo` varchar(50) NOT NULL,
  `calculateLastUsed` datetime DEFAULT NULL,
  PRIMARY KEY (`userID`,`curMatchTeamOne`,`curMatchTeamTwo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userSettings`
--

LOCK TABLES `userSettings` WRITE;
/*!40000 ALTER TABLE `userSettings` DISABLE KEYS */;
/*!40000 ALTER TABLE `userSettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `welcomeInChannel`
--

DROP TABLE IF EXISTS `welcomeInChannel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `welcomeInChannel` (
  `serverID` bigint(255) NOT NULL,
  `channelID` bigint(255) DEFAULT NULL,
  PRIMARY KEY (`serverID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `welcomeInChannel`
--

LOCK TABLES `welcomeInChannel` WRITE;
/*!40000 ALTER TABLE `welcomeInChannel` DISABLE KEYS */;
/*!40000 ALTER TABLE `welcomeInChannel` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-03-07 10:07:17

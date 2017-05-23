-- MySQL dump 10.13  Distrib 5.5.54, for debian-linux-gnu (armv7l)
--
-- Host: localhost    Database: dirk
-- ------------------------------------------------------
-- Server version	5.5.54-0+deb8u1

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
-- Table structure for table `activeusers`
--

DROP TABLE IF EXISTS `activeusers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activeusers` (
  `serverID` bigint(255) NOT NULL,
  `channelID` bigint(255) NOT NULL,
  `userID` bigint(255) NOT NULL,
  `messageCount` int(255) NOT NULL,
  PRIMARY KEY (`serverID`,`channelID`,`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Table structure for table `commandprefix`
--

DROP TABLE IF EXISTS `commandprefix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commandprefix` (
  `serverID` bigint(255) NOT NULL,
  `commandPrefix` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`serverID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Table structure for table `commandstats`
--

DROP TABLE IF EXISTS `commandstats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commandstats` (
  `serverID` bigint(255) NOT NULL,
  `channelID` bigint(255) NOT NULL,
  `userID` bigint(255) NOT NULL,
  `commandName` varchar(25) NOT NULL,
  `commandCount` int(11) NOT NULL,
  PRIMARY KEY (`serverID`,`channelID`,`userID`,`commandName`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `highlightlist`
--

DROP TABLE IF EXISTS `highlightlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `highlightlist` (
  `serverID` bigint(255) NOT NULL,
  `channelID` bigint(255) NOT NULL,
  PRIMARY KEY (`serverID`,`channelID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `highlights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `highlights` (
  `serverID` bigint(255) NOT NULL,
  `keyword` varchar(50) NOT NULL,
  PRIMARY KEY (`serverID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `osunames`
--

DROP TABLE IF EXISTS `osunames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `osunames` (
  `userID` bigint(255) NOT NULL,
  `userName` varchar(25) DEFAULT NULL,
  `gameMode` int(1) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patatorfriet`
--

DROP TABLE IF EXISTS `patatorfriet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patatorfriet` (
  `userID` bigint(255) NOT NULL,
  `serverID` bigint(255) DEFAULT NULL,
  `userName` varchar(50) DEFAULT NULL,
  `patat` int(1) DEFAULT NULL,
  `friet` int(1) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Table structure for table `rollstats`
--

DROP TABLE IF EXISTS `rollstats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rollstats` (
  `rollAmount` bigint(255) NOT NULL,
  `timesRolled` bigint(255) DEFAULT NULL,
  PRIMARY KEY (`rollAmount`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spreadsheetid`
--

DROP TABLE IF EXISTS `spreadsheetid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `spreadsheetid` (
  `spreadsheetID` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usersettings`
--

DROP TABLE IF EXISTS `usersettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usersettings` (
  `userID` int(20) NOT NULL,
  `curMatchTeamOne` varchar(50) NOT NULL,
  `curMatchTeamTwo` varchar(50) NOT NULL,
  `calculateLastUsed` datetime DEFAULT NULL,
  PRIMARY KEY (`userID`,`curMatchTeamOne`,`curMatchTeamTwo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wmtoggle`
--

DROP TABLE IF EXISTS `wmtoggle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wmtoggle` (
  `serverID` bigint(255) NOT NULL,
  `channelID` bigint(255) NOT NULL,
  `welcomeMessage` int(11) NOT NULL,
  `leaveMessage` int(11) NOT NULL,
  PRIMARY KEY (`serverID`,`channelID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-05-23 14:13:39

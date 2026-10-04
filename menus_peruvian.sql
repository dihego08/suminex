-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: 193.203.175.216    Database: u622044135_peruvian
-- ------------------------------------------------------
-- Server version	11.8.9-MariaDB-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_menus`
--

DROP TABLE IF EXISTS `app_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_menus` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `label` varchar(120) NOT NULL,
  `route` varchar(255) DEFAULT NULL COMMENT 'Ruta React; null = solo agrupador',
  `icon` varchar(100) DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `module_key` varchar(80) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `app_menus_module_key_unique` (`module_key`),
  KEY `app_menus_parent_id_sort_order_is_active_index` (`parent_id`,`sort_order`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_menus`
--

LOCK TABLES `app_menus` WRITE;
/*!40000 ALTER TABLE `app_menus` DISABLE KEYS */;
INSERT INTO `app_menus` VALUES (122,0,'Administración',NULL,'fa fa-cog',10,'grp_admin',1,'2026-08-05 21:54:47','2026-08-05 21:54:47'),(123,122,'Usuarios','/users','fa fa-users',1,'users',1,'2026-08-05 21:54:48','2026-08-05 21:54:48'),(124,122,'Cargos','/cargos','fa fa-briefcase',2,'cargos',1,'2026-08-05 21:54:48','2026-08-05 21:54:48'),(125,122,'Accesos','/permissions','fa fa-lock',3,'permissions',1,'2026-08-05 21:54:48','2026-08-05 21:54:48'),(126,0,'Catálogos',NULL,'fa fa-folder-open',20,'grp_catalog',1,'2026-08-05 21:54:48','2026-08-05 21:54:48'),(127,126,'Clientes','/clients','fa fa-user',1,'clients',1,'2026-08-05 21:54:48','2026-08-05 21:54:48'),(128,126,'Productos','/products','fa fa-cube',2,'products',1,'2026-08-05 21:54:48','2026-08-05 21:54:48'),(129,126,'Proveedores','/providers','fa fa-truck',3,'providers',1,'2026-08-05 21:54:49','2026-08-05 21:54:49'),(130,126,'Marcas','/brands','fa fa-tags',4,'brands',1,'2026-08-05 21:54:49','2026-08-05 21:54:49'),(131,126,'Fichas Técnicas','/tech-sheets','fa fa-file-text',5,'tech_sheets',1,'2026-08-05 21:54:49','2026-08-05 21:54:49'),(132,126,'Maquinaria','/machines','fa fa-cogs',6,'machines',1,'2026-08-05 21:54:49','2026-08-05 21:54:49'),(133,126,'Insumos','/insumos','fa fa-flask',7,'insumos',1,'2026-08-05 21:54:49','2026-08-05 21:54:49'),(134,126,'Unidades','/unidades','fa fa-balance-scale',8,'unidades',1,'2026-08-05 21:54:50','2026-08-05 21:54:50'),(135,126,'Familias y Clases','/fam-class','fa fa-sitemap',9,'fam_class',1,'2026-08-05 21:54:50','2026-08-05 21:54:50'),(136,0,'Compras',NULL,'fa fa-shopping-basket',30,'grp_purchases',1,'2026-08-05 21:54:50','2026-08-05 21:54:50'),(137,136,'Compras','/purchases','fa fa-list',1,'purchases',1,'2026-08-05 21:54:50','2026-08-05 21:54:50'),(138,136,'Nueva Compra','/purchases/new','fa fa-plus-circle',2,'purchases_new',1,'2026-08-05 21:54:50','2026-08-05 21:54:50'),(139,0,'Transacciones',NULL,'fa fa-exchange',40,'grp_transactions',1,'2026-08-05 21:54:51','2026-08-05 21:54:51'),(140,139,'Ventas','/sells','fa fa-list-alt',1,'sells',1,'2026-08-05 21:54:51','2026-08-05 21:54:51'),(141,139,'Nueva Venta','/sells/new','fa fa-plus',2,'sells_new',1,'2026-08-05 21:54:51','2026-08-05 21:54:51'),(142,139,'Ventas Pagos','/sell-payments','fa fa-money',3,'sell_payments',1,'2026-08-05 21:54:51','2026-08-05 21:54:51'),(143,139,'Pedidos','/orders','fa fa-clipboard',4,'orders',1,'2026-08-05 21:54:51','2026-08-05 21:54:51'),(144,139,'Nuevo Pedido','/orders/new','fa fa-plus-square',5,'orders_new',1,'2026-08-05 21:54:52','2026-08-05 21:54:52'),(145,139,'Cotizaciones','/cotizations','fa fa-file-o',6,'cotizations',1,'2026-08-05 21:54:52','2026-08-05 21:54:52'),(146,139,'Nueva Cotización','/cotizations/new','fa fa-plus',7,'cotizations_new',1,'2026-08-05 21:54:52','2026-08-05 21:54:52'),(147,139,'Guías de Remisión','/guias','fa fa-truck',8,'guias',1,'2026-08-05 21:54:52','2026-08-05 21:54:52'),(148,139,'Nueva Guía','/guias/new','fa fa-plus',9,'guias_new',1,'2026-08-05 21:54:52','2026-08-05 21:54:52'),(149,0,'SIG',NULL,'fa fa-building',50,'grp_sig',1,'2026-08-05 21:54:53','2026-08-05 21:54:53'),(150,149,'Perfil de Puesto','/sig/perfil-puesto','fa fa-id-card',1,'sig_perfil_puesto',1,'2026-08-05 21:54:53','2026-08-05 21:54:53'),(151,149,'Áreas','/sig/areas','fa fa-map',2,'sig_areas',1,'2026-08-05 21:54:53','2026-08-05 21:54:53'),(152,149,'Puestos','/sig/puestos','fa fa-suitcase',3,'sig_puestos',1,'2026-08-05 21:54:53','2026-08-05 21:54:53'),(153,149,'Personal','/sig/colaboradores','fa fa-users',4,'sig_colaboradores',1,'2026-08-05 21:54:53','2026-08-05 21:54:53'),(154,149,'Documentos','/sig/documents','fa fa-book',5,'sig_documents',1,'2026-08-05 21:54:53','2026-08-05 21:54:53'),(155,0,'Reportes',NULL,'fa fa-bar-chart',60,'grp_reports',1,'2026-08-05 21:54:54','2026-08-05 21:54:54'),(156,155,'Ventas - Sunat','/reports/sells-sunat','fa fa-money',1,'rep_sells_sunat',1,'2026-08-05 21:54:54','2026-08-05 21:54:54'),(157,155,'Ventas - Cliente','/reports/ventas-cliente','fa fa-money',2,'rep_ventas_cliente',1,'2026-08-05 21:54:54','2026-08-05 21:54:54'),(158,155,'Ventas - Mensuales','/reports/ventas-mensuales','fa fa-money',3,'rep_ventas_mensuales',1,'2026-08-05 21:54:54','2026-08-05 21:54:54'),(159,155,'Ventas - Cruzado','/reports/ventas-cruzado','fa fa-money',4,'rep_ventas_cruzado',1,'2026-08-05 21:54:54','2026-08-05 21:54:54'),(160,0,'Control Asistencias',NULL,'fa fa-clock-o',65,'grp_asistencias_control',1,'2026-08-05 21:54:55','2026-08-05 21:54:55'),(162,160,'Relojes','/relojes','fa fa-clock-o',2,'asist_relojes',1,'2026-08-05 21:54:55','2026-08-05 21:54:55'),(163,160,'Feriados','/feriados','fa fa-calendar',3,'asist_feriados',1,'2026-08-05 21:54:55','2026-08-05 21:54:55'),(164,160,'Permisos','/permisos','fa fa-check-square-o',4,'asist_permisos',1,'2026-08-05 21:54:55','2026-08-05 21:54:55'),(165,160,'Horarios','/horarios','fa fa-calendar-times-o',5,'asist_horarios',1,'2026-08-05 21:54:56','2026-08-05 21:54:56'),(166,160,'Asignar Horario','/asignar-horario','fa fa-user-plus',6,'asist_asignar',1,'2026-08-05 21:54:56','2026-08-05 21:54:56'),(167,160,'Tipos de Permisos','/tipos-permisos','fa fa-tags',7,'asist_tipos_permisos',1,'2026-08-05 21:54:56','2026-08-05 21:54:56'),(168,0,'Reportes Asistencias',NULL,'fa fa-pie-chart',70,'grp_asistencias_reportes',1,'2026-08-05 21:54:56','2026-08-05 21:54:56'),(169,168,'Por Colaborador','/reportes','fa fa-user',1,'rep_asist_colaborador',1,'2026-08-05 21:54:56','2026-08-05 21:54:56'),(170,168,'Por Día','/reportes-dia','fa fa-calendar-o',2,'rep_asist_dia',1,'2026-08-05 21:54:57','2026-08-05 21:54:57'),(171,168,'Por Completo','/reportes-dias','fa fa-calendar',3,'rep_asist_completo',1,'2026-08-05 21:54:57','2026-08-05 21:54:57');
/*!40000 ALTER TABLE `app_menus` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-03 20:47:50

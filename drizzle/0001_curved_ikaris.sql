CREATE TABLE `accidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`date` date NOT NULL,
	`time` varchar(5),
	`location` varchar(255),
	`employeeId` varchar(255),
	`employeeName` varchar(255),
	`type` varchar(50),
	`severity` enum('leve','moderado','grave','fatal') NOT NULL,
	`catFiled` boolean DEFAULT false,
	`catNumber` varchar(50),
	`investigationStatus` enum('pendente','em_progresso','concluida') DEFAULT 'pendente',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` varchar(255),
	`userId` int NOT NULL,
	`userName` varchar(255),
	`description` text,
	`changes` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`theme` varchar(255),
	`startDate` date NOT NULL,
	`endDate` date,
	`target` varchar(255),
	`materials` json,
	`status` enum('planejada','em_andamento','concluida') DEFAULT 'planejada',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diseases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`cid10` varchar(10) NOT NULL,
	`description` text,
	`employeeId` varchar(255),
	`employeeName` varchar(255),
	`diagnosisDate` date,
	`absenceStartDate` date,
	`absenceEndDate` date,
	`medicalCertificateNumber` varchar(50),
	`status` enum('diagnosticada','afastada','recuperada','cronica') DEFAULT 'diagnosticada',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diseases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`entityType` varchar(100),
	`entityId` varchar(255),
	`fileUrl` text,
	`fileSize` int,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(100),
	`date` date NOT NULL,
	`location` varchar(255),
	`inspector` varchar(255),
	`findings` json,
	`nonConformities` int,
	`status` enum('planejada','em_andamento','concluida') DEFAULT 'planejada',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investigations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accidentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`investigationDate` date NOT NULL,
	`investigator` varchar(255),
	`rootCauses` text,
	`preventiveMeasures` text,
	`correctiveMeasures` text,
	`status` enum('aberta','em_andamento','fechada') DEFAULT 'aberta',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investigations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ppps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` varchar(255) NOT NULL,
	`employeeName` varchar(255) NOT NULL,
	`position` varchar(255),
	`department` varchar(255),
	`startDate` date,
	`endDate` date,
	`hazards` json,
	`protectiveEquipment` json,
	`medicalExaminations` json,
	`status` enum('ativo','finalizado','revisao') DEFAULT 'ativo',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ppps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(100),
	`startDate` date NOT NULL,
	`endDate` date,
	`duration` int,
	`instructor` varchar(255),
	`location` varchar(255),
	`participants` json,
	`certificateTemplate` varchar(255),
	`status` enum('planejado','em_andamento','concluido') DEFAULT 'planejado',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','supervisor','operacional','user') NOT NULL DEFAULT 'operacional';--> statement-breakpoint
ALTER TABLE `users` ADD `sector` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;
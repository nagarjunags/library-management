CREATE TABLE `books` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(77) NOT NULL,
	`author` varchar(150) NOT NULL,
	`publisher` varchar(100) NOT NULL,
	`genre` varchar(31) DEFAULT null,
	`isbnNo` varchar(13) DEFAULT null,
	`numofPages` int NOT NULL,
	`totalNumberOfCopies` int NOT NULL,
	`availableNumberOfCopies` int DEFAULT null,
	CONSTRAINT `books_id` PRIMARY KEY(`id`),
	CONSTRAINT `books_isbnNo_unique` UNIQUE(`isbnNo`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`transactionId` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`issueddate` timestamp NOT NULL DEFAULT (now()),
	`returnDate` varchar(100) NOT NULL,
	`isReturned` tinyint NOT NULL DEFAULT 0,
	`fine` int NOT NULL DEFAULT 0,
	CONSTRAINT `transactions_transactionId` PRIMARY KEY(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`UId` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`password` varchar(255) NOT NULL,
	`phoneNum` varchar(13) DEFAULT null,
	`DOB` varchar(20) NOT NULL,
	CONSTRAINT `users_UId` PRIMARY KEY(`UId`)
);

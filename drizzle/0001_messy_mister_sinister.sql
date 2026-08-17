CREATE TABLE `watchlistEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`mediaType` enum('Movie','Web Series','Short Film') NOT NULL,
	`watchStatus` enum('Want to Watch','Watching','Watched') NOT NULL DEFAULT 'Want to Watch',
	`monthYear` varchar(7),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlistEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlistSeedStates` (
	`userId` int NOT NULL,
	`seededAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlistSeedStates_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD CONSTRAINT `watchlistEntries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlistSeedStates` ADD CONSTRAINT `watchlistSeedStates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `watchlist_user_month_idx` ON `watchlistEntries` (`userId`,`monthYear`);--> statement-breakpoint
CREATE INDEX `watchlist_user_title_idx` ON `watchlistEntries` (`userId`,`title`);
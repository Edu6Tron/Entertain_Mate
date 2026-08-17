CREATE TABLE `watchlistExtensionTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`tokenHint` varchar(10) NOT NULL,
	`browser` varchar(32) NOT NULL DEFAULT 'Brave',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `watchlistExtensionTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `watchlist_extension_token_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD `tmdbId` int;--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD `posterUrl` text;--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD `imdbRating` decimal(3,1);--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD `releaseYear` varchar(4);--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD `sourceQuery` varchar(255);--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD `sourceKind` varchar(64);--> statement-breakpoint
ALTER TABLE `watchlistEntries` ADD `moctaleUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `watchlistExtensionTokens` ADD CONSTRAINT `watchlistExtensionTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `watchlist_extension_user_idx` ON `watchlistExtensionTokens` (`userId`);--> statement-breakpoint
CREATE INDEX `watchlist_user_source_query_idx` ON `watchlistEntries` (`userId`,`sourceQuery`);
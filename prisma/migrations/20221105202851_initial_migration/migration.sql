-- CreateTable
CREATE TABLE "guilds" (
    "id" VARCHAR(255) NOT NULL,
    "roles-mod" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "antiInvite" BOOLEAN NOT NULL DEFAULT false,
    "antiInvite-whitelistedGuilds" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "antiScam" BOOLEAN NOT NULL DEFAULT false,
    "antiScam-guardedURLs" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "antiScam-urlLowerBound" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "antiScam-scamLinksAllowed" INTEGER NOT NULL DEFAULT 3,
    "antiScam-timePeriod" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT '',
    "value" VARCHAR(255) NOT NULL DEFAULT '',
    "text" VARCHAR(255) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "guildId" VARCHAR(255),

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

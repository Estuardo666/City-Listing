-- Columnas generadas para poder filtrar "abierto ahora" en SQL en vez de en memoria.
-- Son STORED GENERATED: Postgres las mantiene, la aplicacion nunca las escribe.
-- Un horario con formato invalido ("9:00", texto crudo de Google) queda en NULL
-- y por lo tanto queda fuera del filtro, igual que en openStatus().

ALTER TABLE "VenueBusinessHours"
  ADD COLUMN "openMinute" INTEGER GENERATED ALWAYS AS (
    CASE WHEN "openTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      THEN (substring("openTime" from 1 for 2))::int * 60 + (substring("openTime" from 4 for 2))::int
    END
  ) STORED,
  ADD COLUMN "closeMinute" INTEGER GENERATED ALWAYS AS (
    CASE WHEN "closeTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      THEN (substring("closeTime" from 1 for 2))::int * 60 + (substring("closeTime" from 4 for 2))::int
    END
  ) STORED,
  -- true solo cuando el cierre cae al dia siguiente (20:00 -> 02:00).
  -- open = close significa "abierto 24 horas" y no cuenta como cruce.
  ADD COLUMN "crossesMidnight" BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN "openTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND "closeTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      THEN ((substring("openTime" from 1 for 2))::int * 60 + (substring("openTime" from 4 for 2))::int)
         > ((substring("closeTime" from 1 for 2))::int * 60 + (substring("closeTime" from 4 for 2))::int)
    END
  ) STORED,
  -- openTime = closeTime significa "abierto 24 horas" (asi lo importa Google).
  ADD COLUMN "isAllDay" BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN "openTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND "closeTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      THEN "openTime" = "closeTime"
    END
  ) STORED;

CREATE INDEX "VenueBusinessHours_dayOfWeek_isClosed_openMinute_closeMinute_idx"
  ON "VenueBusinessHours" ("dayOfWeek", "isClosed", "openMinute", "closeMinute");

-- SpecialHours se consulta por fecha para todos los venues del dia.
CREATE INDEX IF NOT EXISTS "SpecialHours_date_idx" ON "SpecialHours" ("date");
